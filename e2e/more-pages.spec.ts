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
