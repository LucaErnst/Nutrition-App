import { expect, test } from '@playwright/test';
import { freshApp, openSection } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshApp(page);
  await page.getByRole('button', { name: 'More' }).click();
});

test('Mehr: Unterseite, zurück per Wischen vom linken Rand', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Touch über CDP');
  await openSection(page, 'Units');
  await expect(page.locator('.settings-page')).toBeVisible();
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: string, x: number) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y: 400 }] });
  await touch('touchStart', 8);
  for (const x of [40, 80, 120, 160]) await touch('touchMove', x);
  await touch('touchEnd', 160);
  await expect(page.locator('.settings-page')).toHaveCount(0);
  await expect(page.locator('.setting-row').first()).toBeVisible();
});

test('Mehr: Tipp auf „Mehr“ in der Leiste führt zurück zur Liste', async ({ page }) => {
  await openSection(page, 'Backup');
  await expect(page.locator('.settings-page')).toBeVisible();
  await page.locator('.app-nav').getByRole('button', { name: 'More' }).click();
  await expect(page.locator('.settings-page')).toHaveCount(0);
});

test('Mehr: Tipp auf „Mehr“ auf heruntergescrollter Unterseite gleitet erst nach oben', async ({ page }) => {
  await openSection(page, 'Backup');
  const pg = page.locator('.settings-page');
  await expect(pg).toBeVisible();
  await pg.evaluate((el) => {
    el.querySelector<HTMLElement>('.settings-page-inner')!.style.minHeight = '3000px';
    el.scrollTop = 500;
  });
  const more = page.locator('.app-nav').getByRole('button', { name: 'More' });
  await more.click();
  await expect.poll(() => pg.evaluate((el) => el.scrollTop)).toBe(0);
  await expect(pg).toBeVisible();
  await more.click();
  await expect(page.locator('.settings-page')).toHaveCount(0);
});

test('Tipp auf den offenen Tab gleitet nach ganz oben', async ({ page }) => {
  await page.evaluate(() => {
    document.body.style.minHeight = '4000px';
    window.scrollTo(0, 800);
  });
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.locator('.app-nav').getByRole('button', { name: 'More' }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test('Mehr: Quellen-Seite listet Belege mit Links (Guideline 1.4.1)', async ({ page }) => {
  await openSection(page, 'Sources');
  const pg = page.locator('.settings-page');
  await expect(pg.getByRole('heading', { name: 'Calorie needs' })).toBeVisible();
  await expect(pg.locator('a[href="https://doi.org/10.1093/ajcn/51.2.241"]')).toBeVisible();
  await expect(pg.locator('.sources-topic')).toHaveCount(5);
  await expect(pg.getByText('not a medical device')).toBeVisible();
});
