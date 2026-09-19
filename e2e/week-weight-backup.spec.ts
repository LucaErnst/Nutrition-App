import { expect, test } from '@playwright/test';
import { addFromSearch, freshApp } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

test('week view shows average, budget and summary', async ({ page }) => {
  await addFromSearch(page, 'Breakfast', 'Low-fat quark');
  await page.getByRole('button', { name: 'Week' }).click();
  await expect(page.getByRole('heading', { name: 'Weekly average' })).toBeVisible();
  await expect(page.getByText('1 of 7 days logged')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Weekly budget' })).toBeVisible();
  await expect(page.getByText('Protein below target')).toBeVisible();
});

test('log weight and see the trend', async ({ page }) => {
  await page.getByRole('button', { name: 'Weight' }).click();
  await page.getByLabel('kg').fill('76.5');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
  await expect(page.getByText('76.5 kg').first()).toBeVisible();
});

test('save and apply a template', async ({ page }) => {
  await addFromSearch(page, 'Breakfast', 'Low-fat quark');
  await page.getByRole('button', { name: 'Expand' }).click();
  await page.getByRole('button', { name: 'Save as template' }).click();
  await page.getByLabel('Template name').fill('Standard breakfast');
  await page.getByRole('button', { name: 'Save' }).click();

  await page.getByRole('button', { name: 'Add item to Dinner' }).click();
  await page.getByRole('tab', { name: 'Templates' }).click();
  await page.getByRole('dialog').getByText('Standard breakfast', { exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.locator('.summary-kcal-value')).toHaveText('336');
});

test('backup export produces a JSON file incl. water', async ({ page }) => {
  await addFromSearch(page, 'Breakfast', 'Low-fat quark');
  await page.getByRole('region', { name: 'Water' }).getByRole('button', { name: 'Add 250 ml' }).click();
  await page.getByRole('button', { name: 'More' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^ernaehrung-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await file.path();
  const { readFileSync } = await import('node:fs');
  const json = JSON.parse(readFileSync(path!, 'utf8'));
  expect(json.app).toBe('nutrition-tracker');
  expect(json.mealEntries).toHaveLength(1);
  expect(json.mealEntries[0].snapshot.name).toBe('Low-fat quark');
  expect(json.water).toHaveLength(1);
});
