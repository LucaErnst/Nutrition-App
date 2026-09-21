// Erzeugt ein Backup mit 35 Tagen realistischer Beispieldaten (Aufbauphase),
// das der Clip-Generator in die App importiert. Aufruf: node marketing/demo-data.mjs
import fs from 'node:fs';

const TODAY = new Date();
const iso = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => { const d = new Date(TODAY); d.setDate(d.getDate() - n); return d; };

const foods = [
  { id: 1, name: 'Haferflocken', kcal: 370, p: 13, f: 7, c: 59, unit: 'g' },
  { id: 2, name: 'Skyr natur', brand: 'Emmi', kcal: 63, p: 11, f: 0.2, c: 4, unit: 'g' },
  { id: 3, name: 'Heidelbeeren', kcal: 57, p: 0.7, f: 0.3, c: 12, unit: 'g' },
  { id: 4, name: 'Ei (ganz)', kcal: 155, p: 13, f: 11, c: 1, unit: 'piece', piece: 55 },
  { id: 5, name: 'Hähnchenbrust (gekocht)', kcal: 165, p: 31, f: 3.6, c: 0, unit: 'g' },
  { id: 6, name: 'Basmatireis (gekocht)', kcal: 130, p: 2.7, f: 0.3, c: 28, unit: 'g' },
  { id: 7, name: 'Brokkoli', kcal: 34, p: 2.8, f: 0.4, c: 7, unit: 'g' },
  { id: 8, name: 'Olivenöl', kcal: 884, p: 0, f: 100, c: 0, unit: 'g' },
  { id: 9, name: 'Rindfleisch mager (gekocht)', kcal: 185, p: 28, f: 8, c: 0, unit: 'g' },
  { id: 10, name: 'Süsskartoffel', kcal: 86, p: 1.6, f: 0.1, c: 20, unit: 'g' },
  { id: 11, name: 'Banane', kcal: 89, p: 1.1, f: 0.3, c: 23, unit: 'piece', piece: 120 },
  { id: 12, name: 'Cashewnüsse', kcal: 553, p: 18, f: 44, c: 30, unit: 'g' },
  { id: 13, name: 'Protein-Milch', brand: 'Emmi', kcal: 56, p: 8, f: 1.5, c: 3, unit: 'ml' },
  { id: 14, name: 'Lachs (gebraten)', kcal: 208, p: 20, f: 13, c: 0, unit: 'g' },
  { id: 15, name: 'Vollkornbrot', kcal: 247, p: 8, f: 3, c: 41, unit: 'g' },
  { id: 16, name: 'Hüttenkäse', kcal: 98, p: 11, f: 4, c: 3, unit: 'g' },
];

const foodItems = foods.map((f) => ({
  id: f.id, name: f.name, brand: f.brand,
  kcal_per_100g: f.kcal, protein_per_100g: f.p, fat_per_100g: f.f, carbs_per_100g: f.c,
  unit_type: f.unit === 'piece' ? 'piece' : f.unit, piece_weight_g: f.piece, source: 'manual', saved: 1,
  favorite: [2, 5, 1].includes(f.id) ? 1 : 0, created_at: Date.now() - 40 * 864e5,
}));

const snap = (f) => ({ name: f.name, brand: f.brand, kcal_per_100g: f.kcal, protein_per_100g: f.p, fat_per_100g: f.f, carbs_per_100g: f.c, unit_type: f.unit === 'piece' ? 'piece' : f.unit, piece_weight_g: f.piece });
const by = Object.fromEntries(foods.map((f) => [f.id, f]));

// Tagespläne (Menge in g/ml bzw. Stück); leicht variiert
const plans = [
  { breakfast: [[1, 80], [2, 250], [3, 120]], morning_snack: [[11, 1]], lunch: [[5, 200], [6, 200], [7, 150], [8, 10]], afternoon_snack: [[12, 30], [13, 300]], dinner: [[9, 200], [10, 250], [7, 100]] },
  { breakfast: [[4, 3], [15, 90], [16, 150]], morning_snack: [[2, 200]], lunch: [[14, 180], [6, 180], [7, 150]], afternoon_snack: [[11, 1], [13, 300]], dinner: [[5, 220], [10, 300], [8, 10]] },
  { breakfast: [[1, 90], [13, 300], [3, 100]], morning_snack: [[12, 25]], lunch: [[9, 180], [6, 220], [7, 120], [8, 10]], afternoon_snack: [[2, 250]], dinner: [[14, 200], [10, 250], [7, 150]] },
];

