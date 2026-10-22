// Meta-Anzeige 1.3 (DACH, Deutsch): Bildschirmaufnahme der App, 9:16, ~15 s, mit Download-Schluss.
// Be-Serious-Stil (Skill brand-video): Bebas Neue in Grossbuchstaben, weiss mit schwarzer Kontur,
// Gold #FFC300 als Akzent, Text nur in der Safe Zone x 65–1015, y 270–1248. Kein Preis, kein Alkohol.
//
// Vorher: node marketing/demo-data.mjs und den Dev-Server starten.
// Aufruf: CLIPS_URL=http://localhost:5180/ node marketing/ad-1.3.mjs
// Ergebnis: marketing/clips/ad-1.3-dach.mp4 (nur lokal, marketing/clips/ ist in .gitignore)
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./clips/', import.meta.url));
const RAW = path.join(OUT, 'raw');
fs.mkdirSync(RAW, { recursive: true });
const BASE = process.env.CLIPS_URL ?? 'http://localhost:4173/';
const VIEW = { width: 540, height: 960 };
const FONT = path.join(os.homedir(), 'Library/Fonts/BebasNeue-Regular.ttf');
const LOGO = path.join(os.homedir(), '.claude/skills/brand-video/assets/beserious/Logo/beserious_logo_gold.png');
const MUSIC = path.join(os.homedir(), 'Downloads/YouTube/Youtube Musik/Faded Light/Audiio_Faded-Light_Revival_Roulettes-Dare_Instrumental.wav');
const SAFE = { x0: 65, x1: 1015, y0: 270, y1: 1248 };
const END_SEC = 3;

// Demo-Daten auf Deutsch (Namen der Lebensmittel, Phase, Sprache)
const DE = {
  'Oats': 'Haferflocken', 'Blueberries': 'Heidelbeeren', 'Egg (whole)': 'Ei', 'Chicken breast (cooked)': 'Hähnchenbrust (gekocht)',
  'Basmati rice (cooked)': 'Basmatireis (gekocht)', 'Broccoli': 'Brokkoli', 'Olive oil': 'Olivenöl', 'Lean beef (cooked)': 'Rindfleisch mager (gekocht)',
  'Sweet potato': 'Süsskartoffel', 'Banana': 'Banane', 'Cashew nuts': 'Cashewnüsse', 'Protein milk': 'Proteinmilch',
  'Salmon (pan-fried)': 'Lachs (gebraten)', 'Whole grain bread': 'Vollkornbrot', 'Cottage cheese': 'Hüttenkäse',
};
const backup = JSON.parse(fs.readFileSync(new URL('./demo-backup.json', import.meta.url), 'utf8'));
const de = (n) => DE[n] ?? n;
for (const f of backup.foodItems) f.name = de(f.name);
for (const e of backup.mealEntries) if (e.snapshot) e.snapshot.name = de(e.snapshot.name);
for (const g of backup.goals) if (g.phase_name === 'Bulk') g.phase_name = 'Aufbau';
for (const s of backup.settings) s.language = 'de';
const backupFile = path.join(RAW, 'ad-demo-de.json');
fs.writeFileSync(backupFile, JSON.stringify(backup));

const TAP_FX = `
  const s = document.createElement('style');
  s.textContent = '.tapfx{position:fixed;width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(255,255,255,.9);pointer-events:none;z-index:99999;transform:translate(-50%,-50%) scale(.6);animation:tapfx .45s ease-out forwards}@keyframes tapfx{to{transform:translate(-50%,-50%) scale(1.6);opacity:0}}';
  document.addEventListener('DOMContentLoaded', () => document.head.appendChild(s));
  window.addEventListener('mousedown', (e) => { const d = document.createElement('div'); d.className='tapfx'; d.style.left=e.clientX+'px'; d.style.top=e.clientY+'px'; document.body.appendChild(d); setTimeout(()=>d.remove(),500); }, true);
`;

