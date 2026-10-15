import { expect, test } from '@playwright/test';
import { addFromSearch, freshApp, openSection } from './helpers';

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
  // Ohne Apple Health (Web) keine Schritte im Fazit
  await expect(page.getByText('Steps:', { exact: false })).toHaveCount(0);
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
  await openSection(page, 'Backup');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^serious-nutrition-backup-\d{4}-\d{2}-\d{2}\.json$/);
  const path = await file.path();
  const { readFileSync } = await import('node:fs');
  const json = JSON.parse(readFileSync(path!, 'utf8'));
  expect(json.app).toBe('nutrition-tracker');
  expect(json.mealEntries).toHaveLength(1);
  expect(json.mealEntries[0].snapshot.name).toBe('Low-fat quark');
  expect(json.water).toHaveLength(1);
});

// Backups aus 1.0 kennen die mitgelieferte Tabelle nicht. Das Wiederherstellen leert alle
// Lebensmittel – danach müssen die Grundnahrungsmittel trotzdem wieder da sein.
test('restoring a backup without built-in foods brings them back', async ({ page }) => {
  const old = {
    app: 'nutrition-tracker', version: 1, exported_at: new Date().toISOString(),
    foodItems: [{ id: 1, name: 'My protein bar', kcal_per_100g: 380, protein_per_100g: 33, fat_per_100g: 12, carbs_per_100g: 35,
      unit_type: 'weight', source: 'manual', saved: 1, created_at: Date.now() }],
    mealEntries: [], goals: [], weights: [], days: [], templates: [], water: [],
    settings: [{ id: 1, training_weekdays: [1, 2, 4, 5], language: 'en', water_goal_ml: 3000, onboarding_done: true }],
  };
  await page.getByRole('button', { name: 'More' }).click();
  await openSection(page, 'Backup');
  await page.locator('input[type=file]').setInputFiles({ name: 'old.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(old)) });
  await page.getByRole('button', { name: 'Replace and restore' }).click();
  await page.waitForTimeout(500);
  await page.reload();

  await page.getByRole('button', { name: 'Diary' }).click();
  await page.getByRole('button', { name: 'Add item to Dinner' }).click();
  await page.getByPlaceholder('Search foods…').fill('Bernese');
  await expect(page.getByRole('dialog').getByText('Bernese rösti fried grated potatoes')).toBeVisible();
});