let id = 1;
const mealEntries = [];
const water = [];
const days = [];
const N = 35;
for (let i = N; i >= 1; i--) {
  const d = daysAgo(i);
  const date = iso(d);
  const wd = d.getDay();
  const training = [1, 2, 4, 5].includes(wd);
  const plan = plans[i % plans.length];
  const scale = training ? 1.0 : 0.84;
  // Kohlenhydrat-/Fettquellen grosszügiger, Proteinquellen leicht kleiner – ergibt ~2'900 kcal / 160 g Protein an Trainingstagen
  const CARB_FAT = new Set([1, 3, 6, 8, 10, 11, 12, 15]);
  // Zwei „Ausreisser“-Tage über Ziel, ein untererfasster Tag
  const bump = i === 4 ? 1.5 : i === 20 ? 1.25 : 1;
  const skip = i === 16;
  if (skip) continue;
  for (const [meal, items] of Object.entries(plan)) {
    for (const [fid, amt] of items) {
      const f = by[fid];
      const jitter = 0.9 + ((i * 7 + fid * 3) % 21) / 100;
      const kind = CARB_FAT.has(fid) ? 1.85 : 0.82;
      const amount = f.unit === 'piece' ? amt : Math.round(amt * kind * scale * bump * jitter / 5) * 5;
      mealEntries.push({ id: id++, date, meal_type: meal, food_item_id: fid, amount, unit: f.unit === 'piece' ? 'piece' : f.unit, created_at: d.getTime() + 8 * 36e5, snapshot: snap(f) });
    }
  }
  const ml = 2000 + ((i * 13) % 6) * 250;
  for (let k = 0; k < ml / 250; k++) water.push({ date, ml: 250, created_at: d.getTime() + (9 + k) * 36e5 });
  days.push({ date, is_training: training });
}

// Heute: Frühstück + Mittag schon drin, Abend offen (für Clip A)
const today = iso(TODAY);
for (const [fid, amt] of [[1, 80], [2, 250], [3, 120]]) mealEntries.push({ id: id++, date: today, meal_type: 'breakfast', food_item_id: fid, amount: amt, unit: by[fid].unit === 'piece' ? 'piece' : by[fid].unit, created_at: Date.now() - 6 * 36e5, snapshot: snap(by[fid]) });
for (const [fid, amt] of [[5, 200], [6, 200], [7, 150], [8, 10]]) mealEntries.push({ id: id++, date: today, meal_type: 'lunch', food_item_id: fid, amount: amt, unit: by[fid].unit, created_at: Date.now() - 2 * 36e5, snapshot: snap(by[fid]) });
for (let k = 0; k < 5; k++) water.push({ date: today, ml: 250, created_at: Date.now() - (5 - k) * 36e5 });
days.push({ date: today, is_training: true });

// Gewicht: Aufbau 76.0 → 78.2 über 90 Tage mit Tagesrauschen
const weights = [];
for (let i = 90; i >= 0; i--) {
  const base = 76 + (90 - i) * (2.2 / 90);
  const noise = Math.sin(i * 1.7) * 0.45 + Math.cos(i * 0.6) * 0.3 + (((i * 31) % 7) - 3) * 0.08;
  weights.push({ date: iso(daysAgo(i)), weight_kg: Math.round((base + noise) * 10) / 10 });
}

const backup = {
  app: 'nutrition-tracker', version: 1, exported_at: new Date().toISOString(),
  foodItems, mealEntries,
  goals: [{ id: 1, phase_name: 'Aufbau', phase_type: 'bulk', start_date: iso(daysAgo(60)), training_day_kcal: 2900, rest_day_kcal: 2500, protein_g: 160, fat_min_g: 70, fat_max_g: 90 }],
  weights, days,
  settings: [{ id: 1, training_weekdays: [1, 2, 4, 5], language: 'de', water_goal_ml: 3000, onboarding_done: true, last_backup_at: Date.now() }],
  templates: [], water,
};
fs.writeFileSync(new URL('./demo-backup.json', import.meta.url), JSON.stringify(backup));
console.log(`demo-backup.json: ${mealEntries.length} Einträge, ${weights.length} Gewichte, ${water.length} Wasser`);
