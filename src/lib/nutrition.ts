import type { FoodItem, Macros, MealEntry, NutritionSnapshot, Unit } from '../db/types';
import { ZERO_MACROS } from '../db/types';

/** Das, was zum Rechnen und Anzeigen eines Eintrags nötig ist. */
export type NutritionSource = Pick<
  FoodItem,
  'name' | 'brand' | 'kcal_per_100g' | 'protein_per_100g' | 'fat_per_100g' | 'carbs_per_100g' | 'unit_type' | 'piece_weight_g'
>;

/**
 * Liefert die Nährwertbasis eines Eintrags: Snapshot, sonst das FoodItem.
 * Ohne beides (Item gelöscht, kein Snapshot) gibt es nichts zu rechnen.
 */
export function resolveSource(entry: MealEntry, food: FoodItem | undefined): NutritionSource | undefined {
  return entry.snapshot ?? food;
}

/** Rechnet die eingetragene Menge in Gramm (bzw. ml) um. */
export function amountToGrams(item: NutritionSource | NutritionSnapshot, amount: number, unit: Unit): number {
  if (unit === 'Stück') return amount * (item.piece_weight_g ?? 100);
  return amount;
}

export function macrosFor(item: NutritionSource | NutritionSnapshot, amount: number, unit: Unit): Macros {
  const factor = amountToGrams(item, amount, unit) / 100;
  return {
    kcal: item.kcal_per_100g * factor,
    protein: item.protein_per_100g * factor,
    fat: item.fat_per_100g * factor,
    carbs: item.carbs_per_100g * factor,
  };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.kcal,
      protein: acc.protein + m.protein,
      fat: acc.fat + m.fat,
      carbs: acc.carbs + m.carbs,
    }),
    { ...ZERO_MACROS },
  );
}

export function defaultUnit(item: Pick<FoodItem, 'unit_type'>): Unit {
  if (item.unit_type === 'piece') return 'Stück';
  if (item.unit_type === 'volume') return 'ml';
  return 'g';
}

export interface EntryWithFood {
  entry: MealEntry;
  /** Nährwertbasis (Snapshot oder FoodItem) – für Anzeige und Rechnung */
  food: NutritionSource;
  /** Das referenzierte FoodItem, falls es noch existiert */
  item?: FoodItem;
  macros: Macros;
}

export function fmt(n: number, digits = 0): string {
  return n.toLocaleString('de-CH', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
