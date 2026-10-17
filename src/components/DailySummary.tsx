import type { CSSProperties } from 'react';
import type { Macros } from '../db/types';
import { fmt } from '../lib/nutrition';
import { statusFor, type DayTargets } from '../lib/goals';
import { useT } from '../i18n';
import { Ring } from './Ring';

interface Props {
  totals: Macros;
  targets?: DayTargets;
  /** Aktivkalorien aus Apple Health (nur Anzeige) */
  activeEnergy?: number;
  /** Schritte des Tages aus Health; nur Anzeige, ändert kein Ziel */
  steps?: number;
  isTraining?: boolean;
  onToggleTraining?: (v: boolean) => void;
  onOpenGoals?: () => void;
}

export function DailySummary({ totals, targets, activeEnergy, steps, isTraining, onToggleTraining, onOpenGoals }: Props) {
  const t = useT();

  if (!targets) {
    return (
      <section className="card summary-simple" aria-label={t('day.summary')}>
        <div className="summary-kcal">
          <span className="summary-kcal-value">{fmt(totals.kcal)}</span>
          <span className="summary-kcal-label">kcal</span>
        </div>
        <div className="summary-macros">
          <MacroStat label={t('macro.protein')} value={totals.protein} color="var(--c-protein)" />
          <MacroStat label={t('macro.fat')} value={totals.fat} color="var(--c-fat)" />
          <MacroStat label={t('macro.carbs')} value={totals.carbs} color="var(--c-carbs)" />
        </div>
        {onOpenGoals && (
          <p className="summary-hint">
            {t('day.noPhase')}{' '}
            <button className="btn-link" onClick={onOpenGoals}>
              {t('day.setGoals')}
            </button>
          </p>
        )}
      </section>
    );
  }

  const st = statusFor(totals, targets);
  const remaining = targets.kcal - totals.kcal;
  const hasActive = activeEnergy !== undefined && activeEnergy > 0;
  const hasSteps = steps !== undefined && steps > 0;

  return (
    <>
      <section className="card summary" aria-label={t('day.summary')}>
        <div className="summary-top">
          <Ring fraction={totals.kcal / targets.kcal}>
            <span className="summary-kcal-value">{fmt(totals.kcal)}</span>
            <span className="summary-kcal-label">/ {fmt(targets.kcal)} kcal</span>
          </Ring>
          <div className="summary-bars">
            <MacroBar label={t('macro.protein')} value={totals.protein} target={targets.protein} color="var(--c-protein)" />
            <MacroBar
              label={t('macro.fat')}
              value={totals.fat}
              target={targets.fat_max}
              targetLabel={`${fmt(targets.fat_min)}–${fmt(targets.fat_max)}`}
              color="var(--c-fat)"
            />
            <MacroBar label={t('macro.carbs')} value={totals.carbs} target={targets.carbs} color="var(--c-carbs)" />
          </div>
        </div>
        <div className="summary-foot">
          <div className={`summary-remaining status-${st.kcal}`}>
            {remaining >= 0 ? t('day.remaining', { n: fmt(remaining) }) : t('day.over', { n: fmt(-remaining) })}
            <span className="summary-phase"> · {targets.phase_name}</span>
          </div>
          {(hasActive || hasSteps) && (
            <div className="summary-health-col">
              {hasActive && <div className="summary-health">{t('day.activeEnergy', { n: fmt(activeEnergy) })}</div>}
              {hasSteps && <div className="summary-health">{t('day.steps', { n: fmt(steps) })}</div>}
            </div>
          )}
        </div>
      </section>

      {onToggleTraining && (
        <div
          className={`segmented daytype ${isTraining ? 'is-training' : 'is-rest'}`}
          role="radiogroup"
          aria-label={t('day.dayType')}
          style={{ '--n': 2, '--i': isTraining ? 0 : 1 } as CSSProperties}
        >
          <label className={isTraining ? 'active' : ''}>
            <input type="radio" name="daytype" checked={!!isTraining} onChange={() => onToggleTraining(true)} />
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M9.5 1 3 9h4l-1 6 6.5-8h-4z" />
            </svg>
            {t('day.training')}
          </label>
          <label className={!isTraining ? 'active' : ''}>
            <input type="radio" name="daytype" checked={!isTraining} onChange={() => onToggleTraining(false)} />
            <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M13.5 10.2A6 6 0 0 1 5.8 2.5a6 6 0 1 0 7.7 7.7Z" />
            </svg>
            {t('day.rest')}
          </label>
        </div>
      )}
    </>
  );
}

function MacroBar({ label, value, target, targetLabel, color }: { label: string; value: number; target: number; targetLabel?: string; color: string }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div className="macro-bar">
      <div className="macro-bar-head">
        <span>{label}</span>
        <span className="macro-bar-values">
          {fmt(value)} / {targetLabel ?? fmt(target)} g
        </span>
      </div>
      <div className="progress-track" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={Math.round(target)} aria-label={label}>
        <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function MacroStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="macro-stat">
      <span className="macro-dot" style={{ background: color }} aria-hidden="true" />
      <span className="macro-value">{fmt(value)} g</span>
      <span className="macro-label">{label}</span>
    </div>
  );
}
