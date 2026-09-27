/**
 * Baut die Grundnahrungsmittel-Tabellen aus dem Bundeslebensmittelschlüssel (BLS 4.0).
 *
 * Quelle: Max Rubner-Institut (2025): Bundeslebensmittelschlüssel (BLS), Version 4.0 –
 * Deutsche Nährstoffdatenbank. Karlsruhe. DOI: 10.25826/Data20251217-134202-0
 * Lizenz: CC BY 4.0 – freie Nutzung mit Namensnennung.
 *
 * Warum diese Quelle: Open Food Facts kennt jedes verpackte Produkt, aber „Hafer Flocken" oder
 * „Schweineschnitzel natur, gebraten" findet man dort schlecht. Der BLS liefert genau solche
 * Grundnahrungsmittel – mit deutschen und englischen Bezeichnungen.
 *
 * Aufruf:
 *   curl -sL -o /tmp/bls.zip "https://www.blsdb.de/assets/uploads/BLS_4_0_2025_DE.zip?token=…"
 *   unzip -q /tmp/bls.zip -d /tmp/bls
 *   unzip -q /tmp/bls/BLS_4_0_2025_DE/BLS_4_0_Daten_2025_DE.xlsx -d /tmp/bls/xlsx
 *   node tools/build-reference-foods.mjs /tmp/bls/xlsx
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
if (!dir) {
  console.error('Pfad zum entpackten XLSX fehlt (Ordner mit xl/worksheets/sheet1.xml).');
  process.exit(1);
}

/** Spalten laut Kopfzeile des BLS-Datenblatts. */
const COLS = { A: 'code', B: 'de', C: 'en', G: 'kcal', M: 'protein', P: 'fat', S: 'carbs' };

/**
 * Was draussen bleibt: Industrie-Zuschnitte und Einträge, die niemand sucht. Die langen
 * Handelsklassen-Bezeichnungen würden die Suche zumüllen, ohne je getippt zu werden.
 */
const NOISE = /\(S [IVX]+\)|Magerfleischanteil|Fettgewebe|Fettwamme|Schwarten|Nitritpökel|Zichorien|Kaffeeersatz/i;
const MAX_NAME = 58;

function sharedStrings() {
  const xml = readFileSync(path.join(dir, 'xl/sharedStrings.xml'), 'utf8');
  const out = [];
  for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    let text = '';
    for (const t of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) text += t[1];
    out.push(decode(text));
  }
  return out;
}

function decode(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

/** „<LOD" heisst: unter der Nachweisgrenze, also praktisch null. */
function num(v) {
  if (v === undefined || v === null) return 0;
  const s = String(v).trim();
  if (s === '' || s.startsWith('<')) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const strings = sharedStrings();
const sheet = readFileSync(path.join(dir, 'xl/worksheets/sheet1.xml'), 'utf8');

const rows = [];
for (const rowMatch of sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
  if (rowMatch[1] === '1') continue; // Kopfzeile
  const rec = {};
  for (const cell of rowMatch[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*)>([\s\S]*?)<\/c>/g)) {
    const key = COLS[cell[1]];
    if (!key) continue;
    const value = cell[3].match(/<v>([\s\S]*?)<\/v>/);
    if (!value) continue;
    rec[key] = / t="s"/.test(cell[2]) ? strings[Number(value[1])] : decode(value[1]);
  }
  if (rec.code && rec.de) rows.push(rec);
}
console.log(`${rows.length} Zeilen gelesen`);

const usable = rows.filter((r) => r.de.length <= MAX_NAME && !NOISE.test(r.de));
mkdirSync('src/db/reference', { recursive: true });

for (const lang of ['de', 'en']) {
  const seen = new Set();
  const out = [];
  for (const r of usable) {
    // Der BLS schreibt deutsch mit ß; die App ist durchgehend schweizerisch mit ss.
    const raw = (r[lang] || r.de).trim();
    const name = lang === 'de' ? raw.replace(/ß/g, 'ss') : raw;
    if (!name || seen.has(name)) continue;
    seen.add(name);
    // Kompaktes Format: [Schlüssel, Name, kcal, Protein, Fett, Kohlenhydrate]
    out.push([r.code, name, Math.round(num(r.kcal)), r1(num(r.protein)), r1(num(r.fat)), r1(num(r.carbs))]);
  }
  const file = `src/db/reference/${lang}.json`;
  writeFileSync(file, JSON.stringify(out) + '\n');
  console.log(`${lang}: ${out.length} Einträge → ${file}`);
}

function r1(n) {
  return Math.round(n * 10) / 10;
}
