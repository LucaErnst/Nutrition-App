// Setzt die Launch-Clips 1–4 zusammen: Rohschnitt (Gesicht) + Hook oben + Untertitel + App-Einblendung + Abspann.
// Aufruf: WORK=<ordner mit rough-*.mp4 und rough-*.words.json> node marketing/launch/compose.mjs
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const WORK = process.env.WORK;
const OUT = path.join(HERE, 'final');
const PNG = path.join(WORK, 'png');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PNG, { recursive: true });

// capTop: Untertitel nicht auf den Shirt-Schriftzug legen – in 3 und 4 steht Luca näher, das Logo liegt tiefer.
// Hook = erster Satz aus dem Drehtag-Dokument. Korrekturen: was Whisper hört → wie es im Skript steht.
const CLIPS = [
  {
    name: '1-its-out', hook: 'It’s out.',
    fix: { 'Series': 'Serious' },
  },
  {
    name: '2-swiss', hook: 'Älplermagronen\nare in the app now.',
    fix: { 'Alpermagrone,': 'Älplermagronen,', 'Alpenmagrone,': 'Älplermagronen,', 'Spriens,': 'Sbrinz,', 'Birchemüsli,': 'Birchermüesli.', 'with': 'With', 'national': 'National', 'food': 'Food', 'database.': 'Database.', 'Servala,': 'Cervelat,', 'Sprienz,': 'Sbrinz,', 'Birchemüsli.': 'Birchermüesli.', 'trader': 'tracker', 'Servala': 'Cervelat', 'Database,': 'Database.' },
  },
  {
    name: '3-story', capTop: 1050, hook: 'I built my athletes an app.',
    fix: { 'subscription': 'subscription,', 'ads': 'ads,' },
  },
  {
    name: '4-no-account', capTop: 1050, hook: 'No account. No ads.\nNo subscription. Why?',
    fix: { 'a': 'the', 'file?': 'file.' },
  },
];

// Schnittliste und App-Einblendung kommen aus dem Rohschnitt (meta.json): die Einblendung liegt dort,
// wo Luca mitten im Wort zum Text schaut.
const META = JSON.parse(fs.readFileSync(path.join(WORK, 'meta.json'), 'utf8'));

const dur = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());

/** Wörter zu Untertitel-Häppchen: höchstens drei Wörter, Satzzeichen beendet ein Häppchen. */
function groups(words, fix, end) {
  const out = [];
  let cur = [];
  const flush = () => { if (cur.length) out.push(cur); cur = []; };
  words.forEach(([a, b, w], i) => {
    // „a" nur in „Export a file" ersetzen, nicht überall
    const fixed = fix?.[w] !== undefined && !(w === 'a' && words[i + 1]?.[2] !== 'file?') ? fix[w] : w;
    // „one" + „-time" gehören zusammen
    if (fixed.startsWith('-') && cur.length) { cur.at(-1).w += fixed; cur.at(-1).b = b; return; }
    if (fixed.startsWith('-') && out.length) { out.at(-1).at(-1).w += fixed; return; }
    cur.push({ a, b, w: fixed });
    if (cur.length >= 3 || /[.,?!]$/.test(fixed)) flush();
  });
  flush();
  return out.map((g, i) => ({
    text: g.map((x) => x.w).join(' '),
    from: g[0].a,
    to: i + 1 < out.length ? out[i + 1][0].a : Math.min(end, g.at(-1).b + 0.6),
  }));
}

const FONT = `-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif`;
function pageHtml(body) {
  return `<html><body style="margin:0;width:1080px;height:1920px;background:transparent;font-family:${FONT};color:#fff">${body}</body></html>`;
}
const hookHtml = (t) => pageHtml(`<div style="position:absolute;left:70px;right:70px;top:230px;text-align:center"><span style="display:inline-block;background:rgba(10,12,18,.78);border-radius:30px;padding:24px 42px;font-size:66px;font-weight:800;line-height:1.15;letter-spacing:-0.01em;white-space:pre-line">${t}</span></div>`);
const capHtml = (t, top) => pageHtml(`<div style="position:absolute;left:90px;right:150px;top:${top}px;text-align:center;font-size:72px;font-weight:800;line-height:1.1;letter-spacing:-0.01em;-webkit-text-stroke:10px #000;paint-order:stroke fill;text-shadow:0 4px 18px rgba(0,0,0,.6)">${t}</div>`);
const outroHtml = () => pageHtml(`<div style="position:absolute;left:70px;right:70px;top:230px;text-align:center"><span style="display:inline-block;background:rgba(10,12,18,.85);border-radius:30px;padding:24px 44px;font-size:52px;font-weight:800;line-height:1.25">Serious Nutrition<br><span style="color:#e6c46a;font-size:42px;font-weight:700">Free on the App Store</span></span></div>`);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
async function png(file, html) {
  await page.setContent(html);
  await page.screenshot({ path: file, omitBackground: true });
  return file;
}

for (const c of CLIPS) {
  const rough = path.join(WORK, `rough-${c.name}.mov`);
  const end = dur(rough);
  const words = JSON.parse(fs.readFileSync(path.join(WORK, `rough-${c.name}.words.json`), 'utf8'));
  const caps = groups(words, c.fix, end);
  const overlays = [];
  overlays.push({ file: await png(path.join(PNG, `${c.name}-hook.png`), hookHtml(c.hook)), from: 0, to: 2.8 });
  for (const [i, g] of caps.entries()) {
    overlays.push({ file: await png(path.join(PNG, `${c.name}-cap${i}.png`), capHtml(g.text, c.capTop ?? 1300)), from: g.from, to: g.to });
  }
  overlays.push({ file: await png(path.join(PNG, `${c.name}-outro.png`), outroHtml()), from: end - 2.6, to: end + 1 });

  const b = META[c.name].broll;
  const bTo = b.to;
  const brollFile = path.join(HERE, 'broll', `${b.file}.mp4`);
  const inputs = ['-i', rough, '-ss', String(b.offset), '-i', brollFile];
  let fc = `[1:v]setpts=PTS-STARTPTS+${b.from_}/TB,fps=30[br];[0:v][br]overlay=0:0:eof_action=pass:enable='between(t,${b.from_},${bTo})'[v0]`;
  overlays.forEach((o, i) => {
    inputs.push('-i', o.file);
    fc += `;[v${i}][${i + 2}:v]overlay=0:0:enable='between(t,${o.from.toFixed(2)},${o.to.toFixed(2)})'[v${i + 1}]`;
  });
  fc += `;[0:a]highpass=f=90,equalizer=f=250:t=q:w=1.2:g=-3,equalizer=f=3500:t=q:w=1.0:g=4,highshelf=f=7500:g=5,deesser=i=0.25,acompressor=threshold=-22dB:ratio=3:attack=8:release=120:makeup=3,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000[a]`;
  const out = path.join(OUT, `${c.name}.mp4`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex', fc, '-map', `[v${overlays.length}]`, '-map', '[a]',
    '-t', String(end), '-r', '30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out]);
  console.log(out, end.toFixed(1) + ' s', caps.map((g) => g.text).join(' | '));
}
await browser.close();
