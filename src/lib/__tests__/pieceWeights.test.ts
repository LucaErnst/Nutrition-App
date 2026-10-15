import { describe, expect, it } from 'vitest';
import { PIECE_WEIGHTS } from '../../db/pieceWeights';
import { loadReference } from '../../db/reference';

const keys = async (lang: 'de' | 'en') => new Set((await loadReference(lang)).map((r) => r[0]));

describe('PIECE_WEIGHTS', () => {
  it('jeder Schlüssel existiert in beiden mitgelieferten Tabellen', async () => {
    const de = await keys('de');
    const en = await keys('en');
    const missing = Object.keys(PIECE_WEIGHTS).filter((k) => !de.has(k) || !en.has(k));
    expect(missing).toEqual([]);
  });

  it('Gewichte sind plausibel (1 g bis 1 kg)', () => {
    for (const [k, g] of Object.entries(PIECE_WEIGHTS)) {
      expect(g, k).toBeGreaterThan(0);
      expect(g, k).toBeLessThan(1000);
    }
  });
});
