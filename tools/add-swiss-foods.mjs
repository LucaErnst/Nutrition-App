/**
 * Ergänzt die Grundnahrungsmittel um die Schweizer Nährwertdatenbank.
 *
 * Quelle: Schweizer Nährwertdatenbank V 7.1 (01.07.2026), Bundesamt für Lebensmittelsicherheit
 * und Veterinärwesen BLV. Nutzung mit schriftlicher Zustimmung vom 30.09.2026, siehe
 * `docs/BLV-ANFRAGE.md`. Quellenangabe steht in der App unter „Mehr".
 *
 * Warum nur ein Teil: Der Bundeslebensmittelschlüssel deckt Grundnahrungsmittel bereits ab –
 * Milch, Brot, Fleisch stehen in beiden Tabellen. Übernommen wird deshalb nur, was der BLS
 * nicht kennt: Älplermagronen, Birchermüesli, Bauernschüblig, Baumnuss, Wähe, Cervelat, Sbrinz.
 * Alles andere würde die Suche verdoppeln, ohne etwas hinzuzufügen.
 *
 * Läuft nach `build-reference-foods.mjs` und hängt an dessen Ergebnis an. Mehrfaches Ausführen
 * ändert nichts: Einträge mit bekanntem Schlüssel werden übersprungen.
 *
 * Aufruf:
 *   curl -sL -o /tmp/ch-de.xlsx "https://naehrwertdaten.ch/wp-content/uploads/2026/07/Schweizer_Nahrwertdatenbank.xlsx"
 *   curl -sL -o /tmp/ch-en.xlsx "https://naehrwertdaten.ch/wp-content/uploads/2026/07/Swiss_food_composition_database.xlsx"
 *   unzip -q /tmp/ch-de.xlsx -d /tmp/ch-de && unzip -q /tmp/ch-en.xlsx -d /tmp/ch-en
 *   node tools/add-swiss-foods.mjs /tmp/ch-de /tmp/ch-en
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [deDir, enDir] = process.argv.slice(2);
if (!deDir || !enDir) {
  console.error('Aufruf: node tools/add-swiss-foods.mjs <entpacktes-DE-xlsx> <entpacktes-EN-xlsx>');
  process.exit(1);
}

/** Spalten laut Kopfzeile (Zeile 3) des Blatts „Generische Lebensmittel". */
const COLS = { A: 'id', D: 'name', L: 'kcal', O: 'fat', AP: 'carbs', BB: 'protein' };

/** Schlüsselpräfix, damit die Herkunft eines Eintrags erkennbar bleibt. */
const PREFIX = 'ch-';

/** Wie im BLS-Skript: längere Bezeichnungen tippt niemand und sie sprengen die Zeile. */
const MAX_NAME = 62;

function decode(s) {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function sharedStrings(dir) {
  const xml = readFileSync(path.join(dir, 'xl/sharedStrings.xml'), 'utf8');
  const out = [];
  for (const m of xml.matchAll(/<si>([\s\S]*?)<\/si>/g)) {
    let text = '';
    for (const t of m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)) text += t[1];
    out.push(decode(text));
  }
  return out;
}

/**
 * Zeilen des ersten Blatts. Leere Zellen stehen als `<c .../>` ohne Inhalt in der Datei – wer
 * die überliest, schiebt alle folgenden Werte eine Spalte nach links und liest Kalorien als
 * Quellenangabe.
 */
function readRows(dir) {
  const strings = sharedStrings(dir);
  const sheet = readFileSync(path.join(dir, 'xl/worksheets/sheet1.xml'), 'utf8');
  const rows = [];
  for (const row of sheet.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    if (Number(row[1]) < 4) continue; // Titel, Leerzeile, Kopfzeile
    const rec = {};
    for (const cell of row[2].matchAll(/<c r="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const key = COLS[cell[1]];
      if (!key || cell[3] === undefined) continue;
      const value = cell[3].match(/<v>([\s\S]*?)<\/v>/);
      if (!value) continue;
      rec[key] = / t="s"/.test(cell[2]) ? strings[Number(value[1])] : decode(value[1]);
    }
    if (rec.id && rec.name) rows.push(rec);
  }
  return rows;
}

/** „k.A." heisst: kein Wert vorhanden. */
function num(v) {
  if (v === undefined || v === null) return 0;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : 0;
}

function r1(n) {
  return Math.round(n * 10) / 10;
}

/** Erstes bedeutungstragendes Wort, normalisiert – die Grundlage des Dublettenvergleichs. */
function headWord(name) {
  const words = String(name)
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter((w) => w.length > 2);
  return words[0] ?? '';
}

const de = readRows(deDir);
const en = readRows(enDir);
console.log(`Schweizer Datenbank: ${de.length} Einträge (DE), ${en.length} (EN)`);

const enById = new Map(en.map((r) => [r.id, r.name]));

/*
 * Die Auswahl fällt einmal – für beide Sprachen dieselbe. Würde jede Sprache für sich
 * entscheiden, enthielte die englische Tabelle andere Einträge als die deutsche, und ein
 * Sprachwechsel liesse Lebensmittel verschwinden.
 */
const deTable = JSON.parse(readFileSync('src/db/reference/de.json', 'utf8'));
// Was der BLS schon kennt, bleibt draussen. Verglichen wird das erste Wort: „Appenzeller"
// steht in beiden Tabellen, „Älplermagronen" nur in der Schweizer.
const known = new Set(deTable.map((row) => headWord(row[1])));
const existingKeys = new Set(deTable.map((row) => row[0]));

const chosen = [];
for (const row of de) {
  const key = PREFIX + row.id;
  if (existingKeys.has(key) || known.has(headWord(row.name))) continue;
  const kcal = Math.round(num(row.kcal));
  if (kcal <= 0) continue;
  const nameDe = row.name.trim().replace(/ß/g, 'ss');
  // Ohne englische Bezeichnung bliebe der Eintrag in der englischen App deutsch stehen.
  const nameEn = (enById.get(row.id) ?? '').trim();
  if (!nameDe || !nameEn || nameDe.length > MAX_NAME || nameEn.length > MAX_NAME) continue;
  chosen.push({
    key,
    de: nameDe,
    en: nameEn,
    kcal,
    protein: r1(num(row.protein)),
    fat: r1(num(row.fat)),
    carbs: r1(num(row.carbs)),
  });
}
console.log(`${chosen.length} Einträge kennt der BLS nicht`);

for (const lang of ['de', 'en']) {
  const file = `src/db/reference/${lang}.json`;
  const table = JSON.parse(readFileSync(file, 'utf8'));
  const keys = new Set(table.map((row) => row[0]));

  let added = 0;
  for (const c of chosen) {
    if (keys.has(c.key)) continue;
    table.push([c.key, c[lang], c.kcal, c.protein, c.fat, c.carbs]);
    keys.add(c.key);
    added += 1;
  }

  writeFileSync(file, JSON.stringify(table) + '\n');
  console.log(`${lang}: ${added} Schweizer Einträge ergänzt → ${table.length} gesamt`);
}
