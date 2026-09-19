import { expect, test } from '@playwright/test';
import { freshAppRaw } from './helpers';

test('onboarding suggests targets and creates the phase', async ({ page }) => {
  await freshAppRaw(page);
  await expect(page.getByRole('heading', { name: 'Welcome to Serious Nutrition' })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await page.getByRole('spinbutton', { name: 'Age' }).fill('30');
  await page.getByRole('spinbutton', { name: 'Height (cm)' }).fill('180');
  await page.getByRole('spinbutton', { name: 'Weight (kg)' }).fill('77');
  await page.getByRole('combobox', { name: 'Everyday activity' }).selectOption('high');
  await page.getByLabel('Goal').getByText('Build muscle').click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Your suggested targets' })).toBeVisible();
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
