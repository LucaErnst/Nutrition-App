import { expect, test } from '@playwright/test';
import { freshApp } from './helpers';

test.beforeEach(async ({ page }) => {
  await freshApp(page);
});

async function dragGrabber(page: import('@playwright/test').Page, dy: number, ms: number) {
  const box = (await page.locator('.sheet-grabber').boundingBox())!;
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  const steps = 12;
  for (let i = 1; i <= steps; i++) {
    await page.mouse.move(x, y + (dy * i) / steps);
    await page.waitForTimeout(ms / steps);
  }
  await page.mouse.up();
}

test('add sheet: title, tabs and search stay on top while the list scrolls', async ({ page }) => {
  await page.getByRole('button', { name: 'Add item to Breakfast' }).click();
  await page.getByRole('searchbox', { name: 'Search foods' }).fill('chicken');
  await page.waitForTimeout(500); // Einblenden abwarten
  const before = await page.getByRole('tab', { name: 'Scan' }).boundingBox();
  await page.locator('.modal.sheet').evaluate((m) => (m.scrollTop = 800));
  await page.waitForTimeout(200);
  const after = await page.getByRole('tab', { name: 'Scan' }).boundingBox();
  expect(Math.abs(after!.y - before!.y)).toBeLessThan(2);
  await expect(page.getByRole('searchbox', { name: 'Search foods' })).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Close' })).toBeInViewport();
});

test('add sheet: a short slow pull springs back, a long pull closes', async ({ page }) => {
  await page.getByRole('button', { name: 'Add item to Breakfast' }).click();
  const dialog = page.getByRole('dialog');
  await page.waitForTimeout(500);
  await dragGrabber(page, 60, 600);
  await page.waitForTimeout(400);
  await expect(dialog).toBeVisible();
  await dragGrabber(page, 300, 600);
  await expect(dialog).toBeHidden();
});

test('add sheet: tapping a tab still switches tabs', async ({ page }) => {
  await page.getByRole('button', { name: 'Add item to Breakfast' }).click();
  await page.getByRole('tab', { name: 'Manual' }).click();
  await expect(page.getByRole('tab', { name: 'Manual' })).toHaveAttribute('aria-selected', 'true');
});
