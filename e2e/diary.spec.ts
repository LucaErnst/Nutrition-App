import { expect, test } from '@playwright/test';
import { addFromSearch, freshApp, kcalTotal } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

test('add item, change amount, delete and undo', async ({ page }) => {
  await addFromSearch(page, 'Breakfast', 'Low-fat quark');
  await expect(kcalTotal(page)).toHaveText('168');

  // Menge inline auf 125 g ändern
  await page.getByRole('button', { name: 'Expand' }).click();
  await page.getByTitle('Change amount').click();
  await page.locator('.stepper-compact input').fill('125');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(kcalTotal(page)).toHaveText('84');

  // Löschen → Toast → Rückgängig
  await page.getByRole('button', { name: 'Remove Low-fat quark' }).click();
  await expect(kcalTotal(page)).toHaveText('0');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(kcalTotal(page)).toHaveText('84');
});

test('daily target and training-day toggle', async ({ page }) => {
  await expect(page.getByText('Bulk')).toBeVisible();
  await page.getByLabel('Day type').getByText('Training').click();
  await expect(page.locator('.summary-kcal-label')).toHaveText(/2.700 kcal/);
  await page.getByLabel('Day type').getByText('Rest day').click();
  await expect(page.locator('.summary-kcal-label')).toHaveText(/2.350 kcal/);
});

test('amount stepper and quick-amount chips', async ({ page }) => {
  await page.getByRole('button', { name: 'Add item to Lunch' }).click();
  await page.getByRole('searchbox', { name: 'Search foods' }).fill('Cashew');
  await page.getByRole('dialog').getByText('Cashew nuts', { exact: true }).click();
  const amount = page.getByRole('dialog').getByRole('spinbutton', { name: 'Amount' });
  await expect(amount).toHaveValue('25');
  await page.getByRole('button', { name: 'Increase amount' }).click();
  await expect(amount).toHaveValue('35');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(kcalTotal(page)).toHaveText('193');

  // Beim nächsten Mal wird 35 g vorgeschlagen
  await page.getByRole('button', { name: 'Add item to Lunch' }).click();
  await page.getByRole('searchbox', { name: 'Search foods' }).fill('Cashew');
  await page.getByRole('dialog').getByText('Cashew nuts', { exact: true }).click();
  await expect(amount).toHaveValue('35');
  await expect(page.getByRole('button', { name: 'Last 35 g' })).toBeVisible();
});

test('manual quick entry without a name', async ({ page }) => {
  await page.getByRole('button', { name: 'Add item to Dinner' }).click();
  await page.getByRole('tab', { name: 'Manual' }).click();
  await page.getByRole('spinbutton', { name: 'Amount' }).fill('1');
  await page.getByRole('combobox', { name: 'Unit' }).selectOption('Stück');
  await page.getByRole('spinbutton', { name: 'kcal' }).fill('800');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(kcalTotal(page)).toHaveText('800');
  await page.getByRole('button', { name: 'Expand' }).click();
  await expect(page.getByText('Quick entry')).toBeVisible();
});

test('water: add, undo, goal', async ({ page }) => {
  const water = page.getByRole('region', { name: 'Water' });
  await expect(water.getByText('0 / 3.0 l')).toBeVisible();
  await water.getByRole('button', { name: 'Add 500 ml' }).click();
  await water.getByRole('button', { name: 'Add 250 ml' }).click();
  await expect(water.getByText('0.75 / 3.0 l')).toBeVisible();
  await expect(water.getByText("2'250 ml left").or(water.getByText('2,250 ml left'))).toBeVisible();
  await water.getByRole('button', { name: 'Remove last entry' }).click();
  await expect(water.getByText('0.5 / 3.0 l')).toBeVisible();
});

test('water goal can be typed and picked', async ({ page }) => {
  await page.getByRole('button', { name: 'More' }).click();
  const goal = page.getByRole('spinbutton', { name: 'Daily water goal (ml)' });
  await goal.fill('2200');
  await goal.blur();
  await expect(goal).toHaveValue('2200');
  await page.getByRole('button', { name: '3.5 l' }).click();
  await expect(goal).toHaveValue('3500');
  await page.getByRole('button', { name: 'Diary' }).click();
  await expect(page.getByRole('region', { name: 'Water' }).getByText('0 / 3.5 l')).toBeVisible();
});

test('language switch to German and back', async ({ page }) => {
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByLabel('Language').getByText('Deutsch').click();
  await expect(page.getByRole('heading', { name: 'Ernährung' })).toBeVisible();
  await page.getByRole('button', { name: 'Tagebuch' }).click();
  await expect(page.getByRole('heading', { name: 'Frühstück' })).toBeVisible();
  // Einstellung überlebt einen Reload
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Frühstück' })).toBeVisible();
  await page.getByRole('button', { name: 'Mehr' }).click();
  await page.getByLabel('Sprache').getByText('English').click();
  await page.getByRole('button', { name: 'Diary' }).click();
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
});
