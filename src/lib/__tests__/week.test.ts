import { describe, expect, it } from 'vitest';
import { summarizeWeek, weekBudget, type DaySummary } from '../week';
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

describe('weekBudget', () => {
  const week = (today: string) => {
    const dates = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18', '2026-09-19', '2026-09-20'];
    // Mo–Do erfasst: 2900, 2700, (nicht erfasst), 2500; Fr = heute 800
    const kcal: Record<string, number | null> = { '2026-09-14': 2900, '2026-09-15': 2700, '2026-09-16': null, '2026-09-17': 2500, '2026-09-18': 800 };
    return { days: dates.map((d) => day(d, kcal[d] ?? 0, train, kcal[d] != null && d <= today)), today };
  };

  it('rechnet Budget, Verbrauch und Rest pro Tag', () => {
    const { days, today } = week('2026-09-18');
    const b = weekBudget(days, today)!;
    expect(b.budget).toBe(7 * 2700);
    // Mo 2900 + Di 2700 + Mi (nicht erfasst → Ziel 2700) + Do 2500 = 10800
    expect(b.spentBefore).toBe(10800);
    expect(b.driftBefore).toBe(200 + 0 - 200); // +200, 0, −200
    expect(b.daysLeft).toBe(3); // Fr, Sa, So
    expect(b.remainingFromToday).toBe(18900 - 10800);
    expect(b.perDay).toBe(2700);
    expect(b.todayLeft).toBe(1900);
  });

  it('liefert undefined ohne Zielwerte', () => {
    const days = [day('2026-09-14', 2000, undefined)];
    expect(weekBudget(days, '2026-09-14')).toBeUndefined();
  });

  it('abgeschlossene Woche: keine Resttage', () => {
    const { days } = week('2026-09-18');
    const b = weekBudget(days, '2026-09-27')!;
    expect(b.daysLeft).toBe(0);
    expect(b.perDay).toBe(0);
  });
});
