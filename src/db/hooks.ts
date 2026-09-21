import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { MEAL_TYPES, ZERO_MACROS, snapshotOf, type DailyGoal, type FoodItem, type Macros, type MealEntry, type MealTemplate, type MealType, type Settings, type Unit, type WeightEntry } from './types';
import { addDays } from '../lib/date';
import { scheduleReminderSync } from '../lib/remindersNative';
import { scheduleHealthSync, syncHealthWeight } from '../lib/health';
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
  const id = await db.mealEntries.add({ ...entry, snapshot: snapshotOf(food), created_at: Date.now() });
  if (food.id) await db.foodItems.update(food.id, { last_amount: entry.amount, last_unit: entry.unit });
  scheduleReminderSync();
  scheduleHealthSync(entry.date);
  return id;
}

export async function updateMealEntryAmount(id: number, amount: number) {
  const entry = await db.mealEntries.get(id);
  await db.mealEntries.update(id, { amount });
  if (entry) await db.foodItems.update(entry.food_item_id, { last_amount: amount, last_unit: entry.unit });
  scheduleReminderSync();
  if (entry) scheduleHealthSync(entry.date);
}

export async function deleteMealEntry(id: number) {
  const entry = await db.mealEntries.get(id);
  await db.mealEntries.delete(id);
  scheduleReminderSync();
  if (entry) scheduleHealthSync(entry.date);
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
  const r = await db.settings.put({ ...cur, ...patch, id: 1 });
  scheduleReminderSync();
  return r;
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
  await db.days.put({ date, is_training });
  scheduleReminderSync();
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
  scheduleReminderSync();
  void syncHealthWeight(date, weight_kg);
  // Manuell eingetragen überschreibt einen Health-Import
  if (existing) return db.weights.update(existing.id!, { weight_kg, source: undefined });
  return db.weights.add({ date, weight_kg });
}

export async function deleteWeight(id: number) {
  const w = await db.weights.get(id);
  await db.weights.delete(id);
  if (w && w.source !== 'health') void syncHealthWeight(w.date, undefined);
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
  scheduleReminderSync();
  scheduleHealthSync(date);
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

// --- Schnellfunktionen ---------------------------------------------------------

/** Stellt einen gelöschten Eintrag mit derselben ID wieder her (Undo). */
export async function restoreMealEntry(entry: MealEntry) {
  const id = await db.mealEntries.add(entry);
  scheduleReminderSync();
  scheduleHealthSync(entry.date);
  return id;
}

export async function toggleFavorite(item: FoodItem) {
  return db.foodItems.update(item.id!, { favorite: item.favorite ? 0 : 1 });
}

export interface MealCopySource {
  date: string;
  meal_type: MealType;
  entries: MealEntry[];
  totals: Macros;
}

/** Mahlzeiten von heute und gestern, die Posten enthalten – als Kopiervorlage. */
export function useCopySources(date: string): MealCopySource[] | undefined {
  return useLiveQuery(async () => {
    const yesterday = addDays(date, -1);
    const entries = await db.mealEntries.where('date').anyOf([date, yesterday]).toArray();
    if (entries.length === 0) return [];
    const foodIds = [...new Set(entries.map((e) => e.food_item_id))];
    const foods = await db.foodItems.bulkGet(foodIds);
    const foodById = new Map(foods.filter(Boolean).map((f) => [f!.id!, f!]));
    const groups = new Map<string, MealCopySource>();
    for (const e of entries) {
      const key = `${e.date}|${e.meal_type}`;
      const g = groups.get(key) ?? { date: e.date, meal_type: e.meal_type, entries: [], totals: { ...ZERO_MACROS } };
      const src = resolveSource(e, foodById.get(e.food_item_id));
      if (!src) continue;
      g.entries.push(e);
      g.totals = sumMacros([g.totals, macrosFor(src, e.amount, e.unit)]);
      groups.set(key, g);
    }
    // gestern zuerst, dann heute; innerhalb in Mahlzeiten-Reihenfolge
    const order = (m: MealType) => MEAL_TYPES.indexOf(m);
    return [...groups.values()].sort((a, b) => a.date.localeCompare(b.date) || order(a.meal_type) - order(b.meal_type));
  }, [date]);
}

/** Kopiert alle Posten einer Mahlzeit (inkl. Snapshot) in eine andere Mahlzeit/Tag. */
export async function copyMeal(source: MealCopySource, date: string, meal_type: MealType): Promise<number> {
  const now = Date.now();
  const rows: Omit<MealEntry, 'id'>[] = source.entries.map((e, i) => ({
    date,
    meal_type,
    food_item_id: e.food_item_id,
    amount: e.amount,
    unit: e.unit,
    snapshot: e.snapshot,
    created_at: now + i,
  }));
  if (rows.length) await db.mealEntries.bulkAdd(rows);
  scheduleReminderSync();
  scheduleHealthSync(date);
  return rows.length;
}

// --- Wasser ------------------------------------------------------------------

export const DEFAULT_WATER_GOAL_ML = 3000;

/** Tagesmenge Wasser in ml. */
export function useWaterForDay(date: string): number | undefined {
  return useLiveQuery(async () => {
    const rows = await db.water.where('date').equals(date).toArray();
    return rows.reduce((s, r) => s + r.ml, 0);
  }, [date]);
}

/** Wasser pro Datum (ml) für mehrere Tage, z.B. eine Woche. */
export function useWaterByDate(dates: string[]): Map<string, number> | undefined {
  const key = dates.join(',');
  return useLiveQuery(async () => {
    const rows = dates.length ? await db.water.where('date').anyOf(dates).toArray() : [];
    const map = new Map<string, number>(dates.map((d) => [d, 0]));
    for (const r of rows) map.set(r.date, (map.get(r.date) ?? 0) + r.ml);
    return map;
  }, [key]);
}

export async function addWater(date: string, ml: number) {
  const id = await db.water.add({ date, ml, created_at: Date.now() });
  scheduleReminderSync();
  scheduleHealthSync(date);
  return id;
}

/** Entfernt den zuletzt eingetragenen Schluck des Tages (Undo). */
export async function removeLastWater(date: string): Promise<number | undefined> {
  const last = await db.water.where('date').equals(date).reverse().sortBy('created_at');
  const entry = last[0];
  if (!entry) return undefined;
  await db.water.delete(entry.id!);
  scheduleReminderSync();
  scheduleHealthSync(date);
  return entry.ml;
}
