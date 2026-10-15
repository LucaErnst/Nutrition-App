/**
 * Schritte aus Apple Health (1.2) – nur zur Erklärung, nie zur Steuerung: Sie ändern keine
 * Kalorien- oder Makroziele (docs/RELEASE-1.2.md A3).
 *
 * Wozu dann? Im Defizit sinkt die Alltagsbewegung oft unbemerkt, und der Gewichtstrend stockt.
 * Ein Satz im Wochenfazit nimmt die Panik raus, bevor jemand die Kalorien weiter drückt.
 */
import type { PhaseType } from '../db/types';
import type { Conclusion } from './week';

/** Tage ohne Health-Daten fehlen in der Map – sie zählen nicht als 0. */
export function stepsAverage(steps: Map<string, number>, dates: string[]): { avg: number; days: number } {
  const values = dates.map((d) => steps.get(d)).filter((v): v is number => v !== undefined && v > 0);
  if (values.length === 0) return { avg: 0, days: 0 };
  return { avg: values.reduce((s, v) => s + v, 0) / values.length, days: values.length };
}

/** Ab wie viel weniger Schritten der Hinweis kommt (Anteil). */
export const STEPS_DROP_LIMIT = -0.2;
/** Gewichtstrend gilt als stockend, wenn er sich in 14 Tagen um weniger als so viel bewegt (kg). */
export const WEIGHT_STALL_KG = 0.2;

export interface StepsInput {
  week: { avg: number; days: number };
  /** Die vier Wochen davor */
  before: { avg: number; days: number };
  /** Veränderung des 7-Tage-Trends über 14 Tage (kg), undefined ohne genug Daten */
  trendChange14?: number;
  phase?: PhaseType;
}

/** Fazit-Zeilen zu den Schritten: Wochenschnitt und – wenn es passt – der Hinweis auf den Rückgang. */
export function stepsConclusions(s: StepsInput, fmtSteps: (n: number) => string): Conclusion[] {
  const out: Conclusion[] = [];
  if (s.week.days === 0) return out;
  out.push({ kind: 'info', key: 'concl.stepsAvg', params: { n: fmtSteps(Math.round(s.week.avg / 10) * 10) } });

  // Genug Daten: mindestens 4 Tage diese Woche und 14 Tage in den vier Wochen davor
  if (s.week.days < 4 || s.before.days < 14 || s.before.avg <= 0) return out;
  const drop = s.week.avg / s.before.avg - 1;
  const stalled = s.trendChange14 !== undefined && Math.abs(s.trendChange14) < WEIGHT_STALL_KG;
  const goalPhase = s.phase === 'cut' || s.phase === 'bulk';
  if (drop <= STEPS_DROP_LIMIT && stalled && goalPhase) {
    out.push({ kind: 'warn', key: 'concl.stepsDrop', params: { pct: Math.round(-drop * 100) } });
  }
  return out;
}
