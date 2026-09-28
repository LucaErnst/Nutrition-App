import { expect, test } from '@playwright/test';
import { openSection, stubOffSearch } from './helpers';

/**
 * Läuft mit locale en-US (siehe playwright.config.ts). Ein Gerät in den USA soll die App
 * auf Englisch, in Pfund, Fuss/Zoll und Unzen bekommen – ohne dass jemand etwas einstellt.
 */
async function freshUsApp(page: import('@playwright/test').Page) {
  await stubOffSearch(page);
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    const dbs = await indexedDB.databases();
    await Promise.all(
      dbs.map(
        (d) =>
          new Promise<void>((res) => {
            const r = indexedDB.deleteDatabase(d.name!);
            r.onsuccess = r.onerror = r.onblocked = () => res();
          }),
      ),
    );
  });
  await page.reload();
}

test('Onboarding fragt Fuss/Zoll und Pfund, Gewicht erscheint in Pfund', async ({ page }) => {
  await freshUsApp(page);
  await expect(page.getByRole('heading', { name: 'Welcome to Serious Nutrition' })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await page.getByRole('spinbutton', { name: 'Age' }).fill('30');
  await page.getByRole('spinbutton', { name: 'Height (ft)' }).fill('5');
  await page.getByRole('spinbutton', { name: 'in', exact: true }).fill('11');
  await page.getByRole('spinbutton', { name: 'Weight (lb)' }).fill('170');
  await page.getByRole('combobox', { name: 'Everyday activity' }).selectOption('high');
  await page.getByLabel('Goal').getByText('Build muscle').click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  // 5'11" = 180.3 cm, 170 lb = 77.1 kg → dieselben Ziele wie im metrischen Onboarding-Test
  await expect(page.getByRole('heading', { name: 'Your suggested targets' })).toBeVisible();
  await expect(page.getByRole('spinbutton', { name: 'Protein min. (g)' })).toHaveValue('140');
  await page.getByRole('button', { name: 'Start tracking' }).click();

  await page.getByRole('button', { name: 'Weight' }).click();
  // Eingetragen wurden 170 lb; gespeichert sind 77.1 kg, angezeigt wieder 170.0 lb.
  await expect(page.locator('.weight-value')).toHaveText('170.0 lb');
  await expect(page.getByRole('spinbutton', { name: 'lb' })).toBeVisible();
});

test('Mengen werden in Unzen vorgeschlagen', async ({ page }) => {
  await freshUsApp(page);
  await page.getByRole('button', { name: 'Skip, set targets later' }).click();

  await page.getByRole('button', { name: 'Add item to Lunch' }).click();
  await page.getByRole('searchbox', { name: 'Search foods' }).fill('Oats');
  await page.getByRole('dialog').getByText('Oats', { exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('combobox', { name: 'Unit' })).toHaveValue('oz');
});

test('Wasser läuft in Flüssigunzen, gespeichert bleiben Milliliter', async ({ page }) => {
  await freshUsApp(page);
  await page.getByRole('button', { name: 'Skip, set targets later' }).click();

  const water = page.getByRole('region', { name: 'Water' });
  // Voreinstellung 3000 ml sind 101 fl oz.
  await expect(water.getByText('0 / 101 fl oz')).toBeVisible();
  await water.getByRole('button', { name: 'Add 8 fl oz' }).click();
  await expect(water.getByText('8 / 101 fl oz')).toBeVisible();
  await expect(water.getByText('93 fl oz left')).toBeVisible();

  // Das Ziel wird in Unzen eingestellt, in der Datenbank stehen weiterhin Milliliter.
  await page.getByRole('button', { name: 'More' }).click();
  await openSection(page, 'Water');
  const goal = page.getByRole('spinbutton', { name: 'Daily water goal (fl oz)' });
  await expect(goal).toHaveValue('101');
  await page.getByRole('button', { name: '96 fl oz', exact: true }).click();
  await expect(goal).toHaveValue('96');
  const storedMl = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('nutrition-tracker');
        open.onsuccess = () => {
          const req = open.result.transaction('settings').objectStore('settings').getAll();
          req.onsuccess = () => resolve(req.result[0]?.water_goal_ml);
        };
      }),
  );
  expect(storedMl).toBe(2839);
});
