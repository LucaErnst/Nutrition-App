/**
 * Erinnerungs-Planung (rein, testbar): erzeugt aus den Einstellungen und dem
 * heutigen Stand eine Liste konkreter Benachrichtigungen für die nächsten Tage.
 * Regeln: max. 3 pro Tag, nichts Erledigtes für heute, Protein-Rest nur heute
 * und nur mit echter Zahl.
 */
import type { Language } from '../i18n';
import { addDays, todayISO } from './date';
import { pickText, type ReminderKind } from './reminderTexts';

export interface WaterReminder {
  from: string; // HH:MM
  to: string; // HH:MM
  every_hours: number;
}

export interface ReminderSettings {
  enabled: boolean;
  breakfast: string | null;
  lunch: string | null;
  dinner: string | null;
  water: WaterReminder | null;
  weigh: string | null;
  /** Sonntag, Uhrzeit */
  weekly: string | null;
  /** Abends an offenes Protein erinnern (nur heute, echte Zahl) */
  protein: boolean;
}

export const DEFAULT_REMINDERS: ReminderSettings = {
  enabled: false,
  breakfast: '08:30',
  lunch: null,
  dinner: '19:30',
  water: { from: '10:30', to: '20:30', every_hours: 3 },
  weigh: '07:30',
  weekly: '19:00',
  protein: true,
};

export const MAX_PER_DAY = 3;

/** Heutiger Stand – bestimmt, welche Erinnerungen heute noch sinnvoll sind. */
export interface TodayState {
  breakfastLogged: boolean;
  lunchLogged: boolean;
  dinnerLogged: boolean;
  weighed: boolean;
  waterMl: number;
  waterGoalMl: number;
  /** Offenes Protein in g (Ziel − bisher); undefined ohne Ziel */
  proteinLeft?: number;
}

export interface PlannedReminder {
  id: number;
  kind: ReminderKind;
  at: Date;
  title: string;
  body: string;
}

const KIND_INDEX: Record<ReminderKind, number> = { weigh: 0, breakfast: 1, lunch: 2, protein: 3, dinner: 4, weekly: 5, water: 6 };
/** Wer bei mehr als MAX_PER_DAY Kandidaten bleibt */
const PRIORITY: ReminderKind[] = ['dinner', 'breakfast', 'protein', 'weigh', 'water', 'lunch', 'weekly'];

function at(date: string, hhmm: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = hhmm.split(':').map(Number);
  return new Date(y, m - 1, d, h, min, 0, 0);
}

function daysSinceEpoch(date: string): number {
  return Math.round(at(date, '12:00').getTime() / 86_400_000);
}

export function planReminders(opts: {
  settings: ReminderSettings;
  lang: Language;
  today: TodayState;
  now?: Date;
  salt?: number;
  days?: number;
}): PlannedReminder[] {
  const { settings: s, lang, today } = opts;
  if (!s.enabled) return [];
  const now = opts.now ?? new Date();
  const salt = opts.salt ?? 0;
  const days = opts.days ?? 7;
  const todayIso = todayISO();
  const out: PlannedReminder[] = [];

  for (let offset = 0; offset < days; offset++) {
    const date = addDays(todayIso, offset);
    const isToday = offset === 0;
    const seq = daysSinceEpoch(date);
    const candidates: PlannedReminder[] = [];
    const add = (kind: ReminderKind, time: string, slot = 0, params?: Record<string, number | string>) => {
      const when = at(date, time);
      if (when.getTime() <= now.getTime()) return;
      const t = pickText(lang, kind, seq + slot, salt, params);
      candidates.push({ id: offset * 100 + KIND_INDEX[kind] * 10 + slot, kind, at: when, title: t.title, body: t.body });
    };

    if (s.weigh && !(isToday && today.weighed)) add('weigh', s.weigh);
    if (s.breakfast && !(isToday && today.breakfastLogged)) add('breakfast', s.breakfast);
    if (s.lunch && !(isToday && today.lunchLogged)) add('lunch', s.lunch);
    if (s.dinner && !(isToday && today.dinnerLogged)) add('dinner', s.dinner);
    if (s.water && !(isToday && today.waterMl >= today.waterGoalMl)) {
      const [fh, fm] = s.water.from.split(':').map(Number);
      const [th, tm] = s.water.to.split(':').map(Number);
      const every = Math.max(1, s.water.every_hours);
      let slot = 0;
      for (let minutes = fh * 60 + fm; minutes <= th * 60 + tm && slot < 6; minutes += every * 60, slot++) {
        const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
        const mm = String(minutes % 60).padStart(2, '0');
        add('water', `${hh}:${mm}`, slot);
      }
    }
    // Protein-Rest: nur heute, nur mit echter Zahl, nur wenn das Abendessen noch aussteht.
    if (isToday && s.protein && today.proteinLeft !== undefined && today.proteinLeft >= 20 && !today.dinnerLogged && s.dinner) {
      const [h, m] = s.dinner.split(':').map(Number);
      const proteinTime = `${String(Math.max(0, h - 2)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      add('protein', proteinTime, 0, { n: Math.round(today.proteinLeft) });
    }
    if (s.weekly && at(date, '12:00').getDay() === 0) add('weekly', s.weekly);

    // Tageslimit nach Priorität, dann chronologisch
    const kept = candidates
      .sort((a, b) => PRIORITY.indexOf(a.kind) - PRIORITY.indexOf(b.kind) || a.at.getTime() - b.at.getTime())
      .slice(0, MAX_PER_DAY)
      .sort((a, b) => a.at.getTime() - b.at.getTime());
    out.push(...kept);
  }
  return out;
}
