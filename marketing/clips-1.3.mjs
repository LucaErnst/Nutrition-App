// 1.3-Launch: App-Reels im neuen Look (9:16, 1080×1920), ohne Gesicht, mit Hook und Abspann.
// Vorher: node marketing/demo-data.mjs. Aufruf: CLIPS_URL=http://localhost:5180/ node marketing/clips-1.3.mjs
// Ergebnis: marketing/clips/1.3-*.mp4
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./clips/', import.meta.url));
const RAW = path.join(OUT, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const VIEW = { width: 540, height: 960 };
// Standard ist die Vorschau auf 4173; mit CLIPS_URL lässt sich auch der Dev-Server nutzen.
const BASE = process.env.CLIPS_URL ?? 'http://localhost:4173/';

// Tipp-Feedback, damit man im Video sieht, wo getippt wird
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
  for (const ch of text) { await page.keyboard.type(ch); await page.waitForTimeout(110); }
}

async function withApp(name, fn) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEW, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'en-US', hasTouch: false,
    recordVideo: { dir: RAW, size: VIEW },
  });
  const ctxStart = Date.now();
  const page = await ctx.newPage();
  await page.addInitScript(TAP_FX);
  await page.addInitScript(() => localStorage.setItem('nutrition-tracker:tips', 'off'));
  await page.goto(BASE);
  // Sprache Deutsch + Demo-Daten importieren
  await page.evaluate(() => localStorage.setItem('nutrition-tracker:language', 'en'));
  await page.reload();
  await page.getByRole('button', { name: 'Skip, set targets later' }).click();
  await page.getByRole('button', { name: 'More' }).click();
  // 1.3: Backup ist eine eigene Seite unter „Mehr“
  await page.locator('.setting-row').filter({ hasText: 'Backup' }).first().click();
  await page.locator('input[type=file]').setInputFiles(fileURLToPath(new URL('./demo-backup.json', import.meta.url)));
  await page.getByRole('button', { name: 'Replace and restore' }).click();
  await page.waitForTimeout(600);
  await page.locator('.app-nav').getByRole('button', { name: 'Diary' }).click();
  await page.waitForTimeout(400);
  await page.evaluate(() => window.scrollTo(0, 0));
  const t0 = Date.now();
  await fn(page);
  const startSec = (t0 - ctxStart) / 1000;
  const sceneDur = (Date.now() - t0) / 1000;
  const video = page.video();
  await ctx.close();
  await browser.close();
  const src = await video.path();
  const dst = path.join(RAW, `${name}.webm`);
  fs.renameSync(src, dst);
  return { file: dst, startSec, sceneDur };
}

/** Text-Overlay (1080×1920, transparent) als PNG rendern – ffmpeg ohne drawtext */
async function overlayPng(file, { top, bottom, brand }) {
  const html = `<html><body style="margin:0;width:1080px;height:1920px;background:transparent;font-family:-apple-system,Helvetica Neue,Arial,sans-serif;color:#fff">
    <div style="position:absolute;left:60px;right:60px;top:120px;text-align:center"><span style="display:inline-block;background:rgba(10,12,18,.72);border-radius:28px;padding:22px 40px;font-size:64px;font-weight:800;line-height:1.15;letter-spacing:-0.01em;white-space:pre-line;backdrop-filter:blur(6px)">${top ?? ''}</span></div>
    <div style="position:absolute;left:60px;right:60px;bottom:250px;text-align:center"><span style="display:inline-block;background:rgba(10,12,18,.72);border-radius:28px;padding:20px 36px;font-size:46px;font-weight:700;line-height:1.2;white-space:pre-line;backdrop-filter:blur(6px)">${bottom ?? ''}</span></div>
    ${brand ? '<div style="position:absolute;left:60px;right:60px;bottom:150px;text-align:center;font-size:38px;font-weight:600;color:#e6c46a;text-shadow:0 2px 8px rgba(0,0,0,1)">Serious Nutrition · App Store</div>' : ''}
  </body></html>`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(html);
  await p.screenshot({ path: file, omitBackground: true });
  await b.close();
}

