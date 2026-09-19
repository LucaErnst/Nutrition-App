import { describe, expect, it } from 'vitest';
import type { DailyGoal } from '../../db/types';
import { activeGoalFor, fatStatus, kcalStatus, targetsFor } from '../goals';

const phase: DailyGoal = {
  phase_name: 'Aufbau', start_date: '2026-09-14', training_day_kcal: 2700, rest_day_kcal: 2350,
  protein_g: 150, fat_min_g: 75, fat_max_g: 90,
};

describe('targetsFor', () => {
  it('leitet Kohlenhydrate aus dem Kalorienrest ab (Fett-Mittelwert)', () => {
    const t = targetsFor(phase, true);
    // (2700 - 150*4 - 82.5*9) / 4 = 339.4
    expect(t.carbs).toBeCloseTo(339.4, 1);
    expect(targetsFor(phase, false).kcal).toBe(2350);
  });

  it('wird nie negativ', () => {
    expect(targetsFor({ ...phase, rest_day_kcal: 800 }, false).carbs).toBe(0);
  });
});

describe('activeGoalFor', () => {
  const older: DailyGoal = { ...phase, phase_name: 'Defizit', start_date: '2026-06-01', end_date: '2026-09-13' };
  it('wählt die Phase, in deren Zeitraum das Datum liegt', () => {
    expect(activeGoalFor([older, phase], '2026-09-01')?.phase_name).toBe('Defizit');
    expect(activeGoalFor([older, phase], '2026-09-14')?.phase_name).toBe('Aufbau');
    expect(activeGoalFor([older], '2026-09-20')).toBeUndefined();
  });
  it('bevorzugt bei Überlappung die später beginnende Phase', () => {
    const overlap = { ...older, end_date: undefined };
    expect(activeGoalFor([overlap, phase], '2026-09-20')?.phase_name).toBe('Aufbau');
  });
});

describe('status', () => {
  it('bewertet Kalorien mit ±10 % Toleranz', () => {
    expect(kcalStatus(2500, 2700)).toBe('ok');
    expect(kcalStatus(2400, 2700)).toBe('under');
    expect(kcalStatus(3000, 2700)).toBe('over');
  });
  it('bewertet Fett gegen den Bereich', () => {
    expect(fatStatus(80, 75, 90)).toBe('ok');
    expect(fatStatus(70, 75, 90)).toBe('under');
    expect(fatStatus(95, 75, 90)).toBe('over');
  });
});
