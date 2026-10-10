// Clip D „Barcode → done.“ aus Lucas iPhone-Bildschirmaufnahme (ohne Gesicht), mit Musik und Tap-Geräuschen.
// Aufruf: SRC=<SDR-Fassung der Aufnahme> node marketing/launch/scan-clip.mjs
// Musik: Leo de Nada – Game On (Instrumental), Audiio-Lizenz #3191038632 (Business, Social-Media).
// Der Beat-Einsatz (2:24.74 im Track) liegt genau auf dem Erkennen des Barcodes.
import { chromium } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const SRC = process.env.SRC;
const OUT = path.join(HERE, 'final', 'd-barcode.mp4');
const TMP = path.dirname(SRC);

// Tagebuch → Dialog, dann (Pause im Dialog übersprungen) Scan → Ergebnis → Add, dann der fertige Eintrag
const SEGS = [[4.9, 6.0], [9.7, 14.0], [14.1, 16.6]];
const HOLD = 1.2; // letztes Bild stehen lassen für den Abspann

const HOME = process.env.HOME;
const MUSIC = `${HOME}/Downloads/YouTube/Youtube Musik/Leo de Nada/Game On (Instrumental)/Audiio_Leo-de-Nada_Leo-de-Nada_Game-On_Instrumental.wav`;
const DROP = 144.74; // Einsatz im Track
const DETECT = 2.6; // Barcode erkannt, Zeit im Clip
const TAP = `${HOME}/Downloads/YouTube/The Story Sound Pack/Extras/Phone - Tap 03.wav`;
const TAPS = [0.70, 1.25, 5.40]; // + Add, Scan, Add

const FONT = `-apple-system,'SF Pro Display','Helvetica Neue',Arial,sans-serif`;
const page = (body) => `<html><body style="margin:0;width:1080px;height:1920px;background:transparent;font-family:${FONT};color:#fff">${body}</body></html>`;
const hook = page(`<div style="position:absolute;left:70px;right:70px;top:230px;text-align:center"><span style="display:inline-block;background:rgba(10,12,18,.85);border-radius:30px;padding:24px 42px;font-size:72px;font-weight:800;line-height:1.15">Barcode → done.</span></div>`);
const outro = page(`<div style="position:absolute;left:70px;right:70px;top:230px;text-align:center"><span style="display:inline-block;background:rgba(10,12,18,.9);border-radius:30px;padding:24px 44px;font-size:52px;font-weight:800;line-height:1.25">Serious Nutrition<br><span style="color:#e6c46a;font-size:42px;font-weight:700">Free on the App Store</span></span></div>`);

const browser = await chromium.launch();
const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [name, html] of [['hook', hook], ['outro', outro]]) {
  await p.setContent(html);
  await p.screenshot({ path: path.join(TMP, `d-${name}.png`), omitBackground: true });
}
await browser.close();

function audio(first) {
  const m = `[${first}:a]aresample=48000,afade=t=out:st=${(dur - 0.9).toFixed(2)}:d=0.9,volume=0.9[m]`;
  const taps = TAPS.map((t, i) => `[${first + 1 + i}:a]aresample=48000,volume=0.55,adelay=${Math.round(t * 1000)}|${Math.round(t * 1000)}[t${i}]`);
  return `;${m};${taps.join(';')};[m]${TAPS.map((_, i) => `[t${i}]`).join('')}amix=inputs=${TAPS.length + 1}:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
}

const dur = SEGS.reduce((s, [a, b]) => s + b - a, 0) + HOLD;
const inputs = SEGS.flatMap(([a, b]) => ['-ss', String(a), '-t', String(b - a), '-i', SRC]);
let fc = SEGS.map((_, i) => `[${i}:v]fps=30,setpts=PTS-STARTPTS[s${i}]`).join(';');
fc += `;${SEGS.map((_, i) => `[s${i}]`).join('')}concat=n=${SEGS.length}:v=1[c]`;
fc += `;[c]tpad=stop_mode=clone:stop_duration=${HOLD},scale=-2:1920:flags=lanczos,pad=1080:1920:(ow-iw)/2:0:color=0x0b0d12[b]`;
const n = SEGS.length;
fc += `;[b][${n}:v]overlay=0:0:enable='lt(t,${(dur - 2.4).toFixed(2)})'[h];[h][${n + 1}:v]overlay=0:0:enable='gte(t,${(dur - 2.4).toFixed(2)})'[v]`;
execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-i', path.join(TMP, 'd-hook.png'), '-i', path.join(TMP, 'd-outro.png'),
  '-ss', String(DROP - DETECT), '-t', String(dur), '-i', MUSIC, ...TAPS.flatMap(() => ['-i', TAP]),
  '-filter_complex', fc + audio(n + 2), '-map', '[v]', '-map', '[a]', '-t', String(dur), '-r', '30',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', OUT]);
console.log(OUT, dur.toFixed(1) + ' s');
