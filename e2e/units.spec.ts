import { expect, test } from '@playwright/test';
import { freshApp, kcalTotal, openAddDialog } from './helpers';

/** Trägt ein Referenz-Lebensmittel mit einer bestimmten Einheit ein. */
async function addWithUnit(page: import('@playwright/test').Page, meal: string, food: string, amount: string, unit?: string) {
  await openAddDialog(page, meal);
  await page.getByRole('searchbox', { name: 'Search foods' }).fill(food);
  await page.getByRole('dialog').getByText(food, { exact: true }).click();
  const dialog = page.getByRole('dialog');
  if (unit) await dialog.getByRole('combobox', { name: 'Unit' }).selectOption(unit);
  await dialog.getByRole('spinbutton', { name: 'Amount' }).fill(amount);
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

test('Menge in Unzen eintragen – Nährwerte werden umgerechnet', async ({ page }) => {
  const dialog = await addWithUnit(page, 'Lunch', 'Oats', '1', 'oz');

  // Haferflocken: 110 kcal je 30 g → 366.7 je 100 g; 1 oz = 28.35 g → 104 kcal
  await expect(dialog.getByText('104 kcal')).toBeVisible();

  await dialog.getByRole('button', { name: 'Add', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(kcalTotal(page)).toHaveText('104');
  await expect(page.getByText('1 oz', { exact: true })).toHaveCount(1);
});

test('Gramm und Kilogramm ergeben denselben Wert', async ({ page }) => {
  const a = await addWithUnit(page, 'Lunch', 'Oats', '250');
  await a.getByRole('button', { name: 'Add', exact: true }).click();
  const withGrams = await kcalTotal(page).textContent();
  expect(withGrams).toBeTruthy();

  await freshApp(page);
  const b = await addWithUnit(page, 'Lunch', 'Oats', '0.25', 'kg');
  await b.getByRole('button', { name: 'Add', exact: true }).click();

  await expect(kcalTotal(page)).toHaveText(withGrams!);
  await expect(page.getByText('0.25 kg', { exact: true })).toHaveCount(1);
});

test('US-Einstellung stellt die passenden Einheiten nach vorne', async ({ page }) => {
  await page.getByRole('button', { name: 'More' }).click();
  const us = page.getByRole('radio', { name: 'US', exact: true });
  await us.click();
  await expect(us).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Diary' }).click();

  await openAddDialog(page, 'Lunch');
  await page.getByRole('searchbox', { name: 'Search foods' }).fill('Oats');
  await page.getByRole('dialog').getByText('Oats', { exact: true }).click();
  const dialog = page.getByRole('dialog');

  // Ohne eigene Wahl schlägt die App jetzt Unzen vor statt Gramm …
  await expect(dialog.getByRole('combobox', { name: 'Unit' })).toHaveValue('oz');
  // … und die übliche Portion (30 g) wird mitgerechnet, statt als 30 oz stehen zu bleiben.
  await expect(dialog.getByRole('spinbutton', { name: 'Amount' })).toHaveValue('1.06');
  await expect(dialog.getByText('110 kcal')).toBeVisible();
});
