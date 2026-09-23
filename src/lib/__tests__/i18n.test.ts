import { describe, expect, it } from 'vitest';
import { en } from '../../i18n/en';
import { de } from '../../i18n/de';
import { deviceLanguage } from '../../i18n';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort();

describe('i18n dictionaries', () => {
  it('German covers every English key with the same placeholders', () => {
    for (const key of Object.keys(en) as (keyof typeof en)[]) {
      expect(de[key], `missing de key ${key}`).toBeTruthy();
      expect(placeholders(de[key]), `placeholders differ for ${key}`).toEqual(placeholders(en[key]));
    }
  });

  it('has no empty texts', () => {
    for (const [k, v] of Object.entries({ ...en, ...de })) expect(v.trim(), k).not.toBe('');
  });
});

describe('deviceLanguage', () => {
  it('nimmt Deutsch bei deutschsprachigen Geräten', () => {
    expect(deviceLanguage(['de-CH', 'en-US'])).toBe('de');
    expect(deviceLanguage(['de'])).toBe('de');
  });

  it('sonst Englisch', () => {
    expect(deviceLanguage(['en-GB'])).toBe('en');
    expect(deviceLanguage(['fr-CH', 'it-CH'])).toBe('en');
    expect(deviceLanguage([])).toBe('en');
  });
});
