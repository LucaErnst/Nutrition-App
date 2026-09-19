import type { Macros } from '../db/types';
import { fmt } from '../lib/nutrition';
import { statusFor, type DayTargets } from '../lib/goals';
import { useT } from '../i18n';
import { ProgressBar } from './ProgressBar';

interface Props {
  totals: Macros;
  targets?: DayTargets;
  isTraining?: boolean;
  onToggleTraining?: (v: boolean) => void;
  onOpenGoals?: () => void;
}

export function DailySummary({ totals, targets, isTraining, onToggleTraining, onOpenGoals }: Props) {
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

  return (
    <section className="card summary" aria-label={t('day.summary')}>
      <div className="summary-top">
        <div>
          <div className="summary-kcal">
            <span className="summary-kcal-value">{fmt(totals.kcal)}</span>
            <span className="summary-kcal-label">/ {fmt(targets.kcal)} kcal</span>
          </div>
          <div className={`summary-remaining status-${st.kcal}`}>
            {remaining >= 0 ? t('day.remaining', { n: fmt(remaining) }) : t('day.over', { n: fmt(-remaining) })}
            <span className="summary-phase"> · {targets.phase_name}</span>
          </div>
        </div>
        {onToggleTraining && (
          <div className="segmented segmented-sm" role="radiogroup" aria-label={t('day.dayType')}>
            <label className={isTraining ? 'active' : ''}>
              <input type="radio" name="daytype" checked={!!isTraining} onChange={() => onToggleTraining(true)} />
              {t('day.training')}
            </label>
            <label className={!isTraining ? 'active' : ''}>
              <input type="radio" name="daytype" checked={!isTraining} onChange={() => onToggleTraining(false)} />
              {t('day.rest')}
            </label>
          </div>
        )}
      </div>

      <div className="progress-list">
        <ProgressBar label={t('macro.kcal')} value={totals.kcal} target={targets.kcal} unit="kcal" color="var(--c-kcal)" status={st.kcal} />
        <ProgressBar label={t('macro.protein')} value={totals.protein} target={targets.protein} unit="g" color="var(--c-protein)" status={st.protein} />
        <ProgressBar label={t('macro.fat')} value={totals.fat} target={targets.fat_max} range={[targets.fat_min, targets.fat_max]} unit="g" color="var(--c-fat)" status={st.fat} />
        <ProgressBar
          label={t('macro.carbs')}
          value={totals.carbs}
          target={targets.carbs}
          unit="g"
          color="var(--c-carbs)"
          status={totals.carbs > targets.carbs * 1.15 ? 'over' : totals.carbs >= targets.carbs * 0.9 ? 'ok' : 'under'}
        />
      </div>
    </section>
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
