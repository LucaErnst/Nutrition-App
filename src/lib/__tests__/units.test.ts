import { describe, expect, it } from 'vitest';
import type { Unit } from '../../db/types';
import {
  convertAmount,
  csvUnitLabel,
  defaultUnitFor,
  detectUnitSystem,
  fromBase,
  labelFor,
  stepFor,
  toBase,
  unitChoices,
  unitChoicesForFood,
  UNITS,
  unitDef,
} from '../units';
import { amountToGrams, macrosFor } from '../nutrition';
import type { NutritionSource } from '../nutrition';

const food: NutritionSource = {
  name: 'Haferflocken',
  kcal_per_100g: 370,
  protein_per_100g: 13,
  fat_per_100g: 7,
  carbs_per_100g: 59,
  unit_type: 'weight',
};

describe('Umrechnung in die Basis (g bzw. ml)', () => {
  it('metrische Einheiten', () => {
    expect(toBase(1, 'g')).toBe(1);
    expect(toBase(1.5, 'kg')).toBe(1500);
    expect(toBase(25, 'cl')).toBe(250);
    expect(toBase(2.5, 'dl')).toBe(250);
    expect(toBase(0.75, 'l')).toBe(750);
  });

  it('Gewicht in US/UK – oz und lb sind dort identisch', () => {
    expect(toBase(1, 'oz')).toBeCloseTo(28.3495, 3);
    expect(toBase(1, 'lb')).toBeCloseTo(453.592, 3);
    expect(toBase(16, 'oz')).toBeCloseTo(toBase(1, 'lb'), 6);
  });

  it('Flüssigunze und Pint sind in den USA und England verschieden gross', () => {
    expect(toBase(1, 'floz_us')).toBeCloseTo(29.5735, 3);
    expect(toBase(1, 'floz_uk')).toBeCloseTo(28.4131, 3);
    expect(toBase(1, 'pt_us')).toBeCloseTo(473.176, 3);
    expect(toBase(1, 'pt_uk')).toBeCloseTo(568.261, 3);
    // Genau daran hängt, dass Codes das Land tragen müssen.
    expect(toBase(1, 'floz_us')).not.toBeCloseTo(toBase(1, 'floz_uk'), 1);
  });

  it('US-Löffel und -Cup', () => {
    expect(toBase(1, 'cup_us')).toBeCloseTo(236.588, 3);
    expect(toBase(16, 'tbsp_us')).toBeCloseTo(toBase(1, 'cup_us'), 4);
    expect(toBase(3, 'tsp_us')).toBeCloseTo(toBase(1, 'tbsp_us'), 4);
    expect(toBase(1, 'tbsp_uk')).toBe(15);
    expect(toBase(1, 'tsp_uk')).toBe(5);
  });

  it('fromBase ist die Umkehrung', () => {
    expect(fromBase(1500, 'kg')).toBeCloseTo(1.5, 6);
    expect(fromBase(toBase(3.25, 'oz'), 'oz')).toBeCloseTo(3.25, 6);
  });
});

describe('Nährwerte rechnen mit jeder Einheit', () => {
  it('100 g und 0.1 kg ergeben dasselbe', () => {
    expect(macrosFor(food, 0.1, 'kg').kcal).toBeCloseTo(macrosFor(food, 100, 'g').kcal, 6);
  });

  it('1 lb Haferflocken', () => {
    expect(macrosFor(food, 1, 'lb').kcal).toBeCloseTo(453.59237 * 3.7, 3);
  });

  it('Stück rechnet über das Stückgewicht, nicht über einen Faktor', () => {
    const egg: NutritionSource = { ...food, unit_type: 'piece', piece_weight_g: 60 };
    expect(amountToGrams(egg, 2, 'Stück')).toBe(120);
  });

  it('ohne Stückgewicht gilt weiterhin 100 g pro Stück', () => {
    const x: NutritionSource = { ...food, unit_type: 'piece' };
    expect(amountToGrams(x, 1, 'Stück')).toBe(100);
  });
});

