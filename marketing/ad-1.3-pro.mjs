// Meta-Anzeige 1.3, Pro-Fassung im Stil der Store-Header: dunkler Grund mit Gold- und Violett-Licht,
// die App läuft in einem iPhone-Rahmen, der unten aus dem Bild läuft, Text oben in der Safe Zone.
// Hook steht ab Frame 0 (Regel brand-video), die folgenden Texte gleiten weich ein und aus.
//
// Vorher: CLIPS_URL=http://localhost:5180/ node marketing/ad-1.3.mjs  (macht Aufnahme + ad-1.3-rec.json)
// Aufruf: node marketing/ad-1.3-pro.mjs → marketing/clips/ad-1.3-dach-pro.mp4
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = fileURLToPath(new URL('./clips/', import.meta.url));
const RAW = path.join(OUT, 'raw');
const rec = JSON.parse(fs.readFileSync(path.join(RAW, 'ad-1.3-rec.json'), 'utf8'));
const { rawFile, startSec, sceneDur, marks } = rec;

const FONT = path.join(os.homedir(), 'Library/Fonts/BebasNeue-Regular.ttf');
const LOGO = path.join(os.homedir(), '.claude/skills/brand-video/assets/beserious/Logo/beserious_logo_gold.png');
const MUSIC = path.join(os.homedir(), 'Downloads/YouTube/Youtube Musik/Faded Light/Audiio_Faded-Light_Revival_Roulettes-Dare_Instrumental.wav');
const SAFE = { x0: 65, x1: 1015, y0: 270, y1: 1248 };
const END_SEC = 3;
const FPS = 30;

// Telefon: Bildschirm 676 breit (App 540×960 → 676×1202), Rahmen 12 px, läuft unten aus dem Bild.
const SCREEN_W = 676, SCREEN_H = 1202, BEZEL = 12, RADIUS = 64;
const PHONE_W = SCREEN_W + 2 * BEZEL, PHONE_X = (1080 - PHONE_W) / 2, PHONE_Y = 710;
const SCREEN_X = PHONE_X + BEZEL, SCREEN_Y = PHONE_Y + BEZEL;

const css = `@font-face{font-family:Bebas;src:url('file://${FONT}')}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1920px;position:relative;overflow:hidden;font-family:Bebas,Impact,sans-serif;text-transform:uppercase;color:#fff}
  .t{position:absolute;left:${SAFE.x0}px;right:${1080 - SAFE.x1}px;text-align:center;line-height:.96;letter-spacing:.01em;
     -webkit-text-stroke:4px #000;paint-order:stroke fill;text-shadow:0 6px 24px rgba(0,0,0,.9)}
  .g{color:#FFC300}
  .pill{display:inline-block;background:#FFC300;color:#000;-webkit-text-stroke:0;text-shadow:0 10px 30px rgba(255,195,0,.35);border-radius:999px;padding:16px 46px 8px}
  .glow-a{position:absolute;top:-300px;left:-260px;width:1000px;height:1000px;border-radius:50%;background:radial-gradient(circle,rgba(230,196,106,.24),rgba(230,196,106,0) 68%)}
  .glow-b{position:absolute;bottom:-340px;right:-260px;width:1100px;height:1100px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,.26),rgba(139,92,246,0) 66%)}`;

