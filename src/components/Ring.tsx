import type { ReactNode } from 'react';

const R = 52;
const C = 2 * Math.PI * R;

/**
 * Farbe nach erreichtem Anteil: wenig = rot, die Hälfte = orange, drei Viertel = gelbgrün, voll = grün.
 * Über 100 % bleibt sie grün – im Aufbau ist ein Überschuss meist gewollt.
 */
export function ringColor(fraction: number): string {
  const f = Math.min(1, Math.max(0, fraction));
  return `hsl(${Math.round(4 + 128 * f ** 1.8)} 78% 47%)`;
}

interface Props {
  /** Anteil am Ziel, 0–1 (darüber wird gekappt) */
  fraction: number;
  children: ReactNode;
  label?: string;
}

/** Kalorienring im Stil der Aktivitätsringe: füllt sich und färbt sich mit dem Tagesstand. */
export function Ring({ fraction, children, label }: Props) {
  const f = Math.min(1, Math.max(0, Number.isFinite(fraction) ? fraction : 0));
  return (
    <div className="ring" role={label ? 'img' : undefined} aria-label={label}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={R} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={R}
          stroke={ringColor(fraction)}
          strokeDasharray={C}
          strokeDashoffset={C * (1 - f)}
        />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
