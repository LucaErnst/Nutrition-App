import { useState } from 'react';
import { useDaySummaries } from '../db/hooks';
import { addDays, formatShortDate, todayISO, weekDates, weekStartOf, weekdayShort } from '../lib/date';
import { fmt } from '../lib/nutrition';
import { summarizeWeek, weekBudget, type DaySummary } from '../lib/week';
import { WeekBudgetCard } from './WeekBudgetCard';

interface Props {
  onOpenDay?: (date: string) => void;
}

export function WeekView({ onOpenDay }: Props) {
  const today = todayISO();
  const [start, setStart] = useState(weekStartOf(today));
  const dates = weekDates(start);
  const days = useDaySummaries(dates);
  const week = days ? summarizeWeek(days, today) : undefined;
  const budget = days ? weekBudget(days, today) : undefined;
  const isCurrent = start === weekStartOf(today);

  return (
    <div className="week">
      <nav className="date-nav" aria-label="Woche">
        <button className="btn-icon" onClick={() => setStart(addDays(start, -7))} aria-label="Vorherige Woche">
          ‹
        </button>
        <div className="date-nav-center">
          <span className="date-label">
            {isCurrent ? 'Diese Woche' : `${formatShortDate(start)} – ${formatShortDate(addDays(start, 6))}`}
          </span>
          {isCurrent && (
            <span className="date-sub">
              {formatShortDate(start)} – {formatShortDate(addDays(start, 6))}
            </span>
          )}
        </div>
        <button className="btn-icon" onClick={() => setStart(addDays(start, 7))} aria-label="Nächste Woche" disabled={isCurrent}>
          ›
        </button>
      </nav>

      {week && (
        <>
          <section className="card section" aria-label="Wochenschnitt">
            <div className="section-head">
              <h2>Wochenschnitt</h2>
              <span className="search-hint">{week.trackedCount} von 7 Tagen erfasst</span>
            </div>
            <div className="week-stats">
              <Stat label="Kalorien" value={week.avg.kcal} target={week.avgTarget?.kcal} unit="kcal" color="var(--c-kcal)" />
              <Stat label="Protein" value={week.avg.protein} target={week.avgTarget?.protein} unit="g" color="var(--c-protein)" prefix="≥ " />
              <Stat
                label="Fett"
                value={week.avg.fat}
                targetLabel={week.avgTarget ? `${fmt(week.avgTarget.fat_min)}–${fmt(week.avgTarget.fat_max)} g` : undefined}
                unit="g"
                color="var(--c-fat)"
              />
              <Stat label="Kohlenhydrate" value={week.avg.carbs} target={week.avgTarget?.carbs} unit="g" color="var(--c-carbs)" prefix="≈ " />
            </div>
            {week.totalTargetKcal !== undefined && (
              <p className="week-total">
                Summe erfasste Tage: <strong>{fmt(week.total.kcal)}</strong> von {fmt(week.totalTargetKcal)} kcal
                {' '}({week.total.kcal >= week.totalTargetKcal ? '+' : '−'}{fmt(Math.abs(week.total.kcal - week.totalTargetKcal))})
              </p>
            )}
          </section>

          {budget && <WeekBudgetCard budget={budget} isCurrent={isCurrent} />}

          <section className="card section" aria-label="Fazit">
            <h2>Fazit</h2>
            <ul className="conclusions">
              {week.conclusions.map((c, i) => (
                <li key={i} className={`conclusion conclusion-${c.kind}`}>
                  <span className="conclusion-icon" aria-hidden="true">
                    {c.kind === 'ok' ? '✓' : c.kind === 'warn' ? '!' : 'i'}
                  </span>
                  {c.text}
                </li>
              ))}
            </ul>
          </section>

          <section className="card section" aria-label="Tage">
            <h2>Tage</h2>
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
}

function Stat({ label, value, target, targetLabel, unit, color, prefix = '' }: StatProps) {
  const tl = targetLabel ?? (target !== undefined ? `${prefix}${fmt(target)} ${unit}` : undefined);
  return (
    <div className="week-stat">
      <span className="progress-label">
        <span className="macro-dot" style={{ background: color }} aria-hidden="true" />
        {label}
      </span>
      <span className="week-stat-value">
        {fmt(value)} <span className="week-stat-unit">{unit}</span>
      </span>
      {tl && <span className="week-stat-target">Ziel {tl}</span>}
    </div>
  );
}

function DayBars({ days, today, onOpenDay }: { days: DaySummary[]; today: string; onOpenDay?: (d: string) => void }) {
  const scaleMax = Math.max(
    1,
    ...days.map((d) => Math.max(d.totals.kcal, d.targets?.kcal ?? 0)),
  ) * 1.05;

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
                {d.targets && <span className="day-bar-type">{d.targets.is_training ? 'T' : 'R'}</span>}
              </span>
              <span className="day-bar-track">
                {d.tracked && (
                  <span className={`day-bar-fill status-${status}`} style={{ width: `${(d.totals.kcal / scaleMax) * 100}%` }} />
                )}
                {target && <span className="day-bar-target" style={{ left: `${(target / scaleMax) * 100}%` }} />}
              </span>
              <span className="day-bar-values">
                {d.tracked ? (
                  <>
                    <strong>{fmt(d.totals.kcal)}</strong>
                    <span className="day-bar-macros">P {fmt(d.totals.protein)} · F {fmt(d.totals.fat)} · KH {fmt(d.totals.carbs)}</span>
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
