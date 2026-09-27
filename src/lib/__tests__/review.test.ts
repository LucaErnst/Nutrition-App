import { describe, expect, it } from 'vitest';
import { MAX_ASKS, MIN_DAYS_BETWEEN, shouldAskForReview, streakFrom, type ReviewContext, type ReviewState } from '../review';

const DAY = 86_400_000;
const NOW = Date.parse('2026-09-27T10:00:00Z');

const ctx = (over: Partial<ReviewContext> = {}): ReviewContext => ({
  trackedDays: 30,
  streak: 7,
  purchased: false,
  version: '1.1.0',
  now: NOW,
  ...over,
});

describe('Wann nach einer Bewertung gefragt wird', () => {
  it('nach einer Woche ohne Lücke', () => {
    expect(shouldAskForReview(ctx(), {})).toBe(true);
  });

  it('nicht bei kurzer Serie', () => {
    expect(shouldAskForReview(ctx({ streak: 6 }), {})).toBe(false);
  });

  it('nicht bei wenig Nutzung, auch mit Serie', () => {
    expect(shouldAskForReview(ctx({ trackedDays: 6, streak: 6 }), {})).toBe(false);
  });

  it('nach einem Kauf, der sich bewährt hat', () => {
    expect(shouldAskForReview(ctx({ streak: 2, purchased: true, trackedDays: 10 }), {})).toBe(true);
    expect(shouldAskForReview(ctx({ streak: 2, purchased: true, trackedDays: 9 }), {})).toBe(false);
  });

  it('geschenktes Pro zählt nicht als Kauf', () => {
    expect(shouldAskForReview(ctx({ streak: 2, purchased: false, trackedDays: 30 }), {})).toBe(false);
  });
});

describe('Wann geschwiegen wird', () => {
  it('nie zweimal in derselben Version', () => {
    const state: ReviewState = { version: '1.1.0', at: NOW - 400 * DAY, count: 1 };
    expect(shouldAskForReview(ctx(), state)).toBe(false);
    expect(shouldAskForReview(ctx({ version: '1.2.0' }), state)).toBe(true);
  });

  it('nicht innerhalb der Sperrfrist', () => {
    const recent: ReviewState = { version: '1.0.0', at: NOW - (MIN_DAYS_BETWEEN - 1) * DAY, count: 1 };
    expect(shouldAskForReview(ctx(), recent)).toBe(false);
    const old: ReviewState = { version: '1.0.0', at: NOW - (MIN_DAYS_BETWEEN + 1) * DAY, count: 1 };
    expect(shouldAskForReview(ctx(), old)).toBe(true);
  });

  it('nach drei Anfragen ist Schluss', () => {
    expect(shouldAskForReview(ctx(), { count: MAX_ASKS, version: '0.9.0' })).toBe(false);
  });
});

describe('Serie zählen', () => {
  it('zählt bis heute', () => {
    expect(streakFrom(['2026-09-25', '2026-09-26', '2026-09-27'], '2026-09-27')).toBe(3);
  });

  it('gestern zählt mit – heute ist oft noch leer', () => {
    expect(streakFrom(['2026-09-25', '2026-09-26'], '2026-09-27')).toBe(2);
  });

  it('eine Lücke beendet die Serie', () => {
    expect(streakFrom(['2026-09-20', '2026-09-21', '2026-09-26', '2026-09-27'], '2026-09-27')).toBe(2);
  });

  it('nichts Aktuelles heisst keine Serie', () => {
    expect(streakFrom(['2026-09-01', '2026-09-02'], '2026-09-27')).toBe(0);
    expect(streakFrom([], '2026-09-27')).toBe(0);
  });
});
