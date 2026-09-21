/**
 * Phasen-Auswertung: beantwortet nach Lucas Coaching-Regeln (docs/COACHING-RULES.md) die Frage
 * „Hat die Phase funktioniert, und was ändern wir?“. Reine Rechnung ohne Datenbank – testbar.
 *
 * Kern: Nicht auf Tageswerte reagieren, sondern auf den 7-Tage-Trend über die letzten zwei Wochen,
 * und nur bei ausreichender Datentreue (Kalorien ≥ 6/7 Tage, Gewicht ≥ 5/7 Tage). Dann eine kleine
 * Anpassung (100–250 kcal), zuerst an Ruhetagen, und wieder 14 Tage beobachten.
 */
import type { DailyGoal, PhaseType, WeightEntry } from '../db/types';
import { addDays } from './date';
import type { DaySummary } from './week';
import { withTrend, type WeightPoint } from './weight';
import type { MessageKey } from '../i18n/en';

export const OBSERVE_DAYS = 14;

/** Zielbereiche in % Körpergewicht pro Woche (Trend) */
export const RATE_RULES: Record<PhaseType, { min: number; max: number; tooFast: number; tooSlow: number }> = {
  bulk: { min: 0.1, max: 0.25, tooFast: 0.3, tooSlow: 0.1 },
  cut: { min: -0.7, max: -0.4, tooFast: -0.8, tooSlow: -0.25 },
  maintain: { min: -0.5, max: 0.5, tooFast: 0.5, tooSlow: -0.5 }, // Band um das Startgewicht
};

export interface PhaseWeek {
  start: string;
  trackedDays: number;
  avgKcal?: number;
  avgTargetKcal?: number;
  avgProtein?: number;
  /** Trend am Ende der Woche (letzter Punkt bis dahin) */
  trendKg?: number;
  weighDays: number;
}

export type VerdictKind = 'too_early' | 'insufficient_data' | 'on_track' | 'too_fast' | 'too_slow' | 'stalled' | 'no_weight';

export interface Adjustment {
  training_day_kcal: number;
  rest_day_kcal: number;
  /** Änderung in kcal (negativ = weniger) */
  delta_training: number;
  delta_rest: number;
}

export interface PhaseMessage {
  kind: 'ok' | 'warn' | 'info';
  key: MessageKey;
  params?: Record<string, string | number>;
}

export interface PhaseReport {
  type: PhaseType;
  start: string;
  end: string;
  /** Beginn des Beobachtungsfensters (Phasenstart oder letzte Anpassung) */
  windowStart: string;
  elapsedDays: number;
  elapsedWeeks: number;
  intake: {
    trackedDays: number;
    trackedRatio: number;
    avgKcal?: number;
    avgTargetKcal?: number;
    avgProtein?: number;
    avgProteinTarget?: number;
    avgFat?: number;
    avgCarbs?: number;
    proteinBelowDays: number;
    proteinTwoInARow: boolean;
    proteinThreeOfSeven: boolean;
  };
  weight: {
    weighDays: number;
    weighRatio: number;
    startTrend?: number;
    currentTrend?: number;
    deltaKg?: number;
    /** % Körpergewicht pro Woche über die ganze Phase */
    ratePct?: number;
    /** % Körpergewicht pro Woche über die letzten 14 Tage */
    rate2wPct?: number;
  };
  weeks: PhaseWeek[];
  dataOk: boolean;
  verdict: VerdictKind;
  adjustment?: Adjustment;
  messages: PhaseMessage[];
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 864e5);
}

function trendAt(points: WeightPoint[], date: string): number | undefined {
  let best: WeightPoint | undefined;
  for (const p of points) if (p.date <= date) best = p;
  return best?.trend;
}

function avg(nums: number[]): number | undefined {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : undefined;
}

