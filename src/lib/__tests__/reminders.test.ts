import { describe, expect, it } from 'vitest';
import { DEFAULT_REMINDERS, MAX_PER_DAY, planReminders, type TodayState } from '../reminders';
import { todayISO } from '../date';

const base: TodayState = { breakfastLogged: false, lunchLogged: false, dinnerLogged: false, weighed: false, waterMl: 0, waterGoalMl: 3000, proteinLeft: 40 };
const settings = { ...DEFAULT_REMINDERS, enabled: true, lunch: '12:45' };
const early = () => { const d = new Date(); d.setHours(6, 0, 0, 0); return d; };

describe('planReminders', () => {
  it('nothing when disabled', () => {
    expect(planReminders({ settings: DEFAULT_REMINDERS, lang: 'de', today: base })).toEqual([]);
  });

  it('caps at three per day, dinner and breakfast first', () => {
    const plan = planReminders({ settings, lang: 'de', today: base, now: early(), days: 1 });
    expect(plan.length).toBe(MAX_PER_DAY);
    const kinds = plan.map((p) => p.kind);
    expect(kinds).toContain('dinner');
    expect(kinds).toContain('breakfast');
    expect(kinds).toContain('protein');
    // chronologisch
    for (let i = 1; i < plan.length; i++) expect(plan[i].at.getTime()).toBeGreaterThan(plan[i - 1].at.getTime());
  });

  it('skips what is already done today and uses the real protein number', () => {
    const plan = planReminders({ settings, lang: 'en', today: { ...base, breakfastLogged: true, weighed: true, proteinLeft: 37 }, now: early(), days: 1 });
    const kinds = plan.map((p) => p.kind);
    expect(kinds).not.toContain('breakfast');
    expect(kinds).not.toContain('weigh');
    const protein = plan.find((p) => p.kind === 'protein')!;
    expect(protein.body + protein.title).toContain('37 g');
    // zwei Stunden vor dem Abendessen
    expect(protein.at.getHours()).toBe(17);
  });

  it('no protein reminder without a target or when dinner is logged', () => {
    expect(planReminders({ settings, lang: 'de', today: { ...base, proteinLeft: undefined }, now: early(), days: 1 }).some((p) => p.kind === 'protein')).toBe(false);
    expect(planReminders({ settings, lang: 'de', today: { ...base, dinnerLogged: true }, now: early(), days: 1 }).some((p) => p.kind === 'protein')).toBe(false);
  });

  it('skips times already past today', () => {
    const late = new Date(); late.setHours(21, 0, 0, 0);
    expect(planReminders({ settings, lang: 'de', today: base, now: late, days: 1 })).toEqual([]);
  });

  it('plans future days without today-state and rotates texts', () => {
    const plan = planReminders({ settings: { ...settings, protein: false, lunch: null, water: null, weigh: null }, lang: 'de', today: base, now: early(), days: 7 });
    const dinners = plan.filter((p) => p.kind === 'dinner');
    expect(dinners.length).toBe(7);
    expect(new Set(dinners.map((d) => d.body)).size).toBe(7);
    expect(new Set(plan.map((p) => p.id)).size).toBe(plan.length);
  });

  it('weekly reminder only on Sunday', () => {
    const plan = planReminders({ settings: { ...DEFAULT_REMINDERS, enabled: true, breakfast: null, dinner: null, water: null, weigh: null, protein: false }, lang: 'en', today: base, now: early(), days: 7 });
    expect(plan.length).toBe(1);
    expect(plan[0].kind).toBe('weekly');
    expect(plan[0].at.getDay()).toBe(0);
    expect(plan[0].at.toISOString().slice(0, 10) >= todayISO()).toBe(true);
  });
});
