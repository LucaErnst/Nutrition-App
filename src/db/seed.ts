import { db } from './db';
import type { FoodItem, Unit } from './types';
import { getLanguage } from '../i18n';
import { loadReference, type ReferenceRow } from './reference';

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
    created_at: now,
  };
}

/**
 * Grundnahrungsmittel aus dem Bundeslebensmittelschlüssel (Max Rubner-Institut, CC BY 4.0).
 * Open Food Facts kennt jedes verpackte Produkt, aber „Hafer Flocken" oder „Schweineschnitzel
 * natur, gebraten" findet man dort schlecht – diese Tabelle füllt die Lücke und liegt offline
 * in der App.
 */
const REFERENCE_VERSION = 'bls-4.0-ch-7.1';
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
    unit_type: 'weight',
    source: 'reference',
    saved: 1,
    ref_key: key,
    created_at: now,
  };
}

/**
 * Legt fehlende Grundnahrungsmittel an – auch bei Nutzern, die die App schon hatten.
 * Verglichen wird über den Schlüssel, nicht über den Namen: Sonst legte ein Sprachwechsel
 * alles ein zweites Mal an. Der Vermerk im localStorage spart den Download der Tabelle,
 * wenn sie schon eingespielt ist.
 */
async function seedReference(): Promise<void> {
  try {
    if (localStorage.getItem(REFERENCE_STAMP) === REFERENCE_VERSION) return;
  } catch {
    // Privater Modus: dann eben jedes Mal prüfen.
  }
  const lang = getLanguage() === 'de' ? 'de' : 'en';
  const rows = await loadReference(lang);
  const existing = await db.foodItems.where('source').equals('reference').toArray();
  const known = new Set(existing.map((f) => f.ref_key).filter(Boolean));
  const missing = rows.filter((r) => !known.has(r[0]));
  const now = Date.now();
  if (missing.length) {
    await db.foodItems.bulkAdd(missing.map((r, i) => referenceToFoodItem(r, now + i)));
  }
  await dropRetiredReference(existing, new Set(rows.map((r) => r[0])));
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
 * Die Startliste oben (`SEED`) hat keinen Schlüssel und bleibt deshalb unberührt – sie ist
 * gewollt und gibt einer frisch installierten App etwas zum Antippen.
 */
async function dropRetiredReference(existing: FoodItem[], current: Set<string>): Promise<void> {
  const retired = existing.filter((f) => f.ref_key && !current.has(f.ref_key) && f.id !== undefined);
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
export async function syncReferenceLanguage(lang: 'de' | 'en'): Promise<number> {
  try {
    if (localStorage.getItem(REFERENCE_LANG) === lang) return 0;
  } catch {
    // ohne Vermerk halt jedes Mal
  }
  const rows = await loadReference(lang);
  const names = new Map(rows.map((r) => [r[0], r[1]]));
  const existing = await db.foodItems.where('source').equals('reference').toArray();
  const changed = existing
    .filter((f) => f.ref_key && names.has(f.ref_key) && f.name !== names.get(f.ref_key))
    .map((f) => ({ ...f, name: names.get(f.ref_key!)! }));
  if (changed.length) await db.foodItems.bulkPut(changed);
  try {
    localStorage.setItem(REFERENCE_LANG, lang);
  } catch {
    // s.o.
  }
  return changed.length;
}

/** Legt die Referenzdaten und die aktuelle Phase einmalig an. */
export async function seedIfEmpty(): Promise<void> {
  const count = await db.foodItems.where('source').equals('reference').count();
  if (count === 0) {
    const now = Date.now();
    await db.foodItems.bulkAdd(SEED.map((r, i) => toFoodItem(r, now + i)));
  }
  await seedReference();

  // Die erste Phase entsteht im Onboarding (Zielvorschlag aus Körperdaten).
}