function r1(n: number): number {
  return Math.round(n * 10) / 10;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface EvaluateInput {
  goal: DailyGoal;
  /** Tage der Phase bis heute (inkl.), lückenlos */
  days: DaySummary[];
  /** Alle Gewichte (auch vor der Phase, für den Trend am Start) */
  weights: WeightEntry[];
  today: string;
}

export function evaluatePhase({ goal, days, weights, today }: EvaluateInput): PhaseReport {
  const type: PhaseType = goal.phase_type ?? 'bulk';
  const start = goal.start_date;
  const end = goal.end_date && goal.end_date < today ? goal.end_date : today;
  const windowStart = goal.adjusted_at && goal.adjusted_at > start ? goal.adjusted_at : start;
  const elapsedDays = Math.max(0, daysBetween(start, end) + 1);
  const elapsedWeeks = elapsedDays / 7;
  const phaseDays = days.filter((d) => d.date >= start && d.date <= end);
  const tracked = phaseDays.filter((d) => d.tracked);
  const points = withTrend(weights);
  const phasePoints = points.filter((p) => p.date >= start && p.date <= end);

  // --- Einnahme
  const withT = tracked.filter((d) => d.targets);
  const proteinBelow = withT.filter((d) => d.totals.protein < d.targets!.protein);
  let twoInARow = false;
  for (let i = 1; i < withT.length; i++) {
    if (daysBetween(withT[i - 1].date, withT[i].date) === 1 && withT[i - 1].totals.protein < withT[i - 1].targets!.protein && withT[i].totals.protein < withT[i].targets!.protein) twoInARow = true;
  }
  let threeOfSeven = false;
  for (let i = 0; i < phaseDays.length; i++) {
    const win = phaseDays.slice(i, i + 7).filter((d) => d.tracked && d.targets);
    if (win.filter((d) => d.totals.protein < d.targets!.protein).length >= 3) threeOfSeven = true;
  }
  const intake: PhaseReport['intake'] = {
    trackedDays: tracked.length,
    trackedRatio: elapsedDays ? tracked.length / elapsedDays : 0,
    avgKcal: avg(tracked.map((d) => d.totals.kcal)),
    avgTargetKcal: avg(withT.map((d) => d.targets!.kcal)),
    avgProtein: avg(tracked.map((d) => d.totals.protein)),
    avgProteinTarget: avg(withT.map((d) => d.targets!.protein)),
    avgFat: avg(tracked.map((d) => d.totals.fat)),
    avgCarbs: avg(tracked.map((d) => d.totals.carbs)),
    proteinBelowDays: proteinBelow.length,
    proteinTwoInARow: twoInARow,
    proteinThreeOfSeven: threeOfSeven,
  };

  // --- Gewicht
  const startTrend = trendAt(points, start) ?? phasePoints[0]?.trend;
  const currentTrend = trendAt(points, end);
  const deltaKg = startTrend !== undefined && currentTrend !== undefined ? currentTrend - startTrend : undefined;
  const ratePct = deltaKg !== undefined && startTrend && elapsedWeeks >= 1 ? (deltaKg / elapsedWeeks / startTrend) * 100 : undefined;
  const twoWeeksAgo = addDays(end, -OBSERVE_DAYS);
  const trendBefore = twoWeeksAgo >= windowStart ? trendAt(points, twoWeeksAgo) : undefined;
  const rate2wPct = trendBefore && currentTrend !== undefined && trendBefore > 0 ? ((currentTrend - trendBefore) / 2 / trendBefore) * 100 : undefined;
  const weight: PhaseReport['weight'] = {
    weighDays: phasePoints.length,
    weighRatio: elapsedDays ? phasePoints.length / elapsedDays : 0,
    startTrend,
    currentTrend,
    deltaKg,
    ratePct,
    rate2wPct,
  };

  // --- Wochen
  const weeks: PhaseWeek[] = [];
  for (let ws = start; ws <= end; ws = addDays(ws, 7)) {
    const we = addDays(ws, 6);
    const wd = phaseDays.filter((d) => d.date >= ws && d.date <= we);
    const wt = wd.filter((d) => d.tracked);
    weeks.push({
      start: ws,
      trackedDays: wt.length,
      avgKcal: avg(wt.map((d) => d.totals.kcal)),
      avgTargetKcal: avg(wt.filter((d) => d.targets).map((d) => d.targets!.kcal)),
      avgProtein: avg(wt.map((d) => d.totals.protein)),
      trendKg: trendAt(points, we > end ? end : we),
      weighDays: phasePoints.filter((p) => p.date >= ws && p.date <= we).length,
    });
  }

  // --- Datenlage über das Beobachtungsfenster (letzte 14 Tage bzw. seit Anpassung)
  const obsStart = twoWeeksAgo > windowStart ? twoWeeksAgo : windowStart;
  const obsDays = Math.max(1, daysBetween(obsStart, end) + 1);
  const obsTracked = tracked.filter((d) => d.date >= obsStart).length / obsDays;
  const obsWeigh = phasePoints.filter((p) => p.date >= obsStart).length / obsDays;
  const dataOk = obsTracked >= 6 / 7 - 1e-9 && obsWeigh >= 5 / 7 - 1e-9;

  // --- Urteil
  const messages: PhaseMessage[] = [];
  const rules = RATE_RULES[type];
  let verdict: VerdictKind;
  let adjustment: Adjustment | undefined;
  const sinceWindow = daysBetween(windowStart, end) + 1;

  if (sinceWindow < OBSERVE_DAYS) {
    verdict = 'too_early';
    messages.push({ kind: 'info', key: 'phase.tooEarly', params: { days: OBSERVE_DAYS - sinceWindow } });
  } else if (currentTrend === undefined || rate2wPct === undefined) {
    verdict = 'no_weight';
    messages.push({ kind: 'warn', key: 'phase.noWeight' });
  } else if (!dataOk) {
    verdict = 'insufficient_data';
    messages.push({
      kind: 'warn',
      key: 'phase.dataLow',
      params: { kcal: Math.round(obsTracked * 100), weigh: Math.round(obsWeigh * 100) },
    });
  } else {
    const rate = rate2wPct;
    const kgPerWeek = (rate / 100) * currentTrend;
    const p = { rate: r2(rate), kg: r2(Math.abs(kgPerWeek)), min: rules.min, max: rules.max };
    if (type === 'maintain') {
      // Band ±0,5 % um das Startgewicht
      const dev = startTrend ? ((currentTrend - startTrend) / startTrend) * 100 : 0;
      if (Math.abs(dev) <= 0.5) {
        verdict = 'on_track';
        messages.push({ kind: 'ok', key: 'phase.maintainOk', params: { dev: r1(dev), kg: r1(currentTrend) } });
      } else {
        verdict = dev > 0 ? 'too_fast' : 'too_slow';
        adjustment = adjust(goal, dev > 0 ? -1 : 1, 100, 150);
        messages.push({ kind: 'warn', key: dev > 0 ? 'phase.maintainUp' : 'phase.maintainDown', params: { dev: r1(Math.abs(dev)), kcal: 150 } });
      }
    } else if (type === 'bulk') {
      if (rate > rules.tooFast) {
        verdict = 'too_fast';
        adjustment = adjust(goal, -1, 100, 150);
        messages.push({ kind: 'warn', key: 'phase.bulkFast', params: p });
      } else if (rate < rules.tooSlow) {
        verdict = Math.abs(rate) < 0.1 ? 'stalled' : 'too_slow';
        adjustment = adjust(goal, 1, 100, 150);
        messages.push({ kind: 'warn', key: 'phase.bulkSlow', params: p });
      } else if (rate > rules.max) {
        // Grauzone 0,25–0,3 %: noch keine Änderung, aber im Blick behalten
        verdict = 'on_track';
        messages.push({ kind: 'info', key: 'phase.bulkEdge', params: p });
      } else {
        verdict = 'on_track';
        messages.push({ kind: 'ok', key: 'phase.bulkOk', params: p });
      }
    } else {
      if (rate < rules.tooFast) {
        verdict = 'too_fast';
        adjustment = adjust(goal, 1, 150, 200);
        messages.push({ kind: 'warn', key: 'phase.cutFast', params: p });
      } else if (rate > rules.tooSlow) {
        verdict = Math.abs(rate) < 0.1 ? 'stalled' : 'too_slow';
        adjustment = adjust(goal, -1, 150, 200);
        messages.push({ kind: 'warn', key: 'phase.cutSlow', params: p });
      } else if (rate < rules.min) {
        verdict = 'on_track';
        messages.push({ kind: 'info', key: 'phase.cutEdge', params: p });
      } else {
        verdict = 'on_track';
        messages.push({ kind: 'ok', key: 'phase.cutOk', params: p });
      }
    }
  }

  // Protein immer bewerten, sobald es Daten gibt
  if (withT.length > 0) {
    if (intake.proteinTwoInARow || intake.proteinThreeOfSeven) {
      messages.push({ kind: 'warn', key: 'phase.proteinWarn', params: { n: intake.proteinBelowDays, total: withT.length, target: Math.round(intake.avgProteinTarget ?? 0) } });
    } else if (intake.proteinBelowDays > 0) {
      messages.push({ kind: 'info', key: 'phase.proteinMark', params: { n: intake.proteinBelowDays } });
    } else {
      messages.push({ kind: 'ok', key: 'phase.proteinOk', params: { avg: Math.round(intake.avgProtein ?? 0) } });
    }
  }

  // Zufuhr gegen Ziel (nur Information, die Entscheidung läuft über den Trend)
  if (intake.avgKcal !== undefined && intake.avgTargetKcal) {
    const diff = intake.avgKcal - intake.avgTargetKcal;
    messages.push({ kind: Math.abs(diff) <= intake.avgTargetKcal * 0.05 ? 'ok' : 'info', key: 'phase.intake', params: { avg: Math.round(intake.avgKcal), target: Math.round(intake.avgTargetKcal), diff: `${diff >= 0 ? '+' : '−'}${Math.round(Math.abs(diff))}` } });
  }

  return { type, start, end, windowStart, elapsedDays, elapsedWeeks: r1(elapsedWeeks), intake, weight, weeks, dataOk, verdict, adjustment, messages };
}

/**
 * Kleine Anpassung: Ruhetage tragen die grössere Änderung, Trainingstage die kleinere
 * (Trainings-Kohlenhydrate schützen). Richtung: −1 weniger, +1 mehr.
 */
function adjust(goal: DailyGoal, dir: 1 | -1, small: number, big: number): Adjustment {
  const delta_rest = dir * big;
  const delta_training = dir * small;
  return {
    training_day_kcal: goal.training_day_kcal + delta_training,
    rest_day_kcal: goal.rest_day_kcal + delta_rest,
    delta_training,
    delta_rest,
  };
}
