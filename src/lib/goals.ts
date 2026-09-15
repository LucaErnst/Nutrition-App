import type { DailyGoal, Macros } from '../db/types';

/** Zielwerte für einen konkreten Tag, abgeleitet aus Phase + Trainingstag. */
export interface DayTargets {
  kcal: number;
  protein: number;
  fat_min: number;
  fat_max: number;
  /** Rest der Kalorien nach Protein und Fett (Fett-Mittelwert), in g */
  carbs: number;
  is_training: boolean;
  phase_name: string;
}

export function activeGoalFor(goals: DailyGoal[], date: string): DailyGoal | undefined {
  return goals
    .filter((g) => g.start_date <= date && (!g.end_date || date <= g.end_date))
    .sort((a, b) => b.start_date.localeCompare(a.start_date))[0];
}

export function targetsFor(goal: DailyGoal, isTraining: boolean): DayTargets {
  const kcal = isTraining ? goal.training_day_kcal : goal.rest_day_kcal;
  const fatMid = (goal.fat_min_g + goal.fat_max_g) / 2;
  const carbs = Math.max(0, (kcal - goal.protein_g * 4 - fatMid * 9) / 4);
  return {
    kcal,
    protein: goal.protein_g,
    fat_min: goal.fat_min_g,
    fat_max: goal.fat_max_g,
    carbs,
    is_training: isTraining,
    phase_name: goal.phase_name,
  };
}

export type Status = 'under' | 'ok' | 'over';

/** Grobe Einordnung eines Tageswerts gegen das Ziel (für Farben und Fazit). */
export function kcalStatus(actual: number, target: number): Status {
  const diff = actual / target;
  if (diff < 0.9) return 'under';
  if (diff > 1.1) return 'over';
  return 'ok';
}

export function proteinStatus(actual: number, target: number): Status {
  return actual >= target ? 'ok' : 'under';
}

export function fatStatus(actual: number, min: number, max: number): Status {
  if (actual < min) return 'under';
  if (actual > max) return 'over';
  return 'ok';
}

export function statusFor(totals: Macros, t: DayTargets) {
  return {
    kcal: kcalStatus(totals.kcal, t.kcal),
    protein: proteinStatus(totals.protein, t.protein),
    fat: fatStatus(totals.fat, t.fat_min, t.fat_max),
  };
}
