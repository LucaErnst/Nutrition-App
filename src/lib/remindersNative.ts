/**
 * Terminiert die geplanten Erinnerungen als lokale Benachrichtigungen (Capacitor).
 * Wird beim Start, beim Zurückkehren in den Vordergrund und nach Datenänderungen
 * aufgerufen; plant dabei immer alles neu, damit Erledigtes wegfällt.
 */
import { db } from '../db/db';
import { getLanguage } from '../i18n';
import { isNative } from './native';
import { todayISO } from './date';
import { DEFAULT_REMINDERS, planReminders, type TodayState } from './reminders';
import { activeGoalFor, targetsFor } from './goals';
import { macrosFor, resolveSource, sumMacros } from './nutrition';
import { scheduleWidgetSync } from './widgets';

const DEFAULT_WATER_GOAL_ML = 3000;
const DEFAULT_TRAINING_WEEKDAYS = [1, 2, 4, 5];

let timer: number | undefined;

/** Entprellt: mehrere Datenänderungen kurz hintereinander → eine Neuplanung. */
export function scheduleReminderSync() {
  if (!isNative) return;
  scheduleWidgetSync();
  window.clearTimeout(timer);
  timer = window.setTimeout(() => void syncReminders(), 1500);
}

export async function reminderPermission(): Promise<'granted' | 'denied' | 'prompt'> {
  if (!isNative) return 'denied';
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const st = await LocalNotifications.checkPermissions();
  return st.display === 'granted' ? 'granted' : st.display === 'denied' ? 'denied' : 'prompt';
}

export async function requestReminderPermission(): Promise<boolean> {
  if (!isNative) return false;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const st = await LocalNotifications.requestPermissions();
  return st.display === 'granted';
}

function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

async function todayState(): Promise<TodayState> {
  const date = todayISO();
  const [entries, water, weights, goals, settings, override] = await Promise.all([
    db.mealEntries.where('date').equals(date).toArray(),
    db.water.where('date').equals(date).toArray(),
    db.weights.where('date').equals(date).count(),
    db.goals.toArray(),
    db.settings.get(1),
    db.days.get(date),
  ]);
  const has = (meal: string) => entries.some((e) => e.meal_type === meal);
  const foodIds = [...new Set(entries.map((e) => e.food_item_id))];
  const foods = await db.foodItems.bulkGet(foodIds);
  const byId = new Map(foods.filter(Boolean).map((f) => [f!.id!, f!]));
  const totals = sumMacros(
    entries.flatMap((e) => {
      const src = resolveSource(e, byId.get(e.food_item_id));
      return src ? [macrosFor(src, e.amount, e.unit)] : [];
    }),
  );
  const goal = activeGoalFor(goals, date);
  const isTraining = override?.is_training ?? (settings?.training_weekdays ?? DEFAULT_TRAINING_WEEKDAYS).includes(weekdayOf(date));
  const proteinLeft = goal ? Math.max(0, targetsFor(goal, isTraining).protein - totals.protein) : undefined;
  return {
    breakfastLogged: has('breakfast'),
    lunchLogged: has('lunch'),
    dinnerLogged: has('dinner'),
    weighed: weights > 0,
    waterMl: water.reduce((s, w) => s + w.ml, 0),
    waterGoalMl: settings?.water_goal_ml ?? DEFAULT_WATER_GOAL_ML,
    proteinLeft,
  };
}

export async function syncReminders(): Promise<number> {
  if (!isNative) return 0;
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const settings = await db.settings.get(1);
  const reminders = settings?.reminders ?? DEFAULT_REMINDERS;

  // Alles Alte verwerfen – wir planen komplett neu
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) await LocalNotifications.cancel({ notifications: pending.notifications.map((p) => ({ id: p.id })) });
  if (!reminders.enabled) return 0;
  if ((await reminderPermission()) !== 'granted') return 0;

  let salt = settings?.reminder_salt;
  if (salt === undefined) {
    salt = Math.floor(Math.random() * 1000);
    await db.settings.put({ ...(settings ?? { id: 1 as const, training_weekdays: DEFAULT_TRAINING_WEEKDAYS }), reminder_salt: salt });
  }

  const plan = planReminders({ settings: reminders, lang: getLanguage(), today: await todayState(), salt, days: 7 });
  if (plan.length === 0) return 0;
  await LocalNotifications.schedule({
    notifications: plan.map((p) => ({
      id: p.id,
      title: p.title,
      body: p.body,
      schedule: { at: p.at, allowWhileIdle: true },
      extra: { kind: p.kind },
    })),
  });
  return plan.length;
}
