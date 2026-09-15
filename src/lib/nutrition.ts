import type { FoodItem, Macros, MealEntry, Unit } from '../db/types';
import { ZERO_MACROS } from '../db/types';

/** Rechnet die eingetragene Menge in Gramm (bzw. ml) um. */
export function amountToGrams(item: FoodItem, amount: number, unit: Unit): number {
  if (unit === 'Stück') return amount * (item.piece_weight_g ?? 100);
  return amount;
}

export function macrosFor(item: FoodItem, amount: number, unit: Unit): Macros {
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

export function defaultUnit(item: FoodItem): Unit {
  if (item.unit_type === 'piece') return 'Stück';
  if (item.unit_type === 'volume') return 'ml';
  return 'g';
}

export interface EntryWithFood {
  entry: MealEntry;
  food: FoodItem;
  macros: Macros;
}

export function fmt(n: number, digits = 0): string {
  return n.toLocaleString('de-CH', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}
