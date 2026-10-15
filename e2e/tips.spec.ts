import { expect, test } from '@playwright/test';
import { addFromSearch, freshApp, openSection } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

test('new install: first-entry tip shows, disappears after logging, dismiss sticks', async ({ page }) => {
  const first = page.getByRole('note').filter({ hasText: 'log your first food' });
  await expect(first).toBeVisible();
  await addFromSearch(page, 'Breakfast', 'Low-fat quark');
  await expect(first).toBeHidden();

  // Tagestyp-Hinweis wegtippen – bleibt auch nach Neuladen weg
  const dayType = page.getByRole('note').filter({ hasText: 'Training or rest day?' });
  await expect(dayType).toBeVisible();
  await dayType.getByRole('button', { name: 'Hide tip' }).click();
  await expect(dayType).toBeHidden();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
  await expect(dayType).toBeHidden();
});

test('existing user with entries gets no tips; More can turn them back on', async ({ page }) => {
  await addFromSearch(page, 'Breakfast', 'Low-fat quark');
  // So sieht ein Update von 1.1 aus: Einträge da, Hinweis-Modus noch nicht entschieden
  await page.evaluate(() => {
    localStorage.removeItem('nutrition-tracker:tips');
    localStorage.removeItem('nutrition-tracker:tips-seen');
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0);

  await page.getByRole('button', { name: 'More' }).click();
  await openSection(page, 'Tips');
  await page.getByRole('button', { name: 'Show tips again' }).click();
  await page.getByRole('button', { name: 'Diary' }).click();
  await expect(page.getByRole('note').filter({ hasText: 'Training or rest day?' })).toBeVisible();
});
