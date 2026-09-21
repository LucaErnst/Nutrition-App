import { describe, expect, it } from 'vitest';
import { evaluatePhase } from '../phase';
import type { DailyGoal, WeightEntry } from '../../db/types';
import type { DaySummary } from '../week';
import { addDays } from '../date';

const goal: DailyGoal = { id: 1, phase_name: 'Bulk', phase_type: 'bulk', start_date: '2026-08-01', training_day_kcal: 2900, rest_day_kcal: 2500, protein_g: 160, fat_min_g: 70, fat_max_g: 90 };
const TODAY = '2026-09-11'; // 42 Tage

function days(opts: { protein?: (i: number) => number; skip?: (i: number) => boolean } = {}): DaySummary[] {
  const out: DaySummary[] = [];
  for (let i = 0; i < 42; i++) {
    const date = addDays('2026-08-01', i);
    const tracked = !(opts.skip?.(i) ?? false);
    out.push({
      date,
      tracked,
      totals: tracked ? { kcal: 2750, protein: opts.protein?.(i) ?? 175, fat: 75, carbs: 300 } : { kcal: 0, protein: 0, fat: 0, carbs: 0 },
      targets: { kcal: 2700, protein: 160, fat_min: 70, fat_max: 90, carbs: 300, is_training: true, phase_name: 'Bulk' },
    });
  }
  return out;
}

/** Gewicht linear von start über 42 Tage um deltaTotal, tägliche Wägung (bis auf skip) */
function weights(start: number, deltaTotal: number, skip?: (i: number) => boolean): WeightEntry[] {
  const out: WeightEntry[] = [];
  for (let i = -7; i < 42; i++) {
    if (skip?.(i)) continue;
    const kg = start + (Math.max(0, i) / 41) * deltaTotal;
    out.push({ date: addDays('2026-08-01', i), weight_kg: Math.round(kg * 100) / 100 });
  }
  return out;
}

describe('evaluatePhase – Aufbau', () => {
  it('Tempo im Bereich (+0,17 %/Woche) → on_track, keine Anpassung', () => {
    // 80 kg, +0,8 kg in 6 Wochen ≈ +0,17 %/Woche
    const r = evaluatePhase({ goal, days: days(), weights: weights(80, 0.8), today: TODAY });
    expect(r.verdict).toBe('on_track');
    expect(r.adjustment).toBeUndefined();
    expect(r.weight.rate2wPct).toBeGreaterThan(0.1);
    expect(r.weight.rate2wPct).toBeLessThan(0.25);
    expect(r.dataOk).toBe(true);
  });

  it('zu schnell (+0,5 %/Woche) → −150 Ruhetag, −100 Trainingstag', () => {
    const r = evaluatePhase({ goal, days: days(), weights: weights(80, 2.4), today: TODAY });
    expect(r.verdict).toBe('too_fast');
    expect(r.adjustment).toEqual({ training_day_kcal: 2800, rest_day_kcal: 2350, delta_training: -100, delta_rest: -150 });
  });

  it('Stillstand → +150 Ruhetag, +100 Trainingstag', () => {
    const r = evaluatePhase({ goal, days: days(), weights: weights(80, 0), today: TODAY });
    expect(r.verdict).toBe('stalled');
    expect(r.adjustment?.delta_rest).toBe(150);
  });

  it('zu wenig erfasst (4 von 7 Tagen) → keine Kalorienänderung', () => {
    const r = evaluatePhase({ goal, days: days({ skip: (i) => i % 7 < 3 }), weights: weights(80, 2.4), today: TODAY });
    expect(r.verdict).toBe('insufficient_data');
    expect(r.adjustment).toBeUndefined();
  });

  it('zu selten gewogen (3 von 7) → keine Kalorienänderung', () => {
    const r = evaluatePhase({ goal, days: days(), weights: weights(80, 2.4, (i) => i % 7 > 2), today: TODAY });
    expect(r.verdict).toBe('insufficient_data');
  });

  it('unter 14 Tagen → too_early', () => {
    const r = evaluatePhase({ goal, days: days().slice(0, 10), weights: weights(80, 0.3), today: '2026-08-10' });
    expect(r.verdict).toBe('too_early');
  });

  it('nach einer Anpassung läuft das Fenster neu', () => {
    const g = { ...goal, adjusted_at: '2026-09-05' };
    const r = evaluatePhase({ goal: g, days: days(), weights: weights(80, 2.4), today: TODAY });
    expect(r.verdict).toBe('too_early');
    expect(r.windowStart).toBe('2026-09-05');
  });

  it('Protein: zwei Tage in Folge darunter → Warnung', () => {
    const r = evaluatePhase({ goal, days: days({ protein: (i) => (i === 20 || i === 21 ? 120 : 175) }), weights: weights(80, 0.8), today: TODAY });
    expect(r.intake.proteinTwoInARow).toBe(true);
    expect(r.messages.some((m) => m.key === 'phase.proteinWarn')).toBe(true);
  });

  it('Protein: ein einzelner Tag → nur markiert', () => {
    const r = evaluatePhase({ goal, days: days({ protein: (i) => (i === 20 ? 120 : 175) }), weights: weights(80, 0.8), today: TODAY });
    expect(r.messages.some((m) => m.key === 'phase.proteinMark')).toBe(true);
    expect(r.messages.some((m) => m.key === 'phase.proteinWarn')).toBe(false);
  });
});

describe('evaluatePhase – Defizit und Erhalt', () => {
  const cut: DailyGoal = { ...goal, phase_type: 'cut', training_day_kcal: 2300, rest_day_kcal: 2000 };
  it('Defizit im Bereich (−0,5 %/Woche)', () => {
    const r = evaluatePhase({ goal: cut, days: days(), weights: weights(80, -2.4), today: TODAY });
    expect(r.verdict).toBe('on_track');
  });
  it('Defizit zu schnell (−1 %/Woche) → +200 Ruhetag, +150 Training', () => {
    const r = evaluatePhase({ goal: cut, days: days(), weights: weights(80, -4.8), today: TODAY });
    expect(r.verdict).toBe('too_fast');
    expect(r.adjustment).toEqual({ training_day_kcal: 2450, rest_day_kcal: 2200, delta_training: 150, delta_rest: 200 });
  });
  it('Defizit zu langsam (−0,15 %/Woche) → −200 Ruhetag', () => {
    const r = evaluatePhase({ goal: cut, days: days(), weights: weights(80, -0.7), today: TODAY });
    expect(['too_slow', 'stalled']).toContain(r.verdict);
    expect(r.adjustment?.delta_rest).toBe(-200);
  });
  it('Erhalt innerhalb ±0,5 % → on_track', () => {
    const m: DailyGoal = { ...goal, phase_type: 'maintain' };
    const r = evaluatePhase({ goal: m, days: days(), weights: weights(80, 0.3), today: TODAY });
    expect(r.verdict).toBe('on_track');
  });
  it('Erhalt driftet über +0,5 % → −150 Ruhetag', () => {
    const m: DailyGoal = { ...goal, phase_type: 'maintain' };
    const r = evaluatePhase({ goal: m, days: days(), weights: weights(80, 1.0), today: TODAY });
    expect(r.verdict).toBe('too_fast');
    expect(r.adjustment?.delta_rest).toBe(-150);
  });
});
