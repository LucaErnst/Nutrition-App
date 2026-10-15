import { describe, expect, it } from 'vitest';
import { stepsAverage, stepsConclusions } from '../steps';

const fmt = (n: number) => String(n);

describe('stepsAverage', () => {
  it('Tage ohne Daten zählen nicht als 0', () => {
    const m = new Map([
      ['2026-10-01', 8000],
      ['2026-10-02', 6000],
    ]);
    expect(stepsAverage(m, ['2026-10-01', '2026-10-02', '2026-10-03'])).toEqual({ avg: 7000, days: 2 });
  });

  it('ohne Daten: 0 Tage', () => {
    expect(stepsAverage(new Map(), ['2026-10-01'])).toEqual({ avg: 0, days: 0 });
  });
});

describe('stepsConclusions', () => {
  const base = {
    week: { avg: 6000, days: 7 },
    before: { avg: 8000, days: 28 },
    trendChange14: -0.05,
    phase: 'cut' as const,
  };

  it('Rückgang −25 %, Trend stockt, Defizit → Hinweis', () => {
    const c = stepsConclusions(base, fmt);
    expect(c.map((x) => x.key)).toEqual(['concl.stepsAvg', 'concl.stepsDrop']);
    expect(c[1].params).toEqual({ pct: 25 });
  });

  it('Gewicht fällt noch → kein Hinweis, nur Schnitt', () => {
    expect(stepsConclusions({ ...base, trendChange14: -0.6 }, fmt).map((x) => x.key)).toEqual(['concl.stepsAvg']);
  });

  it('Rückgang unter 20 % → kein Hinweis', () => {
    expect(stepsConclusions({ ...base, week: { avg: 7000, days: 7 } }, fmt).map((x) => x.key)).toEqual(['concl.stepsAvg']);
  });

  it('Erhaltungsphase → kein Hinweis', () => {
    expect(stepsConclusions({ ...base, phase: 'maintain' }, fmt).map((x) => x.key)).toEqual(['concl.stepsAvg']);
  });

  it('zu wenig Daten → kein Hinweis', () => {
    expect(stepsConclusions({ ...base, week: { avg: 6000, days: 3 } }, fmt)).toHaveLength(1);
    expect(stepsConclusions({ ...base, before: { avg: 8000, days: 10 } }, fmt)).toHaveLength(1);
    expect(stepsConclusions({ ...base, trendChange14: undefined }, fmt)).toHaveLength(1);
  });

  it('keine Schritte diese Woche → gar nichts', () => {
    expect(stepsConclusions({ ...base, week: { avg: 0, days: 0 } }, fmt)).toEqual([]);
  });

  it('Schnitt auf 10 gerundet', () => {
    expect(stepsConclusions({ ...base, week: { avg: 7423, days: 2 } }, fmt)[0].params).toEqual({ n: '7420' });
  });
});
