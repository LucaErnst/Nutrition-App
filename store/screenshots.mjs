/**
 * Erzeugt Store-Screenshots (iPhone 6,7", 1290×2796) mit Beispieldaten in EN und DE.
 * Aufruf: npm run screenshots  (baut die App und startet vite preview auf Port 4174)
 */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const PORT = 4174;
const BASE = `http://localhost:${PORT}`;
const OUT = 'store/screenshots';

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };

// Beispiel-Lebensmittel (pro 100 g) – Namen je Sprache
const FOODS = [
  { id: 1, en: 'Low-fat quark', de: 'Magerquark', kcal: 67, p: 12, f: 0.4, c: 4, unit: 'weight', amt: 250 },
  { id: 2, en: 'Oats', de: 'Haferflocken', kcal: 367, p: 13.3, f: 6.7, c: 60, unit: 'weight', amt: 60 },
  { id: 3, en: 'Blueberries', de: 'Heidelbeeren', kcal: 57, p: 0.5, f: 0.5, c: 12, unit: 'weight', amt: 150 },
  { id: 4, en: 'Chicken breast (cooked)', de: 'Hähnchenbrust (gekocht)', kcal: 167, p: 31, f: 3.3, c: 0, unit: 'weight', amt: 200 },
  { id: 5, en: 'Basmati rice (cooked)', de: 'Basmatireis (gekocht)', kcal: 129, p: 2.5, f: 0, c: 28, unit: 'weight', amt: 250 },
  { id: 6, en: 'Broccoli', de: 'Brokkoli', kcal: 33, p: 2.7, f: 0.7, c: 3.3, unit: 'weight', amt: 200 },
  { id: 7, en: 'Skyr natural', de: 'Skyr Natur', brand: 'Danone', kcal: 57, p: 10, f: 0.2, c: 3.9, unit: 'weight', amt: 200, barcode: '3033491704642' },
  { id: 8, en: 'Banana', de: 'Banane', kcal: 87.5, p: 0.8, f: 0, c: 22.5, unit: 'piece', piece: 120, amt: 1 },
  { id: 9, en: 'Lean beef (cooked)', de: 'Rindfleisch mager (gekocht)', kcal: 185, p: 27.5, f: 8, c: 0, unit: 'weight', amt: 200 },
  { id: 10, en: 'Sweet potato', de: 'Süsskartoffel', kcal: 85, p: 1.5, f: 0, c: 20, unit: 'weight', amt: 300 },
  { id: 11, en: 'Cashew nuts', de: 'Cashewnüsse', kcal: 552, p: 20, f: 44, c: 30, unit: 'weight', amt: 30, portions: [{ label: '1 handful', grams: 30 }] },
  { id: 12, en: 'Olive oil', de: 'Olivenöl', kcal: 857, p: 0, f: 100, c: 0, unit: 'piece', piece: 14, amt: 1 },
];

