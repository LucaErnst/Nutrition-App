import { describe, expect, it } from 'vitest';
import { usedAppBefore, type UsageTraces } from '../pro';

const none: UsageTraces = { settings: false, goals: 0, entries: 0, weights: 0, days: 0, ownFoods: 0 };

describe('usedAppBefore – wer die App vor 1.1 hatte, behält Pro', () => {
  it('frische Installation von 1.1 ist kein Early Adopter', () => {
    // Die Referenzlebensmittel aus seedIfEmpty() zählen bewusst nicht mit.
    expect(usedAppBefore(none)).toBe(false);
  });

  it('gespeicherte Einstellungen genügen', () => {
    expect(usedAppBefore({ ...none, settings: true })).toBe(true);
  });

  it('eine einzige Spur genügt', () => {
    expect(usedAppBefore({ ...none, entries: 1 })).toBe(true);
    expect(usedAppBefore({ ...none, goals: 1 })).toBe(true);
    expect(usedAppBefore({ ...none, weights: 1 })).toBe(true);
    expect(usedAppBefore({ ...none, days: 1 })).toBe(true);
    expect(usedAppBefore({ ...none, ownFoods: 1 })).toBe(true);
  });
});
