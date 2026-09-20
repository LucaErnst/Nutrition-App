import { expect, test } from '@playwright/test';
import { addFromSearch, freshApp } from './helpers';

/**
 * Faltbares iPhone (Duo): aussen 4:3-Display, innen fast quadratisch, Wechsel zur Laufzeit.
 * Punktgrössen geschätzt aus 2088×1422 bzw. 2713×1920 bei 3×.
 */
const OUTER = { width: 474, height: 696 };
const INNER = { width: 640, height: 904 };
const INNER_LANDSCAPE = { width: 904, height: 640 };

async function noHorizontalScroll(page: import('@playwright/test').Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, 'kein horizontales Scrollen').toBeLessThanOrEqual(0);
}

async function columns(page: import('@playwright/test').Page, root: string) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel)!;
    return getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length;
  }, root);
}

test('Duo: Tagebuch wechselt live zwischen Aussen- und Innendisplay', async ({ page }) => {
  await page.setViewportSize(OUTER);
  await freshApp(page);
  await addFromSearch(page, 'Breakfast', 'Oats', '80');

  // Aussen (474 px): eine Spalte, Tab-Leiste unten
  await noHorizontalScroll(page);
  expect(await columns(page, '.day')).toBe(1);
  const nav = page.getByRole('navigation', { name: 'Main navigation' });
  expect(await nav.evaluate((el) => getComputedStyle(el).position)).toBe('fixed');

  // Aufklappen → zwei Spalten, Navigation oben
  await page.setViewportSize(INNER_LANDSCAPE);
  await noHorizontalScroll(page);
  expect(await columns(page, '.day')).toBe(2);
  expect(await nav.evaluate((el) => getComputedStyle(el).position)).not.toBe('fixed');
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();

  // Dialog im aufgeklappten Zustand öffnen, zuklappen, Dialog muss bedienbar bleiben
  await page.getByRole('button', { name: 'Add item to Lunch' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.setViewportSize(OUTER);
  await expect(page.getByRole('dialog')).toBeVisible();
  await noHorizontalScroll(page);
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  // Scroll-Lock wieder aufgehoben
  expect(await page.evaluate(() => document.body.style.position)).not.toBe('fixed');

  // Innendisplay hochkant (640 px): eine Spalte, aber zentriert und ohne Überlauf
  await page.setViewportSize(INNER);
  await noHorizontalScroll(page);
  expect(await columns(page, '.day')).toBe(1);
});

test('Duo: Woche und Gewicht zweispaltig auf dem Innendisplay', async ({ page }) => {
  await page.setViewportSize(INNER_LANDSCAPE);
  await freshApp(page);
  await page.getByRole('button', { name: 'Week' }).click();
  await expect(page.getByRole('heading', { name: 'Weekly average' })).toBeVisible();
  expect(await columns(page, '.week')).toBe(2);
  await noHorizontalScroll(page);

  await page.getByRole('button', { name: 'Weight' }).click();
  await page.getByLabel('kg').fill('77.8');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
  expect(await columns(page, '.weight')).toBe(2);
  await noHorizontalScroll(page);
});
