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
        <button className="btn-icon" onClick={() => setStart(addDays(start, -7))} aria-label={t('week.prev')}>
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
        <button className="btn-icon" onClick={() => setStart(addDays(start, 7))} aria-label={t('week.next')} disabled={isCurrent}>
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
            <div className="week-stats">
              <Stat label={t('macro.kcal')} value={week.avg.kcal} target={week.avgTarget?.kcal} unit="kcal" color="var(--c-kcal)" />
              <Stat label={t('macro.protein')} value={week.avg.protein} target={week.avgTarget?.protein} unit="g" color="var(--c-protein)" prefix="≥ " />
              <Stat
                label={t('macro.fat')}
                value={week.avg.fat}
                targetLabel={week.avgTarget ? `${fmt(week.avgTarget.fat_min)}–${fmt(week.avgTarget.fat_max)} g` : undefined}
                unit="g"
                color="var(--c-fat)"
              />
              <Stat label={t('macro.carbs')} value={week.avg.carbs} target={week.avgTarget?.carbs} unit="g" color="var(--c-carbs)" prefix="≈ " />
              {waterDays.length > 0 && (
                <Stat
                  label={t('water.avg')}
                  value={waterValue(waterAvg, system)}
                  digits={waterDigits(system)}
                  target={waterValue(waterGoal, system)}
                  unit={waterUnitLabel(system)}
                  color="var(--c-water)"
                />
              )}
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

          <section className="card section" aria-label={t('week.conclusion')}>
            <h2>{t('week.conclusion')}</h2>
            <ul className="conclusions">
              {conclusions.map((c, i) => (
                <li key={i} className={`conclusion conclusion-${c.kind}`}>
                  <span className="conclusion-icon" aria-hidden="true">
                    {c.kind === 'ok' ? '✓' : c.kind === 'warn' ? '!' : 'i'}
                  </span>
                  {t(c.key, c.params)}
                </li>
              ))}
            </ul>
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

interface StatProps {
  label: string;
  value: number;
  target?: number;
  targetLabel?: string;
  unit: string;
  color: string;
  prefix?: string;
  digits?: number;
}

function Stat({ label, value, target, targetLabel, unit, color, prefix = '', digits = 0 }: StatProps) {
  const t = useT();
  const tl = targetLabel ?? (target !== undefined ? `${prefix}${fmt(target, digits)} ${unit}` : undefined);
  return (
    <div className="week-stat">
      <span className="progress-label">
        <span className="macro-dot" style={{ background: color }} aria-hidden="true" />
        {label}
      </span>
      <span className="week-stat-value">
        {fmt(value, digits)} <span className="week-stat-unit">{unit}</span>
      </span>
      {tl && <span className="week-stat-target">{t('week.target', { t: tl })}</span>}
    </div>
  );
}

function DayBars({ days, today, onOpenDay }: { days: DaySummary[]; today: string; onOpenDay?: (d: string) => void }) {
  const t = useT();
  const scaleMax = Math.max(1, ...days.map((d) => Math.max(d.totals.kcal, d.targets?.kcal ?? 0))) * 1.05;

  return (
    <ul className="day-bars">
      {days.map((d) => {
        const target = d.targets?.kcal;
        const status = !d.tracked || !target ? '' : d.totals.kcal > target * 1.1 ? 'over' : d.totals.kcal < target * 0.9 ? 'under' : 'ok';
        const future = d.date > today;
        return (
          <li key={d.date} className={`day-bar ${future ? 'day-future' : ''} ${d.date === today ? 'day-today' : ''}`}>
            <button className="day-bar-btn" onClick={() => onOpenDay?.(d.date)} disabled={!onOpenDay}>
              <span className="day-bar-label">
                <span className="day-bar-weekday">{weekdayShort(d.date)}</span>
                <span className="day-bar-date">{formatShortDate(d.date)}</span>
                {d.targets && <span className="day-bar-type">{d.targets.is_training ? t('week.typeT') : t('week.typeR')}</span>}
              </span>
              <span className="day-bar-track">
                {d.tracked && <span className={`day-bar-fill status-${status}`} style={{ width: `${(d.totals.kcal / scaleMax) * 100}%` }} />}
                {target && <span className="day-bar-target" style={{ left: `${(target / scaleMax) * 100}%` }} />}
              </span>
              <span className="day-bar-values">
                {d.tracked ? (
                  <>
                    <strong>{fmt(d.totals.kcal)}</strong>
                    <span className="day-bar-macros">
                      {t('macro.p')} {fmt(d.totals.protein)} · {t('macro.f')} {fmt(d.totals.fat)} · {t('macro.c')} {fmt(d.totals.carbs)}
                    </span>
                  </>
                ) : (
                  <span className="day-bar-empty">{future ? '' : '–'}</span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
