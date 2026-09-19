import type { Unit } from '../db/types';

interface Props {
  value: string;
  onChange: (v: string) => void;
  unit: Unit;
  /** Kompakte Variante für die Inline-Bearbeitung im Tagebuch */
  compact?: boolean;
  autoFocus?: boolean;
  onBlur?: () => void;
  onKeyDown?: (ev: React.KeyboardEvent<HTMLInputElement>) => void;
  ariaLabel?: string;
}

/** Schrittweite: 10 g/ml, 1 Stück; unter 20 g feiner. */
export function stepFor(unit: Unit, current: number): number {
  if (unit === 'Stück') return 1;
  return current < 20 ? 5 : 10;
}

function parse(v: string): number {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

export function AmountStepper({ value, onChange, unit, compact, autoFocus, onBlur, onKeyDown, ariaLabel }: Props) {
  const n = parse(value);

  function bump(dir: 1 | -1) {
    const step = stepFor(unit, dir < 0 ? n - 0.01 : n);
    const next = Math.max(0, Math.round((n + dir * step) * 100) / 100);
    onChange(String(next));
  }

  return (
    <div className={`stepper ${compact ? 'stepper-compact' : ''}`}>
      <button type="button" className="stepper-btn" onClick={() => bump(-1)} aria-label="Menge verringern" disabled={n <= 0}>
        −
      </button>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => e.target.select()}
        autoFocus={autoFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel ?? 'Menge'}
      />
      <button type="button" className="stepper-btn" onClick={() => bump(1)} aria-label="Menge erhöhen">
        +
      </button>
    </div>
  );
}
