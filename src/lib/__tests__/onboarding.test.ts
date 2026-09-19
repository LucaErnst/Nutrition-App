import { describe, expect, it } from 'vitest';
import { bmrMifflin, suggestGoals } from '../onboarding';

describe('bmrMifflin', () => {
  it('rechnet nach Mifflin-St Jeor', () => {
    // 10*77 + 6.25*180 - 5*30 + 5 = 1750
    expect(bmrMifflin('male', 30, 180, 77)).toBe(1750);
    expect(bmrMifflin('female', 30, 165, 60)).toBe(10 * 60 + 6.25 * 165 - 150 - 161);
  });
});

describe('suggestGoals', () => {
  const base = { sex: 'male' as const, age: 30, height_cm: 180, weight_kg: 77, activity: 'high' as const, phase: 'bulk' as const, training_days: 4 };

  it('liefert plausible Werte für einen Athleten im Aufbau', () => {
    const g = suggestGoals(base);
    expect(g.tdee).toBe(Math.round(1750 * 1.65)); // 2888
    expect(g.training_day_kcal).toBeGreaterThan(g.rest_day_kcal);
    expect(g.training_day_kcal - g.rest_day_kcal).toBe(300);
    // Wochensumme ≈ TDEE*7*1.1 (Rundung auf 50)
    const weekly = g.training_day_kcal * 4 + g.rest_day_kcal * 3;
    expect(Math.abs(weekly - 2888 * 7 * 1.1)).toBeLessThan(200);
    expect(g.protein_g).toBe(140); // 77*1.8 = 138.6 → 140
    expect(g.fat_min_g).toBe(60);
    expect(g.fat_max_g).toBe(75);
    expect(g.water_ml).toBe(2750); // 77*35 = 2695 → 2750
  });

  it('Defizit senkt Kalorien und erhöht Protein', () => {
    const cut = suggestGoals({ ...base, phase: 'cut' });
    const bulk = suggestGoals(base);
    expect(cut.rest_day_kcal).toBeLessThan(bulk.rest_day_kcal);
    expect(cut.protein_g).toBe(155); // 77*2 = 154 → 155
  });

  it('ohne Trainingstage sind beide Werte gleich', () => {
    const g = suggestGoals({ ...base, training_days: 0 });
    expect(g.training_day_kcal).toBe(g.rest_day_kcal);
  });

  it('Wasser mindestens 2 l', () => {
    expect(suggestGoals({ ...base, weight_kg: 50 }).water_ml).toBe(2000);
  });
});
