import { describe, expect, it } from 'vitest';
import { REMINDER_TEXTS, permutedIndex, pickText, type ReminderKind } from '../reminderTexts';

const KINDS: ReminderKind[] = ['breakfast', 'lunch', 'dinner', 'water', 'weigh', 'weekly', 'protein'];

describe('reminder texts', () => {
  it('has 64 unique bodies per kind and language', () => {
    for (const lang of ['de', 'en'] as const) {
      for (const kind of KINDS) {
        const bodies = REMINDER_TEXTS[lang].bodies[kind];
        expect(bodies.length, `${lang}/${kind}`).toBe(64);
        expect(new Set(bodies).size, `${lang}/${kind} duplicates`).toBe(64);
        expect(REMINDER_TEXTS[lang].titles[kind].length, `${lang}/${kind} titles`).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('protein texts always carry the {n} placeholder', () => {
    for (const lang of ['de', 'en'] as const) {
      for (const b of REMINDER_TEXTS[lang].bodies.protein) expect(b).toContain('{n}');
    }
  });

  it('rotates through every body before repeating', () => {
    const seen = new Set<string>();
    for (let seq = 0; seq < 64; seq++) seen.add(pickText('de', 'water', seq, 5).body);
    expect(seen.size).toBe(64);
    expect(pickText('de', 'water', 64, 5).body).toBe(pickText('de', 'water', 0, 5).body);
  });

  it('fills placeholders', () => {
    const m = pickText('en', 'protein', 3, 1, { n: 40 });
    expect(m.body).toContain('40 g');
    expect(m.title + m.body).not.toContain('{n}');
  });

  it('permutedIndex is a bijection', () => {
    const idx = new Set<number>();
    for (let i = 0; i < 64; i++) idx.add(permutedIndex(i, 64, 9));
    expect(idx.size).toBe(64);
  });
});
