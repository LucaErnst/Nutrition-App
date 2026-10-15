import { db } from './db';
import type { FoodItem, Unit } from './types';
import { getLanguage } from '../i18n';
import { loadReference, loadUsda, USDA_PREFIX, type ReferenceRow } from './reference';
import { PIECE_WEIGHTS } from './pieceWeights';

/**
 * Startdaten aus der Spec. Werte sind pro Portion angegeben (so wie in der
 * Referenztabelle) und werden beim Seeden auf 100 g normalisiert.
 * Kohlenhydrate und Stückgewichte fehlen in der Spec und sind ergänzt.
 */
interface SeedRow {
  name: string;
  name_en: string;
  amount: number;
  unit: Unit;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
  piece_weight_g?: number;
}

const SEED: SeedRow[] = [
  { name: 'Magerquark', name_en: 'Low-fat quark', amount: 250, unit: 'g', kcal: 168, protein: 30, fat: 1, carbs: 10 },
  { name: 'Protein-Milch (High Protein Drink)', name_en: 'Protein milk (high protein drink)', amount: 50, unit: 'ml', kcal: 28, protein: 4, fat: 1, carbs: 2.5 },
  { name: 'Haferflocken', name_en: 'Oats', amount: 30, unit: 'g', kcal: 110, protein: 4, fat: 2, carbs: 18 },
  { name: 'Cashewnüsse', name_en: 'Cashew nuts', amount: 25, unit: 'g', kcal: 138, protein: 5, fat: 11, carbs: 7.5 },
  { name: 'Heidelbeeren', name_en: 'Blueberries', amount: 200, unit: 'g', kcal: 115, protein: 1, fat: 1, carbs: 24 },
  { name: 'Ei (ganz)', name_en: 'Egg (whole)', amount: 1, unit: 'Stück', kcal: 70, protein: 6, fat: 5, carbs: 0.5, piece_weight_g: 55 },
  { name: 'Hähnchenbrust (gekocht)', name_en: 'Chicken breast (cooked)', amount: 120, unit: 'g', kcal: 200, protein: 37, fat: 4, carbs: 0 },
  { name: 'Kalbsfleisch (gekocht)', name_en: 'Veal (cooked)', amount: 100, unit: 'g', kcal: 170, protein: 31, fat: 4, carbs: 0 },
  { name: 'Rindfleisch mager (gekocht)', name_en: 'Lean beef (cooked)', amount: 200, unit: 'g', kcal: 370, protein: 55, fat: 16, carbs: 0 },
  { name: 'Basmatireis (gekocht)', name_en: 'Basmati rice (cooked)', amount: 120, unit: 'g', kcal: 155, protein: 3, fat: 0, carbs: 34 },
  { name: 'Süsskartoffel', name_en: 'Sweet potato', amount: 200, unit: 'g', kcal: 170, protein: 3, fat: 0, carbs: 40 },
  { name: 'Brokkoli', name_en: 'Broccoli', amount: 150, unit: 'g', kcal: 50, protein: 4, fat: 1, carbs: 5 },
  { name: 'Avocado (ganz)', name_en: 'Avocado (whole)', amount: 1, unit: 'Stück', kcal: 240, protein: 3, fat: 22, carbs: 5, piece_weight_g: 200 },
  { name: 'Olivenöl', name_en: 'Olive oil', amount: 1, unit: 'Stück', kcal: 120, protein: 0, fat: 14, carbs: 0, piece_weight_g: 14 },
  { name: 'Banane', name_en: 'Banana', amount: 1, unit: 'Stück', kcal: 105, protein: 1, fat: 0, carbs: 27, piece_weight_g: 120 },
  { name: 'Fettarmer Mozzarella', name_en: 'Low-fat mozzarella', amount: 100, unit: 'g', kcal: 152, protein: 20, fat: 7.5, carbs: 2 },
  { name: 'Linsenwaffeln', name_en: 'Lentil crackers', amount: 5, unit: 'Stück', kcal: 119, protein: 10, fat: 0.5, carbs: 18, piece_weight_g: 6 },
];

/**
 * Schlüssel der Startliste. Ohne ihn folgten diese Einträge keinem Sprachwechsel (bis 1.1).
 * Der englische Name ist stabil und eindeutig, darum dient er als Schlüssel.
 */
