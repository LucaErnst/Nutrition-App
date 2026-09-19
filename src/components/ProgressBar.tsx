import { fmt } from '../lib/nutrition';
import type { Status } from '../lib/goals';

interface Props {
  label: string;
  value: number;
  target: number;
  /** Optionaler Zielbereich (z.B. Fett 75–90 g); wird als Markierung angezeigt */
  range?: [number, number];
  unit: string;
  color: string;
  status: Status;
}

export function ProgressBar({ label, value, target, range, unit, color, status }: Props) {
  // Skala reicht bis 110 % des Ziels (bzw. Bereichs-Maximum), damit "drüber" sichtbar ist
  const scaleMax = (range ? range[1] : target) * 1.15;
  const pct = Math.min(100, (value / scaleMax) * 100);
  const targetPct = (target / scaleMax) * 100;
  const remaining = target - value;

  return (
    <div className={`progress progress-${status}`}>
      <div className="progress-head">
        <span className="progress-label">
          <span className="macro-dot" style={{ background: color }} aria-hidden="true" />
          {label}
        </span>
        <span className="progress-values">
          <strong>{fmt(value)}</strong> / {range ? `${fmt(range[0])}–${fmt(range[1])}` : fmt(target)} {unit}
        </span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuenow={Math.round(value)}
        aria-valuemin={0}
        aria-valuemax={Math.round(target)}
        aria-label={label}
      >
        {range && (
          <div
            className="progress-range"
            style={{ left: `${(range[0] / scaleMax) * 100}%`, width: `${((range[1] - range[0]) / scaleMax) * 100}%` }}
          />
        )}
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
        {!range && <div className="progress-marker" style={{ left: `${targetPct}%` }} />}
      </div>
      <div className="progress-foot">
        {status === 'over' && <span>{fmt(Math.abs(remaining))} {unit} über Ziel</span>}
        {status === 'ok' && range && <span>im Zielbereich</span>}
        {status === 'ok' && !range && remaining > 0 && <span>Ziel erreicht · noch {fmt(remaining)} {unit} bis zur Grenze</span>}
        {status === 'ok' && !range && remaining <= 0 && <span>Ziel erreicht</span>}
        {status === 'under' && remaining > 0 && <span>noch {fmt(remaining)} {unit}</span>}
        {status === 'under' && remaining <= 0 && <span>Ziel erreicht</span>}
      </div>
    </div>
  );
}
