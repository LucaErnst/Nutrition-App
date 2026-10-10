// TikTok-Videos aus den Karussell-Folien (VIDEO=1 node build.mjs → out-video/).
// Jede Folie steht so lange, wie man zum Lesen braucht – gerundet auf ganze Takte, der Wisch-Übergang endet auf dem Beat.
// BEATS = JSON mit {track: {file, start, beats[]}} (Beat-Zeiten im Track, librosa). Aufruf: BEATS=… node marketing/instagram/tiktok.mjs
// Musik (alle Audiio, Business / Social-Media):
//   Josh Alan – Everything is Beautiful #1998588604 · The Spacies – Gravity #2328382031
//   Petteri Sainio – To The Moon and Back #2332680392 · Leo de Nada – Game On #3191038632 · Leo de Nada – No Time #6544666769
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = fileURLToPath(new URL('./', import.meta.url));
const SRC = path.join(HERE, 'out-video');
const OUT = path.join(HERE, 'tiktok');
fs.mkdirSync(OUT, { recursive: true });
const BEATS = JSON.parse(fs.readFileSync(process.env.BEATS, 'utf8'));

// Lesezeit je Folie in Sekunden (Zielwert, wird auf den Takt gerundet)
const VIDEOS = {
  'a-why': { music: 'beautiful', secs: [3.5, 4.6, 3.2, 3.2, 3.2, 3.2, 3.8] },
  'b-week': { music: 'gravity', secs: [3.2, 3.7, 3.7, 3.5, 5.0, 3.8] },
  'c-scale': { music: 'moon', secs: [3.2, 3.2, 3.7, 3.7, 4.2, 3.8] },
  'd-training': { music: 'gameon', secs: [3.2, 3.7, 4.6, 3.2, 3.2, 3.8] },
  'e-shortcuts': { music: 'notime', secs: [3.7, 3.0, 3.0, 3.0, 3.0, 3.7, 3.8] },
  'f-protein': { music: 'gravity', secs: [3.2, 3.7, 4.6, 4.6, 3.2, 3.8] },
};
const XF = 0.25; // Übergang

for (const [name, v] of Object.entries(VIDEOS)) {
  const m = BEATS[v.music];
  const beats = m.beats.map((b) => b - m.start); // Beat-Zeiten relativ zum Einstieg
  // Schnittpunkte: kumulierte Lesezeit, auf den nächsten geraden Beat gerundet
  const cuts = [];
  let acc = 0;
  for (const s of v.secs.slice(0, -1)) {
    acc += s;
    const even = beats.filter((_, i) => i % 2 === 0 && beats[i] > (cuts.at(-1) ?? 0) + 1.5);
    const b = even.reduce((x, y) => (Math.abs(y - acc) < Math.abs(x - acc) ? y : x));
    cuts.push(b);
    acc = b;
  }
  const total = acc + v.secs.at(-1);
  const durs = cuts.map((c, i) => c - (i ? cuts[i - 1] : 0));
  durs.push(total - cuts.at(-1));

  const files = fs.readdirSync(SRC).filter((f) => f.startsWith(`carousel-${name}-`)).sort();
  if (files.length !== v.secs.length) throw new Error(`${name}: ${files.length} Folien, ${v.secs.length} Zeiten`);
  // Jede Folie läuft XF länger, damit der Übergang vor dem Beat beginnt und auf ihm endet
  const inputs = files.flatMap((f, i) => ['-loop', '1', '-t', String(durs[i] + (i < files.length - 1 ? XF : 0)), '-i', path.join(SRC, f)]);
  let fc = files.map((_, i) => `[${i}:v]fps=30,format=yuv420p,settb=AVTB[s${i}]`).join(';');
  let prev = 's0';
  files.slice(1).forEach((_, k) => {
    const i = k + 1;
    fc += `;[${prev}][s${i}]xfade=transition=slideleft:duration=${XF}:offset=${(cuts[k] - XF).toFixed(3)}[x${i}]`;
    prev = `x${i}`;
  });
  const a = files.length;
  fc += `;[${a}:a]aresample=48000,afade=t=in:d=0.05,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2,loudnorm=I=-14:TP=-1.5:LRA=11[a]`;
  const out = path.join(OUT, `${name}.mp4`);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-ss', String(m.start), '-t', String(total), '-i', m.file,
    '-filter_complex', fc, '-map', `[${prev}]`, '-map', '[a]', '-t', String(total), '-r', '30',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out]);
  console.log(name, total.toFixed(1) + ' s', 'Schnitte', cuts.map((c) => c.toFixed(2)).join(' '));
}