const SEED_PREFIX = 'seed:';
const seedKey = (row: SeedRow) => SEED_PREFIX + row.name_en;

function toFoodItem(row: SeedRow, now: number): FoodItem {
  const isPiece = row.unit === 'Stück';
  const grams = isPiece ? row.amount * (row.piece_weight_g ?? 100) : row.amount;
  const f = 100 / grams;
  return {
    name: getLanguage() === 'de' ? row.name : row.name_en,
    kcal_per_100g: row.kcal * f,
    protein_per_100g: row.protein * f,
    fat_per_100g: row.fat * f,
    carbs_per_100g: row.carbs * f,
    unit_type: isPiece ? 'piece' : row.unit === 'ml' ? 'volume' : 'weight',
    piece_weight_g: isPiece ? (row.piece_weight_g ?? 100) : undefined,
    default_amount: row.amount,
    source: 'reference',
    saved: 1,
    ref_key: seedKey(row),
    created_at: now,
  };
}

/**
 * Startliste von Installationen vor 1.2: Die Einträge haben noch keinen Schlüssel. Erkannt
 * werden sie am Namen in einer der beiden Sprachen; Nährwerte bleiben, wie sie sind.
 */
async function backfillSeedKeys(): Promise<void> {
  const byName = new Map<string, string>();
  for (const row of SEED) {
    byName.set(row.name, seedKey(row));
    byName.set(row.name_en, seedKey(row));
  }
  const unkeyed = await db.foodItems.where('source').equals('reference').filter((f) => !f.ref_key).toArray();
  const updates = unkeyed.filter((f) => byName.has(f.name)).map((f) => ({ ...f, ref_key: byName.get(f.name)! }));
  if (updates.length === 0) return;
  await db.foodItems.bulkPut(updates);
  // Einmal neu abgleichen lassen: Die Startliste kann noch in der Gerätesprache stehen.
  try {
    localStorage.removeItem(REFERENCE_LANG);
  } catch {
    // dann beim nächsten Sprachwechsel
  }
}

/**
 * Grundnahrungsmittel aus dem Bundeslebensmittelschlüssel (Max Rubner-Institut, CC BY 4.0) und
 * der Schweizer Nährwertdatenbank (BLV).
 * Open Food Facts kennt jedes verpackte Produkt, aber „Hafer Flocken" oder „Schweineschnitzel
 * natur, gebraten" findet man dort schlecht – diese Tabelle füllt die Lücke und liegt offline
 * in der App.
 */
// „-pc1": Stückgewichte (1.2). Eine neue Endung lässt bestehende Installationen einmal abgleichen.
const REFERENCE_VERSION = 'bls-4.0-ch-7.1-pc1-usda1';
const REFERENCE_STAMP = 'nutrition-tracker:reference';
const REFERENCE_LANG = 'nutrition-tracker:reference-lang';

function referenceToFoodItem(r: ReferenceRow, now: number): FoodItem {
  const [key, name, kcal, protein, fat, carbs] = r;
  return {
    name,
    kcal_per_100g: kcal,
    protein_per_100g: protein,
    fat_per_100g: fat,
    carbs_per_100g: carbs,
    ...pieceFields(key),
    source: 'reference',
    saved: 1,
    ref_key: key,
    created_at: now,
  };
}

/** Stück statt Gramm, wenn es für den Eintrag ein belegtes Stückgewicht gibt. */
function pieceFields(key: string): Pick<FoodItem, 'unit_type' | 'piece_weight_g' | 'default_amount'> {
  const g = PIECE_WEIGHTS[key];
  return g ? { unit_type: 'piece', piece_weight_g: g, default_amount: 1 } : { unit_type: 'weight' };
}

/**
 * Installationen vor 1.2: Die Einträge liegen schon als Gramm vor. Stückgewicht nachtragen,
 * aber nur, wo noch keines gesetzt ist – ein selbst korrigiertes Gewicht bleibt.
 */
async function backfillPieceWeights(existing: FoodItem[]): Promise<void> {
  const updates = existing
    .filter((f) => f.ref_key && PIECE_WEIGHTS[f.ref_key] && f.unit_type === 'weight' && !f.piece_weight_g)
    .map((f) => ({ ...f, ...pieceFields(f.ref_key!) }));
  if (updates.length) await db.foodItems.bulkPut(updates);
}

