import { describe, expect, it } from 'vitest';
import {
  bodyWeightUnitFor,
  cmToFtIn,
  formatBodyDelta,
  formatBodyWeight,
  formatHeight,
  ftInToCm,
  heightUnitFor,
  kgToLb,
  kgToStone,
  lbToKg,
  stoneToKg,
} from '../units';

describe('Körpergewicht', () => {
  it('Kilogramm und Pfund', () => {
    expect(kgToLb(80)).toBeCloseTo(176.37, 2);
    expect(lbToKg(176.37)).toBeCloseTo(80, 2);
    expect(lbToKg(kgToLb(82.4))).toBeCloseTo(82.4, 6);
  });

  it('Stone und Pfund wie auf einer britischen Waage', () => {
    expect(kgToStone(82.4)).toEqual({ st: 12, lb: 13.7 });
    expect(stoneToKg(12, 13.7)).toBeCloseTo(82.4, 1);
    expect(kgToStone(88.9).st).toBe(14);
  });

  it('Rundung ergibt nie 14 Pfund, sondern das nächste Stone', () => {
    // 82.46 kg sind 181.79 lb → 12 st 13.79 lb, gerundet nicht "12 st 14 lb"
    for (let kg = 80; kg < 92; kg += 0.01) {
      const { lb } = kgToStone(kg);
      expect(lb, `${kg} kg`).toBeLessThan(14);
    }
  });

  it('Anzeige je Einheit', () => {
    expect(formatBodyWeight(82.4, 'kg')).toBe('82.4 kg');
    expect(formatBodyWeight(82.4, 'lb')).toBe('181.7 lb');
    expect(formatBodyWeight(82.4, 'st')).toBe('12 st 13.7 lb');
  });

  it('Veränderungen auch in England in Pfund, mit Vorzeichen', () => {
    expect(formatBodyDelta(0.5, 'kg')).toBe('+0.5 kg');
    expect(formatBodyDelta(-0.5, 'kg')).toBe('−0.5 kg');
    expect(formatBodyDelta(0.5, 'st')).toBe('+1.1 lb');
    expect(formatBodyDelta(0, 'kg')).toBe('±0.0 kg');
  });
});

describe('Körpergrösse', () => {
  it('Zentimeter in Fuss und Zoll', () => {
    expect(cmToFtIn(180)).toEqual({ ft: 5, in: 11 });
    expect(cmToFtIn(183)).toEqual({ ft: 6, in: 0 });
    expect(ftInToCm(6, 0)).toBeCloseTo(182.9, 1);
    expect(formatHeight(180, 'cm')).toBe('180 cm');
    expect(formatHeight(180, 'ftin')).toBe('5′ 11″');
  });

  it('12 Zoll werden zu einem Fuss, nie "5 ft 12 in"', () => {
    for (let cm = 150; cm < 210; cm += 0.1) {
      expect(cmToFtIn(cm).in, `${cm} cm`).toBeLessThan(12);
    }
  });
});

describe('Einheiten folgen dem System', () => {
  it('Gewicht', () => {
    expect(bodyWeightUnitFor('metric')).toBe('kg');
    expect(bodyWeightUnitFor('us')).toBe('lb');
    expect(bodyWeightUnitFor('uk')).toBe('st');
  });

  it('Grösse', () => {
    expect(heightUnitFor('metric')).toBe('cm');
    expect(heightUnitFor('us')).toBe('ftin');
    expect(heightUnitFor('uk')).toBe('ftin');
  });
});
