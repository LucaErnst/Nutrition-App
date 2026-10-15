/**
 * Hinweise beim ersten Kontakt (1.2): Die App erklärt eine Besonderheit dort, wo man sie zum
 * ersten Mal sieht, statt einer Tour nach dem Onboarding.
 *
 * Bedienzustand des Geräts, keine Nutzerdaten: liegt im localStorage und gehört nicht ins
 * Backup. Ob jemand Hinweise bekommt, wird einmal entschieden – wer beim ersten Start von 1.2
 * schon Einträge hat, kennt die App und sieht keine.
 */
import { useSyncExternalStore } from 'react';

export type TipId = 'first-entry' | 'day-type' | 'week-budget' | 'weight-trend' | 'template';

const MODE_KEY = 'nutrition-tracker:tips';
const SEEN_KEY = 'nutrition-tracker:tips-seen';

type Mode = 'on' | 'off';

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // privater Modus: dann bleibt der Hinweis bis zum Neuladen weg
  }
  emit();
}

function seen(): Set<string> {
  try {
    return new Set(JSON.parse(read(SEEN_KEY) ?? '[]') as string[]);
  } catch {
    return new Set();
  }
}

/** Einmalig: an für eine neue Installation, aus für jemanden mit Einträgen. */
export function decideTipsMode(hasEntries: boolean): void {
  if (read(MODE_KEY) === null) write(MODE_KEY, hasEntries ? 'off' : 'on');
}

export function tipsMode(): Mode | null {
  const m = read(MODE_KEY);
  return m === 'on' || m === 'off' ? m : null;
}

export function dismissTip(id: TipId): void {
  const s = seen();
  s.add(id);
  write(SEEN_KEY, JSON.stringify([...s]));
}

/** Unter „Mehr": alle Hinweise wieder zeigen. */
export function resetTips(): void {
  write(SEEN_KEY, null);
  write(MODE_KEY, 'on');
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const snapshot = () => `${read(MODE_KEY)}|${read(SEEN_KEY)}`;

/** true, solange der Hinweis gezeigt werden soll. */
export function useTip(id: TipId): boolean {
  useSyncExternalStore(subscribe, snapshot, snapshot);
  return tipsMode() === 'on' && !seen().has(id);
}