/**
 * Legt fehlende Grundnahrungsmittel an – auch bei Nutzern, die die App schon hatten.
 * Verglichen wird über den Schlüssel, nicht über den Namen: Sonst legte ein Sprachwechsel
 * alles ein zweites Mal an. Der Vermerk im localStorage spart den Download der Tabelle,
 * wenn sie schon eingespielt ist.
 */
/**
 * Anlegen, Sprachabgleich und Nachladen ändern dieselben Einträge. Beim ersten Start laufen sie
 * gleichzeitig los – ohne Reihenfolge legte jeder die fehlenden USDA-Einträge an, und
 * „Cheese, cheddar" stand doppelt da. Darum hintereinander.
 */
let referenceQueue: Promise<unknown> = Promise.resolve();
function serialized<T>(task: () => Promise<T>): Promise<T> {
  const run = referenceQueue.then(task, task);
  referenceQueue = run.catch(() => undefined);
  return run;
}

function seedReference(): Promise<void> {
  return serialized(seedReferenceNow);
}

async function seedReferenceNow(): Promise<void> {
  try {
    if (localStorage.getItem(REFERENCE_STAMP) === REFERENCE_VERSION) return;
  } catch {
    // Privater Modus: dann eben jedes Mal prüfen.
  }
  const lang = getLanguage() === 'de' ? 'de' : 'en';
  // USDA nur in englischer Sprache; der Wechsel läuft über syncUsda.
  const rows = lang === 'en' ? [...(await loadReference(lang)), ...(await loadUsda())] : await loadReference(lang);
  const existing = await db.foodItems.where('source').equals('reference').toArray();
  const known = new Set(existing.map((f) => f.ref_key).filter(Boolean));
  const missing = rows.filter((r) => !known.has(r[0]));
  const now = Date.now();
  if (missing.length) {
    await db.foodItems.bulkAdd(missing.map((r, i) => referenceToFoodItem(r, now + i)));
  }
  await dropRetiredReference(existing, new Set(rows.map((r) => r[0])));
  await backfillPieceWeights(existing);
  try {
    localStorage.setItem(REFERENCE_STAMP, REFERENCE_VERSION);
    localStorage.setItem(REFERENCE_LANG, lang);
  } catch {
    // ohne Vermerk wird beim nächsten Start erneut verglichen – teurer, aber korrekt
  }
}

/**
 * Entfernt mitgelieferte Lebensmittel, die es in der neuen Tabelle nicht mehr gibt – etwa
 * Innereien, die nur die Suche zugestellt haben. Angefasst wird nur, was nirgends eingetragen
 * ist: Ein gelöschtes Lebensmittel darf keinen Tag im Tagebuch beschädigen.
 *
 * Die Startliste oben (`SEED`, Schlüssel `seed:`) bleibt unberührt – sie ist gewollt und gibt
 * einer frisch installierten App etwas zum Antippen.
 */
async function dropRetiredReference(existing: FoodItem[], current: Set<string>): Promise<void> {
  const retired = existing.filter(
    (f) =>
      f.ref_key &&
      !f.ref_key.startsWith(SEED_PREFIX) &&
      !f.ref_key.startsWith(USDA_PREFIX) &&
      !current.has(f.ref_key) &&
      f.id !== undefined,
  );
  if (retired.length === 0) return;
  const ids = retired.map((f) => f.id!);
  const used = new Set((await db.mealEntries.where('food_item_id').anyOf(ids).toArray()).map((e) => e.food_item_id));
  const removable = ids.filter((id) => !used.has(id));
  if (removable.length) await db.foodItems.bulkDelete(removable);
}

/**
 * Benennt die Grundnahrungsmittel in der Sprache der Oberfläche.
 *
 * Nötig, weil beim allerersten Start die Sprache aus den Einstellungen noch nicht geladen ist:
 * Die Tabelle wird dann in der Gerätesprache angelegt und bliebe für immer so. Und wer später
 * umschaltet, will „Rind Hackfleisch" sehen und nicht „Beef minced meat". Verglichen wird über
 * den BLS-Code, die eigenen Lebensmittel bleiben unberührt.
 */
