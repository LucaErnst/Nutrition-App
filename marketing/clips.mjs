// Erzeugt TikTok-Clips (9:16, 1080×1920) aus der laufenden App.
// Voraussetzung: `npx vite preview --port 4173` läuft. Aufruf: node marketing/clips.mjs
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./clips/', import.meta.url));
const RAW = path.join(OUT, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const VIEW = { width: 540, height: 960 };

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
    viewport: VIEW, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'en-US',
    recordVideo: { dir: RAW, size: VIEW },
  });
  const ctxStart = Date.now();
  const page = await ctx.newPage();
  await page.addInitScript(TAP_FX);
  await page.goto('http://localhost:4173/');
  // Sprache Deutsch + Demo-Daten importieren
  await page.evaluate(() => localStorage.setItem('nutrition-tracker:language', 'en'));
  await page.reload();
  await page.getByRole('button', { name: 'Skip, set targets later' }).click();
  await page.getByRole('button', { name: 'More' }).click();
  await page.locator('input[type=file]').setInputFiles(fileURLToPath(new URL('./demo-backup.json', import.meta.url)));
  await page.getByRole('button', { name: 'Replace and restore' }).click();
  await page.waitForTimeout(600);
  await page.getByRole('button', { name: 'Diary' }).click();
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

// --- Clip A: Protein-Rest in 5 Sekunden -----------------------------------------
const a = await withApp('a-protein', async (page) => {
  await page.waitForTimeout(1500);
  await page.evaluate(() => document.querySelector('.progress-list')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1200);
  await tap(page, page.getByRole('button', { name: 'Add item to Dinner' }), 900);
  await typeSlow(page, page.getByRole('searchbox', { name: 'Search foods' }), 'skyr');
  await page.waitForTimeout(700);
  await tap(page, page.getByRole('dialog').getByText('Skyr', { exact: true }), 900);
  const amount = page.getByRole('dialog').getByRole('spinbutton', { name: 'Amount' });
  await amount.click();
  await page.keyboard.press('Meta+A');
  await page.keyboard.type('250');
  await page.waitForTimeout(700);
  await tap(page, page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }), 500);
  await page.evaluate(() => document.querySelector('.progress-list')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(2600);
});

// --- Clip B: Wochenbudget --------------------------------------------------------
const b = await withApp('b-week', async (page) => {
  await tap(page, page.getByRole('button', { name: 'Week' }), 800);
  await tap(page, page.getByRole('button', { name: 'Previous week' }), 1800);
  await page.evaluate(() => window.scrollTo({ top: 260, behavior: 'smooth' }));
  await page.waitForTimeout(2200);
  await page.evaluate(() => document.querySelector('.day-bars')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
  await page.waitForTimeout(3200);
});

// --- Clip C: Gewichtstrend -------------------------------------------------------
const c = await withApp('c-weight', async (page) => {
  await tap(page, page.getByRole('button', { name: 'Weight' }), 1200);
  await page.waitForTimeout(2000);
  await tap(page, page.getByRole('radiogroup', { name: 'Range' }).getByText('30 days'), 1800);
  await tap(page, page.getByRole('radiogroup', { name: 'Range' }).getByText('90 days'), 3000);
});

const outA = await render('a-protein', a, 'Protein left?\n5 seconds.', 4.5, 'No account. No ads.\nYour data stays with you.');
const outB = await render('b-week', b, 'One day over target?\nWho cares. The week counts.', 4.5, 'Weekly budget instead of\ndaily calorie panic.');
const outC = await render('c-weight', c, 'Your weight fluctuates.\nThe trend doesn\'t.', 4, '7-day trend instead of\nscale anxiety.');
console.log([outA, outB, outC].join('\n'));
