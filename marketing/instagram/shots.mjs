// Rohe App-Screenshots (metrisch, Demo-Daten) für Instagram-Storys und -Karussells.
// Aufruf: CLIPS_URL=http://localhost:5180/ node marketing/instagram/shots.mjs
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const BASE = process.env.CLIPS_URL ?? 'http://localhost:4173/';
const DEMO = fileURLToPath(new URL('../demo-backup.json', import.meta.url));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 540, height: 1080 }, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'de-CH' });
const page = await ctx.newPage();
await page.goto(BASE);
await page.evaluate(() => localStorage.setItem('nutrition-tracker:language', 'en'));
await page.reload();
await page.getByRole('button', { name: 'Skip, set targets later' }).click();
await page.getByRole('button', { name: 'More' }).click();
const backupChevron = page.locator('section', { has: page.getByRole('heading', { name: 'Backup', exact: true }) }).locator('.meal-chevron');
await backupChevron.click();
await page.locator('input[type=file]').setInputFiles(DEMO);
await page.getByRole('button', { name: 'Replace and restore' }).click();
await page.waitForTimeout(600);
// Das Demo-Backup enthält keine Grundnahrungsmittel; ohne Vermerk legt die App sie neu an.
await page.evaluate(() => localStorage.removeItem('nutrition-tracker:reference'));
await page.reload();
await page.waitForTimeout(4000);

async function shot(name) {
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, `${name}.png`) });
  console.log(name);
}
const nav = (n) => page.getByRole('button', { name: n }).click();

await nav('Diary');
await page.evaluate(() => window.scrollTo(0, 0));
await shot('diary');

await page.locator('.segmented-sm label', { hasText: 'Rest day' }).click();
await shot('diary-rest');
await page.locator('.segmented-sm label', { hasText: 'Training' }).click();

await nav('Week');
await page.waitForTimeout(800);
await page.getByText('Weekly budget').first().evaluate((el) => el.scrollIntoView({ block: 'start' }));
await page.evaluate(() => window.scrollBy(0, -20));
await shot('week-budget');

await nav('Weight');
await page.waitForTimeout(800);
await page.getByRole('radiogroup', { name: 'Range' }).getByText('90 days').click();
await shot('weight');

await nav('Diary');
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole('button', { name: 'Add item to Dinner' }).click();
await page.getByRole('searchbox', { name: 'Search foods' }).fill('cervelat');
await page.waitForTimeout(1500);
await shot('search-cervelat');
await page.keyboard.press('Escape');
await page.waitForTimeout(400);

await nav('More');
await page.waitForTimeout(600);
const chev = page.locator('section', { has: page.getByRole('heading', { name: 'Backup', exact: true }) }).locator('.meal-chevron');
if ((await chev.getAttribute('aria-expanded')) !== 'true') await chev.click();
await page.getByRole('button', { name: 'Export backup' }).evaluate((el) => el.scrollIntoView({ block: 'center' }));
await shot('backup');

// Woche 2: Favoriten, Vorlagen, morgen mit Vorlage + „gestern kopieren“
await nav('Diary');
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByRole('button', { name: 'Next day' }).click();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Add item to Breakfast' }).click();
await shot('favorites');
await page.getByRole('dialog').getByText('Templates', { exact: true }).click();
await shot('templates-tab');
await page.getByRole('dialog').getByText('My breakfast').click();
await page.waitForTimeout(800);
await page.getByRole('button', { name: /^Copy from yesterday/ }).first().click();
await page.waitForTimeout(600);
await page.evaluate(() => window.scrollTo(0, 0));
await shot('tomorrow-filled');

await browser.close();
