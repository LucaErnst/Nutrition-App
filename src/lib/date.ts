import { getLocale, t } from '../i18n';

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + delta);
  return toISODate(date);
}

export function formatDateLabel(iso: string): string {
  const today = todayISO();
  if (iso === today) return t('common.today');
  if (iso === addDays(today, -1)) return t('common.yesterday');
  if (iso === addDays(today, 1)) return t('common.tomorrow');
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(getLocale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Lokales Kurzdatum, z.B. 19.09.2026 bzw. 09/19/2026 */
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(getLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Montag der Woche, in der `iso` liegt. */
export function weekStartOf(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const offset = (date.getDay() + 6) % 7; // Mo = 0 … So = 6
  return addDays(iso, -offset);
}

export function weekDates(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function formatShortDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(getLocale(), { day: 'numeric', month: 'numeric' });
}

export function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(getLocale(), { weekday: 'short' });
}
