import { addWater, DEFAULT_WATER_GOAL_ML, removeLastWater, useSettings, useUnitSystem, useWaterForDay } from '../db/hooks';
import { waterLeftLabel, waterPair, waterStepLabel, waterSteps } from '../lib/nutrition';
import { useT } from '../i18n';
import { useToast } from './Toast';

interface Props {
  date: string;
}

/** Kompakte Wasser-Zeile: Tagesmenge, Ziel, Balken, Schnellwahl in der Einheit des Nutzers. */
export function WaterRow({ date }: Props) {
  const t = useT();
  const toast = useToast();
  const ml = useWaterForDay(date) ?? 0;
  const settings = useSettings();
  const goal = settings?.water_goal_ml ?? DEFAULT_WATER_GOAL_ML;
  const system = useUnitSystem();
  const pct = Math.min(100, (ml / goal) * 100);
  const left = goal - ml;
  const pair = waterPair(ml, goal, system);
  const steps = waterSteps(system);

  async function add(amount: number) {
    await addWater(date, amount);
  }

  async function undo() {
    const removed = await removeLastWater(date);
    if (removed) toast.show({ message: `−${waterStepLabel(removed, system)}` });
  }

  return (
    <section className="card water" aria-label={t('water.title')}>
      <div className="water-head">
        <span className="water-title">
          <span className="water-icon" aria-hidden="true">
            💧
          </span>
          {t('water.title')}
        </span>
        <span className="water-amount">{t('water.of', pair)}</span>
      </div>
      <div className="progress-track water-track" role="progressbar" aria-valuenow={ml} aria-valuemin={0} aria-valuemax={goal} aria-label={t('water.title')}>
        <div className={`progress-fill ${ml >= goal ? 'water-full' : ''}`} style={{ width: `${pct}%`, background: 'var(--c-water)' }} />
      </div>
      <div className="water-actions">
        <span className="water-left">{left > 0 ? t('water.left', { n: waterLeftLabel(left, system) }) : t('water.goalReached')}</span>
        <div className="water-buttons">
          {ml > 0 && (
            <button className="btn-icon" onClick={() => void undo()} aria-label={t('water.remove')} title={t('water.remove')}>
              −
            </button>
          )}
          {steps.map((s) => (
            <button key={s} className="chip water-chip" onClick={() => void add(s)} aria-label={t('water.add', { n: waterStepLabel(s, system) })}>
              +{waterStepLabel(s, system)}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
