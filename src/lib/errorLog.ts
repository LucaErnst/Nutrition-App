/**
 * Lokales Fehlerprotokoll: hält die letzten Fehler in localStorage, damit
 * Abstürze auf dem Handy unter „Mehr → Diagnose“ sichtbar sind.
 * Optional kann hier später ein externer Dienst (z.B. Sentry) angebunden werden.
 */
export interface LoggedError {
  at: number;
  message: string;
  stack?: string;
  source: 'error' | 'unhandledrejection' | 'react' | 'widget' | 'health' | 'pro';
  version: string;
}

const KEY = 'nutrition-tracker:errors';
const MAX = 20;
const listeners = new Set<() => void>();

export function readErrors(): LoggedError[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LoggedError[]) : [];
  } catch {
    return [];
  }
}

function write(list: LoggedError[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* Speicher voll oder gesperrt – Protokoll ist optional */
  }
  listeners.forEach((l) => l());
}

export function logError(source: LoggedError['source'], err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  const entry: LoggedError = { at: Date.now(), message: e.message, stack: e.stack, source, version: __APP_VERSION__ };
  write([entry, ...readErrors()]);
}

export function clearErrors() {
  write([]);
}

export function subscribeErrors(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Globale Fänger einmalig registrieren. */
export function installErrorLogging() {
  window.addEventListener('error', (ev) => logError('error', ev.error ?? ev.message));
  window.addEventListener('unhandledrejection', (ev) => logError('unhandledrejection', ev.reason));
}

export function formatErrorsForShare(list: LoggedError[]): string {
  return list
    .map((e) => `${new Date(e.at).toISOString()} [${e.source}] v${e.version}\n${e.message}\n${e.stack ?? ''}`)
    .join('\n\n');
}
