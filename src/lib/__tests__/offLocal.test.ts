import { describe, expect, it } from 'vitest';
import { findInStore, parseStore, searchStore } from '../offLocal';

const TSV = [
  ['3017620422003', 'Nutella', 'Ferrero', 539, 6.3, 30.9, 57.5, 15, 0],
  ['7610200337891', 'Ovomaltine crunchy cream', 'Ovomaltine', 538, 5.2, 31, 58, '', 0],
  ['5449000000996', 'Coca-Cola', 'Coca-Cola', 42, 0, 0, 10.6, 330, 1],
  ['0049000006346', 'Coca-Cola Zero', 'Coca-Cola', 0, 0, 0, 0, 355, 1],
  ['7613035974685', 'Nutella Biscuits', 'Ferrero', 511, 7.3, 24.6, 64.3, 13.8, 0],
]
  .map((r) => r.join('\t'))
  .join('\n');

describe('mitgelieferte Produkte', () => {
  const store = parseStore(TSV + '\n');

  it('Barcode findet das Produkt mit allen Werten', () => {
    const p = findInStore(store, '3017620422003')!;
    expect(p).toMatchObject({ name: 'Nutella', brand: 'Ferrero', kcal_per_100g: 539, fat_per_100g: 30.9, serving_g: 15, is_liquid: false });
  });

  it('flüssig und Portion werden übernommen, leere Portion bleibt leer', () => {
    expect(findInStore(store, '5449000000996')).toMatchObject({ is_liquid: true, serving_g: 330 });
    expect(findInStore(store, '7610200337891')!.serving_g).toBeUndefined();
  });

  it('UPC-A ohne führende 0 findet den EAN-13', () => {
    expect(findInStore(store, '049000006346')!.name).toBe('Coca-Cola Zero');
  });

  it('unbekannter Barcode → nichts', () => {
    expect(findInStore(store, '1234567890123')).toBeUndefined();
  });

  it('Suche: alle Begriffe, ganzes Wort vor Wortanfang, Beliebtheit bei Gleichstand', () => {
    expect(searchStore(store, 'nutella').map((p) => p.name)).toEqual(['Nutella', 'Nutella Biscuits']);
    expect(searchStore(store, 'cola zero').map((p) => p.name)).toEqual(['Coca-Cola Zero']);
    expect(searchStore(store, 'ferrero biscuits').map((p) => p.name)).toEqual(['Nutella Biscuits']);
  });

  it('Marke zählt mit, Limit greift', () => {
    expect(searchStore(store, 'ferrero', 1)).toHaveLength(1);
    expect(searchStore(store, '')).toEqual([]);
  });
});
