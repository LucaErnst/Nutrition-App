import { fmt } from '../lib/nutrition';
import type { WeekBudget } from '../lib/week';
import { useT } from '../i18n';

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
  const t = useT();
  const usedPct = Math.min(100, ((b.spentBefore + b.today) / b.budget) * 100);
  const perDayDrift = fmt(Math.abs(b.driftBefore) / Math.max(1, b.daysLeft));
  const driftText =
    Math.abs(b.driftBefore) < 25
      ? t('week.budgetOnTrack')
      : b.driftBefore > 0
        ? t('week.budgetOver', { n: fmt(b.driftBefore), perDay: perDayDrift })
        : t('week.budgetUnder', { n: fmt(-b.driftBefore), perDay: perDayDrift });

  if (compact) {
    if (!isCurrent || b.daysLeft === 0) return null;
    return (
      <p className="budget-line">
        <span className="budget-line-label">{t('week.budget')}</span>
        <span>
          {t('week.budgetLine', {
            left: fmt(b.todayLeft),
            perDay: fmt(b.perDay),
            days: b.daysLeft,
            dayWord: b.daysLeft === 1 ? t('common.day') : t('common.days'),
            drift: driftText,
          })}
        </span>
      </p>
    );
  }

  return (
    <section className="card section" aria-label={t('week.budget')}>
      <div className="section-head">
        <h2>{t('week.budget')}</h2>
        <span className="search-hint">{fmt(b.budget)} kcal</span>
      </div>
      <div className="progress-track budget-track" role="progressbar" aria-valuenow={Math.round(b.spentBefore + b.today)} aria-valuemin={0} aria-valuemax={Math.round(b.budget)}>
        <div className="progress-fill" style={{ width: `${usedPct}%`, background: 'var(--c-kcal)' }} />
      </div>
      {isCurrent && b.daysLeft > 0 ? (
        <div className="week-stats budget-stats">
          <div className="week-stat">
            <span className="week-stat-target">{t('week.budgetUsed')}</span>
            <span className="week-stat-value">
              {fmt(b.spentBefore + b.today)} <span className="week-stat-unit">kcal</span>
            </span>
          </div>
          <div className="week-stat">
            <span className="week-stat-target">{t('week.budgetPerDay', { n: b.daysLeft })}</span>
            <span className="week-stat-value">
              {fmt(b.perDay)} <span className="week-stat-unit">kcal</span>
            </span>
          </div>
          <div className="week-stat">
            <span className="week-stat-target">{t('week.budgetTodayLeft')}</span>
            <span className={`week-stat-value ${b.todayLeft < 0 ? 'delta-down' : ''}`}>
              {fmt(b.todayLeft)} <span className="week-stat-unit">kcal</span>
            </span>
          </div>
          <div className="week-stat">
            <span className="week-stat-target">{t('week.budgetPast')}</span>
            <span className="week-stat-value budget-drift">{driftText}</span>
          </div>
        </div>
      ) : (
        <p className="week-total">
          {t('week.budgetTotal', {
            actual: fmt(b.totalSpent),
            budget: fmt(b.budget),
            diff: `${b.totalSpent >= b.budget ? '+' : '−'}${fmt(Math.abs(b.totalSpent - b.budget))}`,
          })}
        </p>
      )}
      <p className="search-hint budget-hint">{t('week.budgetHint')}</p>
    </section>
  );
}
