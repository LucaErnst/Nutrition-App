import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { db } from '../db/db';
import type { DailyGoal, MealType, PhaseType } from '../db/types';
import { en, type MessageKey } from './en';
import { de } from './de';

export type Language = 'en' | 'de';
/** Schlüssel mit einem bestimmten Präfix, z.B. MessageKeyOf<'nav'> */
export type MessageKeyOf<P extends string> = Extract<MessageKey, `${P}.${string}`>;

const DICTS: Record<Language, Record<MessageKey, string>> = { en, de };
const LOCALES: Record<Language, string> = { en: 'en-US', de: 'de-CH' };
const STORAGE_KEY = 'nutrition-tracker:language';

type Params = Record<string, string | number>;

/** Aktive Sprache – auch für Funktionen ausserhalb von React (fmt, Datum). */
let current: Language = readStored() ?? 'en';

function readStored(): Language | undefined {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === 'de' || v === 'en' ? v : undefined;
  } catch {
    return undefined;
  }
}

export function getLanguage(): Language {
  return current;
}

export function getLocale(): string {
  return LOCALES[current];
}

function interpolate(template: string, params?: Params): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) => (params[k] !== undefined ? String(params[k]) : `{${k}}`));
}

/** Übersetzung ohne Hook – für Libs und Nicht-Komponenten. */
export function t(key: MessageKey, params?: Params): string {
  return interpolate(DICTS[current][key] ?? en[key] ?? key, params);
}

/** Standardnamen je Phasentyp in allen Sprachen – ein so benannter Eintrag wird übersetzt angezeigt. */
const PHASE_DEFAULTS: Record<PhaseType, string[]> = {
  cut: ['Cut', 'Defizit', 'Defizitphase'],
  maintain: ['Maintenance', 'Erhalt', 'Erhaltungsphase'],
  bulk: ['Bulk', 'Aufbau', 'Aufbauphase'],
};

/** Phasenname zur Anzeige: Standardnamen werden übersetzt, eigene Namen bleiben. */
export function phaseDisplayName(goal: Pick<DailyGoal, 'phase_name' | 'phase_type'>): string {
  const type = goal.phase_type ?? (Object.keys(PHASE_DEFAULTS) as PhaseType[]).find((k) => PHASE_DEFAULTS[k].includes(goal.phase_name.trim()));
  if (type && PHASE_DEFAULTS[type].includes(goal.phase_name.trim())) {
    return t(type === 'cut' ? 'ob.phaseCut' : type === 'maintain' ? 'ob.phaseMaintain' : 'ob.phaseBulk');
  }
  return goal.phase_name;
}

export function mealLabel(type: MealType): string {
  return t(`meal.${type}` as MessageKey);
}

interface I18nApi {
  lang: Language;
  t: typeof t;
  setLanguage: (l: Language) => void;
}

const I18nContext = createContext<I18nApi>({ lang: current, t, setLanguage: () => {} });

export function useI18n(): I18nApi {
  return useContext(I18nContext);
}

export function useT() {
  return useContext(I18nContext).t;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(current);

  // Einstellung aus der DB übernehmen (localStorage dient nur als schneller Cache beim Start)
  useEffect(() => {
    void db.settings.get(1).then((s) => {
      if (s?.language && s.language !== current) apply(s.language);
    });
    function apply(l: Language) {
      current = l;
      setLang(l);
    }
  }, []);

  const api = useMemo<I18nApi>(
    () => ({
      lang,
      t,
      setLanguage: (l) => {
        current = l;
        try {
          localStorage.setItem(STORAGE_KEY, l);
        } catch {
          /* ignorieren */
        }
        document.documentElement.lang = l;
        setLang(l);
        void db.settings.get(1).then((s) => db.settings.put({ ...(s ?? { id: 1 as const, training_weekdays: [1, 2, 4, 5] }), language: l }));
      },
    }),
    [lang],
  );

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t('app.title');
  }, [lang]);

  return <I18nContext.Provider value={api}>{children}</I18nContext.Provider>;
}
