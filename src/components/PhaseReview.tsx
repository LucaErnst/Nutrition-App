import { useState } from 'react';
import { db } from '../db/db';
import type { DailyGoal } from '../db/types';
import { useDaySummaries, useWeights } from '../db/hooks';
import { addDays, formatDate, formatShortDate, todayISO } from '../lib/date';
import { fmt } from '../lib/nutrition';
import { evaluatePhase, type PhaseReport } from '../lib/phase';
import { scheduleReminderSync } from '../lib/remindersNative';
import { phaseDisplayName, useT } from '../i18n';
import { Modal } from './Modal';

interface Props {
  goal: DailyGoal;
  onClose: () => void;
}

/** Mehr → Phase → Auswertung: Zufuhr, Gewichtstrend, Wochen, Fazit nach Coaching-Regeln. */
export function PhaseReview({ goal, onClose }: Props) {
  const t = useT();
  const today = todayISO();
  const end = goal.end_date && goal.end_date < today ? goal.end_date : today;
  const dates: string[] = [];
  for (let d = goal.start_date; d <= end; d = addDays(d, 1)) dates.push(d);
  const days = useDaySummaries(dates);
  const weights = useWeights();
  const [applied, setApplied] = useState(false);

  const report: PhaseReport | undefined = days && weights ? evaluatePhase({ goal, days, weights, today }) : undefined;

  async function apply() {
    if (!report?.adjustment || !goal.id) return;
    await db.goals.update(goal.id, {
      training_day_kcal: report.adjustment.training_day_kcal,
      rest_day_kcal: report.adjustment.rest_day_kcal,
      adjusted_at: today,
    });
    scheduleReminderSync();
    setApplied(true);
  }

  const sign = (n: number) => `${n >= 0 ? '+' : '−'}${fmt(Math.abs(n))}`;
  const maxKcal = report ? Math.max(...report.weeks.map((w) => Math.max(w.avgKcal ?? 0, w.avgTargetKcal ?? 0)), 1) : 1;

  return (
    <Modal title={`${t('phase.title')} · ${phaseDisplayName(goal)}`} onClose={onClose}>
      {!report ? (
        <p className="search-hint">…</p>
      ) : (
        <div className="phase-review">
          <p className="search-hint">{t('phase.range', { start: formatDate(report.start), end: formatDate(report.end), week: Math.max(1, Math.ceil(report.elapsedDays / 7)) })}</p>

          <h4>{t('phase.intakeTitle')}</h4>
          <div className="week-stats">
            <Stat label={t('macro.kcal')} value={report.intake.avgKcal} unit="kcal" target={report.intake.avgTargetKcal} />
            <Stat label={t('macro.protein')} value={report.intake.avgProtein} unit="g" target={report.intake.avgProteinTarget} prefix="≥ " />
            <Stat label={t('macro.fat')} value={report.intake.avgFat} unit="g" />
            <Stat label={t('macro.carbs')} value={report.intake.avgCarbs} unit="g" />
          </div>
          <p className="search-hint">{t('phase.tracked', { n: report.intake.trackedDays, total: report.elapsedDays })}</p>

          <h4>{t('phase.weightTitle')}</h4>
          {report.weight.startTrend !== undefined && report.weight.currentTrend !== undefined ? (
            <>
              <p className="phase-weight-line">
                {t('phase.weightLine', {
                  start: fmt(report.weight.startTrend, 1),
                  now: fmt(report.weight.currentTrend, 1),
                  delta: sign(Math.round((report.weight.deltaKg ?? 0) * 10) / 10),
                  weeks: fmt(report.elapsedWeeks, 1),
                })}
              </p>
              {report.weight.rate2wPct !== undefined && (
                <p className="search-hint">{t('phase.rate', { rate: `${report.weight.rate2wPct >= 0 ? '+' : '−'}${fmt(Math.abs(report.weight.rate2wPct), 2)}` })}</p>
              )}
            </>
          ) : (
            <p className="search-hint">–</p>
          )}
          <p className="search-hint">{t('phase.weighed', { n: report.weight.weighDays, total: report.elapsedDays })}</p>

          <h4>{t('phase.weeksTitle')}</h4>
          <ul className="phase-weeks">
            {report.weeks.map((w, i) => (
              <li key={w.start} className="phase-week">
                <span className="phase-week-label">
                  {t('phase.weekRow', { n: i + 1 })}
                  <span className="day-bar-date">{formatShortDate(w.start)}</span>
                </span>
                <span className="day-bar-track">
                  {w.avgKcal !== undefined && <span className="day-bar-fill status-ok" style={{ width: `${(w.avgKcal / maxKcal) * 100}%` }} />}
                  {w.avgTargetKcal !== undefined && <span className="day-bar-target" style={{ left: `${(w.avgTargetKcal / maxKcal) * 100}%` }} />}
                </span>
                <span className="phase-week-values">
                  <strong>{w.avgKcal !== undefined ? fmt(w.avgKcal) : '–'}</strong>
                  <span className="phase-week-trend">{w.trendKg !== undefined ? `${fmt(w.trendKg, 1)} kg` : '–'}</span>
                </span>
              </li>
            ))}
          </ul>

          <h4>{t('phase.verdictTitle')}</h4>
          <ul className="conclusions">
            {report.messages.map((m, i) => (
              <li key={i} className={`conclusion conclusion-${m.kind}`}>
                <span className="conclusion-icon" aria-hidden="true">
                  {m.kind === 'ok' ? '✓' : m.kind === 'warn' ? '!' : 'i'}
                </span>
                {t(m.key, fmtParams(m.params))}
              </li>
            ))}
          </ul>
          <p className="search-hint">{t('phase.contextHint')}</p>

          {report.adjustment && !applied && (
            <div className="phase-apply">
              <p className="search-hint">
                {t('phase.applyHint', {
                  t: fmt(report.adjustment.training_day_kcal),
                  dt: sign(report.adjustment.delta_training),
                  r: fmt(report.adjustment.rest_day_kcal),
                  dr: sign(report.adjustment.delta_rest),
                })}
              </p>
              <button className="btn-primary" onClick={() => void apply()}>
                {t('phase.apply')}
              </button>
            </div>
          )}
          {applied && <p className="form-ok">{t('phase.applied')}</p>}

          <blockquote className="phase-quote">{t(report.verdict === 'too_fast' && report.type === 'cut' ? 'phase.quote2' : report.verdict === 'on_track' ? 'phase.quote3' : 'phase.quote1')}</blockquote>
        </div>
      )}
    </Modal>
  );
}

/** Zahlen in Meldungen nach Sprache formatieren (0.29 → 0,29) */
function fmtParams(p?: Record<string, string | number>): Record<string, string | number> | undefined {
  if (!p) return p;
  return Object.fromEntries(Object.entries(p).map(([k, v]) => [k, typeof v === 'number' ? fmt(v, Number.isInteger(v) ? 0 : 2) : v]));
}

function Stat({ label, value, unit, target, prefix = '' }: { label: string; value?: number; unit: string; target?: number; prefix?: string }) {
  const t = useT();
  return (
    <div className="week-stat">
      <span className="progress-label">{label}</span>
      <span className="week-stat-value">
        {value !== undefined ? fmt(value) : '–'} <span className="week-stat-unit">{unit}</span>
      </span>
      {target !== undefined && <span className="week-stat-target">{t('week.target', { t: `${prefix}${fmt(target)} ${unit}` })}</span>}
    </div>
  );
}
