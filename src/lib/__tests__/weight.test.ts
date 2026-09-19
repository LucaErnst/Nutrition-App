import { describe, expect, it } from 'vitest';
import { trendChange, withTrend } from '../weight';

const entries = [
  { date: '2026-09-01', weight_kg: 76 },
  { date: '2026-09-02', weight_kg: 77 },
  { date: '2026-09-03', weight_kg: 75 },
  { date: '2026-09-10', weight_kg: 78 },
];

describe('withTrend', () => {
  it('bildet den Schnitt über ein 7-Tage-Fenster', () => {
    const p = withTrend(entries);
    expect(p[0].trend).toBe(76);
    expect(p[1].trend).toBe(76.5);
    expect(p[2].trend).toBe(76);
    // 10.9.: keine Einträge im Fenster 4.–10.9. ausser sich selbst
    expect(p[3].trend).toBe(78);
  });

  it('sortiert nach Datum', () => {
    const p = withTrend([...entries].reverse());
    expect(p.map((x) => x.date)).toEqual(entries.map((e) => e.date));
  });
});

describe('trendChange', () => {
  it('vergleicht mit dem letzten Punkt vor dem Zeitraum', () => {
    const p = withTrend(entries);
    expect(trendChange(p, 7)).toBe(78 - 76); // 10.9. vs. 3.9.
    expect(trendChange(p, 30)).toBeUndefined();
  });
});
