import { expect, test } from '@playwright/test';
import { freshApp, kcalTotal } from './helpers';

const PRODUCT = {
  code: '7610000000001',
  status: 1,
  product: {
    code: '7610000000001',
    product_name_en: 'Test Skyr',
    product_name_de: 'Test-Skyr',
    brands: 'Testbrand',
    quantity: '500 g',
    nutriments: { 'energy-kcal_100g': 60, proteins_100g: 11, fat_100g: 0.2, carbohydrates_100g: 4 },
  },
};

async function openScan(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Add item to Morning snack' }).click();
  await page.getByRole('tab', { name: 'Scan' }).click();
  await page.getByRole('button', { name: 'Hide camera' }).click();
}

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

test('enter barcode manually → Open Food Facts (mocked) → add', async ({ page }) => {
  await page.route('**/api/v2/product/**', (route) => route.fulfill({ json: PRODUCT }));

  await openScan(page);
  await page.getByLabel('Enter barcode manually').fill('7610000000001');
  await page.getByRole('button', { name: 'Search', exact: true }).click();

  await expect(page.getByText('Test Skyr')).toBeVisible();
  await expect(page.getByText('per 100 g: 60 kcal')).toBeVisible();
  await page.getByRole('spinbutton', { name: 'Amount' }).fill('200');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(kcalTotal(page)).toHaveText('120');

  // Zweiter Scan kommt aus der lokalen Datenbank (kein API-Call nötig)
  await page.unroute('**/api/v2/product/**');
  await page.route('**/api/v2/product/**', (route) => route.abort());
  await openScan(page);
  await page.getByLabel('Enter barcode manually').fill('7610000000001');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('from your database')).toBeVisible();
});

test('unknown barcode → manual entry keeps the barcode', async ({ page }) => {
  await page.route('**/api/v2/product/**', (route) => route.fulfill({ status: 404, json: { status: 0 } }));
  await openScan(page);
  await page.getByLabel('Enter barcode manually').fill('4000000000000');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('is not known to Open Food Facts')).toBeVisible();
  await page.getByRole('button', { name: 'Enter nutrition manually' }).click();
  await expect(page.getByText('Barcode 4000000000000 will be saved with it.')).toBeVisible();
});
