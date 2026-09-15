export type UnitType = 'weight' | 'volume' | 'piece';
export type Unit = 'g' | 'ml' | 'Stück';
export type MealType =
  | 'breakfast'
  | 'morning_snack'
  | 'lunch'
  | 'afternoon_snack'
  | 'dinner';
export type FoodSource = 'manual' | 'openfoodfacts' | 'reference';

export const MEAL_TYPES: MealType[] = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
];

export const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Frühstück',
  morning_snack: 'Vormittag-Snack',
  lunch: 'Mittagessen',
  afternoon_snack: 'Nachmittag-Snack',
  dinner: 'Abendessen',
};

/** Nährwerte sind immer pro 100 g (bzw. 100 ml) gespeichert. */
export interface FoodItem {
  id?: number;
  name: string;
  brand?: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  unit_type: UnitType;
  /** Gewicht eines Stücks in g, falls unit_type === 'piece' */
  piece_weight_g?: number;
  /** Übliche Portionsgröße (in der Einheit des unit_type), als Vorschlag beim Hinzufügen */
  default_amount?: number;
  source: FoodSource;
  barcode?: string;
  /** 1 = erscheint in der Referenzdatenbank / Suche, 0 = nur einmalig verwendet */
  saved: 0 | 1;
  created_at: number;
}

export interface MealEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  food_item_id: number;
  amount: number;
  unit: Unit;
  created_at: number;
}

export interface DailyGoal {
  id?: number;
  phase_name: string;
  start_date: string;
  end_date?: string;
  training_day_kcal: number;
  rest_day_kcal: number;
  protein_g: number;
  fat_min_g: number;
  fat_max_g: number;
}

/** Tagesbezogene Einstellungen, z.B. Trainingstag-Override. */
export interface DayInfo {
  date: string;
  is_training: boolean;
}

/** Globale Einstellungen, genau ein Datensatz mit id = 1. */
export interface Settings {
  id: 1;
  /** Wochentage (0 = So … 6 = Sa), die standardmässig Trainingstage sind */
  training_weekdays: number[];
}

/** Mahlzeiten-Vorlage, z.B. "Standard-Frühstück": mehrere Posten auf einmal eintragen. */
export interface MealTemplate {
  id?: number;
  name: string;
  items: { food_item_id: number; amount: number; unit: Unit }[];
  created_at: number;
}

export interface WeightEntry {
  id?: number;
  date: string;
  weight_kg: number;
}

export interface Macros {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export const ZERO_MACROS: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
