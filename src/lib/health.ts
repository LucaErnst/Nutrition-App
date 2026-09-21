/**
 * Apple Health (nur iOS). Schreibt Tages-Summen (kcal, Makros, Wasser) und Gewicht; liest Gewicht
 * anderer Quellen (Waage) und die Aktivkalorien des Tages. Native Seite: ios/App/App/HealthBridgePlugin.swift.
 * Alles hier ist ein No-op, solange die Anbindung nicht in den Einstellungen aktiviert ist.
 */
import { registerPlugin } from '@capacitor/core';
import { db } from '../db/db';
import { logError } from './errorLog';
import { isNative } from './native';
import { todayISO } from './date';
import { macrosFor, resolveSource, sumMacros } from './nutrition';

interface HealthBridgePlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(): Promise<{ granted: boolean }>;
  writeNutrition(o: { date: string; kcal: number; protein: number; fat: number; carbs: number }): Promise<void>;
  writeWater(o: { date: string; ml: number }): Promise<void>;
  writeWeight(o: { date: string; kg?: number }): Promise<void>;
  readWeights(o: { days: number }): Promise<{ items: { date: string; kg: number }[] }>;
  readActiveEnergy(o: { date: string }): Promise<{ kcal: number }>;
}

const Health = registerPlugin<HealthBridgePlugin>('HealthBridge');

let enabledCache: boolean | undefined;

export async function healthEnabled(): Promise<boolean> {
  if (!isNative) return false;
  if (enabledCache === undefined) enabledCache = !!(await db.settings.get(1))?.health_enabled;
  return enabledCache;
}

export function setHealthEnabledCache(v: boolean) {
  enabledCache = v;
}

export async function healthAvailable(): Promise<boolean> {
  if (!isNative) return false;
  try {
    return (await Health.isAvailable()).available;
  } catch {
    return false;
  }
}

export async function requestHealthAccess(): Promise<boolean> {
  try {
    return (await Health.requestAuthorization()).granted;
  } catch (e) {
    logError('health', e);
    return false;
  }
}

// --- Tages-Summen ---------------------------------------------------------------

const dirty = new Set<string>();
let timer: number | undefined;

/** Tag als geändert vormerken; mehrere Änderungen werden gesammelt geschrieben. */
export function scheduleHealthSync(date: string) {
  if (!isNative) return;
  dirty.add(date);
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void flush(), 1500);
}

async function flush() {
  if (!(await healthEnabled())) {
    dirty.clear();
    return;
  }
  const dates = [...dirty];
  dirty.clear();
  for (const date of dates) await syncHealthDay(date);
}

export async function syncHealthDay(date: string): Promise<void> {
  try {
    const [entries, water] = await Promise.all([db.mealEntries.where('date').equals(date).toArray(), db.water.where('date').equals(date).toArray()]);
    const foods = await db.foodItems.bulkGet([...new Set(entries.map((e) => e.food_item_id))]);
    const byId = new Map(foods.filter(Boolean).map((f) => [f!.id!, f!]));
    const t = sumMacros(
      entries.flatMap((e) => {
        const src = resolveSource(e, byId.get(e.food_item_id));
        return src ? [macrosFor(src, e.amount, e.unit)] : [];
      }),
    );
    await Health.writeNutrition({ date, kcal: Math.round(t.kcal), protein: Math.round(t.protein * 10) / 10, fat: Math.round(t.fat * 10) / 10, carbs: Math.round(t.carbs * 10) / 10 });
    await Health.writeWater({ date, ml: water.reduce((s, w) => s + w.ml, 0) });
  } catch (e) {
    logError('health', e);
  }
}

// --- Gewicht -------------------------------------------------------------------

export async function syncHealthWeight(date: string, kg: number | undefined): Promise<void> {
  if (!(await healthEnabled())) return;
  try {
    await Health.writeWeight(kg === undefined ? { date } : { date, kg });
  } catch (e) {
    logError('health', e);
  }
}

/** Gewichte aus Health (Waage, andere Apps) für Tage ohne eigenen Eintrag übernehmen. */
export async function importHealthWeights(days = 90): Promise<number> {
  if (!(await healthEnabled())) return 0;
  try {
    const { items } = await Health.readWeights({ days });
    let added = 0;
    for (const it of items) {
      const existing = await db.weights.where('date').equals(it.date).first();
      const kg = Math.round(it.kg * 10) / 10;
      if (!existing) {
        await db.weights.add({ date: it.date, weight_kg: kg, source: 'health' });
        added++;
      } else if (existing.source === 'health' && existing.weight_kg !== kg) {
        await db.weights.update(existing.id!, { weight_kg: kg });
      }
    }
    return added;
  } catch (e) {
    logError('health', e);
    return 0;
  }
}

export async function readActiveEnergy(date: string): Promise<number | undefined> {
  if (!(await healthEnabled())) return undefined;
  try {
    const { kcal } = await Health.readActiveEnergy({ date });
    return Math.round(kcal);
  } catch {
    return undefined;
  }
}

// --- Erstabgleich beim Einschalten ------------------------------------------------

/** Schreibt die letzten 30 Tage und alle eigenen Gewichte nach Health, importiert fremde Gewichte. */
export async function healthBackfill(): Promise<void> {
  const today = todayISO();
  const dates: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  for (const date of dates) await syncHealthDay(date);
  const weights = await db.weights.toArray();
  for (const w of weights) if (w.source !== 'health') await syncHealthWeight(w.date, w.weight_kg);
  await importHealthWeights(365);
  void today;
}

/** Beim Start/Vordergrund: heute nachschreiben und fremde Gewichte holen. */
export async function healthRefresh(): Promise<void> {
  if (!(await healthEnabled())) return;
  await syncHealthDay(todayISO());
  await importHealthWeights(30);
}
