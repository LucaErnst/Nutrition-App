import { useEffect, useState } from 'react';
import { useDaySummaries, useGoals, useSettings, useUnitSystem, useWaterByDate, useWeights } from '../db/hooks';
import { addDays, formatShortDate, todayISO, weekDates, weekStartOf, weekdayShort } from '../lib/date';
import { fmt, waterDigits, waterLeftLabel, waterUnitLabel, waterValue } from '../lib/nutrition';
import { summarizeWeek, weekBudget, type Conclusion, type DaySummary } from '../lib/week';
import { useT } from '../i18n';
import { Tip } from './Tip';
import { readSteps } from '../lib/health';
import { stepsAverage, stepsConclusions } from '../lib/steps';
import { trendChange, withTrend } from '../lib/weight';
import { activeGoalFor } from '../lib/goals';
import { WeekBudgetCard } from './WeekBudgetCard';
import { Ring } from './Ring';

interface Props {
  onOpenDay?: (date: string) => void;
}

export function WeekView({ onOpenDay }: Props) {
  const t = useT();
  const today = todayISO();
  const [start, setStart] = useState(weekStartOf(today));
  const dates = weekDates(start);
  const days = useDaySummaries(dates);
  const water = useWaterByDate(dates);
  const settings = useSettings();
  const week = days ? summarizeWeek(days, today) : undefined;
  const budget = days ? weekBudget(days, today) : undefined;
  const isCurrent = start === weekStartOf(today);

  // Wasser: Ø über Tage mit Einträgen
  const waterDays = water ? [...water.values()].filter((ml) => ml > 0) : [];
  const waterAvg = waterDays.length ? waterDays.reduce((s, v) => s + v, 0) / waterDays.length : 0;
  const waterGoal = settings?.water_goal_ml ?? 3000;
  // Wasser folgt dem Einheitensystem: metrisch Liter mit einer Nachkommastelle, sonst ganze Unzen.
  const system = useUnitSystem();
  const conclusions: Conclusion[] = week ? [...week.conclusions] : [];
  const [conclusionsOpen, setConclusionsOpen] = useState(false);

  // Schritte aus Apple Health: diese Woche und die vier davor (nur mit Health, nur nativ).
  const [steps, setSteps] = useState<Map<string, number> | undefined>(undefined);
  useEffect(() => {
    setSteps(undefined);
    if (settings?.health_enabled) void readSteps(addDays(start, -28), addDays(start, 6)).then(setSteps);
  }, [start, settings?.health_enabled]);
  const weights = useWeights();
  const goals = useGoals();
  if (week && steps) {
    const before = Array.from({ length: 28 }, (_, i) => addDays(start, -28 + i));
    const lastDay = isCurrent ? today : addDays(start, 6);
    const points = weights ? withTrend(weights.filter((w) => w.date <= lastDay)) : [];
    conclusions.push(
      ...stepsConclusions(
        {
          week: stepsAverage(steps, dates),
          before: stepsAverage(steps, before),
          trendChange14: trendChange(points, 14),
          phase: goals ? activeGoalFor(goals, lastDay)?.phase_type : undefined,
        },
        fmt,
      ),
    );
  }
  if (week && waterDays.length > 0) {
    conclusions.push({
      kind: waterAvg >= waterGoal ? 'ok' : 'warn',
      key: waterAvg >= waterGoal ? 'concl.waterOk' : 'concl.waterLow',
      params: { avg: waterLeftLabel(waterAvg, system), goal: waterLeftLabel(waterGoal, system) },
    });
  }

  return (
    <div className="week">
      <nav className="date-nav" aria-label={t('week.nav')}>
        <button className="btn-icon btn-round" onClick={() => setStart(addDays(start, -7))} aria-label={t('week.prev')}>
          ‹
        </button>
        <div className="date-nav-center">
          <span className="date-label">{isCurrent ? t('week.this') : `${formatShortDate(start)} – ${formatShortDate(addDays(start, 6))}`}</span>
          {isCurrent && (
            <span className="date-sub">
              {formatShortDate(start)} – {formatShortDate(addDays(start, 6))}
            </span>
          )}
        </div>
        <button className="btn-icon btn-round" onClick={() => setStart(addDays(start, 7))} aria-label={t('week.next')} disabled={isCurrent}>
          ›
        </button>
      </nav>

      <Tip id="week-budget">{t('tip.weekBudget')}</Tip>

      {week && (
        <>
          <div className="split-side">
          <section className="card section" aria-label={t('week.average')}>
            <div className="section-head">
              <h2>{t('week.average')}</h2>
              <span className="search-hint">{t('week.tracked', { n: week.trackedCount })}</span>
            </div>
            <div className="summary-top week-avg">
              <Ring fraction={week.avgTarget ? week.avg.kcal / week.avgTarget.kcal : 0}>
                <span className="summary-kcal-value">{fmt(week.avg.kcal)}</span>
                <span className="summary-kcal-label">{week.avgTarget ? t('week.ringOf', { n: fmt(week.avgTarget.kcal) }) : 'kcal'}</span>
              </Ring>
              <div className="summary-bars">
                <AvgBar label={t('macro.protein')} value={week.avg.protein} target={week.avgTarget?.protein} targetLabel={week.avgTarget ? `≥ ${fmt(week.avgTarget.protein)}` : undefined} unit="g" color="var(--c-protein)" />
                <AvgBar
                  label={t('macro.fat')}
                  value={week.avg.fat}
                  target={week.avgTarget?.fat_max}
                  targetLabel={week.avgTarget ? `${fmt(week.avgTarget.fat_min)}–${fmt(week.avgTarget.fat_max)}` : undefined}
                  unit="g"
                  color="var(--c-fat)"
                />
                <AvgBar label={t('macro.carbs')} value={week.avg.carbs} target={week.avgTarget?.carbs} unit="g" color="var(--c-carbs)" />
                {waterDays.length > 0 && (
                  <AvgBar
                    label={t('water.avg')}
                    value={waterValue(waterAvg, system)}
                    target={waterValue(waterGoal, system)}
                    digits={waterDigits(system)}
                    unit={waterUnitLabel(system)}
                    color="var(--c-water)"
                  />
                )}
              </div>
            </div>
            {week.totalTargetKcal !== undefined && (
              <p className="week-total">
                {t('week.sumTracked', {
                  actual: fmt(week.total.kcal),
                  target: fmt(week.totalTargetKcal),
                  diff: `${week.total.kcal >= week.totalTargetKcal ? '+' : '−'}${fmt(Math.abs(week.total.kcal - week.totalTargetKcal))}`,
                })}
              </p>
            )}
          </section>

          {budget && <WeekBudgetCard budget={budget} isCurrent={isCurrent} />}

          <section className="card meal conclusions-card" aria-label={t('week.conclusion')}>
            <header className="meal-header">
              <button
                className="meal-toggle"
                onClick={() => setConclusionsOpen((v) => !v)}
                aria-expanded={conclusionsOpen}
                aria-controls="week-conclusions"
              >
                <h2>{t('week.conclusion')}</h2>
                <span className="meal-meta">
                  {(['ok', 'warn', 'info'] as const)
                    .map((k) => [k, conclusions.filter((c) => c.kind === k).length] as const)
                    .filter(([, n]) => n > 0)
                    .map(([k, n], i) => (
                      <span key={k}>
                        {i > 0 && ' · '}
                        <span className={`concl-dot concl-dot-${k}`} aria-hidden="true">●</span> {t(`week.sum.${k}`, { n })}
                      </span>
                    ))}
                </span>
              </button>
              <div className="meal-header-right">
                <button
                  className={`btn-icon meal-chevron ${conclusionsOpen ? 'open' : ''}`}
                  onClick={() => setConclusionsOpen((v) => !v)}
                  aria-label={conclusionsOpen ? t('slot.collapse') : t('slot.expand')}
                >
                  <svg viewBox="0 0 8 13" width="8" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1.5 1.5 6.5 6.5l-5 5" />
                  </svg>
                </button>
              </div>
            </header>
            <div className={`collapse ${conclusionsOpen ? 'open' : ''}`} aria-hidden={!conclusionsOpen}>
              <div className="collapse-inner">
                <ul className="conclusions" id="week-conclusions">
                  {conclusions.map((c, i) => (
                    <li key={i} className={`conclusion conclusion-${c.kind}`}>
                      <span className="conclusion-icon" aria-hidden="true">
                        {c.kind === 'ok' ? '✓' : c.kind === 'warn' ? '!' : 'i'}
                      </span>
                      {t(c.key, c.params)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
          </div>

          <section className="card section split-main" aria-label={t('week.days')}>
            <h2>{t('week.days')}</h2>
            <DayBars days={week.days} today={today} onOpenDay={onOpenDay} />
          </section>
        </>
      )}
    </div>
  );
}

/** Balkenfarbe nach Anteil am Tagesziel: unter 90 % violett, 90–105 % grün, darüber rot. */
export function dayStatus(kcal: number, target: number | undefined): 'under' | 'ok' | 'over' | '' {
  if (!target || kcal <= 0) return '';
  const r = kcal / target;
  return r > 1.05 ? 'over' : r >= 0.9 ? 'ok' : 'under';
}

function DayBars({ days, today, onOpenDay }: { days: DaySummary[]; today: string; onOpenDay?: (d: string) => void }) {
  const t = useT();
  return (
    <>
      <ul className="day-bars">
        {days.map((d) => {
          const target = d.targets?.kcal;
          const status = d.tracked ? dayStatus(d.totals.kcal, target) : '';
          const future = d.date > today;
          const pct = target && d.tracked ? Math.min(100, (d.totals.kcal / target) * 100) : 0;
          return (
            <li key={d.date} className={`day-bar ${future ? 'day-future' : ''} ${d.date === today ? 'day-today' : ''}`}>
              <button className="day-bar-btn" onClick={() => onOpenDay?.(d.date)} disabled={!onOpenDay}>
                <span className="day-bar-label">
                  <span className="day-bar-weekday">{weekdayShort(d.date)}</span>
                  <span className="day-bar-date">{d.date.slice(8, 10)}/{d.date.slice(5, 7)}</span>
                </span>
                {d.targets ? (
                  <span className={`day-type-pill ${d.targets.is_training ? 'is-training' : 'is-rest'}`} aria-label={d.targets.is_training ? t('day.training') : t('day.rest')}>
                    {d.targets.is_training ? t('week.typeT') : t('week.typeR')}
                  </span>
                ) : (
                  <span className="day-type-pill is-empty" aria-hidden="true" />
                )}
                <span className="day-bar-track">
                  {d.tracked && <span className={`day-bar-fill status-${status}`} style={{ width: `${pct}%` }} />}
                </span>
                <span className="day-bar-values">
                  {d.tracked ? (
                    <strong>
                      {fmt(d.totals.kcal)} <small>kcal</small>
                    </strong>
                  ) : (
                    <span className="day-bar-empty">–</span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="day-bars-legend">
        <span><span className="concl-dot concl-dot-ok" aria-hidden="true">●</span> {t('week.legendOk')}</span>
        <span><span className="day-dot-under" aria-hidden="true">●</span> {t('week.legendUnder')}</span>
        <span><span className="day-dot-over" aria-hidden="true">●</span> {t('week.legendOver')}</span>
      </p>
    </>
  );
}

function AvgBar({ label, value, target, targetLabel, unit, color, digits = 0 }: { label: string; value: number; target?: number; targetLabel?: string; unit: string; color: string; digits?: number }) {
  const pct = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="macro-bar">
      <div className="macro-bar-head">
        <span>{label}</span>
        <span className="macro-bar-values">
          {fmt(value, digits)}
          {target !== undefined && ` / ${targetLabel ?? fmt(target, digits)}`} {unit}
        </span>
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
