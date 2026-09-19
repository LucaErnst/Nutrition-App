import { describe, expect, it } from 'vitest';
import { addDays, weekDates, weekStartOf } from '../date';

describe('date helpers', () => {
  it('findet den Montag der Woche', () => {
    expect(weekStartOf('2026-09-15')).toBe('2026-09-14'); // Dienstag
    expect(weekStartOf('2026-09-13')).toBe('2026-09-07'); // Sonntag
    expect(weekStartOf('2026-09-14')).toBe('2026-09-14'); // Montag
  });
  it('geht über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('liefert 7 Tage', () => {
    expect(weekDates('2026-09-14')).toHaveLength(7);
    expect(weekDates('2026-09-14')[6]).toBe('2026-09-20');
  });
});
