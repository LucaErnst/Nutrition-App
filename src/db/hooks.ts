import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { snapshotOf, type DailyGoal, type FoodItem, type MealEntry, type MealTemplate, type MealType, type Settings, type Unit, type WeightEntry } from './types';
import { macrosFor, resolveSource, sumMacros, type EntryWithFood } from '../lib/nutrition';
import { activeGoalFor, targetsFor } from '../lib/goals';
import type { DaySummary } from '../lib/week';

/** Alle Einträge eines Tages, mit aufgelöstem FoodItem und berechneten Makros. */
export function useDayEntries(date: string): EntryWithFood[] | undefined {
  return useLiveQuery(async () => {
    const entries = await db.mealEntries.where('date').equals(date).sortBy('created_at');
    const ids = [...new Set(entries.map((e) => e.food_item_id))];
    const foods = await db.foodItems.bulkGet(ids);
    const foodById = new Map(foods.filter(Boolean).map((f) => [f!.id!, f!]));
    return entries.flatMap((entry) => {
      const item = foodById.get(entry.food_item_id);
      const food = resolveSource(entry, item);
      if (!food) return [];
      return [{ entry, food, item, macros: macrosFor(food, entry.amount, entry.unit) }];
    });
  }, [date]);
}

/** Legt einen Eintrag an und friert die Nährwerte des Lebensmittels darin ein. */
export async function addMealEntry(entry: Omit<MealEntry, 'id' | 'created_at' | 'snapshot'>, food: FoodItem) {
  return db.mealEntries.add({ ...entry, snapshot: snapshotOf(food), created_at: Date.now() });
}

export async function updateMealEntryAmount(id: number, amount: number) {
  return db.mealEntries.update(id, { amount });
}

export async function deleteMealEntry(id: number) {
  return db.mealEntries.delete(id);
}

export function groupByMeal(entries: EntryWithFood[]): Record<MealType, EntryWithFood[]> {
  const groups: Record<MealType, EntryWithFood[]> = {
    breakfast: [],
    morning_snack: [],
    lunch: [],
    afternoon_snack: [],
    dinner: [],
  };
  for (const e of entries) groups[e.entry.meal_type].push(e);
  return groups;
}

/** Alle gespeicherten Lebensmittel (Referenzdatenbank), alphabetisch. */
export function useSavedFoods(): FoodItem[] | undefined {
  return useLiveQuery(async () => {
    const items = await db.foodItems.where('saved').equals(1).toArray();
    return items.sort((a, b) => a.name.localeCompare(b.name, 'de'));
  });
}

/** Häufigkeit der Verwendung pro FoodItem (für Schnellauswahl). */
export function useFoodUsage(): Map<number, { count: number; last: number }> | undefined {
  return useLiveQuery(async () => {
    const entries = await db.mealEntries.toArray();
    const map = new Map<number, { count: number; last: number }>();
    for (const e of entries) {
      const cur = map.get(e.food_item_id) ?? { count: 0, last: 0 };
      map.set(e.food_item_id, { count: cur.count + 1, last: Math.max(cur.last, e.created_at) });
    }
    return map;
  });
}

export async function deleteFoodItem(id: number) {
  // Wird das Item noch von Einträgen oder Vorlagen verwendet, nur aus der
  // Datenbank ausblenden, damit historische Tage ihre Werte behalten.
  const used = await db.mealEntries.where('food_item_id').equals(id).count();
  const inTemplate = (await db.templates.toArray()).some((t) => t.items.some((i) => i.food_item_id === id));
  if (used > 0 || inTemplate) return db.foodItems.update(id, { saved: 0 });
  return db.foodItems.delete(id);
}

// --- Ziele & Trainingstage ---------------------------------------------------

export function useGoals(): DailyGoal[] | undefined {
  return useLiveQuery(() => db.goals.orderBy('start_date').reverse().toArray());
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(async () => (await db.settings.get(1)) ?? DEFAULT_SETTINGS);
}

export const DEFAULT_SETTINGS: Settings = { id: 1, training_weekdays: [1, 2, 4, 5] };

export async function saveSettings(patch: Partial<Omit<Settings, 'id'>>) {
  const cur = (await db.settings.get(1)) ?? DEFAULT_SETTINGS;
  return db.settings.put({ ...cur, ...patch, id: 1 });
}