// ---------------------------------------------------------------- Aufnahme
const browser = await chromium.launch({ args: ['--lang=de-CH'] });
const ctx = await browser.newContext({ viewport: VIEW, deviceScaleFactor: 2, colorScheme: 'dark', locale: 'de-CH', recordVideo: { dir: RAW, size: VIEW } });
const ctxStart = Date.now();
const page = await ctx.newPage();
await page.addInitScript(TAP_FX);
await page.addInitScript(() => {
  localStorage.setItem('nutrition-tracker:tips', 'off');
  localStorage.setItem('nutrition-tracker:language', 'de');
  localStorage.setItem('nutrition-tracker:native-layout', '1');
});
await page.goto(BASE);
await page.getByRole('button', { name: 'Überspringen, Ziele später festlegen' }).click();
await page.locator('.app-nav').getByRole('button', { name: 'Mehr' }).click();
await page.locator('.setting-row').filter({ hasText: 'Backup' }).first().click();
await page.locator('input[type=file]').setInputFiles(backupFile);
await page.getByRole('button', { name: 'Ersetzen und wiederherstellen' }).click();
await page.waitForTimeout(700);
await page.reload();
await page.waitForTimeout(900);
await page.locator('.app-nav').getByRole('button', { name: 'Tagebuch' }).click();
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);

const marks = {};
const t0 = Date.now();
const mark = (k) => { marks[k] = (Date.now() - t0) / 1000; };
const tap = async (loc, pause = 700) => { await loc.click(); await page.waitForTimeout(pause); };

