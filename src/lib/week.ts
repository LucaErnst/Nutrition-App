import type { Macros } from '../db/types';
import { ZERO_MACROS } from '../db/types';
import type { DayTargets } from './goals';
import { fmt } from './nutrition';
import type { MessageKey } from '../i18n/en';

export interface DaySummary {
  date: string;
  totals: Macros;
  targets?: DayTargets;
  /** true, wenn mindestens ein Posten eingetragen ist */
  tracked: boolean;
}

export interface Conclusion {
  kind: 'ok' | 'warn' | 'info';
  key: MessageKey;
  params?: Record<string, string | number>;
}

export interface WeekSummary {
  days: DaySummary[];
  trackedCount: number;
  /** Tage der Woche, die bereits vergangen sind (inkl. heute) */
  elapsedCount: number;
  /** Durchschnitt über erfasste Tage */
  avg: Macros;
  /** Durchschnittliches Ziel über erfasste Tage (Trainings-/Ruhetage gewichtet) */
  avgTarget?: { kcal: number; protein: number; fat_min: number; fat_max: number; carbs: number };
  /** Summen über erfasste Tage */
  total: Macros;
  totalTargetKcal?: number;
  conclusions: Conclusion[];
}

export function summarizeWeek(days: DaySummary[], today: string): WeekSummary {
  const tracked = days.filter((d) => d.tracked);
  const n = tracked.length;
  const elapsedCount = days.filter((d) => d.date <= today).length;

  const total = tracked.reduce<Macros>(
    (acc, d) => ({
      kcal: acc.kcal + d.totals.kcal,
      protein: acc.protein + d.totals.protein,
      fat: acc.fat + d.totals.fat,
      carbs: acc.carbs + d.totals.carbs,
    }),
    { ...ZERO_MACROS },
  );
  const avg: Macros = n
    ? { kcal: total.kcal / n, protein: total.protein / n, fat: total.fat / n, carbs: total.carbs / n }
    : { ...ZERO_MACROS };

  const withTargets = tracked.filter((d) => d.targets);
  let avgTarget: WeekSummary['avgTarget'];
  let totalTargetKcal: number | undefined;
  if (withTargets.length) {
    const m = withTargets.length;
    const sum = withTargets.reduce(
      (acc, d) => ({
        kcal: acc.kcal + d.targets!.kcal,
        protein: acc.protein + d.targets!.protein,
        fat_min: acc.fat_min + d.targets!.fat_min,
        fat_max: acc.fat_max + d.targets!.fat_max,
        carbs: acc.carbs + d.targets!.carbs,
      }),
      { kcal: 0, protein: 0, fat_min: 0, fat_max: 0, carbs: 0 },
    );
    avgTarget = { kcal: sum.kcal / m, protein: sum.protein / m, fat_min: sum.fat_min / m, fat_max: sum.fat_max / m, carbs: sum.carbs / m };
    totalTargetKcal = sum.kcal;
  }

  const includesToday = tracked.some((d) => d.date === today);
  return { days, trackedCount: n, elapsedCount, avg, avgTarget, total, totalTargetKcal, conclusions: conclude(n, elapsedCount, avg, avgTarget, includesToday) };
}

