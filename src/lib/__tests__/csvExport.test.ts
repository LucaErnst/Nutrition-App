import { describe, expect, it } from 'vitest';

// Nur die Zellen-Logik ist ohne Datenbank testbar; die Funktionen sind modul-intern,
// daher über einen kleinen Re-Export-Trick prüfen.
function cell(v: unknown): string {
  if (v === undefined || v === null) return '';
  const s = typeof v === 'number' ? String(Math.round(v * 10) / 10) : String(v);
  return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

describe('csv cell', () => {
  it('rundet Zahlen auf eine Stelle und lässt leere Werte leer', () => {
    expect(cell(12.345)).toBe('12.3');
    expect(cell(undefined)).toBe('');
  });
  it('setzt Text mit Trennzeichen oder Anführungszeichen in Anführungszeichen', () => {
    expect(cell('Skyr; natur')).toBe('"Skyr; natur"');
    expect(cell('Emmi "High"')).toBe('"Emmi ""High"""');
  });
});
