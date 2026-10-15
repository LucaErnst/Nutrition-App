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
  await page.getByRole('combobox', { name: 'Everyday life (without training)' }).selectOption('sitting');
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

test('Produktsuche fragt weltweit, ohne Kaestchen zum Anklicken', async ({ page }) => {
  const OFF = /\/cgi\/search\.pl|search\.openfoodfacts\.org|\/api\/v2\/search/;
  const urls: string[] = [];
  await freshUsApp(page);
  // Nach freshUsApp: dessen leere Antwort wuerde sonst gewinnen (der zuletzt gesetzte
  // Handler kommt zuerst dran).
  await page.unroute(OFF);
  await page.route(OFF, (route) => {
    urls.push(route.request().url());
    route.fulfill({
      json: {
        count: 1,
        products: [
          {
            code: '5700381627197',
            product_name: 'Skyr Vanilla',
            brands: 'Arla',
            nutriments: { 'energy-kcal_100g': 63, proteins_100g: 10, fat_100g: 0.2, carbohydrates_100g: 4.5 },
          },
        ],
      },
    });
  });

  await page.getByRole('button', { name: 'Skip, set targets later' }).click();
  await page.getByRole('button', { name: 'Add item to Lunch' }).click();
  await page.getByRole('searchbox', { name: 'Search foods' }).fill('skyr');

  await expect(page.getByText('Skyr Vanilla')).toBeVisible();
  // Kein Land im Aufruf und keine Auswahl in der Oberflaeche.
  expect(urls.join(' ')).not.toContain('united-states');
  expect(urls.join(' ')).not.toContain('switzerland');
  await expect(page.getByText('worldwide instead of')).toHaveCount(0);
});

test('Der Reiter Foods sucht dieselben Produkte wie das Tagebuch', async ({ page }) => {
  const OFF = /\/cgi\/search\.pl|search\.openfoodfacts\.org|\/api\/v2\/search/;
  await freshUsApp(page);
  await page.unroute(OFF);
  await page.route(OFF, (route) =>
    route.fulfill({
      json: {
        count: 1,
        products: [
          {
            code: '5700381627197',
            product_name: 'Skyr Vanilla',
            brands: 'Arla',
            nutriments: { 'energy-kcal_100g': 63, proteins_100g: 10, fat_100g: 0.2, carbohydrates_100g: 4.5 },
          },
        ],
      },
    }),
  );

  await page.getByRole('button', { name: 'Skip, set targets later' }).click();
  await page.getByRole('button', { name: 'Foods' }).click();
  await page.getByRole('searchbox', { name: 'Search database' }).fill('skyr');

  // Produkt erscheint von selbst und laesst sich als eigenes Lebensmittel uebernehmen.
  await page.getByRole('button', { name: /Skyr Vanilla/ }).click();
  await expect(page.getByRole('dialog').getByLabel('Name')).toHaveValue('Skyr Vanilla');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  // Ohne Suchbegriff zeigt der Reiter die eigenen Lebensmittel – das Produkt ist jetzt eines.
  await page.getByRole('searchbox', { name: 'Search database' }).fill('');
  await expect(page.getByText('1 of your own', { exact: false })).toBeVisible();
});
