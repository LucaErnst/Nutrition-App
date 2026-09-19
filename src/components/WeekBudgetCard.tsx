import { fmt } from '../lib/nutrition';
import type { WeekBudget } from '../lib/week';

interface Props {
  budget: WeekBudget;
  /** true, wenn die angezeigte Woche die aktuelle ist */
  isCurrent: boolean;
  /** Kompakte Zeile fürs Tagebuch */
  compact?: boolean;
}

/**
 * Wochen-Budget: der Kalorien-Topf der Woche. Zeigt, wie viel ab heute im
 * Schnitt pro Tag bleibt, statt jeden Tag exakt treffen zu müssen.
 */
export function WeekBudgetCard({ budget: b, isCurrent, compact }: Props) {
  const usedPct = Math.min(100, ((b.spentBefore + b.today) / b.budget) * 100);
  const driftText =
    Math.abs(b.driftBefore) < 25
      ? 'bisher auf Kurs'
      : b.driftBefore > 0
        ? `${fmt(b.driftBefore)} kcal über Plan – ${fmt(b.driftBefore / Math.max(1, b.daysLeft))} kcal/Tag ausgleichen`
        : `${fmt(-b.driftBefore)} kcal unter Plan – ${fmt(-b.driftBefore / Math.max(1, b.daysLeft))} kcal/Tag Spielraum`;

  if (compact) {
    if (!isCurrent || b.daysLeft === 0) return null;
    return (
      <p className="budget-line">
        <span className="budget-line-label">Wochenbudget</span>
        <span>
          heute noch <strong className={b.todayLeft < 0 ? 'status-over' : ''}>{fmt(b.todayLeft)}</strong> kcal · Ø {fmt(b.perDay)} kcal für {b.daysLeft} {b.daysLeft === 1 ? 'Tag' : 'Tage'} · {driftText}
        </span>
      </p>
    );
  }

  return (
    <section className="card section" aria-label="Wochenbudget">
      <div className="section-head">
        <h2>Wochenbudget</h2>
        <span className="search-hint">{fmt(b.budget)} kcal</span>
      </div>
      <div className="progress-track budget-track" role="progressbar" aria-valuenow={Math.round(b.spentBefore + b.today)} aria-valuemin={0} aria-valuemax={Math.round(b.budget)}>
        <div className="progress-fill" style={{ width: `${usedPct}%`, background: 'var(--c-kcal)' }} />
      </div>
      {isCurrent && b.daysLeft > 0 ? (
        <div className="week-stats budget-stats">
          <div className="week-stat">
            <span className="week-stat-target">Verbraucht</span>
            <span className="week-stat-value">
              {fmt(b.spentBefore + b.today)} <span className="week-stat-unit">kcal</span>
            </span>
          </div>
          <div className="week-stat">
            <span className="week-stat-target">Ø pro Resttag ({b.daysLeft})</span>
            <span className="week-stat-value">
              {fmt(b.perDay)} <span className="week-stat-unit">kcal</span>
            </span>
          </div>
          <div className="week-stat">
            <span className="week-stat-target">Heute noch</span>
            <span className={`week-stat-value ${b.todayLeft < 0 ? 'delta-down' : ''}`}>
              {fmt(b.todayLeft)} <span className="week-stat-unit">kcal</span>
            </span>
          </div>
          <div className="week-stat">
            <span className="week-stat-target">Bisherige Tage</span>
            <span className="week-stat-value budget-drift">{driftText}</span>
          </div>
        </div>
      ) : (
        <p className="week-total">
          Gesamt: <strong>{fmt(b.totalSpent)}</strong> von {fmt(b.budget)} kcal ({b.totalSpent >= b.budget ? '+' : '−'}
          {fmt(Math.abs(b.totalSpent - b.budget))})
        </p>
      )}
      <p className="search-hint budget-hint">
        Nicht erfasste vergangene Tage zählen mit ihrem Tagesziel. Ein Tag über Ziel ist kein Problem, solange die Woche stimmt.
      </p>
    </section>
  );
}