/** Schneidet den Vorspann (Import) weg, skaliert auf 1080×1920, legt Hook + Abspann drüber. */
async function render(name, r, hook, hookUntil, outro) {
  const outroFrom = r.sceneDur - 3.5;
  const hookPng = path.join(RAW, `${name}-hook.png`);
  const outroPng = path.join(RAW, `${name}-outro.png`);
  await overlayPng(hookPng, { top: hook });
  await overlayPng(outroPng, { bottom: outro, brand: true });
  const out = path.join(OUT, `${name}.mp4`);
  const fc = `[0:v]scale=1080:1920:flags=lanczos[v0];[v0][1:v]overlay=0:0:enable='lt(t,${hookUntil})'[v1];[v1][2:v]overlay=0:0:enable='gte(t,${outroFrom})'[v]`;
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-ss', String(r.startSec), '-t', String(r.sceneDur), '-i', r.file, '-i', hookPng, '-i', outroPng, '-filter_complex', fc, '-map', '[v]', '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an', out]);
  return out;
}


const nav = (page, n) => page.locator('.app-nav').getByRole('button', { name: n });

// --- 1 · Ring füllt sich ----------------------------------------------------------
const ring = await withApp('1.3-ring', async (page) => {
  await page.waitForTimeout(1500);
  await tap(page, page.getByRole('button', { name: 'Add item to Dinner' }), 1200);
  await tap(page, page.getByRole('dialog').getByText('Chicken breast (cooked)', { exact: true }), 900);
  const amount = page.getByRole('dialog').getByRole('spinbutton', { name: 'Amount' });
  await amount.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.type('300');
  await page.waitForTimeout(600);
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }), 600);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  await page.waitForTimeout(3200);
});

// --- 2 · Wischen zum Löschen, Rückgängig -------------------------------------------
const swipe = await withApp('1.3-swipe', async (page) => {
  await page.waitForTimeout(1000);
  await tap(page, page.getByRole('button', { name: 'Expand' }).first(), 1000);
  const row = page.locator('.entry .swipe-row').first();
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const box = (await row.boundingBox());
  await page.mouse.move(box.x + box.width - 20, box.y + box.height / 2);
  await page.mouse.down();
  for (let i = 1; i <= 24; i++) {
    await page.mouse.move(box.x + box.width - 20 - i * 15, box.y + box.height / 2);
    await page.waitForTimeout(18);
  }
  await page.mouse.up();
  await page.waitForTimeout(1600);
  await tap(page, page.getByRole('button', { name: 'Undo' }), 2400);
});

// --- 3 · Trainingstag / Ruhetag ----------------------------------------------------
const daytype = await withApp('1.3-daytype', async (page) => {
  await page.waitForTimeout(1500);
  await tap(page, page.locator('.daytype label', { hasText: 'Rest day' }), 1800);
  await tap(page, page.locator('.daytype label', { hasText: 'Training' }), 1800);
  await tap(page, page.locator('.daytype label', { hasText: 'Rest day' }), 2200);
});

// --- 4 · Woche in Farben -------------------------------------------------------------
const week = await withApp('1.3-week', async (page) => {
  await tap(page, nav(page, 'Week'), 1500);
  await page.evaluate(() => document.querySelector('.day-bars')?.closest('section')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await page.waitForTimeout(3600);
});

// --- 5 · Neuer Look: Tab-Leiste, Mehr-Seiten -----------------------------------------
const tour = await withApp('1.3-tour', async (page) => {
  await page.waitForTimeout(1000);
  for (const n of ['Week', 'Weight', 'Foods', 'More']) await tap(page, nav(page, n), 1100);
  await tap(page, page.locator('.setting-row').filter({ hasText: 'Units' }).first(), 1300);
  await tap(page, page.locator('.settings-back'), 1100);
  await tap(page, nav(page, 'Diary'), 2200);
});

const outs = [
  await render('1.3-ring', ring, 'Your ring tells you\nhow close you are.', 4, 'Red at the start.\nGreen when you hit it.'),
  await render('1.3-swipe', swipe, 'Logged the wrong thing?\nSwipe.', 4, 'Swipe to delete.\nUndo if you didn’t mean it.'),
  await render('1.3-daytype', daytype, 'Training day. Rest day.\nOne tap.', 3.5, 'Two targets.\nThe whole day adjusts.'),
  await render('1.3-week', week, 'Green, violet, red.\nYour week at a glance.', 4, 'The week counts,\nnot the day.'),
  await render('1.3-tour', tour, 'Same app.\nNew look.', 3.5, 'Serious Nutrition 1.3.\nUpdate now.'),
];
console.log(outs.join('\n'));
