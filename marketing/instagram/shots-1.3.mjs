// Rohe App-Screenshots im 1.3-Look (iOS 27) für die Launch-Posts. Demo-Daten, Englisch, dunkel.
// Vorher: node marketing/demo-data.mjs (Daten relativ zu heute).
// Aufruf: CLIPS_URL=http://localhost:5180/ node marketing/instagram/shots-1.3.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.CLIPS_URL ?? 'http://localhost:4173/';
const DEMO = fileURLToPath(new URL('../demo-backup.json', import.meta.url));

const browser = await chromium.launch({ args: ['--lang=en-US'] });
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, colorScheme: 'dark', locale: 'en-US', isMobile: true, hasTouch: true });
await ctx.addInitScript(() => localStorage.setItem('nutrition-tracker:tips', 'off'));
const page = await ctx.newPage();
await page.goto(BASE);
await page.evaluate(() => localStorage.setItem('nutrition-tracker:language', 'en'));
await page.reload();
await page.getByRole('button', { name: 'Skip, set targets later' }).click();
await page.getByRole('button', { name: 'More' }).click();
await page.locator('.setting-row').filter({ hasText: 'Backup' }).first().click();
await page.locator('input[type=file]').setInputFiles(DEMO);
await page.getByRole('button', { name: 'Replace and restore' }).click();
await page.waitForTimeout(600);
await page.evaluate(() => localStorage.removeItem('nutrition-tracker:reference'));
await page.reload();
await page.waitForTimeout(3500);

const nav = (n) => page.locator('.app-nav').getByRole('button', { name: n }).click();
async function shot(name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, `n-${name}.png`) });
  console.log(`n-${name}`);
}

await nav('Diary');
await page.evaluate(() => window.scrollTo(0, 0));
await shot('diary');

await page.locator('.daytype label', { hasText: 'Rest day' }).click();
await shot('daytype-rest');
await page.locator('.daytype label', { hasText: 'Training' }).click();
await page.waitForTimeout(400);

// Mahlzeit aufklappen und einen Eintrag halb weggewischt zeigen
await page.getByRole('heading', { name: 'Breakfast' }).click();
await page.waitForTimeout(500);
await page.evaluate(() => {
  const li = document.querySelector('.entry.swipe');
  const row = li?.querySelector('.swipe-row');
  const act = li?.querySelector('.swipe-action');
  if (row && act) {
    row.style.transform = 'translateX(-88px)';
    act.style.width = '88px';
  }
  li?.closest('.meal')?.scrollIntoView({ block: 'center' });
});
await shot('swipe');
await page.reload();
await page.waitForTimeout(2500);

await page.getByRole('button', { name: 'Add item to Dinner' }).click();
await page.waitForTimeout(1500);
await shot('sheet');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

await nav('Week');
await page.waitForTimeout(800);
await page.evaluate(() => window.scrollTo(0, 0));
await shot('week-top');
await page.evaluate(() => document.querySelector('.day-bars')?.closest('section')?.scrollIntoView({ block: 'center' }));
await shot('week-days');

await nav('More');
await page.waitForTimeout(600);
await page.evaluate(() => document.querySelector('.settings-block')?.scrollIntoView({ block: 'start' }));
await page.evaluate(() => window.scrollBy(0, -40));
await shot('more');

await browser.close();