mark('hook');
await page.waitForTimeout(2300); // Ring zählt hoch, Hook steht
mark('sheet');
await tap(page.getByRole('button', { name: 'Posten zu Abendessen hinzufügen' }), 1800); // Favoriten + Zuletzt
await tap(page.getByRole('dialog').getByText('Hähnchenbrust (gekocht)', { exact: true }), 900);
const amount = page.getByRole('dialog').getByRole('spinbutton', { name: 'Menge' });
await amount.click();
await page.keyboard.press('Meta+A');
await page.keyboard.type('250', { delay: 120 });
await page.waitForTimeout(500);
await tap(page.getByRole('dialog').getByRole('button', { name: 'Hinzufügen', exact: true }), 500);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
mark('ring');
await page.waitForTimeout(2200);
mark('week');
await tap(page.locator('.app-nav').getByRole('button', { name: 'Woche' }), 1300);
await page.evaluate(() => document.querySelector('.day-bars')?.closest('section')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
await page.waitForTimeout(2600);
mark('end');

const startSec = (t0 - ctxStart) / 1000;
const sceneDur = marks.end;
const video = page.video();
await ctx.close();
await browser.close();
const rawFile = path.join(RAW, 'ad-1.3-dach.webm');
fs.renameSync(await video.path(), rawFile);
// Für die Pro-Fassung (ad-1.3-pro.mjs): Aufnahme und Zeitmarken wiederverwenden
fs.writeFileSync(path.join(RAW, 'ad-1.3-rec.json'), JSON.stringify({ rawFile, startSec, sceneDur, marks }));

// ---------------------------------------------------------------- Texte als PNG
const css = `@font-face{font-family:Bebas;src:url('file://${FONT}')}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1920px;position:relative;font-family:Bebas,Impact,sans-serif;text-transform:uppercase;color:#fff}
  .t{position:absolute;left:${SAFE.x0}px;right:${1080 - SAFE.x1}px;text-align:center;line-height:.98;letter-spacing:.01em;
     -webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:0 6px 22px rgba(0,0,0,.85)}
  .g{color:#FFC300}
  .pill{display:inline-block;background:#FFC300;color:#000;-webkit-text-stroke:0;text-shadow:none;border-radius:999px;padding:16px 44px 8px}`;

async function png(file, body, transparent = true) {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<html><head><style>${css}</style></head><body${transparent ? '' : ' style="background:#07080b"'}>${body}</body></html>`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  // Safe Zone prüfen: kein Text ausserhalb
  const out = await p.evaluate((S) => [...document.querySelectorAll('.t,.safe')].map((e) => e.getBoundingClientRect()).filter((r) => r.left < S.x0 - 1 || r.right > S.x1 + 1 || r.top < S.y0 - 1 || r.bottom > S.y1 + 1).length, SAFE);
  if (out) throw new Error(`${path.basename(file)}: ${out} Textblock(e) ausserhalb der Safe Zone`);
  await p.screenshot({ path: file, omitBackground: transparent });
  await b.close();
  return file;
}

// Mitte des Bildes (Luca, 22.10.): Block vertikal um y 960 zentriert, bleibt in der Safe Zone.
const top = (html, size = 120) => `<div class="t" style="top:960px;transform:translateY(-50%);font-size:${size}px">${html}</div>`;
const hook = await png(path.join(RAW, 'ad-hook.png'), top('Tracken fürs<br><span class="g">Training</span>', 150));
const fav = await png(path.join(RAW, 'ad-fav.png'), top('Deine Lebensmittel.<br><span class="g">Schon da.</span>', 104));
const ring = await png(path.join(RAW, 'ad-ring.png'), top('Ein Blick.<br><span class="g">Alles klar.</span>', 120));
const week = await png(path.join(RAW, 'ad-week.png'), top('Die Woche zählt,<br><span class="g">nicht der Tag.</span>', 110));
const logo = `data:image/png;base64,${fs.readFileSync(LOGO).toString('base64')}`;
const endCard = await png(path.join(RAW, 'ad-end.png'), `
  <div style="position:absolute;top:-260px;left:-200px;width:900px;height:900px;border-radius:50%;background:radial-gradient(circle,rgba(230,196,106,.22),rgba(230,196,106,0) 68%)"></div>
  <div style="position:absolute;bottom:-300px;right:-220px;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,.24),rgba(139,92,246,0) 66%)"></div>
  <img class="safe" src="${logo}" style="position:absolute;left:390px;top:320px;width:300px;height:300px">
  <div class="t" style="top:650px;font-size:118px;white-space:nowrap">Serious Nutrition</div>
  <div class="t" style="top:790px;font-size:60px;-webkit-text-stroke:3px #000">Kalorien &amp; Makros.<br><span class="g">Fürs Training gebaut.</span></div>
  <div class="t" style="top:960px;font-size:84px"><span class="pill">Jetzt im App Store</span></div>
  <div class="t" style="top:1110px;font-size:48px;-webkit-text-stroke:2px #000;color:rgba(255,255,255,.85)">Kein Konto. Deine Daten<br>bleiben auf dem Handy.</div>`, false);

// ---------------------------------------------------------------- Musik: Drop finden
const PY = path.join(os.homedir(), 'Downloads/YT Code/yt-pipeline/.venv/bin/python');
const drop = Number(execFileSync(PY, ['-c', `
import librosa, numpy as np
y, sr = librosa.load(${JSON.stringify(MUSIC)}, sr=22050, mono=True, duration=150)
hop=512; rms=librosa.feature.rms(y=y, hop_length=hop)[0]; fps=sr/hop; win=int(3*fps)
best=0; bt=0
for i in range(int(8*fps), len(rms)-win-int(20*fps)):
    r=rms[i:i+win].mean()/(rms[i-win:i].mean()+1e-6)
    if r>best: best=r; bt=i/fps
on=librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop, units='time')
near=[o for o in on if abs(o-bt)<0.6]
print(round(float(min(near, key=lambda o: abs(o-bt))) if near else bt, 3))
`]).toString().trim());

// ---------------------------------------------------------------- Schnitt
const total = sceneDur + END_SEC;
const en = (a, b) => `between(t,${a.toFixed(3)},${b.toFixed(3)})`;
const fc = [
  `[0:v]scale=1080:1920:flags=lanczos,setsar=1,fps=30[app]`,
  `[app][1:v]overlay=0:0:enable='${en(marks.hook, marks.sheet)}'[a1]`,
  `[a1][2:v]overlay=0:0:enable='${en(marks.sheet + 0.6, marks.ring)}'[a2]`,
  `[a2][3:v]overlay=0:0:enable='${en(marks.ring, marks.week)}'[a3]`,
  `[a3][4:v]overlay=0:0:enable='${en(marks.week + 0.3, sceneDur)}'[a4]`,
  `[5:v]loop=loop=-1:size=1:start=0,fps=30,trim=duration=${END_SEC},setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.25[endv]`,
  `[a4]trim=duration=${sceneDur.toFixed(3)},setpts=PTS-STARTPTS[appv]`,
  `[appv][endv]concat=n=2:v=1:a=0[v]`,
  `[6:a]atrim=start=${drop},asetpts=PTS-STARTPTS,atrim=duration=${total.toFixed(3)},afade=t=out:st=${(total - 1).toFixed(3)}:d=1,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`,
].join(';');
const out = path.join(OUT, 'ad-1.3-dach.mp4');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y',
  '-ss', String(startSec), '-t', String(sceneDur), '-i', rawFile,
  '-i', hook, '-i', fav, '-i', ring, '-i', week, '-i', endCard, '-i', MUSIC,
  '-filter_complex', fc, '-map', '[v]', '-map', '[a]', '-map_chapters', '-1', '-map_metadata', '-1', '-dn', '-r', '30',
  '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-tag:v', 'avc1', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out]);
console.log(JSON.stringify({ out, sceneDur: +sceneDur.toFixed(2), total: +total.toFixed(2), drop, marks }));
