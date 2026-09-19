import type { ReminderSettings } from '../lib/reminders';
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

export interface Portion {
  label: string;
  /** Gewicht in g bzw. ml */
  grams: number;
}

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
  /** Favorit: in der Suche ganz oben */
  favorite?: 0 | 1;
  /** Eigene Portionsgrössen, z.B. „1 EL“ = 14 g, „1 Handvoll“ = 30 g */
  portions?: Portion[];
  /** Zuletzt eingetragene Menge – wird beim nächsten Mal vorgeschlagen */
  last_amount?: number;
  last_unit?: Unit;
  created_at: number;
}

/**
 * Nährwerte zum Zeitpunkt des Eintrags. Damit bleiben alte Tage stabil, auch
 * wenn das Lebensmittel in der Datenbank später korrigiert oder gelöscht wird.
 */
export interface NutritionSnapshot {
  name: string;
  brand?: string;
  kcal_per_100g: number;
  protein_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
  unit_type: UnitType;
  piece_weight_g?: number;
}

export interface MealEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  meal_type: MealType;
  food_item_id: number;
  amount: number;
  unit: Unit;
  created_at: number;
  /** Fehlt nur bei Einträgen aus Backups vor Version 0.4 – dann gilt das FoodItem */
  snapshot?: NutritionSnapshot;
}

export function snapshotOf(food: FoodItem): NutritionSnapshot {
  return {
    name: food.name,
    brand: food.brand,
    kcal_per_100g: food.kcal_per_100g,
    protein_per_100g: food.protein_per_100g,
    fat_per_100g: food.fat_per_100g,
    carbs_per_100g: food.carbs_per_100g,
    unit_type: food.unit_type,
    piece_weight_g: food.piece_weight_g,
  };
}

export type PhaseType = 'cut' | 'maintain' | 'bulk';

export interface DailyGoal {
  id?: number;
  phase_name: string;
  /** Typ der Phase; erlaubt eine übersetzte Anzeige des Standardnamens */
  phase_type?: PhaseType;
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
  /** Zeitpunkt des letzten erfolgreichen Backup-Exports */
  last_backup_at?: number;
  /** Sprache der Oberfläche; Standard Englisch */
  language?: 'en' | 'de';
  /** Tagesziel Wasser in ml */
  water_goal_ml?: number;
  /** Onboarding abgeschlossen oder übersprungen */
  onboarding_done?: boolean;
  /** Zeitpunkt des letzten automatischen Backups (nativ) */
  last_auto_backup_at?: number;
  /** Erinnerungen (nur native App) */
  reminders?: ReminderSettings;
  /** Zufalls-Versatz für die Text-Rotation der Erinnerungen */
  reminder_salt?: number;
}

/** Mahlzeiten-Vorlage, z.B. "Standard-Frühstück": mehrere Posten auf einmal eintragen. */
export interface MealTemplate {
  id?: number;
  name: string;
  items: { food_item_id: number; amount: number; unit: Unit }[];
  created_at: number;
}

/** Ein Schluck/Glas Wasser; die Tagesmenge ist die Summe. */
export interface WaterEntry {
  id?: number;
  date: string;
  ml: number;
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
