import { expect, test, type Page } from '@playwright/test';
import { freshApp, openAddDialog, openSection } from './helpers';

/**
 * Faltbares iPhone (Duo) für alles, was mit 1.1 dazugekommen ist: Einheiten, Körpermasse,
 * aufklappbare Karten unter „Mehr“. Geprüft wird beides – jede Displaygrösse für sich und
 * der Wechsel zur Laufzeit, bei dem die Ansicht nicht neu geladen wird.
 */
const OUTER = { width: 474, height: 696 };
const INNER = { width: 640, height: 904 };
const INNER_LANDSCAPE = { width: 904, height: 640 };

async function noHorizontalScroll(page: Page, where: string) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, `kein horizontales Scrollen: ${where}`).toBeLessThanOrEqual(0);
}

/** Kein Element ragt über den rechten Rand hinaus (fängt zu breite Felder und Knöpfe). */
async function nothingOverflows(page: Page, where: string) {
  const worst = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    let max = 0;
    for (const el of document.querySelectorAll('section, .field, .chips, .form-actions, .stepper, select, input, button')) {
      const r = el.getBoundingClientRect();
      if (r.width > 0) max = Math.max(max, r.right - w);
    }
    return Math.round(max);
  });
  expect(worst, `nichts ragt über den Rand: ${where}`).toBeLessThanOrEqual(1);
}

test('Duo: Mehr bleibt über den Display-Wechsel bedienbar', async ({ page }) => {
  await page.setViewportSize(OUTER);
  await freshApp(page);
  await page.getByRole('button', { name: 'More' }).click();
  await noHorizontalScroll(page, 'Mehr aussen');
  await nothingOverflows(page, 'Mehr aussen');

  // Aufgeklappte Karte muss den Wechsel überstehen – die Ansicht wird dabei nicht neu geladen.
  await openSection(page, 'Units');
  const us = page.getByRole('radio', { name: 'US', exact: true });
  await expect(us).toBeVisible();

  await page.setViewportSize(INNER_LANDSCAPE);
  await expect(us).toBeVisible();
  await noHorizontalScroll(page, 'Mehr innen quer');
  await nothingOverflows(page, 'Mehr innen quer');

  await page.setViewportSize(INNER);
  await expect(us).toBeVisible();
  await noHorizontalScroll(page, 'Mehr innen hoch');
  await nothingOverflows(page, 'Mehr innen hoch');
});

test('Duo: Gewicht in Stone und Pfund passt auf beide Displays', async ({ page }) => {
  await page.setViewportSize(INNER_LANDSCAPE);
  await freshApp(page);
  await page.getByRole('button', { name: 'More' }).click();
  await openSection(page, 'Units');
  await page.getByRole('radio', { name: 'UK', exact: true }).click();

  await page.getByRole('button', { name: 'Weight' }).click();
  await page.getByRole('spinbutton', { name: 'st', exact: true }).fill('12');
  await page.getByRole('spinbutton', { name: 'lb', exact: true }).fill('4');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('.weight-value')).toHaveText('12 st 4.0 lb');
  await noHorizontalScroll(page, 'Gewicht innen quer');
  await nothingOverflows(page, 'Gewicht innen quer');

  await page.setViewportSize(OUTER);
  await expect(page.locator('.weight-value')).toHaveText('12 st 4.0 lb');
  await noHorizontalScroll(page, 'Gewicht aussen');
  await nothingOverflows(page, 'Gewicht aussen');
});

test('Duo: Einheiten-Auswahl im Dialog überlebt das Aufklappen', async ({ page }) => {
  await page.setViewportSize(OUTER);
  await freshApp(page);
  await openAddDialog(page, 'Lunch');
  await page.getByRole('searchbox', { name: 'Search foods' }).fill('Oats');
  await page.getByRole('dialog').getByText('Oats', { exact: true }).click();

  const unit = page.getByRole('dialog').getByRole('combobox', { name: 'Unit' });
  await unit.selectOption('kg');
  await page.getByRole('dialog').getByRole('spinbutton', { name: 'Amount' }).fill('0.25');
  await nothingOverflows(page, 'Dialog aussen');

  // Aufklappen mitten in der Eingabe: Auswahl und Menge bleiben stehen
  await page.setViewportSize(INNER_LANDSCAPE);
  await expect(unit).toHaveValue('kg');
  await expect(page.getByRole('dialog').getByRole('spinbutton', { name: 'Amount' })).toHaveValue('0.25');
  await noHorizontalScroll(page, 'Dialog innen quer');
  await nothingOverflows(page, 'Dialog innen quer');

  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByText('0.25 kg', { exact: true })).toHaveCount(1);
});

test('Duo: Mehr nutzt das Innendisplay zweispaltig', async ({ page }) => {
  await page.setViewportSize(INNER_LANDSCAPE);
  await freshApp(page);
  await page.getByRole('button', { name: 'More' }).click();

  const cols = await page.evaluate(() => getComputedStyle(document.querySelector('.goals')!).columnCount);
  expect(cols, 'zwei Spalten auf dem Innendisplay').toBe('2');
  await noHorizontalScroll(page, 'Mehr zweispaltig');
  await nothingOverflows(page, 'Mehr zweispaltig');

  // Zugeklappt bleibt es einspaltig auf dem Aussendisplay
  await page.setViewportSize(OUTER);
  const outerCols = await page.evaluate(() => getComputedStyle(document.querySelector('.goals')!).columnCount);
  expect(outerCols, 'eine Spalte aussen').toBe('auto');
  await nothingOverflows(page, 'Mehr aussen einspaltig');
});

test('Duo: Phasen-Auswertung bleibt beim Wechsel offen und lesbar', async ({ page }) => {
  await page.setViewportSize(OUTER);
  await freshApp(page);
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('button', { name: 'Review' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await nothingOverflows(page, 'Auswertung aussen');

  await page.setViewportSize(INNER_LANDSCAPE);
  await expect(dialog).toBeVisible();
  await noHorizontalScroll(page, 'Auswertung innen quer');
  await nothingOverflows(page, 'Auswertung innen quer');

  await page.setViewportSize(INNER);
  await expect(dialog).toBeVisible();
  await nothingOverflows(page, 'Auswertung innen hoch');
  await dialog.getByRole('button', { name: 'Close' }).click();
  await expect(dialog).toBeHidden();
  expect(await page.evaluate(() => document.body.style.position)).not.toBe('fixed');
});
