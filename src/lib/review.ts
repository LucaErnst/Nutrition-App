/**
 * Bewertungs-Abfrage. Apple zeigt den Dialog höchstens dreimal pro Jahr und Gerät und sagt
 * der App nie, ob er erschienen ist – wir können also nur den richtigen Moment wählen und
 * danach Ruhe geben. Die Regeln stehen hier als reine Funktion, damit sie prüfbar sind.
 *
 * Der Moment soll einer sein, in dem die App gerade etwas geleistet hat: eine Woche am Stück
 * getrackt, oder ein Kauf, der sich im Alltag schon bewährt hat. Nie beim Start, nie nach
 * einem Fehler, nie zweimal in derselben Version.
 */
import { registerPlugin } from '@capacitor/core';
import { db } from '../db/db';
import { saveSettings } from '../db/hooks';
import { addDays, todayISO } from './date';
import { logError } from './errorLog';
import { isNative } from './native';
import { proSource } from './pro';

interface ReviewBridge {
  requestReview(): Promise<void>;
}

const Review = registerPlugin<ReviewBridge>('ReviewBridge');

export interface ReviewState {
  /** Zeitpunkt der letzten Anfrage */
  at?: number;
  /** Version, in der zuletzt gefragt wurde */
  version?: string;
  /** Wie oft insgesamt gefragt wurde */
  count?: number;
}

export interface ReviewContext {
  /** Tage mit mindestens einem Eintrag */
  trackedDays: number;
  /** Tage am Stück bis heute oder gestern */
  streak: number;
  /** Pro wurde gekauft (nicht geschenkt) */
  purchased: boolean;
  version: string;
  now: number;
}

/** Eigene Sperre zusätzlich zu Apples Grenze – lieber zu selten als zu oft. */
export const MIN_DAYS_BETWEEN = 120;
export const MAX_ASKS = 3;

export function shouldAskForReview(ctx: ReviewContext, state: ReviewState): boolean {
  if ((state.count ?? 0) >= MAX_ASKS) return false;
  if (state.version === ctx.version) return false;
  if (state.at !== undefined && ctx.now - state.at < MIN_DAYS_BETWEEN * 86_400_000) return false;

  // Wer die App kaum benutzt, hat nichts zu bewerten.
  if (ctx.trackedDays < 7) return false;

  // Ein guter Moment: eine Woche ohne Lücke, oder ein Kauf, der sich bewährt hat.
  return ctx.streak >= 7 || (ctx.purchased && ctx.trackedDays >= 10);
}

/**
 * Längste Serie, die bis heute oder gestern reicht. Gestern zählt mit, weil der heutige Tag
 * oft noch leer ist, wenn die Frage ausgelöst wird.
 */
export function streakFrom(dates: readonly string[], today = todayISO()): number {
  const set = new Set(dates);
  let day = set.has(today) ? today : addDays(today, -1);
  if (!set.has(day)) return 0;
  let n = 0;
  while (set.has(day)) {
    n += 1;
    day = addDays(day, -1);
  }
  return n;
}

let timer: ReturnType<typeof setTimeout> | undefined;

/**
 * Nach einer Änderung kurz warten und dann prüfen – nicht bei jedem einzelnen Eintrag,
 * und nie mitten in einer Eingabe.
 */
export function scheduleReviewCheck(delayMs = 4000): void {
  if (!isNative) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => void maybeAskForReview(), delayMs);
}

/** Prüft die Regeln und bittet iOS gegebenenfalls um die Abfrage. */
export async function maybeAskForReview(now = Date.now()): Promise<boolean> {
  if (!isNative) return false;
  try {
    const settings = await db.settings.get(1);
    const state: ReviewState = settings?.review ?? {};
    const dates = (await db.mealEntries.orderBy('date').uniqueKeys()) as string[];
    const ctx: ReviewContext = {
      trackedDays: dates.length,
      streak: streakFrom(dates),
      purchased: proSource() === 'purchase',
      version: __APP_VERSION__,
      now,
    };
    if (!shouldAskForReview(ctx, state)) return false;

    // Erst merken, dann fragen: Wenn der Aufruf scheitert, wird trotzdem nicht nachgehakt.
    await saveSettings({ review: { at: now, version: ctx.version, count: (state.count ?? 0) + 1 } });
    await Review.requestReview();
    return true;
  } catch (e) {
    logError('review', e);
    return false;
  }
}
