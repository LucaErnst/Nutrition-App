/**
 * CSV-Export für die eigene Auswertung (Excel, Numbers, Google Sheets) oder für den Coach.
 * Drei Dateien: Tage (Summen + Ziele + Wasser + Gewicht), Einträge (jede Zeile ein Posten), Gewicht.
 * Trennzeichen ist ';' mit UTF-8-BOM, damit Excel im DACH-Raum die Datei direkt richtig öffnet.
 */
import { db } from '../db/db';
import { getLanguage, mealLabel } from '../i18n';
import { addDays, todayISO } from './date';
import { activeGoalFor, targetsFor } from './goals';
import { macrosFor, resolveSource } from './nutrition';
import { withTrend } from './weight';
import { shareFile } from './native';

const SEP = ';';

function cell(v: unknown): string {
  if (v === undefined || v === null) return '';
  const s = typeof v === 'number' ? String(Math.round(v * 10) / 10) : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function csv(rows: unknown[][]): string {
  return '﻿' + rows.map((r) => r.map(cell).join(SEP)).join('\r\n') + '\r\n';
}

function weekdayOf(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

const H = {
  en: {
    days: ['Date', 'Day type', 'kcal', 'Protein g', 'Fat g', 'Carbs g', 'Target kcal', 'Target protein g', 'Target fat min g', 'Target fat max g', 'Water ml', 'Weight kg', 'Trend kg', 'Phase', 'Entries'],
    entries: ['Date', 'Meal', 'Food', 'Brand', 'Amount', 'Unit', 'kcal', 'Protein g', 'Fat g', 'Carbs g'],
    weights: ['Date', 'Weight kg', 'Trend 7d kg', 'Source'],
    training: 'Training',
    rest: 'Rest',
  },
  de: {
    days: ['Datum', 'Tagestyp', 'kcal', 'Protein g', 'Fett g', 'KH g', 'Ziel kcal', 'Ziel Protein g', 'Ziel Fett min g', 'Ziel Fett max g', 'Wasser ml', 'Gewicht kg', 'Trend kg', 'Phase', 'Posten'],
    entries: ['Datum', 'Mahlzeit', 'Lebensmittel', 'Marke', 'Menge', 'Einheit', 'kcal', 'Protein g', 'Fett g', 'KH g'],
    weights: ['Datum', 'Gewicht kg', 'Trend 7T kg', 'Quelle'],
    training: 'Training',
    rest: 'Ruhetag',
  },
};

export interface CsvFiles {
  days: string;
  entries: string;
  weights: string;
  from: string;
  to: string;
}

/** Baut die drei CSV-Inhalte für den Zeitraum (Standard: alles). */
export async function buildCsv(from?: string, to?: string): Promise<CsvFiles> {
  const lang = getLanguage();
  const h = H[lang];
  const [entries, goals, settings, overrides, water, weights, foods] = await Promise.all([
    db.mealEntries.orderBy('date').toArray(),
    db.goals.toArray(),
    db.settings.get(1),
    db.days.toArray(),
    db.water.toArray(),
    db.weights.orderBy('date').toArray(),
    db.foodItems.toArray(),
  ]);
  const first = [entries[0]?.date, weights[0]?.date].filter((d): d is string => !!d).sort()[0] ?? todayISO();
  const start = from ?? first;
  const end = to ?? todayISO();
  const foodById = new Map(foods.map((f) => [f.id!, f]));
  const overrideByDate = new Map(overrides.map((o) => [o.date, o.is_training]));
  const trainingWeekdays = settings?.training_weekdays ?? [1, 2, 4, 5];
  const waterByDate = new Map<string, number>();
  for (const w of water) waterByDate.set(w.date, (waterByDate.get(w.date) ?? 0) + w.ml);
  const trend = withTrend(weights);
  const trendByDate = new Map(trend.map((p) => [p.date, p]));

  // Einträge
  const entryRows: unknown[][] = [h.entries];
  const totalsByDate = new Map<string, { kcal: number; protein: number; fat: number; carbs: number; n: number }>();
  for (const e of entries) {
    if (e.date < start || e.date > end) continue;
    const src = resolveSource(e, foodById.get(e.food_item_id));
    if (!src) continue;
    const m = macrosFor(src, e.amount, e.unit);
    entryRows.push([e.date, mealLabel(e.meal_type), src.name, src.brand ?? '', e.amount, e.unit, m.kcal, m.protein, m.fat, m.carbs]);
    const t = totalsByDate.get(e.date) ?? { kcal: 0, protein: 0, fat: 0, carbs: 0, n: 0 };
    t.kcal += m.kcal;
    t.protein += m.protein;
    t.fat += m.fat;
    t.carbs += m.carbs;
    t.n++;
    totalsByDate.set(e.date, t);
  }

  // Tage (lückenlos)
  const dayRows: unknown[][] = [h.days];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const tot = totalsByDate.get(d);
    const goal = activeGoalFor(goals, d);
    const isTraining = overrideByDate.get(d) ?? trainingWeekdays.includes(weekdayOf(d));
    const tg = goal ? targetsFor(goal, isTraining) : undefined;
    const tp = trendByDate.get(d);
    dayRows.push([
      d,
      isTraining ? h.training : h.rest,
      tot?.kcal,
      tot?.protein,
      tot?.fat,
      tot?.carbs,
      tg?.kcal,
      tg?.protein,
      tg?.fat_min,
      tg?.fat_max,
      waterByDate.get(d),
      tp?.weight,
      tp?.trend,
      goal?.phase_name ?? '',
      tot?.n ?? 0,
    ]);
  }

  // Gewicht
  const weightRows: unknown[][] = [h.weights];
  for (const p of trend) {
    if (p.date < start || p.date > end) continue;
    weightRows.push([p.date, p.weight, p.trend, p.source === 'health' ? 'Health' : 'App']);
  }

  return { days: csv(dayRows), entries: csv(entryRows), weights: csv(weightRows), from: start, to: end };
}

/** Exportiert eine der drei Tabellen über das Teilen-Blatt / als Download. */
export async function exportCsv(kind: 'days' | 'entries' | 'weights'): Promise<'shared' | 'downloaded'> {
  const files = await buildCsv();
  const name = `serious-nutrition-${kind}-${files.from}_${files.to}.csv`;
  return shareFile(new File([files[kind]], name, { type: 'text/csv' }));
}
