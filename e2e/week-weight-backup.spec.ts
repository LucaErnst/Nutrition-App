import { expect, test } from '@playwright/test';
import { addFromSearch, freshApp } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

test('Wochenübersicht zeigt Schnitt, Budget und Fazit', async ({ page }) => {
  await addFromSearch(page, 'Frühstück', 'Magerquark');
  await page.getByRole('button', { name: 'Woche' }).click();
  await expect(page.getByRole('heading', { name: 'Wochenschnitt' })).toBeVisible();
  await expect(page.getByText('1 von 7 Tagen erfasst')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wochenbudget' })).toBeVisible();
  await expect(page.getByText('Protein unter Ziel')).toBeVisible();
});

test('Gewicht eintragen und Trend sehen', async ({ page }) => {
  await page.getByRole('button', { name: 'Gewicht' }).click();
  await page.getByLabel('kg').fill('76.5');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: 'Verlauf' })).toBeVisible();
  await expect(page.getByText('76.5 kg').first()).toBeVisible();
});

test('Vorlage speichern und anwenden', async ({ page }) => {
  await addFromSearch(page, 'Frühstück', 'Magerquark');
  await page.getByRole('button', { name: 'Ausklappen' }).click();
  await page.getByRole('button', { name: 'Als Vorlage speichern' }).click();
  await page.getByLabel('Name der Vorlage').fill('Standard-Frühstück');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await page.getByRole('button', { name: 'Posten zu Abendessen hinzufügen' }).click();
  await page.getByRole('tab', { name: 'Vorlagen' }).click();
  await page.getByRole('dialog').getByText('Standard-Frühstück', { exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.summary-kcal-value')).toHaveText('336');
});

test('Backup-Export erzeugt eine JSON-Datei', async ({ page }) => {
  await addFromSearch(page, 'Frühstück', 'Magerquark');
  await page.getByRole('button', { name: 'Mehr' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Backup exportieren' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^ernaehrung-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await file.path();
  const { readFileSync } = await import('node:fs');
  const json = JSON.parse(readFileSync(path!, 'utf8'));
  expect(json.app).toBe('nutrition-tracker');
  expect(json.mealEntries).toHaveLength(1);
  expect(json.mealEntries[0].snapshot.name).toBe('Magerquark');
});
