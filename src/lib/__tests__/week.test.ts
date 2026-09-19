import { describe, expect, it } from 'vitest';
import { summarizeWeek, type DaySummary } from '../week';
import type { DayTargets } from '../goals';

const train: DayTargets = { kcal: 2700, protein: 150, fat_min: 75, fat_max: 90, carbs: 339, is_training: true, phase_name: 'A' };
const rest: DayTargets = { ...train, kcal: 2350, carbs: 252, is_training: false };

function day(date: string, kcal: number, targets: DayTargets | undefined, tracked = true): DaySummary {
  return { date, totals: { kcal, protein: 160, fat: 80, carbs: 300 }, targets, tracked };
}

describe('summarizeWeek', () => {
  it('mittelt nur über erfasste Tage und gewichtet das Ziel nach Tagestyp', () => {
    const days = [day('2026-09-14', 2700, train), day('2026-09-15', 2300, rest), day('2026-09-16', 0, train, false)];
    const w = summarizeWeek(days, '2026-09-16');
    expect(w.trackedCount).toBe(2);
    expect(w.avg.kcal).toBe(2500);
    expect(w.avgTarget?.kcal).toBe(2525);
    expect(w.totalTargetKcal).toBe(5050);
  });

  it('liefert ein Fazit in Spec-Wortlaut', () => {
    const w = summarizeWeek([day('2026-09-14', 2700, train)], '2026-09-18');
    const texts = w.conclusions.map((c) => c.text).join(' ');
    expect(texts).toContain('Protein erreicht');
    expect(texts).toContain('Kalorien im Rahmen');
    expect(texts).toContain('Fett im Bereich');
    expect(w.conclusions.some((c) => c.kind === 'ok')).toBe(true);
  });

  it('meldet fehlende Tage und einen laufenden Tag', () => {
    const w = summarizeWeek(
      [day('2026-09-14', 2700, train), day('2026-09-15', 0, rest, false), day('2026-09-16', 1000, train)],
      '2026-09-16',
    );
    const texts = w.conclusions.map((c) => c.text).join(' ');
    expect(texts).toContain('2 von 3 vergangenen Tagen erfasst');
    expect(texts).toContain('Heute ist noch nicht abgeschlossen');
  });

  it('kommt ohne Zielwerte aus', () => {
    const w = summarizeWeek([day('2026-09-14', 2000, undefined)], '2026-09-18');
    expect(w.avgTarget).toBeUndefined();
    expect(w.conclusions[0].text).toContain('Keine Phase');
  });

  it('ohne Einträge nur ein Hinweis', () => {
    expect(summarizeWeek([], '2026-09-18').conclusions).toHaveLength(1);
  });
});
