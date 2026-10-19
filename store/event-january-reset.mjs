/**
 * Bilder für das In-App-Event „January Reset“ (01.–21.01.2027).
 * App Store Connect verlangt pro Sprache ein Bild für die Karte (16:9, 1920 × 1080) und eines für
 * die Detailseite (9:16, 1080 × 1920), kein Alphakanal. Apple legt Name und Kurztext selbst über
 * das Bild – darum steht hier kein Text, nur das Tagebuch und 21 Tage als Punkte.
 *
 * Quelle sind die fertigen Store-Bilder 1.3 (`store/screenshots/<lang>/01-diary.png`); daraus wird
 * nur das Gerät ausgeschnitten. Aufruf: `node store/event-january-reset.mjs`.
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';

const OUT = 'store/event-january-reset';

// Im Store-Bild (430 × 932 Punkte, Faktor 3) steht das Gerät bei x 48, y 246, 334 Punkte breit.
const PHONE = { x: 48, y: 246, w: 334, h: 932 - 246 };

/** 21 Tage: die ersten 14 gefüllt (grün), der Rest offen – „du bist mittendrin“. */
function dots(size, gap) {
  const cells = Array.from({ length: 21 }, (_, i) =>
    `<span style="width:${size}px;height:${size}px;border-radius:50%;${
      i < 14 ? 'background:#34c759;box-shadow:0 0 18px rgba(52,199,89,.45)' : 'border:3px solid rgba(255,255,255,.22)'
    }"></span>`,
  ).join('');
  return `<div class="dots" style="display:grid;grid-template-columns:repeat(7,${size}px);gap:${gap}px">${cells}</div>`;
}

function page(kind, shot) {
  const card = kind === 'card';
  const [W, H] = card ? [1920, 1080] : [1080, 1920];
  // Gerät: Ausschnitt aus dem Store-Bild, unten aus dem Bild laufend.
  const scale = card ? 2.05 : 2.6;
  const pw = PHONE.w * scale;
  const ph = PHONE.h * scale;
  const phoneLeft = card ? 1040 : (W - pw) / 2;
  const phoneTop = card ? 150 : 820;
  const bg = `background-image:url(data:image/png;base64,${shot});background-size:${430 * scale}px ${932 * scale}px;background-position:-${PHONE.x * scale}px -${PHONE.y * scale}px`;
  const dotsBox = card
    ? `<div style="position:absolute;left:190px;top:50%;transform:translateY(-50%)">${dots(74, 30)}</div>`
    : `<div style="position:absolute;left:50%;top:190px;transform:translateX(-50%)">${dots(84, 30)}</div>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: ${W}px; height: ${H}px; overflow: hidden; position: relative; background: #07080b; }
    .glow-a { position: absolute; top: -300px; left: -220px; width: 1000px; height: 1000px; border-radius: 50%;
      background: radial-gradient(circle, rgba(230,196,106,.20), rgba(230,196,106,0) 68%); }
    .glow-b { position: absolute; bottom: -320px; right: -220px; width: 1100px; height: 1100px; border-radius: 50%;
      background: radial-gradient(circle, rgba(139,92,246,.22), rgba(139,92,246,0) 66%); }
    .phone { position: absolute; left: ${phoneLeft}px; top: ${phoneTop}px; width: ${pw}px; height: ${ph}px; ${bg};
      filter: drop-shadow(0 40px 90px rgba(0,0,0,.7)); }
  </style></head><body>
    <div class="glow-a"></div><div class="glow-b"></div>
    ${dotsBox}
    <div class="phone"></div>
  </body></html>`;
}

const browser = await chromium.launch();
for (const lang of ['en', 'de']) {
  const shot = readFileSync(`store/screenshots/${lang}/01-diary.png`).toString('base64');
  mkdirSync(`${OUT}/${lang}`, { recursive: true });
  for (const kind of ['card', 'details']) {
    const [w, h] = kind === 'card' ? [1920, 1080] : [1080, 1920];
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const pg = await ctx.newPage();
    await pg.setContent(page(kind, shot));
    await pg.screenshot({ path: `${OUT}/${lang}/${kind}.png`, omitBackground: false });
    await ctx.close();
  }
}
await browser.close();
console.log(`Bilder in ${OUT}/{en,de}/{card,details}.png`);