function backup(lang) {
  const now = Date.now();
  const name = (f) => f[lang];
  const foodItems = FOODS.map((f, i) => ({
    id: f.id, name: name(f), brand: f.brand, kcal_per_100g: f.kcal, protein_per_100g: f.p, fat_per_100g: f.f, carbs_per_100g: f.c,
    unit_type: f.unit, piece_weight_g: f.piece, default_amount: f.amt, source: f.barcode ? 'openfoodfacts' : 'reference', barcode: f.barcode,
    saved: 1, favorite: i < 3 ? 1 : 0, portions: f.portions, created_at: now - 1e7 + i, last_amount: f.amt, last_unit: f.unit === 'piece' ? 'Stück' : 'g',
  }));
  const snap = (f) => ({ name: name(f), brand: f.brand, kcal_per_100g: f.kcal, protein_per_100g: f.p, fat_per_100g: f.f, carbs_per_100g: f.c, unit_type: f.unit, piece_weight_g: f.piece });
  const F = Object.fromEntries(FOODS.map((f) => [f.id, f]));
  // Tagesplan: [meal, foodId, amount, unit]
  const day = (variant) => [
    ['breakfast', 1, 250, 'g'], ['breakfast', 2, 60, 'g'], ['breakfast', 3, 150, 'g'],
    ['morning_snack', 7, 200, 'g'], ['morning_snack', 8, 1, 'Stück'],
    ['lunch', 4, variant ? 280 : 250, 'g'], ['lunch', 5, 300, 'g'], ['lunch', 6, 200, 'g'], ['lunch', 12, 1, 'Stück'],
    ['afternoon_snack', 11, 40, 'g'],
    ['dinner', 9, 250, 'g'], ['dinner', 10, variant ? 450 : 400, 'g'], ['dinner', 6, 150, 'g'],
  ];
  const mealEntries = [];
  let id = 1;
  for (let d = 6; d >= 0; d--) {
    const date = daysAgo(d);
    const rows = d === 0 ? day(false).slice(0, 7) : day(d % 2 === 0); // heute: bis Mittag
    rows.forEach(([meal, fid, amount, unit], i) => {
      mealEntries.push({ id: id++, date, meal_type: meal, food_item_id: fid, amount, unit, snapshot: snap(F[fid]), created_at: now - d * 864e5 + i * 1000 });
    });
  }
  const weights = [];
  for (let d = 27; d >= 0; d--) weights.push({ id: 28 - d, date: daysAgo(d), weight_kg: Math.round((76.4 + (27 - d) * 0.05 + Math.sin(d * 1.3) * 0.45) * 10) / 10 });
  const water = [500, 500, 250, 500].map((ml, i) => ({ id: i + 1, date: daysAgo(0), ml, created_at: now - (4 - i) * 36e5 }));
  for (let d = 1; d <= 6; d++) [500, 500, 500, 500, 500, 250].forEach((ml, i) => water.push({ id: 100 + d * 10 + i, date: daysAgo(d), ml, created_at: now - d * 864e5 + i * 1000 }));
  return {
    app: 'nutrition-tracker', version: 1, exported_at: new Date().toISOString(),
    foodItems, mealEntries,
    goals: [{ id: 1, phase_name: lang === 'de' ? 'Aufbau' : 'Bulk', start_date: daysAgo(30), training_day_kcal: 2900, rest_day_kcal: 2500, protein_g: 150, fat_min_g: 70, fat_max_g: 85 }],
    weights, days: [], settings: [{ id: 1, training_weekdays: [1, 2, 4, 5], language: lang, water_goal_ml: 3000, onboarding_done: true, last_backup_at: now }],
    templates: [{ id: 1, name: lang === 'de' ? 'Standard-Frühstück' : 'Standard breakfast', items: [{ food_item_id: 1, amount: 250, unit: 'g' }, { food_item_id: 2, amount: 60, unit: 'g' }, { food_item_id: 3, amount: 150, unit: 'g' }], created_at: now }],
    water,
  };
}

async function main() {
  const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
  const browser = await chromium.launch();
  try {
    for (const lang of ['en', 'de']) {
      mkdirSync(`${OUT}/${lang}`, { recursive: true });
      const context = await browser.newContext({
        viewport: { width: 430, height: 932 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
        locale: lang === 'de' ? 'de-CH' : 'en-US', colorScheme: 'light',
      });
      await context.addInitScript((l) => localStorage.setItem('nutrition-tracker:language', l), lang);
      const page = await context.newPage();
      const t = (en, de) => (lang === 'de' ? de : en);

      await page.goto(BASE);
      await page.getByRole('button', { name: t('Skip, set targets later', 'Überspringen, Ziele später festlegen') }).click();
      await page.getByRole('button', { name: t('More', 'Mehr') }).click();
      await page.getByRole('button', { name: t('Import backup…', 'Backup importieren…') }).click({ force: true }).catch(() => {});
      await page.locator('input[type=file]').setInputFiles({ name: 'sample.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(backup(lang))) });
      await page.getByRole('button', { name: t('Replace and restore', 'Ersetzen und wiederherstellen') }).click();
      await page.waitForTimeout(500);
      await page.reload();
      await page.waitForTimeout(800);

      const shot = (n) => page.screenshot({ path: `${OUT}/${lang}/${n}.png` });

      // 1 Tagebuch
      await page.getByRole('button', { name: t('Diary', 'Tagebuch') }).click();
      await page.waitForTimeout(400);
      await shot('01-diary');

      // 2 Suche mit Ergebnissen
      await page.getByRole('button', { name: t('Add item to Dinner', 'Posten zu Abendessen hinzufügen') }).click();
      await page.waitForTimeout(400);
      await shot('02-search');

      // 3 Mengen-Picker mit Chips
      await page.getByRole('dialog').getByText(t('Cashew nuts', 'Cashewnüsse'), { exact: true }).click();
      await page.waitForTimeout(300);
      await shot('03-amount');
      await page.keyboard.press('Escape');

      // 4 Woche
      await page.getByRole('button', { name: t('Week', 'Woche') }).click();
      await page.waitForTimeout(500);
      await shot('04-week');

      // 5 Gewicht
      await page.getByRole('button', { name: t('Weight', 'Gewicht') }).click();
      await page.waitForTimeout(1200);
      await shot('05-weight');

      // 6 Ziele/Mehr
      await page.getByRole('button', { name: t('More', 'Mehr') }).click();
      await page.waitForTimeout(400);
      await page.evaluate(() => window.scrollTo(0, 260));
      await page.waitForTimeout(200);
      await shot('06-goals');

      await context.close();
      console.log(`${lang}: 6 Screenshots → ${OUT}/${lang}/`);
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