/** Ist ein Datum ein Trainingstag? Tages-Override schlägt Wochentag-Standard. */
export function useIsTrainingDay(date: string): boolean | undefined {
  return useLiveQuery(async () => {
    const override = await db.days.get(date);
    if (override) return override.is_training;
    const settings = (await db.settings.get(1)) ?? DEFAULT_SETTINGS;
    return settings.training_weekdays.includes(weekdayOf(date));
  }, [date]);
}

export async function setTrainingDay(date: string, is_training: boolean) {
  return db.days.put({ date, is_training });
}

export function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

// --- Woche -------------------------------------------------------------------

/** Tagessummen + Ziele für eine Liste von Datumswerten. */
export function useDaySummaries(dates: string[]): DaySummary[] | undefined {
  const key = dates.join(',');
  return useLiveQuery(async () => {
    if (dates.length === 0) return [];
    const [entries, goals, settings, overrides] = await Promise.all([
      db.mealEntries.where('date').between(dates[0], dates[dates.length - 1], true, true).toArray(),
      db.goals.toArray(),
      db.settings.get(1),
      db.days.where('date').anyOf(dates).toArray(),
    ]);
    const foodIds = [...new Set(entries.map((e) => e.food_item_id))];
    const foods = await db.foodItems.bulkGet(foodIds);
    const foodById = new Map(foods.filter(Boolean).map((f) => [f!.id!, f!]));
    const overrideByDate = new Map(overrides.map((o) => [o.date, o.is_training]));
    const trainingWeekdays = (settings ?? DEFAULT_SETTINGS).training_weekdays;

    return dates.map((date) => {
      const dayEntries = entries.filter((e) => e.date === date);
      const totals = sumMacros(
        dayEntries.flatMap((e) => {
          const food = resolveSource(e, foodById.get(e.food_item_id));
          return food ? [macrosFor(food, e.amount, e.unit)] : [];
        }),
      );
      const isTraining = overrideByDate.get(date) ?? trainingWeekdays.includes(weekdayOf(date));
      const goal = activeGoalFor(goals, date);
      return {
        date,
        totals,
        targets: goal ? targetsFor(goal, isTraining) : undefined,
        tracked: dayEntries.length > 0,
      };
    });
  }, [key]);
}

// --- Gewicht -----------------------------------------------------------------

export function useWeights(): WeightEntry[] | undefined {
  return useLiveQuery(() => db.weights.orderBy('date').toArray());
}

/** Speichert das Gewicht für ein Datum (überschreibt einen bestehenden Eintrag). */
export async function upsertWeight(date: string, weight_kg: number) {
  const existing = await db.weights.where('date').equals(date).first();
  if (existing) return db.weights.update(existing.id!, { weight_kg });
  return db.weights.add({ date, weight_kg });
}

export async function deleteWeight(id: number) {
  return db.weights.delete(id);
}

// --- Vorlagen ----------------------------------------------------------------

export function useTemplates(): MealTemplate[] | undefined {
  return useLiveQuery(() => db.templates.orderBy('name').toArray());
}

export async function saveTemplate(name: string, items: MealTemplate['items']) {
  return db.templates.add({ name, items, created_at: Date.now() });
}

export async function deleteTemplate(id: number) {
  return db.templates.delete(id);
}

/** Trägt alle Posten einer Vorlage in eine Mahlzeit ein; liefert die Anzahl. */
export async function applyTemplate(template: MealTemplate, date: string, meal_type: MealType): Promise<number> {
  const foods = await db.foodItems.bulkGet(template.items.map((i) => i.food_item_id));
  const now = Date.now();
  const rows: Omit<MealEntry, 'id'>[] = template.items.flatMap((item, i) => {
    const food = foods[i];
    if (!food) return [];
    return [{ date, meal_type, food_item_id: item.food_item_id, amount: item.amount, unit: item.unit as Unit, snapshot: snapshotOf(food), created_at: now + i }];
  });
  if (rows.length) await db.mealEntries.bulkAdd(rows);
  return rows.length;
}

/** Befüllt fehlende Snapshots (z.B. nach Import eines älteren Backups). */
export async function backfillSnapshots(): Promise<number> {
  const foods = await db.foodItems.toArray();
  const byId = new Map(foods.map((f) => [f.id!, f]));
  let n = 0;
  await db.mealEntries
    .filter((e) => !e.snapshot)
    .modify((e) => {
      const food = byId.get(e.food_item_id);
      if (food) {
        e.snapshot = snapshotOf(food);
        n++;
      }
    });
  return n;
}
