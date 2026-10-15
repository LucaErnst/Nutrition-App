/**
 * Amerikanische Grundnahrungsmittel aus USDA FoodData Central, Teil SR Legacy (April 2018).
 * Gemeinfrei (CC0); die Quellenangabe steht trotzdem in der App unter „Mehr".
 *
 * Eigene Datei `src/db/reference/usda.json`, nicht in `en.json`: Die deutsche und die englische
 * Tabelle müssen dieselben Schlüssel haben, sonst verschwänden beim Sprachwechsel Einträge.
 * USDA gibt es nur auf Englisch und erscheint nur in englischer App-Sprache (entschieden
 * 10.10.2026, docs/RELEASE-1.2.md A1).
 *
 * Ausgelassen: Babynahrung und die Kategorie „American Indian/Alaska Native Foods" (Robbe,
 * Walross …). Dubletten zum BLS und zur Startliste: gleicher Name nach Normalisierung.
 *
 * Aufruf:
 *   curl -sL -o /tmp/sr.zip https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
 *   unzip -q /tmp/sr.zip -d /tmp/sr
 *   node tools/add-usda-foods.mjs /tmp/sr/FoodData_Central_sr_legacy_food_csv_2018-04
 */
import { createReadStream, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Aufruf: node tools/add-usda-foods.mjs <entpackter-SR-Legacy-Ordner>');
  process.exit(1);
}

const PREFIX = 'usda:';
/** Babynahrung, American Indian/Alaska Native Foods */
const SKIP_CATEGORIES = new Set(['3', '24']);
/** Längere Namen gibt es bei USDA oft („…, separable lean only, trimmed to 1/8" fat, …"). */
const MAX_NAME = 90;
const NUTRIENTS = { 1008: 'kcal', 1003: 'protein', 1004: 'fat', 1005: 'carbs' };

/** CSV-Zeile mit Anführungszeichen; Kommas in Namen sind bei USDA die Regel. */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

async function* rows(file) {
  const rl = createInterface({ input: createReadStream(path.join(dir, file)), crlfDelay: Infinity });
  let header;
  for await (const line of rl) {
    if (!line) continue;
    const cells = parseCsvLine(line);
    if (!header) {
      header = cells;
      continue;
    }
    yield Object.fromEntries(header.map((h, i) => [h, cells[i]]));
  }
}

const norm = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
const r1 = (n) => Math.round(n * 10) / 10;

const foods = new Map();
for await (const r of rows('food.csv')) {
  if (SKIP_CATEGORIES.has(r.food_category_id)) continue;
  // Verwaltungszusatz, für Nutzer bedeutungslos
  const name = r.description.replace(/\s*\(Includes foods for USDA's Food Distribution Program\)/i, '').trim();
  if (!name || name.length > MAX_NAME) continue;
  foods.set(r.fdc_id, { name });
}

for await (const r of rows('food_nutrient.csv')) {
  const f = foods.get(r.fdc_id);
  const key = NUTRIENTS[r.nutrient_id];
  if (!f || !key) continue;
  f[key] = Number(r.amount);
}

const blsNames = new Set(JSON.parse(readFileSync('src/db/reference/en.json', 'utf8')).map((row) => norm(row[1])));
// Auch die Startliste (SEED in src/db/seed.ts) – sonst stünde „Oats" zweimal untereinander.
for (const m of readFileSync('src/db/seed.ts', 'utf8').matchAll(/name_en: '([^']+)'/g)) blsNames.add(norm(m[1]));
const out = [];
let dupes = 0;
let incomplete = 0;
for (const [id, f] of foods) {
  if (![f.kcal, f.protein, f.fat, f.carbs].every((v) => Number.isFinite(v))) {
    incomplete++;
    continue;
  }
  if (blsNames.has(norm(f.name))) {
    dupes++;
    continue;
  }
  out.push([PREFIX + id, f.name, Math.round(f.kcal), r1(f.protein), r1(f.fat), r1(f.carbs)]);
}
out.sort((a, b) => a[1].localeCompare(b[1]));
writeFileSync('src/db/reference/usda.json', JSON.stringify(out) + '\n');
console.log(`USDA: ${out.length} Einträge → src/db/reference/usda.json (${dupes} Dubletten zum BLS, ${incomplete} ohne vollständige Nährwerte)`);
