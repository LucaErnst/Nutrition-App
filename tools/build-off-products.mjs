/**
 * Mitgelieferte Markenprodukte aus Open Food Facts (1.2): Scannen und Produktsuche ohne Wartezeit
 * und ohne Netz. Was hier fehlt, sucht die App weiter online.
 *
 * Quelle: Open Food Facts, Datenexport `en.openfoodfacts.org.products.csv.gz`.
 * Lizenz: Datenbank ODbL, Inhalte DbCL. Der Auszug ist eine abgeleitete Datenbank und steht
 * deshalb ebenfalls unter ODbL; Quellenangabe in der App unter „Mehr" und in den Nutzungsbedingungen.
 *
 * Auswahl, weil die App weltweit genutzt wird: die 200'000 meistgescannten Produkte weltweit
 * (`unique_scans_n`) plus die 5'000 meistgescannten jedes Landes, damit kleinere Märkte nicht
 * fehlen. Nur Produkte mit vollständigen und plausiblen Nährwerten: kcal, Protein, Fett und
 * Kohlenhydrate vorhanden, Energie passt grob zu den Makros (Atwater ±35 % oder ±40 kcal).
 *
 * Ausgabe `public/data/off-products.tsv.gz`, eine Zeile pro Produkt, beliebteste zuerst:
 *   barcode \t name \t marke \t kcal \t protein \t fett \t kh \t portion_g \t flüssig(1/0)
 *
 * Aufruf (Export ~1,3 GB, Stand prüfen):
 *   curl -sL -o /tmp/off.csv.gz https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz
 *   node tools/build-off-products.mjs /tmp/off.csv.gz
 */
import { createReadStream, mkdirSync, writeFileSync } from 'node:fs';
import { createGunzip, gzipSync } from 'node:zlib';
import { createInterface } from 'node:readline';

const src = process.argv[2];
if (!src) {
  console.error('Aufruf: node tools/build-off-products.mjs <en.openfoodfacts.org.products.csv.gz>');
  process.exit(1);
}

const GLOBAL_TOP = 200_000;
const PER_COUNTRY = 5_000;
const MAX_NAME = 80;
const MAX_BRAND = 40;

const clean = (s) => String(s ?? '').replace(/[\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
const num = (v) => {
  const n = Number(v);
  return v !== '' && Number.isFinite(n) ? n : undefined;
};
const r1 = (n) => Math.round(n * 10) / 10;

const rl = createInterface({ input: createReadStream(src).pipe(createGunzip()), crlfDelay: Infinity });
let ix;
const products = [];
let rows = 0;
for await (const line of rl) {
  const c = line.split('\t');
  if (!ix) {
    ix = Object.fromEntries(c.map((h, i) => [h, i]));
    continue;
  }
  rows++;
  const code = c[ix.code]?.trim();
  const name = clean(c[ix.product_name]);
  if (!code || !/^\d{8,14}$/.test(code) || !name || name.length > MAX_NAME) continue;
  const kcal = num(c[ix['energy-kcal_100g']]);
  const p = num(c[ix.proteins_100g]);
  const f = num(c[ix.fat_100g]);
  const k = num(c[ix.carbohydrates_100g]);
  if ([kcal, p, f, k].some((v) => v === undefined)) continue;
  if (kcal < 0 || kcal > 950 || p < 0 || p > 100 || f < 0 || f > 100 || k < 0 || k > 100 || p + f + k > 105) continue;
  const est = 4 * p + 9 * f + 4 * k;
  if (Math.abs(est - kcal) > Math.max(40, 0.35 * Math.max(kcal, est))) continue;
  const serving = num(c[ix.serving_quantity]);
  const liquid = /\b(ml|cl|l)\b/i.test(c[ix.quantity] ?? '');
  products.push({
    line: [
      code,
      name,
      clean(c[ix.brands]).split(',')[0].trim().slice(0, MAX_BRAND),
      Math.round(kcal),
      r1(p),
      r1(f),
      r1(k),
      serving && serving > 0 && serving < 2000 ? r1(serving) : '',
      liquid ? 1 : 0,
    ].join('\t'),
    scans: Number(c[ix.unique_scans_n]) || 0,
    countries: (c[ix.countries_tags] ?? '').split(',').filter(Boolean),
  });
}

products.sort((a, b) => b.scans - a.scans);
const chosen = new Set();
for (let i = 0; i < Math.min(GLOBAL_TOP, products.length); i++) chosen.add(i);
const perCountry = new Map();
products.forEach((pr, i) => {
  for (const country of pr.countries) {
    const n = perCountry.get(country) ?? 0;
    if (n < PER_COUNTRY) {
      perCountry.set(country, n + 1);
      chosen.add(i);
    }
  }
});
// Gleicher Barcode mehrfach im Export: der beliebteste Eintrag gewinnt.
const seen = new Set();
const lines = [];
for (const i of [...chosen].sort((a, b) => a - b)) {
  const code = products[i].line.slice(0, products[i].line.indexOf('\t'));
  if (seen.has(code)) continue;
  seen.add(code);
  lines.push(products[i].line);
}

mkdirSync('public/data', { recursive: true });
const gz = gzipSync(Buffer.from(lines.join('\n') + '\n'), { level: 9 });
writeFileSync('public/data/off-products.tsv.gz', gz);
console.log(`${rows} Zeilen gelesen, ${products.length} vollständig → ${lines.length} mitgeliefert, ${(gz.length / 1e6).toFixed(1)} MB`);
