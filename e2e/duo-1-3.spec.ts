import { expect, test, type Page } from '@playwright/test';
import { addFromSearch, freshApp, openSection } from './helpers';

/**
 * Faltbares iPhone (Duo) für den 1.3-Look: Tab-Leiste mit gleitender Markierung, Unterseiten unter
 * „Mehr“ mit Zurückwischen, Wischen zum Löschen, Kalorienring. Jede Grösse für sich und der Wechsel
 * zur Laufzeit (Auf- und Zuklappen), bei dem die Ansicht nicht neu geladen wird.
 * Geprüft wird das Layout der App (Tab-Leiste immer unten), im Browser über den Test-Schalter.
 */
const OUTER = { width: 474, height: 696 };
const INNER = { width: 640, height: 904 };
const INNER_LANDSCAPE = { width: 904, height: 640 };
const SIZES = [OUTER, INNER, INNER_LANDSCAPE, OUTER];

test.beforeEach(async ({ page }) => {
  await page.setViewportSize(OUTER);
  await freshApp(page);
  await page.evaluate(() => localStorage.setItem('nutrition-tracker:native-layout', '1'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Breakfast' })).toBeVisible();
});

async function noHorizontalScroll(page: Page, where: string) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, `kein horizontales Scrollen: ${where}`).toBeLessThanOrEqual(0);
}

/** Tab-Leiste unten und Markierung genau auf dem aktiven Tab. */
async function tabBarOk(page: Page, where: string) {
  const r = await page.evaluate(() => {
    const nav = document.querySelector('.app-nav')!;
    const n = nav.getBoundingClientRect();
    const thumb = document.querySelector('.nav-thumb')!.getBoundingClientRect();
    const active = nav.querySelector('[aria-current="page"]')!.getBoundingClientRect();
    return {
      position: getComputedStyle(nav).position,
      bottomGap: innerHeight - n.bottom,
      off: Math.abs(thumb.left - active.left) + Math.abs(thumb.width - active.width),
    };
  });
  expect(r.position, `Tab-Leiste fest: ${where}`).toBe('fixed');
  expect(r.bottomGap, `Tab-Leiste unten: ${where}`).toBeLessThan(40);
  expect(r.off, `Markierung auf dem Tab: ${where}`).toBeLessThanOrEqual(1);
}

test('Duo 1.3: Tab-Leiste bleibt beim Klappen unten, Markierung folgt', async ({ page }) => {
  for (const name of ['Diary', 'Week', 'More']) {
    await page.locator('.app-nav').getByRole('button', { name }).click();
    // Markierung gleitet zum neuen Tab – erst messen, wenn sie steht
    await page.waitForFunction(() => document.getAnimations().every((a) => a.playState !== 'running'));
    await page.waitForTimeout(550);
    for (const s of SIZES) {
      await page.setViewportSize(s);
      await page.waitForTimeout(150);
      await tabBarOk(page, `${name} ${s.width}×${s.height}`);
      await noHorizontalScroll(page, `${name} ${s.width}×${s.height}`);
    }
  }
});

test('Duo 1.3: Unterseite unter „Mehr“ übersteht das Klappen, Zurückwischen passt danach', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Touch über CDP');
  await page.locator('.app-nav').getByRole('button', { name: 'More' }).click();
  await openSection(page, 'Units');
  for (const s of [INNER, INNER_LANDSCAPE]) {
    await page.setViewportSize(s);
    await expect(page.getByRole('radio', { name: 'US', exact: true })).toBeVisible();
    await noHorizontalScroll(page, `Unterseite ${s.width}×${s.height}`);
  }

  // Mitten im Wischen: Liste darunter so breit wie der Inhalt, nicht wie vor dem Aufklappen
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: string, x: number) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: 300 }] });
  await touch('touchStart', 8);
  for (const x of [30, 60, 90, 120]) await touch('touchMove', x);
  const geo = await page.evaluate(() => {
    const under = document.querySelector<HTMLElement>('.settings-under')!.getBoundingClientRect();
    const pg = document.querySelector<HTMLElement>('.settings-page')!.offsetWidth;
    return { under: under.width, page: pg };
  });
  expect(Math.abs(geo.under - (geo.page - 32))).toBeLessThanOrEqual(2);
  for (const x of [300, 500]) await touch('touchMove', x);
  await touch('touchEnd', 500);
  await expect(page.locator('.settings-page')).toHaveCount(0);
  await expect(page.locator('.setting-row').first()).toBeVisible();
});

test('Duo 1.3: Wischen zum Löschen und Ring auf allen Displays', async ({ page }) => {
  await addFromSearch(page, 'Breakfast', 'Low-fat quark');
  for (const s of [INNER_LANDSCAPE, INNER, OUTER]) {
    await page.setViewportSize(s);
    await expect(page.locator('.ring')).toBeVisible();
    await noHorizontalScroll(page, `Tagebuch ${s.width}×${s.height}`);
  }
  // Im Querformat innen wischen
  await page.setViewportSize(INNER_LANDSCAPE);
  await page.getByRole('button', { name: 'Expand' }).click();
  await page.waitForTimeout(500);
  const row = page.locator('.entry .swipe-row').filter({ hasText: 'Low-fat quark' });
  const box = (await row.boundingBox())!;
  await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 16; i++) await page.mouse.move(box.x + box.width - 20 - i * (box.width / 20), box.y + box.height / 2);
  await page.mouse.up();
  await expect(page.locator('.summary-kcal-value')).toHaveText('0');
  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.summary-kcal-value')).not.toHaveText('0');
});