export function syncReferenceLanguage(lang: 'de' | 'en'): Promise<number> {
  return serialized(() => syncReferenceLanguageNow(lang));
}

async function syncReferenceLanguageNow(lang: 'de' | 'en'): Promise<number> {
  try {
    if (localStorage.getItem(REFERENCE_LANG) === lang) return 0;
  } catch {
    // ohne Vermerk halt jedes Mal
  }
  const rows = await loadReference(lang);
  const names = new Map(rows.map((r) => [r[0], r[1]]));
  for (const row of SEED) names.set(seedKey(row), lang === 'de' ? row.name : row.name_en);
  const existing = await db.foodItems.where('source').equals('reference').toArray();
  const changed = existing
    .filter((f) => f.ref_key && names.has(f.ref_key) && f.name !== names.get(f.ref_key))
    .map((f) => ({ ...f, name: names.get(f.ref_key!)! }));
  if (changed.length) await db.foodItems.bulkPut(changed);
  await syncUsda(lang);
  try {
    localStorage.setItem(REFERENCE_LANG, lang);
  } catch {
    // s.o.
  }
  return changed.length;
}

/**
 * Nach dem Wiederherstellen eines Backups: Die Lebensmittel-Tabelle stammt jetzt aus der Datei,
 * die Vermerke im localStorage aber noch vom Gerät. Ein Backup aus 1.0 kennt die mitgelieferte
 * Tabelle nicht – ohne diesen Abgleich wäre sie bis zur nächsten Tabellen-Version verschwunden.
 * Erst umbenennen, dann ergänzen, sonst kämen fehlende Einträge in der falschen Sprache dazu.
 */
export async function refreshReferenceAfterRestore(): Promise<void> {
  try {
    localStorage.removeItem(REFERENCE_STAMP);
    localStorage.removeItem(REFERENCE_LANG);
  } catch {
    // ohne localStorage wird ohnehin bei jedem Start verglichen
  }
  await syncReferenceLanguage(getLanguage() === 'de' ? 'de' : 'en');
  await seedReference();
}

/**
 * USDA-Einträge folgen der Sprache: auf Englisch da, auf Deutsch ausgeblendet (`saved: 0`, so
 * erscheinen sie in keiner Suche). Ausnahme: Was schon eingetragen oder Favorit ist, bleibt –
 * sonst verschwände ein bekanntes Lebensmittel nach einem Sprachwechsel.
 */
async function syncUsda(lang: 'de' | 'en'): Promise<void> {
  const existing = (await db.foodItems.where('source').equals('reference').toArray()).filter((f) =>
    f.ref_key?.startsWith(USDA_PREFIX),
  );
  if (lang === 'en') {
    const known = new Set(existing.map((f) => f.ref_key));
    const missing = (await loadUsda()).filter((r) => !known.has(r[0]));
    const now = Date.now();
    if (missing.length) await db.foodItems.bulkAdd(missing.map((r, i) => referenceToFoodItem(r, now + i)));
    const hidden = existing.filter((f) => f.saved === 0).map((f) => ({ ...f, saved: 1 as const }));
    if (hidden.length) await db.foodItems.bulkPut(hidden);
    return;
  }
  const ids = existing.map((f) => f.id!).filter((id) => id !== undefined);
  const used = new Set((await db.mealEntries.where('food_item_id').anyOf(ids).toArray()).map((e) => e.food_item_id));
  const hide = existing
    .filter((f) => f.saved === 1 && f.favorite !== 1 && !used.has(f.id!))
    .map((f) => ({ ...f, saved: 0 as const }));
  if (hide.length) await db.foodItems.bulkPut(hide);
}

/** Legt die Referenzdaten und die aktuelle Phase einmalig an. */
export async function seedIfEmpty(): Promise<void> {
  const count = await db.foodItems.where('source').equals('reference').count();
  if (count === 0) {
    const now = Date.now();
    await db.foodItems.bulkAdd(SEED.map((r, i) => toFoodItem(r, now + i)));
  } else {
    await backfillSeedKeys();
  }
  await seedReference();

  // Die erste Phase entsteht im Onboarding (Zielvorschlag aus Körperdaten).
}
