import { addWater, DEFAULT_WATER_GOAL_ML, removeLastWater, useSettings, useWaterForDay } from '../db/hooks';
import { fmt, fmtMax } from '../lib/nutrition';
import { useT } from '../i18n';
import { useToast } from './Toast';

interface Props {
  date: string;
}

const STEPS = [250, 500];

/** Kompakte Wasser-Zeile: Tagesmenge, Ziel, Balken, +250 / +500 ml. */
export function WaterRow({ date }: Props) {
  const t = useT();
  const toast = useToast();
  const ml = useWaterForDay(date) ?? 0;
  const settings = useSettings();
  const goal = settings?.water_goal_ml ?? DEFAULT_WATER_GOAL_ML;
  const pct = Math.min(100, (ml / goal) * 100);
  const left = goal - ml;

  async function add(amount: number) {
    await addWater(date, amount);
  }

  async function undo() {
    const removed = await removeLastWater(date);
    if (removed) toast.show({ message: `−${removed} ml` });
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
        <span className="water-amount">{t('water.of', { amount: fmtMax(ml / 1000, 2), goal: fmt(goal / 1000, 1) })}</span>
      </div>
      <div className="progress-track water-track" role="progressbar" aria-valuenow={ml} aria-valuemin={0} aria-valuemax={goal} aria-label={t('water.title')}>
        <div className={`progress-fill ${ml >= goal ? 'water-full' : ''}`} style={{ width: `${pct}%`, background: 'var(--c-water)' }} />
      </div>
      <div className="water-actions">
        <span className="water-left">{left > 0 ? t('water.left', { n: fmt(left) }) : t('water.goalReached')}</span>
        <div className="water-buttons">
          {ml > 0 && (
            <button className="btn-icon" onClick={() => void undo()} aria-label={t('water.remove')} title={t('water.remove')}>
              −
            </button>
          )}
          {STEPS.map((s) => (
            <button key={s} className="chip water-chip" onClick={() => void add(s)} aria-label={t('water.add', { n: s })}>
              +{s} ml
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
