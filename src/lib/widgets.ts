/**
 * Home- und Sperrbildschirm-Widgets (nur iOS, WidgetKit).
 *
 * Die Web-App kann nicht direkt in ein Widget zeichnen. Stattdessen schreibt sie nach jeder
 * Datenänderung einen kleinen Tagesstand (JSON) in den gemeinsamen App-Group-Speicher; die
 * Widget-Extension (Swift, ios/SeriousWidgets) liest ihn und rendert nativ. Der +250-ml-Button
 * im Widget schreibt umgekehrt „ausstehendes Wasser“ in denselben Speicher, das die App beim
 * nächsten Start/Vordergrund übernimmt.
 */
import { registerPlugin } from '@capacitor/core';
import { logError } from './errorLog';
import { db } from '../db/db';
import { getLanguage } from '../i18n';
import { isNative } from './native';
import { todayISO, weekDates, weekStartOf } from './date';
import { activeGoalFor, targetsFor } from './goals';
import { macrosFor, resolveSource, sumMacros } from './nutrition';
import { weekBudget } from './week';
import { isPro } from './pro';
import type { DaySummary } from './week';

/** Was das Widget anzeigt – bewusst klein und flach (wird als JSON abgelegt). */
export interface WidgetSnapshot {
  date: string; // YYYY-MM-DD, damit das Widget einen alten Stand am nächsten Tag erkennt
  lang: 'en' | 'de';
  kcal: number;
  kcalTarget?: number;
  protein: number;
  proteinTarget?: number;
  waterMl: number;
  waterGoalMl: number;
  /** Wochenbudget: was heute noch drin ist und wie viele Tage (inkl. heute) übrig sind */
  weekLeftToday?: number;
  weekDaysLeft?: number;
  weekOnTrack?: boolean;
  /** false = Widgets zeigen den Pro-Hinweis statt Daten */
  pro: boolean;
  updatedAt: number;
}

interface PendingWater {
  ml: number;
  at: number;
}

interface WidgetBridgePlugin {
  setSnapshot(opts: { json: string }): Promise<{ stored: boolean; bytes: number; group: string }>;
  takePendingWater(): Promise<{ items: PendingWater[] }>;
}

const WidgetBridge = registerPlugin<WidgetBridgePlugin>('WidgetBridge');

const DEFAULT_WATER_GOAL_ML = 3000;
const DEFAULT_TRAINING_WEEKDAYS = [1, 2, 4, 5];

function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

/** Rechnet den Tagesstand aus der Datenbank – ohne React, damit es überall aufrufbar ist. */
export async function buildSnapshot(): Promise<WidgetSnapshot> {
  const today = todayISO();
  const dates = weekDates(weekStartOf(today));
  const [entries, goals, settings, overrides, water] = await Promise.all([
    db.mealEntries.where('date').between(dates[0], dates[dates.length - 1], true, true).toArray(),
    db.goals.toArray(),
    db.settings.get(1),
    db.days.where('date').anyOf(dates).toArray(),
    db.water.where('date').equals(today).toArray(),
  ]);
  const foodIds = [...new Set(entries.map((e) => e.food_item_id))];
  const foods = await db.foodItems.bulkGet(foodIds);
  const foodById = new Map(foods.filter(Boolean).map((f) => [f!.id!, f!]));
  const overrideByDate = new Map(overrides.map((o) => [o.date, o.is_training]));
  const trainingWeekdays = settings?.training_weekdays ?? DEFAULT_TRAINING_WEEKDAYS;

  const days: DaySummary[] = dates.map((date) => {
    const dayEntries = entries.filter((e) => e.date === date);
    const totals = sumMacros(
      dayEntries.flatMap((e) => {
        const food = resolveSource(e, foodById.get(e.food_item_id));
        return food ? [macrosFor(food, e.amount, e.unit)] : [];
      }),
    );
    const isTraining = overrideByDate.get(date) ?? trainingWeekdays.includes(weekdayOf(date));
    const goal = activeGoalFor(goals, date);
    return { date, totals, targets: goal ? targetsFor(goal, isTraining) : undefined, tracked: dayEntries.length > 0 };
  });
  const todayDay = days.find((d) => d.date === today)!;
  const budget = weekBudget(days, today);

  return {
    date: today,
    lang: getLanguage(),
    kcal: Math.round(todayDay.totals.kcal),
    kcalTarget: todayDay.targets ? Math.round(todayDay.targets.kcal) : undefined,
    protein: Math.round(todayDay.totals.protein),
    proteinTarget: todayDay.targets ? Math.round(todayDay.targets.protein) : undefined,
    waterMl: water.reduce((s, w) => s + w.ml, 0),
    waterGoalMl: settings?.water_goal_ml ?? DEFAULT_WATER_GOAL_ML,
    weekLeftToday: budget ? Math.round(budget.todayLeft) : undefined,
    weekDaysLeft: budget?.daysLeft,
    weekOnTrack: budget ? budget.driftBefore <= 0 : undefined,
    pro: isPro(),
    updatedAt: Date.now(),
  };
}

let timer: number | undefined;

/** Entprellt wie die Erinnerungen: viele Änderungen kurz nacheinander → ein Schreibvorgang. */
export function scheduleWidgetSync() {
  if (!isNative) return;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncWidgets(), 800);
}

/** Letzter Sync-Stand für die Diagnose-Ansicht */
export function lastWidgetSync(): { at: number; stored?: boolean; bytes?: number; snap?: WidgetSnapshot } | undefined {
  try {
    const raw = localStorage.getItem('nutrition-tracker:widget-sync');
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

export async function syncWidgets(): Promise<void> {
  if (!isNative) return;
  try {
    const snap = await buildSnapshot();
    const res = await WidgetBridge.setSnapshot({ json: JSON.stringify(snap) });
    localStorage.setItem('nutrition-tracker:widget-sync', JSON.stringify({ at: Date.now(), stored: res?.stored, bytes: res?.bytes, snap }));
  } catch (e) {
    // Fehlende Bridge (Android) oder Rechenfehler – unter Mehr → Diagnose sichtbar machen
    logError('widget', e);
  }
}

/**
 * Übernimmt Wasser, das über den Widget-Button eingetragen wurde, in die Datenbank.
 * Gibt die Anzahl übernommener Einträge zurück.
 */
export async function importPendingWater(): Promise<number> {
  if (!isNative) return 0;
  let items: PendingWater[] = [];
  try {
    items = (await WidgetBridge.takePendingWater()).items ?? [];
  } catch (e) {
    logError('widget', e);
    return 0;
  }
  for (const p of items) {
    const d = new Date(p.at);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    await db.water.add({ date, ml: p.ml, created_at: p.at });
  }
  if (items.length) scheduleWidgetSync();
  return items.length;
}
