import { describe, expect, it } from 'vitest';
import { bmrMifflin, suggestGoals, LIFESTYLE_PAL, TRAINING_PAL_PER_DAY } from '../onboarding';

describe('bmrMifflin', () => {
  it('rechnet nach Mifflin-St Jeor', () => {
    // 10*77 + 6.25*180 - 5*30 + 5 = 1750
    expect(bmrMifflin('male', 30, 180, 77)).toBe(1750);
    expect(bmrMifflin('female', 30, 165, 60)).toBe(10 * 60 + 6.25 * 165 - 150 - 161);
  });

  it('Mann und Frau unterscheiden sich bei gleichen Daten um 166 kcal', () => {
    expect(bmrMifflin('male', 30, 175, 70) - bmrMifflin('female', 30, 175, 70)).toBe(166);
  });

  it('jedes Lebensjahr senkt den Grundumsatz um 5 kcal', () => {
    expect(bmrMifflin('male', 30, 180, 80) - bmrMifflin('male', 40, 180, 80)).toBe(50);
  });
});

describe('suggestGoals', () => {
  const base = {
    sex: 'male' as const, age: 30, height_cm: 180, weight_kg: 77,
    lifestyle: 'sitting' as const, phase: 'bulk' as const, training_days: 4,
  };

  it('Erhaltungsbedarf = Grundumsatz × (Alltag + Training)', () => {
    const g = suggestGoals(base);
    const pal = LIFESTYLE_PAL.sitting + 4 * TRAINING_PAL_PER_DAY;
    expect(g.tdee).toBe(Math.round(1750 * pal));
  });

  it('Alltag zählt: Handwerker ohne Sport braucht mehr als Bürojob ohne Sport', () => {
    const office = suggestGoals({ ...base, training_days: 0 });
    const physical = suggestGoals({ ...base, training_days: 0, lifestyle: 'physical' });
    expect(physical.tdee).toBeGreaterThan(office.tdee + 500);
  });

  it('Training verteilt sich: Trainingstag 300 kcal über Ruhetag, Woche stimmt', () => {
    const g = suggestGoals(base);
    expect(g.training_day_kcal - g.rest_day_kcal).toBe(300);
    const weekly = g.training_day_kcal * 4 + g.rest_day_kcal * 3;
    expect(Math.abs(weekly - g.tdee * 7 * 1.1)).toBeLessThan(200);
  });

  it('Herleitung: Zeilen ergeben den Erhaltungsbedarf und das Ziel', () => {
    const g = suggestGoals({ ...base, phase: 'cut' });
    const s = g.steps;
    expect(Math.abs(s.bmr + s.lifestyle + s.training - s.maintenance)).toBeLessThanOrEqual(2);
    expect(Math.abs(s.maintenance + s.phase - s.target)).toBeLessThanOrEqual(2);
    expect(s.phase).toBeLessThan(0);
  });

  it('Untergrenze: kein Tagesziel unter dem Grundumsatz, über alle Kombinationen', () => {
    for (const sex of ['male', 'female'] as const)
      for (const lifestyle of ['sitting', 'mixed', 'standing', 'physical'] as const)
        for (const days of [0, 1, 3, 6, 7])
          for (const [h, w, age] of [[150, 45, 70], [165, 60, 30], [190, 110, 25]]) {
            const g = suggestGoals({ sex, age, height_cm: h, weight_kg: w, lifestyle, phase: 'cut', training_days: days });
            // Rundung auf 50 kcal darf höchstens 25 kcal kosten
            expect(g.rest_day_kcal).toBeGreaterThanOrEqual(g.bmr - 25);
          }
  });

  it('ohne Untergrenze bleibt floored false', () => {
    expect(suggestGoals(base).floored).toBe(false);
  });

  it('Protein und Fett normal am Körpergewicht', () => {
    const g = suggestGoals(base);
    expect(g.protein_g).toBe(140); // 77*1.8 = 138.6 → 140
    expect(g.fat_min_g).toBe(60);
    expect(g.fat_max_g).toBe(75);
  });

  it('Protein bei BMI über 30 am Referenzgewicht (BMI 25), nicht am vollen Gewicht', () => {
    // 180 cm, 130 kg → BMI 40; Referenz 25 × 1.8² = 81 kg
    const g = suggestGoals({ ...base, weight_kg: 130, phase: 'cut' });
    expect(g.protein_g).toBe(160); // 81*2.0 = 162 → 160
    expect(g.fat_max_g).toBe(80); // 81*1.0 → 80
    expect(g.reference_weight_kg).toBe(81);
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
    expect(g.steps.training).toBe(0);
  });

  it('Wasser mindestens 2 l, sonst ~35 ml/kg', () => {
    expect(suggestGoals({ ...base, weight_kg: 50 }).water_ml).toBe(2000);
    expect(suggestGoals(base).water_ml).toBe(2750);
  });
});
