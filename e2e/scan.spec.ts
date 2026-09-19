import { expect, test } from '@playwright/test';
import { freshApp, kcalTotal } from './helpers';

const PRODUCT = {
  code: '7610000000001',
  status: 1,
  product: {
    code: '7610000000001',
    product_name_de: 'Test-Skyr',
    brands: 'Testmarke',
    quantity: '500 g',
    nutriments: { 'energy-kcal_100g': 60, proteins_100g: 11, fat_100g: 0.2, carbohydrates_100g: 4 },
  },
};

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

test('Barcode manuell eingeben → Open Food Facts (gemockt) → eintragen', async ({ page }) => {
  await page.route('**/api/v2/product/**', (route) => route.fulfill({ json: PRODUCT }));

  await page.getByRole('button', { name: 'Posten zu Vormittag-Snack hinzufügen' }).click();
  await page.getByRole('tab', { name: 'Scannen' }).click();
  await page.getByRole('button', { name: 'Kamera ausblenden' }).click();
  await page.getByLabel('Barcode manuell eingeben').fill('7610000000001');
  await page.getByRole('button', { name: 'Suchen', exact: true }).click();

  await expect(page.getByText('Test-Skyr')).toBeVisible();
  await expect(page.getByText('pro 100 g: 60 kcal')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Menge' }).fill('200');
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(kcalTotal(page)).toHaveText('120');

  // Zweiter Scan kommt aus der lokalen Datenbank (kein API-Call nötig)
  await page.unroute('**/api/v2/product/**');
  await page.route('**/api/v2/product/**', (route) => route.abort());
  await page.getByRole('button', { name: 'Posten zu Vormittag-Snack hinzufügen' }).click();
  await page.getByRole('tab', { name: 'Scannen' }).click();
  await page.getByRole('button', { name: 'Kamera ausblenden' }).click();
  await page.getByLabel('Barcode manuell eingeben').fill('7610000000001');
  await page.getByRole('button', { name: 'Suchen', exact: true }).click();
  await expect(page.getByText('aus deiner Datenbank')).toBeVisible();
});

test('Unbekannter Barcode → manuelle Eingabe mit Barcode', async ({ page }) => {
  await page.route('**/api/v2/product/**', (route) => route.fulfill({ status: 404, json: { status: 0 } }));
  await page.getByRole('button', { name: 'Posten zu Vormittag-Snack hinzufügen' }).click();
  await page.getByRole('tab', { name: 'Scannen' }).click();
  await page.getByRole('button', { name: 'Kamera ausblenden' }).click();
  await page.getByLabel('Barcode manuell eingeben').fill('4000000000000');
  await page.getByRole('button', { name: 'Suchen', exact: true }).click();
  await expect(page.getByText('nicht bekannt')).toBeVisible();
  await page.getByRole('button', { name: 'Nährwerte manuell eingeben' }).click();
  await expect(page.getByText('Barcode 4000000000000 wird mitgespeichert.')).toBeVisible();
});