describe('Auswahl und Vorgaben', () => {
  it('das eigene System steht oben, der Rest bleibt erreichbar', () => {
    const us = unitChoices('volume', 'us');
    expect(us[0].group).toBe('us');
    expect(us.map((g) => g.group)).toContain('metric');
    expect(unitChoices('volume', 'metric')[0].group).toBe('metric');
    expect(unitChoices('volume', 'uk')[0].group).toBe('uk');
  });

  it('Stück-Artikel dürfen zusätzlich abgewogen werden', () => {
    const groups = unitChoicesForFood('piece', 'metric');
    expect(groups[0].units).toEqual(['Stück']);
    expect(groups.flatMap((g) => g.units)).toContain('g');
  });

  it('Vorgabe je System', () => {
    expect(defaultUnitFor('weight', 'metric')).toBe('g');
    expect(defaultUnitFor('weight', 'us')).toBe('oz');
    expect(defaultUnitFor('volume', 'metric')).toBe('ml');
    expect(defaultUnitFor('volume', 'us')).toBe('floz_us');
    expect(defaultUnitFor('volume', 'uk')).toBe('floz_uk');
    expect(defaultUnitFor('piece', 'us')).toBe('Stück');
  });

  it('System aus der Gerätesprache', () => {
    expect(detectUnitSystem(['en-US'])).toBe('us');
    expect(detectUnitSystem(['en-GB'])).toBe('uk');
    expect(detectUnitSystem(['de-CH'])).toBe('metric');
    expect(detectUnitSystem(['de'])).toBe('metric');
    expect(detectUnitSystem([])).toBe('metric');
  });
});

describe('Schrittweite und Beschriftung', () => {
  it('bleibt bei Gramm wie bisher, wird bei groben Einheiten feiner', () => {
    expect(stepFor('g', 100)).toBe(10);
    expect(stepFor('g', 15)).toBe(5);
    expect(stepFor('kg', 2)).toBe(0.1);
    expect(stepFor('lb', 0.5)).toBe(0.125);
    expect(stepFor('Stück', 3)).toBe(1);
  });

  it('CSV unterscheidet US und UK', () => {
    expect(csvUnitLabel('floz_us')).toBe('fl oz (US)');
    expect(csvUnitLabel('floz_uk')).toBe('fl oz (UK)');
    expect(csvUnitLabel('g')).toBe('g');
    expect(csvUnitLabel('Stück')).toBe('pc');
  });

  it('jede Einheit hat eine Beschriftung und einen Faktor', () => {
    for (const [code, def] of Object.entries(UNITS)) {
      expect(def.label.length, code).toBeGreaterThan(0);
      if (def.kind !== 'piece') expect(def.base, code).toBeGreaterThan(0);
    }
  });
});

describe('Mengen umrechnen', () => {
  it('die übliche Portion wird in die Einheit des Nutzers übersetzt', () => {
    // 30 g Haferflocken dürfen nie als 30 oz im Feld landen.
    expect(convertAmount(30, 'g', 'oz')).toBeCloseTo(1.06, 2);
    expect(convertAmount(250, 'g', 'kg')).toBe(0.25);
    expect(convertAmount(250, 'ml', 'floz_us')).toBeCloseTo(8.45, 2);
    expect(convertAmount(250, 'ml', 'floz_uk')).toBeCloseTo(8.8, 2);
  });

  it('gleiche Einheit bleibt unverändert', () => {
    expect(convertAmount(30, 'g', 'g')).toBe(30);
  });

  it('Stück bleibt unangetastet – ohne Stückgewicht gibt es nichts umzurechnen', () => {
    expect(convertAmount(2, 'Stück', 'g')).toBe(2);
    expect(convertAmount(2, 'g', 'Stück')).toBe(2);
  });
});

describe('Unbekannte Einheiten aus alten Sicherungen', () => {
  // Ein wiederhergestelltes Backup kann Codes enthalten, die es nicht mehr gibt.
  const odd = 'piece' as Unit;

  it('stürzen nicht ab, sondern rechnen 1:1 wie vor der Umstellung', () => {
    expect(() => toBase(50, odd)).not.toThrow();
    expect(toBase(50, odd)).toBe(50);
    expect(stepFor(odd, 100)).toBe(10);
    expect(unitDef(odd).kind).toBe('weight');
  });

  it('zeigen ihren eigenen Code an, statt eine falsche Einheit vorzutäuschen', () => {
    expect(labelFor(odd, 'pc')).toBe('piece');
    expect(csvUnitLabel(odd)).toBe('piece');
  });
});
