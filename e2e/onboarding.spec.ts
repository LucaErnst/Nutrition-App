import { expect, test } from '@playwright/test';
import { freshAppRaw } from './helpers';

test('onboarding suggests targets and creates the phase', async ({ page }) => {
  await freshAppRaw(page);
  await expect(page.getByRole('heading', { name: 'Welcome to Serious Nutrition' })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await page.getByRole('spinbutton', { name: 'Age' }).fill('30');
  await page.getByRole('spinbutton', { name: 'Height (cm)' }).fill('180');
  await page.getByRole('spinbutton', { name: 'Weight (kg)' }).fill('77');
  await page.getByRole('combobox', { name: 'Everyday life (without training)' }).selectOption('sitting');
  await page.getByLabel('Goal').getByText('Build muscle').click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Your suggested targets' })).toBeVisible();
  // Herleitung: Grundumsatz 1,750 kcal (Mifflin-St Jeor), Zeilen bis zum Tagesziel
  const table = page.getByRole('table', { name: 'How your target is calculated' });
  await expect(table.getByRole('row', { name: /Basal metabolic rate/ })).toContainText('1,750 kcal');
  await expect(table.getByRole('row', { name: /Training \(4 days\/week\)/ })).toContainText('+490 kcal');
  await expect(page.getByLabel('Phase name')).toHaveValue('Bulk');
  await expect(page.getByRole('spinbutton', { name: 'Protein min. (g)' })).toHaveValue('140');
  await expect(page.getByRole('spinbutton', { name: 'Water goal (ml)' })).toHaveValue('2750');
  await page.getByRole('button', { name: 'Start tracking' }).click();

  // Tagebuch mit Phase, Wasserziel und heutigem Gewicht
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
  await expect(page.getByText('Bulk')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Water' }).getByText('/ 2.8 l')).toBeVisible();
  await page.getByRole('button', { name: 'Weight' }).click();
  await expect(page.getByText('77.0 kg').first()).toBeVisible();

  // Kein zweites Onboarding nach Reload
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
});

test('onboarding can be skipped', async ({ page }) => {
  await freshAppRaw(page);
  await page.getByRole('button', { name: 'Skip, set targets later' }).click();
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
  await expect(page.getByText('No phase for this day.')).toBeVisible();
});

test('needs calculator under More fills a new phase', async ({ page }) => {
  await freshAppRaw(page);
  await page.getByRole('button', { name: 'Skip, set targets later' }).click();
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Calculate needs' }).click();
  const dialog = page.getByRole('dialog', { name: 'Calculate your needs' });
  await dialog.getByLabel('Sex').getByText('Female').click();
  await dialog.getByRole('spinbutton', { name: 'Age' }).fill('35');
  await dialog.getByRole('spinbutton', { name: 'Height (cm)' }).fill('168');
  await dialog.getByRole('spinbutton', { name: 'Weight (kg)' }).fill('64');
  await dialog.getByRole('combobox', { name: 'Everyday life (without training)' }).selectOption('standing');
  await dialog.getByLabel('Goal').getByText('Lose fat').click();
  await dialog.getByRole('button', { name: 'Calculate', exact: true }).click();

  // 10*64 + 6.25*168 - 5*35 - 161 = 1,354
  await expect(dialog.getByRole('row', { name: /Basal metabolic rate/ })).toContainText('1,354 kcal');
  await expect(dialog.getByText('This is a starting point.', { exact: false })).toBeVisible();
  await dialog.getByRole('button', { name: 'Use as new phase' }).click();

  // Formular ist vorbelegt, gespeichert wird erst hier
  const form = page.getByRole('dialog', { name: 'New phase' });
  await expect(form.getByLabel('Phase name')).toHaveValue('Cut');
  await expect(form.getByRole('spinbutton', { name: 'Protein min. (g)' })).toHaveValue('130');
  await form.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Cut').first()).toBeVisible();
});
