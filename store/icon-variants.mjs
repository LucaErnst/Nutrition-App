/** Rendert App-Icon-Varianten (1024×1024) aus dem BS-Logo mit Chromium. */
import { chromium } from '@playwright/test';
import { readFileSync, mkdirSync } from 'node:fs';

const logo = 'data:image/png;base64,' + readFileSync('assets/brand/bs-logo.png').toString('base64');
const variants = {
  'A-dark': { bg: 'radial-gradient(circle at 50% 35%, #23262e 0%, #0f1115 70%)', size: 74, shadow: '0 24px 60px rgba(0,0,0,.55)' },
  'B-blue': { bg: 'linear-gradient(160deg, #2f6df0 0%, #1e4fc4 100%)', size: 74, shadow: '0 24px 60px rgba(0,0,0,.35)' },
  'C-gold': { bg: 'linear-gradient(160deg, #1a1408 0%, #0f1115 60%)', size: 80, shadow: '0 0 90px rgba(255,180,40,.28), 0 24px 60px rgba(0,0,0,.6)', ring: true },
};
mkdirSync('store/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
for (const [name, v] of Object.entries(variants)) {
  await page.setContent(`<html><body style="margin:0;width:1024px;height:1024px;background:${v.bg};display:flex;align-items:center;justify-content:center;overflow:hidden">
    ${v.ring ? '<div style="position:absolute;inset:64px;border-radius:50%;border:2px solid rgba(255,190,60,.18)"></div>' : ''}
    <img src="${logo}" style="width:${v.size}%;filter:drop-shadow(${v.shadow});transform:translateY(-2%)">
  </body></html>`);
  await page.waitForTimeout(200);
  await page.screenshot({ path: `store/icons/${name}.png` });
  console.log('→ store/icons/' + name + '.png');
}
await browser.close();
