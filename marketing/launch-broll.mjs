// App-Aufnahmen (B-Roll) für die Launch-Clips 1–4 aus dem Drehtag-Dokument.
// Voraussetzung: Dev-Server oder Vorschau läuft. Aufruf: CLIPS_URL=http://localhost:5180/ node marketing/launch-broll.mjs
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./launch/broll/', import.meta.url));
fs.mkdirSync(OUT, { recursive: true });
const VIEW = { width: 540, height: 960 };
const BASE = process.env.CLIPS_URL ?? 'http://localhost:4173/';

const TAP_FX = `
  const s = document.createElement('style');
  s.textContent = '.tapfx{position:fixed;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(255,255,255,.9);pointer-events:none;z-index:99999;transform:translate(-50%,-50%) scale(.6);animation:tapfx .45s ease-out forwards}@keyframes tapfx{to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  window.addEventListener('mousedown', (e) => { const d = document.createElement('div'); d.className='tapfx'; d.style.left=e.clientX+'px'; d.style.top=e.clientY+'px'; document.body.appendChild(d); setTimeout(()=>d.remove(),500); }, true);
`;

async function tap(page, locator, pause = 700) {
  await locator.click();
  await page.waitForTimeout(pause);
}

async function typeSlow(page, locator, text) {
  await locator.click();
  for (const ch of text) { await page.keyboard.type(ch); await page.waitForTimeout(120); }
}

const ONLY = process.argv.slice(2);

async function scene(name, fn) {
  if (ONLY.length && !ONLY.includes(name)) return null;
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEW, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'de-CH', acceptDownloads: true,
    recordVideo: { dir: OUT, size: VIEW },
  });
  const ctxStart = Date.now();
  const page = await ctx.newPage();
  await page.addInitScript(TAP_FX);
  await page.goto(BASE);
  await page.evaluate(() => localStorage.setItem('nutrition-tracker:language', 'en'));
  await page.reload();
  await page.getByRole('button', { name: 'Skip, set targets later' }).click();
  await page.getByRole('button', { name: 'More' }).click();
  await page.locator('section', { has: page.getByRole('heading', { name: 'Backup', exact: true }) }).locator('.meal-chevron').click();
  await page.locator('input[type=file]').setInputFiles(fileURLToPath(new URL('./demo-backup.json', import.meta.url)));
  await page.getByRole('button', { name: 'Replace and restore' }).click();
  await page.waitForTimeout(600);
  // Das Demo-Backup enthält keine Grundnahrungsmittel; ohne Vermerk legt die App sie neu an.
  await page.evaluate(() => localStorage.removeItem('nutrition-tracker:reference'));
  await page.reload();
  await page.waitForTimeout(4000);
  await page.getByRole('button', { name: 'Diary' }).click();
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const t0 = Date.now();
  await fn(page);
  const start = (t0 - ctxStart) / 1000;
  const dur = (Date.now() - t0) / 1000;
  const video = page.video();
  await ctx.close();
  await browser.close();
  const raw = await video.path();
  const out = path.join(OUT, `${name}.mp4`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(start), '-t', String(dur), '-i', raw, '-vf', 'scale=1080:1920:flags=lanczos', '-r', '30', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', '-an', out]);
  fs.rmSync(raw);
  return out;
}

// Clip 1 „It's out": Tagebuch eines echten Tages, ruhig nach unten scrollen
const diary = await scene('diary', async (page) => {
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo({ top: 420, behavior: 'smooth' }));
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo({ top: 900, behavior: 'smooth' }));
  await page.waitForTimeout(2000);
});

// Clip 2 Swiss dishes: „cervelat" tippen, Treffer erscheint, antippen
const cervelat = await scene('cervelat', async (page) => {
  await page.waitForTimeout(500);
  await tap(page, page.getByRole('button', { name: 'Add item to Dinner' }), 900);
  await typeSlow(page, page.getByRole('searchbox', { name: 'Search foods' }), 'cervelat');
  await page.waitForTimeout(1800);
  await tap(page, page.getByRole('dialog').getByText('Cervelat (Swiss sausage)'), 2200);
});

// Clip 4 No account: Mehr → Backup exportieren
const backup = await scene('backup', async (page) => {
  await tap(page, page.getByRole('button', { name: 'More' }), 900);
  const section = page.locator('section', { has: page.getByRole('heading', { name: 'Backup', exact: true }) }).locator('.meal-chevron');
  await section.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await page.waitForTimeout(1000);
  await tap(page, section, 900);
  const btn = page.getByRole('button', { name: 'Export backup' });
  await btn.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await page.waitForTimeout(1000);
  await tap(page, btn, 2200);
});

// Clip 3 Story: Protein-Balken füllt sich
const protein = await scene('protein', async (page) => {
  await page.waitForTimeout(600);
  await page.evaluate(() => document.querySelector('.progress-list')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(600);
  await tap(page, page.getByRole('button', { name: 'Add item to Dinner' }), 700);
  await typeSlow(page, page.getByRole('searchbox', { name: 'Search foods' }), 'skyr');
  await page.waitForTimeout(600);
  await tap(page, page.getByRole('dialog').getByText('Skyr', { exact: true }).first(), 700);
  const amount = page.getByRole('dialog').getByRole('spinbutton', { name: 'Amount' });
  await amount.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.type('250');
  await page.waitForTimeout(500);
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }), 400);
  await page.evaluate(() => document.querySelector('.progress-list')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(2200);
});

// Clip 6 Daily calories: Woche als Budget
const week = await scene('week', async (page) => {
  await tap(page, page.getByRole('button', { name: 'Week' }), 1200);
  await page.getByText('Weekly budget').first().evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await page.waitForTimeout(2600);
  await page.evaluate(() => document.querySelector('.day-bars')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await page.waitForTimeout(2400);
});

// Clip 7 Scale lies: Gewicht mit 7-Tage-Trend
const weight = await scene('weight', async (page) => {
  await tap(page, page.getByRole('button', { name: 'Weight' }), 1500);
  await tap(page, page.getByRole('radiogroup', { name: 'Range' }).getByText('30 days'), 1800);
  await tap(page, page.getByRole('radiogroup', { name: 'Range' }).getByText('90 days'), 2600);
});

// Clip 8 Training day: Umschalter, Ziele springen
const training = await scene('training', async (page) => {
  await page.waitForTimeout(900);
  await tap(page, page.locator('.segmented-sm label', { hasText: 'Rest day' }), 1800);
  await tap(page, page.locator('.segmented-sm label', { hasText: 'Training' }), 1800);
  await tap(page, page.locator('.segmented-sm label', { hasText: 'Rest day' }), 1500);
});

// Clip 10 Same breakfast: morgen, Vorlage antippen, Mittag von gestern kopieren
const template = await scene('template', async (page) => {
  await tap(page, page.getByRole('button', { name: 'Next day' }), 1000);
  await tap(page, page.getByRole('button', { name: 'Add item to Breakfast' }), 800);
  await tap(page, page.getByRole('dialog').getByText('Templates', { exact: true }), 900);
  await tap(page, page.getByRole('dialog').getByText('My breakfast'), 1600);
  await tap(page, page.getByRole('button', { name: /^Copy from yesterday/ }).first(), 2200);
});

console.log([diary, cervelat, backup, protein, week, weight, training, template].filter(Boolean).join('\n'));
