import type { WeightEntry } from '../db/types';
import { addDays } from './date';

export interface WeightPoint {
  date: string;
  weight: number;
  /** Gleitender 7-Tage-Durchschnitt (über die Einträge der letzten 7 Tage) */
  trend: number;
  source?: WeightEntry['source'];
}

/**
 * Trend = Durchschnitt aller Einträge im Fenster [date − 6, date].
 * Zeitfenster statt "letzte N Einträge", damit Lücken das Ergebnis nicht verzerren.
 */
export function withTrend(entries: WeightEntry[], windowDays = 7): WeightPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((e) => {
    const from = addDays(e.date, -(windowDays - 1));
    const inWindow = sorted.filter((x) => x.date >= from && x.date <= e.date);
    const trend = inWindow.reduce((s, x) => s + x.weight_kg, 0) / inWindow.length;
    return { date: e.date, weight: e.weight_kg, trend, source: e.source };
  });
}

/** Veränderung des Trends über die letzten `days` Tage (kg), falls genug Daten. */
export function trendChange(points: WeightPoint[], days: number): number | undefined {
  if (points.length < 2) return undefined;
  const last = points[points.length - 1];
  const cutoff = addDays(last.date, -days);
  const earlier = [...points].reverse().find((p) => p.date <= cutoff);
  if (!earlier) return undefined;
  return last.trend - earlier.trend;
}
