import { db } from './db';
import type { FoodItem, Unit } from './types';
import { getLanguage } from '../i18n';

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

/** Legt die Referenzdaten und die aktuelle Phase einmalig an. */
export async function seedIfEmpty(): Promise<void> {
  const count = await db.foodItems.where('source').equals('reference').count();
  if (count === 0) {
    const now = Date.now();
    await db.foodItems.bulkAdd(SEED.map((r, i) => toFoodItem(r, now + i)));
  }

  // Zielwerte aus der Spec (Aufbauphase, Woche 1 ab 14.09.2026)
  if ((await db.goals.count()) === 0) {
    await db.goals.add({
      phase_name: getLanguage() === 'de' ? 'Aufbauphase' : 'Bulk',
      start_date: '2026-09-14',
      training_day_kcal: 2700,
      rest_day_kcal: 2350,
      protein_g: 150,
      fat_min_g: 75,
      fat_max_g: 90,
    });
  }
}
