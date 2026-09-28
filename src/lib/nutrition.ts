import type { FoodItem, Macros, MealEntry, NutritionSnapshot, Unit, UnitType } from '../db/types';
import { ZERO_MACROS } from '../db/types';
import { getLocale } from '../i18n';
import { defaultUnitFor, isPieceUnit, labelFor, toBase, type UnitSystem } from './units';

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

/** Rechnet die eingetragene Menge in Gramm (bzw. ml) um – die Basis der Nährwerte. */
export function amountToGrams(item: NutritionSource | NutritionSnapshot, amount: number, unit: Unit): number {
  if (isPieceUnit(unit)) return amount * (item.piece_weight_g ?? 100);
  return toBase(amount, unit);
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

/** Vorgeschlagene Einheit für ein Lebensmittel – abhängig vom Einheitensystem des Nutzers. */
export function defaultUnit(item: Pick<FoodItem, 'unit_type'>, system: UnitSystem = 'metric'): Unit {
  return defaultUnitFor(item.unit_type as UnitType, system);
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
  return n.toLocaleString(getLocale(), {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

/** Wie fmt, aber ohne Auffüllen mit Nullen (0.5 statt 0.50). */
/*
 * Wasser wird immer in Millilitern gespeichert – in der Datenbank, in den Einstellungen und im
 * Widget-Stand. Umgerechnet wird nur für die Anzeige, damit ein eingetragener Schluck seine
 * Bedeutung behält, auch wenn jemand das Einheitensystem wechselt.
 */

/** Anzeige-Einheit für Wasser: metrisch Liter, sonst Flüssigunzen (US bzw. UK sind verschieden gross). */
export function waterUnit(system: UnitSystem): Unit {
  return system === 'metric' ? 'l' : defaultUnitFor('volume', system);
}

/** Milliliter je Anzeige-Einheit. */
function perUnit(unit: Unit): number {
  return toBase(1, unit);
}

function inUnit(ml: number, unit: Unit): number {
  return ml / perUnit(unit);
}

/** Kurzform der Anzeige-Einheit, z.B. „l" oder „fl oz". */
export function waterUnitLabel(system: UnitSystem): string {
  return labelFor(waterUnit(system), '');
}

/** Zahlenpaar für die Kopfzeile der Wasser-Karte; die Einheit steht einmal dahinter. */
export function waterPair(ml: number, goalMl: number, system: UnitSystem): { amount: string; goal: string; unit: string } {
  const unit = waterUnit(system);
  if (unit === 'l') return { amount: fmtMax(ml / 1000, 2), goal: fmt(goalMl / 1000, 1), unit: 'l' };
  return { amount: fmt(inUnit(ml, unit)), goal: fmt(inUnit(goalMl, unit)), unit: labelFor(unit, '') };
}

/**
 * Restmenge in derselben Einheit wie das Ziel. „0 / 3.0 l" und daneben „noch 3000 ml" waren
 * zwei Einheiten in einer Karte; unter einem Liter bleibt Milliliter die natürlichere Zahl.
 */
export function waterLeftLabel(ml: number, system: UnitSystem = 'metric'): string {
  const unit = waterUnit(system);
  if (unit !== 'l') return `${fmt(inUnit(ml, unit))} ${labelFor(unit, '')}`;
  return ml >= 1000 ? `${fmt(ml / 1000, 1)} l` : `${fmt(ml)} ml`;
}

/** Zahlenwert in der Anzeige-Einheit – für Diagramme und Balken, die selbst formatieren. */
export function waterValue(ml: number, system: UnitSystem): number {
  return inUnit(ml, waterUnit(system));
}

/** Nachkommastellen, die zur Anzeige-Einheit passen: 2.5 l, aber 85 fl oz. */
export function waterDigits(system: UnitSystem): number {
  return waterUnit(system) === 'l' ? 1 : 0;
}

/** Schnellwahl an der Wasser-Karte und im Widget, in Millilitern. Ein Glas und eine grosse Flasche. */
export function waterSteps(system: UnitSystem): number[] {
  const unit = waterUnit(system);
  if (unit === 'l') return [250, 500];
  return [8, 16].map((n) => Math.round(n * perUnit(unit)));
}

/** Beschriftung einer Stufe: „250 ml", „8 fl oz". */
export function waterStepLabel(ml: number, system: UnitSystem): string {
  const unit = waterUnit(system);
  if (unit === 'l') return `${fmt(ml)} ml`;
  return `${fmt(inUnit(ml, unit))} ${labelFor(unit, '')}`;
}

/** Grenzen des Tagesziels, in Millilitern – für beide Systeme dieselben. */
export const WATER_GOAL_MIN_ML = 500;
export const WATER_GOAL_MAX_ML = 10000;

/**
 * Das Zielfeld unter „Mehr" und im Onboarding: angezeigt wird die Einheit des Nutzers,
 * gespeichert bleiben Milliliter.
 */
export interface WaterGoalField {
  /** Einheit im Feldtitel: „ml" oder „fl oz". */
  label: string;
  /** Schrittweite der Plus/Minus-Knöpfe, in Millilitern. */
  stepMl: number;
  toDisplay: (ml: number) => number;
  toMl: (displayed: number) => number;
  presetsMl: number[];
}

export function waterGoalField(system: UnitSystem): WaterGoalField {
  const unit = waterUnit(system);
  if (unit === 'l') {
    return {
      label: 'ml',
      stepMl: 250,
      toDisplay: (ml) => ml,
      toMl: (n) => Math.round(n / 50) * 50,
      presetsMl: [2000, 2500, 3000, 3500, 4000],
    };
  }
  const per = perUnit(unit);
  return {
    label: labelFor(unit, ''),
    stepMl: Math.round(8 * per),
    toDisplay: (ml) => Math.round(inUnit(ml, unit)),
    toMl: (n) => Math.round(n * per),
    presetsMl: [64, 80, 96, 112, 128].map((n) => Math.round(n * per)),
  };
}

export function fmtMax(n: number, maxDigits: number): string {
  return n.toLocaleString(getLocale(), { maximumFractionDigits: maxDigits });
}
