/**
 * Erzeugt aus dem BS-Logo alle Quell-Bilder für @capacitor/assets und die PWA:
 * assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png, splash-dark.png,
 * public/icon-192.png, icon-512.png, apple-touch-icon.png
 */
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const logo = 'data:image/png;base64,' + readFileSync('assets/brand/bs-logo.png').toString('base64');
const BG = 'radial-gradient(circle at 50% 35%, #23262e 0%, #0f1115 70%)';
const SOLID = '#0f1115';

const browser = await chromium.launch();
async function render(path, w, h, html, transparent = false) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;width:${w}px;height:${h}px;overflow:hidden;background:transparent">${html}</body></html>`);
  await page.waitForTimeout(150);
  await page.screenshot({ path, omitBackground: transparent });
  await page.close();
  console.log('→', path);
}
const centered = (bg, size, extra = '') =>
  `<div style="width:100%;height:100%;background:${bg};display:flex;align-items:center;justify-content:center">
     <img src="${logo}" style="width:${size}%;filter:drop-shadow(0 24px 60px rgba(0,0,0,.55));transform:translateY(-2%)${extra}"></div>`;

// App-Icon (iOS: Apple rundet selbst ab; Android: Vorder-/Hintergrund getrennt)
await render('assets/icon-only.png', 1024, 1024, centered(BG, 74));
// Android adaptive: Vordergrund nur Logo (transparent), Safe-Zone = innere 66 % → Logo kleiner
await render('assets/icon-foreground.png', 1024, 1024,
  `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent"><img src="${logo}" style="width:52%;transform:translateY(-2%)"></div>`, true);
await render('assets/icon-background.png', 1024, 1024, `<div style="width:100%;height:100%;background:${BG}"></div>`);
// Splash: Logo klein in der Mitte, dunkel (hell/dunkel identisch – Marke bleibt dunkel)
await render('assets/splash.png', 2732, 2732, centered(SOLID, 22));
await render('assets/splash-dark.png', 2732, 2732, centered(SOLID, 22));
// PWA
await render('public/icon-512.png', 512, 512, centered(BG, 74));
await render('public/icon-192.png', 192, 192, centered(BG, 74));
await render('public/apple-touch-icon.png', 180, 180, centered(BG, 74));
await browser.close();