const b = await chromium.launch();
async function png(name, body, { transparent = true, check = true } = {}) {
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<html><head><style>${css}</style></head><body style="background:${transparent ? 'transparent' : '#07080b'}">${body}</body></html>`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  if (check) {
    const bad = await p.evaluate((S) => [...document.querySelectorAll('.t')].map((e) => e.getBoundingClientRect()).filter((r) => r.left < S.x0 - 1 || r.right > S.x1 + 1 || r.top < S.y0 - 1 || r.bottom > S.y1 + 1).length, SAFE);
    if (bad) throw new Error(`${name}: Text ausserhalb der Safe Zone`);
  }
  const file = path.join(RAW, `pro-${name}.png`);
  await p.screenshot({ path: file, omitBackground: transparent });
  await p.close();
  return file;
}

// Hintergrund mit Licht und Telefonkörper (Bildschirm bleibt schwarz, das Video kommt darüber)
const bg = await png('bg', `<div class="glow-a"></div><div class="glow-b"></div>
  <div style="position:absolute;left:${PHONE_X}px;top:${PHONE_Y}px;width:${PHONE_W}px;height:1400px;border-radius:${RADIUS + BEZEL}px;
    background:linear-gradient(160deg,#2f333d,#14161b);box-shadow:0 50px 120px rgba(0,0,0,.75),0 0 0 2px rgba(255,255,255,.08)"></div>`, { transparent: false, check: false });
// Maske für die runden Bildschirmecken
const mask = await png('mask', `<div style="position:absolute;left:0;top:0;width:${SCREEN_W}px;height:${SCREEN_H}px;border-radius:${RADIUS}px;background:#fff"></div>`, { check: false });

// Überschriften: zwei Zeilen, oben in der Safe Zone (y 300–620)
const head = (l1, l2, size) => `<div class="t" style="top:${SAFE.y0 + 40}px;font-size:${size}px">${l1}<br><span class="g">${l2}</span></div>`;
const T = {
  hook: await png('hook', head('Tracken fürs', 'Training', 150)),
  fav: await png('fav', head('Deine Lebensmittel.', 'Schon da.', 100)),
  ring: await png('ring', head('Ein Blick.', 'Alles klar.', 140)),
  week: await png('week', head('Die Woche zählt,', 'nicht der Tag.', 124)),
};
const logo = `data:image/png;base64,${fs.readFileSync(LOGO).toString('base64')}`;
const endBg = await png('end-bg', `<div class="glow-a"></div><div class="glow-b"></div>
  <img src="${logo}" style="position:absolute;left:400px;top:330px;width:280px;height:280px">`, { transparent: false, check: false });
const endText = await png('end-text', `
  <div class="t" style="top:650px;font-size:118px;white-space:nowrap">Serious Nutrition</div>
  <div class="t" style="top:790px;font-size:60px;-webkit-text-stroke:3px #000">Kalorien &amp; Makros.<br><span class="g">Fürs Training gebaut.</span></div>
  <div class="t" style="top:960px;font-size:84px"><span class="pill">Jetzt im App Store</span></div>
  <div class="t" style="top:1110px;font-size:48px;-webkit-text-stroke:2px #000;color:rgba(255,255,255,.85)">Kein Konto. Deine Daten<br>bleiben auf dem Handy.</div>`);
await b.close();

// ---------------------------------------------------------------- Musik-Drop (wie ad-1.3.mjs)
const PY = path.join(os.homedir(), 'Downloads/YT Code/yt-pipeline/.venv/bin/python');
const drop = Number(execFileSync(PY, ['-c', `
import librosa
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
const f = (n) => n.toFixed(3);
// Einblenden: 0,35 s, gleitet 60 px von unten (kubisches Ausklingen); Ausblenden 0,2 s
const IN = 0.35, OUTD = 0.2, RISE = 60;
const beats = [
  { key: 'fav', s: marks.sheet + 0.15, e: marks.ring },
  { key: 'ring', s: marks.ring + 0.1, e: marks.week },
  { key: 'week', s: marks.week + 0.25, e: sceneDur },
];
const inputs = ['-ss', String(startSec), '-t', String(sceneDur), '-i', rawFile, '-i', bg, '-i', mask, '-i', T.hook];
for (const bt of beats) inputs.push('-i', T[bt.key]);
inputs.push('-i', endBg, '-i', endText, '-i', MUSIC);
const iEndBg = 4 + beats.length, iEndText = iEndBg + 1, iMusic = iEndText + 1;

const fc = [];
// Bildschirm: App skalieren, runde Ecken per Maske
fc.push(`[0:v]setpts=PTS-STARTPTS,fps=${FPS},scale=${SCREEN_W}:${SCREEN_H}:flags=lanczos,setsar=1,format=rgba[scr0]`);
fc.push(`[2:v]format=gray,crop=${SCREEN_W}:${SCREEN_H}:0:0,loop=loop=-1:size=1,fps=${FPS}[m]`);
fc.push(`[scr0][m]alphamerge[scr]`);
fc.push(`[1:v]loop=loop=-1:size=1,fps=${FPS},trim=duration=${f(sceneDur)},setpts=PTS-STARTPTS[bgv]`);
fc.push(`[bgv][scr]overlay=${SCREEN_X}:${SCREEN_Y}:shortest=1[base]`);
// Hook ab Frame 0 voll sichtbar, blendet vor dem ersten Wechsel aus
fc.push(`[3:v]loop=loop=-1:size=1,fps=${FPS},format=rgba,fade=t=out:st=${f(marks.sheet - OUTD)}:d=${OUTD}:alpha=1[hk]`);
fc.push(`[base][hk]overlay=0:0:enable='lt(t,${f(marks.sheet)})'[v0]`);
beats.forEach((bt, i) => {
  const idx = 4 + i;
  fc.push(`[${idx}:v]loop=loop=-1:size=1,fps=${FPS},format=rgba,fade=t=in:st=${f(bt.s)}:d=${IN}:alpha=1,fade=t=out:st=${f(bt.e - OUTD)}:d=${OUTD}:alpha=1[t${i}]`);
  fc.push(`[v${i}][t${i}]overlay=x=0:y='${RISE}*pow(1-min(1,max(0,(t-${f(bt.s)})/${IN})),3)':enable='between(t,${f(bt.s)},${f(bt.e)})'[v${i + 1}]`);
});
const last = `v${beats.length}`;
fc.push(`[${last}]trim=duration=${f(sceneDur)},setpts=PTS-STARTPTS,format=yuv420p[appv]`);
// Schlusskarte: Grund steht, Text gleitet ein
fc.push(`[${iEndBg}:v]loop=loop=-1:size=1,fps=${FPS},trim=duration=${END_SEC},setpts=PTS-STARTPTS[eb]`);
fc.push(`[${iEndText}:v]loop=loop=-1:size=1,fps=${FPS},trim=duration=${END_SEC},setpts=PTS-STARTPTS,format=rgba,fade=t=in:st=0.1:d=0.4:alpha=1[et]`);
fc.push(`[eb][et]overlay=x=0:y='80*pow(1-min(1,max(0,(t-0.1)/0.45)),3)'[endv0]`);
fc.push(`[endv0]format=yuv420p,fade=t=in:st=0:d=0.25[endv]`);
fc.push(`[appv][endv]concat=n=2:v=1:a=0[v]`);
fc.push(`[${iMusic}:a]atrim=start=${drop},asetpts=PTS-STARTPTS,atrim=duration=${f(total)},afade=t=out:st=${f(total - 1)}:d=1,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]`);

const out = path.join(OUT, 'ad-1.3-dach-pro.mp4');
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs,
  '-filter_complex', fc.join(';'), '-map', '[v]', '-map', '[a]', '-map_chapters', '-1', '-map_metadata', '-1', '-dn', '-r', String(FPS),
  '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.1', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-tag:v', 'avc1',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out]);
console.log(JSON.stringify({ out, total: +total.toFixed(2), drop }));