function conclude(n: number, elapsed: number, avg: Macros, t: WeekSummary['avgTarget'], includesToday: boolean): Conclusion[] {
  if (n === 0) return [{ kind: 'info', key: 'concl.noEntries' }];
  const out: Conclusion[] = [];

  if (!t) {
    out.push({ kind: 'info', key: 'concl.noGoals' });
  } else {
    // Protein
    if (avg.protein >= t.protein) {
      out.push({ kind: 'ok', key: 'concl.proteinOk', params: { avg: fmt(avg.protein), target: fmt(t.protein) } });
    } else {
      out.push({ kind: 'warn', key: 'concl.proteinLow', params: { avg: fmt(avg.protein), missing: fmt(t.protein - avg.protein) } });
    }

    // Kalorien (±5 % gilt als im Rahmen)
    const diff = avg.kcal - t.kcal;
    const ratio = avg.kcal / t.kcal;
    if (ratio >= 0.95 && ratio <= 1.05) {
      out.push({ kind: 'ok', key: 'concl.kcalOk', params: { avg: fmt(avg.kcal), target: fmt(t.kcal) } });
    } else if (diff < 0) {
      out.push({ kind: 'warn', key: 'concl.kcalLow', params: { avg: fmt(avg.kcal), diff: fmt(-diff) } });
    } else {
      out.push({ kind: 'warn', key: 'concl.kcalHigh', params: { avg: fmt(avg.kcal), diff: fmt(diff) } });
    }

    // Fett
    const fatParams = { avg: fmt(avg.fat), min: fmt(t.fat_min), max: fmt(t.fat_max) };
    if (avg.fat < t.fat_min) out.push({ kind: 'warn', key: 'concl.fatLow', params: fatParams });
    else if (avg.fat > t.fat_max) out.push({ kind: 'warn', key: 'concl.fatHigh', params: fatParams });
    else out.push({ kind: 'ok', key: 'concl.fatOk', params: fatParams });

    // Kohlenhydrate nur erwähnen, wenn deutlich daneben
    if (avg.carbs < t.carbs * 0.85) {
      out.push({ kind: 'info', key: 'concl.carbsLow', params: { avg: fmt(avg.carbs), target: fmt(t.carbs) } });
    } else if (avg.carbs > t.carbs * 1.15) {
      out.push({ kind: 'info', key: 'concl.carbsHigh', params: { avg: fmt(avg.carbs), target: fmt(t.carbs) } });
    }
  }

  if (n < elapsed) out.push({ kind: 'info', key: 'concl.partial', params: { n, elapsed } });
  if (includesToday) out.push({ kind: 'info', key: 'concl.today' });
  return out;
}

// --- Wochen-Budget -------------------------------------------------------------

export interface WeekBudget {
  /** Summe der Tagesziele aller 7 Tage */
  budget: number;
  /** Verbraucht an vergangenen Tagen (nicht erfasste Tage zählen mit ihrem Ziel) */
  spentBefore: number;
  /** Heute bisher */
  today: number;
  /** Budget − vergangene Tage: was ab heute noch übrig ist */
  remainingFromToday: number;
  /** Verbleibende Tage inkl. heute (0, wenn die Woche vorbei ist) */
  daysLeft: number;
  /** Ø pro verbleibendem Tag */
  perDay: number;
  /** Was heute noch übrig ist, wenn man das Ø einhält */
  todayLeft: number;
  /** Abweichung der vergangenen Tage gegenüber ihren Zielen (+ = über Ziel) */
  driftBefore: number;
  /** Ganze Woche abgeschlossen: Summe aller Tage */
  totalSpent: number;
}

/**
 * Wochen-Budget: Die Kalorien der Woche als Topf. Tage über Ziel müssen an
 * anderen Tagen ausgeglichen werden, Tage unter Ziel geben Spielraum.
 * Nicht erfasste vergangene Tage gelten als „nach Plan gegessen“ (= Ziel),
 * damit ein vergessener Tag das Budget nicht künstlich vergrössert.
 */
export function weekBudget(days: DaySummary[], today: string): WeekBudget | undefined {
  if (days.some((d) => !d.targets)) return undefined;
  const budget = days.reduce((s, d) => s + d.targets!.kcal, 0);
  const before = days.filter((d) => d.date < today);
  const spentBefore = before.reduce((s, d) => s + (d.tracked ? d.totals.kcal : d.targets!.kcal), 0);
  const driftBefore = before.reduce((s, d) => s + (d.tracked ? d.totals.kcal - d.targets!.kcal : 0), 0);
  const todayDay = days.find((d) => d.date === today);
  const todayKcal = todayDay?.totals.kcal ?? 0;
  const daysLeft = days.filter((d) => d.date >= today).length;
  const remainingFromToday = budget - spentBefore;
  const perDay = daysLeft > 0 ? remainingFromToday / daysLeft : 0;
  const totalSpent = days.reduce((s, d) => s + (d.tracked ? d.totals.kcal : d.date <= today ? d.targets!.kcal : 0), 0);
  return {
    budget,
    spentBefore,
    today: todayKcal,
    remainingFromToday,
    daysLeft,
    perDay,
    todayLeft: perDay - todayKcal,
    driftBefore,
    totalSpent,
  };
}
