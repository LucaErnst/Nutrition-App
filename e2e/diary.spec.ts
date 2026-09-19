import { expect, test } from '@playwright/test';
import { addFromSearch, freshApp, kcalTotal } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

test('Posten eintragen, Menge ändern, löschen und rückgängig', async ({ page }) => {
  await addFromSearch(page, 'Frühstück', 'Magerquark');
  await expect(kcalTotal(page)).toHaveText('168');

  // Menge inline auf 125 g ändern
  await page.getByRole('button', { name: 'Ausklappen' }).click();
  await page.getByTitle('Menge ändern').click();
  await page.locator('.stepper-compact input').fill('125');
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(kcalTotal(page)).toHaveText('84');

  // Löschen → Toast → Rückgängig
  await page.getByRole('button', { name: 'Magerquark entfernen' }).click();
  await expect(kcalTotal(page)).toHaveText('0');
  await page.getByRole('button', { name: 'Rückgängig' }).click();
  await expect(kcalTotal(page)).toHaveText('84');
});

test('Tagesziel und Trainingstag-Umschaltung', async ({ page }) => {
  await expect(page.getByText('Aufbauphase')).toBeVisible();
  await page.getByLabel('Tagestyp').getByText('Training').click();
  await expect(page.locator('.summary-kcal-label')).toHaveText(/2.700 kcal/);
  await page.getByLabel('Tagestyp').getByText('Ruhetag').click();
  await expect(page.locator('.summary-kcal-label')).toHaveText(/2.350 kcal/);
});

test('Mengen-Stepper und Schnellwahl-Chips', async ({ page }) => {
  await page.getByRole('button', { name: 'Posten zu Mittagessen hinzufügen' }).click();
  await page.getByRole('searchbox', { name: 'Lebensmittel suchen' }).fill('Cashew');
  await page.getByRole('dialog').getByText('Cashewnüsse', { exact: true }).click();
  const amount = page.getByRole('dialog').getByRole('spinbutton', { name: 'Menge' });
  await expect(amount).toHaveValue('25');
  await page.getByRole('button', { name: 'Menge erhöhen' }).click();
  await expect(amount).toHaveValue('35');
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(kcalTotal(page)).toHaveText('193');

  // Beim nächsten Mal wird 35 g vorgeschlagen
  await page.getByRole('button', { name: 'Posten zu Mittagessen hinzufügen' }).click();
  await page.getByRole('searchbox', { name: 'Lebensmittel suchen' }).fill('Cashew');
  await page.getByRole('dialog').getByText('Cashewnüsse', { exact: true }).click();
  await expect(amount).toHaveValue('35');
  await expect(page.getByRole('button', { name: 'Zuletzt 35 g' })).toBeVisible();
});

test('Manueller Schnell-Eintrag ohne Namen', async ({ page }) => {
  await page.getByRole('button', { name: 'Posten zu Abendessen hinzufügen' }).click();
  await page.getByRole('tab', { name: 'Manuell' }).click();
  await page.getByRole('spinbutton', { name: 'Menge' }).fill('1');
  await page.getByRole('combobox', { name: 'Einheit' }).selectOption('Stück');
  await page.getByRole('spinbutton', { name: 'kcal' }).fill('800');
  await page.getByRole('button', { name: 'Hinzufügen', exact: true }).click();
  await expect(kcalTotal(page)).toHaveText('800');
  await page.getByRole('button', { name: 'Ausklappen' }).click();
  await expect(page.getByText('Schnell-Eintrag')).toBeVisible();
});
