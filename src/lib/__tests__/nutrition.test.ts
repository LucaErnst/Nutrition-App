import { describe, expect, it } from 'vitest';
import type { FoodItem } from '../../db/types';
import { amountToGrams, macrosFor, resolveSource, sumMacros } from '../nutrition';

const quark: FoodItem = {
  name: 'Magerquark', kcal_per_100g: 67.2, protein_per_100g: 12, fat_per_100g: 0.4, carbs_per_100g: 4,
  unit_type: 'weight', source: 'reference', saved: 1, created_at: 0,
};
const egg: FoodItem = {
  name: 'Ei', kcal_per_100g: 127.27, protein_per_100g: 10.9, fat_per_100g: 9.09, carbs_per_100g: 0.9,
  unit_type: 'piece', piece_weight_g: 55, source: 'reference', saved: 1, created_at: 0,
};

describe('macrosFor', () => {
  it('rechnet Gramm-Mengen linear um', () => {
    const m = macrosFor(quark, 250, 'g');
    expect(m.kcal).toBeCloseTo(168, 0);
    expect(m.protein).toBeCloseTo(30, 5);
  });

  it('rechnet Stück über das Stückgewicht um', () => {
    expect(amountToGrams(egg, 2, 'Stück')).toBe(110);
    expect(macrosFor(egg, 2, 'Stück').kcal).toBeCloseTo(140, 0);
  });

  it('nimmt 100 g pro Stück an, wenn kein Stückgewicht gesetzt ist', () => {
    expect(amountToGrams({ ...egg, piece_weight_g: undefined }, 1, 'Stück')).toBe(100);
  });

  it('erlaubt Gramm-Eingabe bei Stück-Artikeln', () => {
    expect(macrosFor(egg, 55, 'g').kcal).toBeCloseTo(70, 0);
  });
});

describe('sumMacros', () => {
  it('summiert und liefert bei leerer Liste Null', () => {
    expect(sumMacros([])).toEqual({ kcal: 0, protein: 0, fat: 0, carbs: 0 });
    const s = sumMacros([macrosFor(quark, 100, 'g'), macrosFor(quark, 100, 'g')]);
    expect(s.protein).toBeCloseTo(24, 5);
  });
});

describe('resolveSource (Snapshot)', () => {
  const entry = { date: '2026-09-19', meal_type: 'lunch' as const, food_item_id: 1, amount: 100, unit: 'g' as const, created_at: 0 };

  it('nutzt den Snapshot auch wenn das Lebensmittel inzwischen geändert wurde', () => {
    const snap = { ...quark, kcal_per_100g: 60 };
    const src = resolveSource({ ...entry, snapshot: snap }, { ...quark, kcal_per_100g: 999 });
    expect(macrosFor(src!, 100, 'g').kcal).toBe(60);
  });

  it('fällt ohne Snapshot auf das Lebensmittel zurück', () => {
    expect(resolveSource(entry, quark)?.kcal_per_100g).toBe(67.2);
  });

  it('liefert undefined, wenn weder Snapshot noch Lebensmittel existieren', () => {
    expect(resolveSource(entry, undefined)).toBeUndefined();
  });
});
