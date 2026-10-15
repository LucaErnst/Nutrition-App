import { useState, type FormEvent } from 'react';
import { useUnitSystem, useSettings, useWeights } from '../db/hooks';
import { bodyWeightUnitFor, ftInToCm, heightUnitFor, kgToLb, lbToKg, stoneToKg } from '../lib/units';
import { useT } from '../i18n';
import { fmt } from '../lib/nutrition';
import { withTrend } from '../lib/weight';
import { suggestGoals, type GoalSuggestion, type Lifestyle, type Phase, type Sex } from '../lib/onboarding';
import type { DailyGoal } from '../db/types';

/** Eingaben als Text, so wie sie im Formular stehen. */
export interface BodyState {
  sex: Sex;
  age: string;
  height: string;
  /** Zoll-Anteil, nur bei Fuss/Zoll */
  heightIn: string;
  weight: string;
  /** Pfund-Anteil, nur bei Stone */
  weightLb: string;
  lifestyle: Lifestyle;
  phase: Phase;
}

export const EMPTY_BODY: BodyState = { sex: 'male', age: '', height: '', heightIn: '', weight: '', weightLb: '', lifestyle: 'sitting', phase: 'bulk' };

export function num(v: string): number {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Rechnet die Eingaben in cm und kg um – eingegeben wird in der Einheit des Geräts. */
export function useBodyMetrics(b: BodyState) {
  const system = useUnitSystem();
  const bodyUnit = bodyWeightUnitFor(system);
  const hUnit = heightUnitFor(system);
  const heightCm = hUnit === 'cm' ? num(b.height) : ftInToCm(num(b.height), num(b.heightIn));
  const weightKg = bodyUnit === 'kg' ? num(b.weight) : bodyUnit === 'lb' ? lbToKg(num(b.weight)) : stoneToKg(num(b.weight), num(b.weightLb));
  const valid = num(b.age) > 0 && heightCm > 0 && weightKg > 0;
  return { bodyUnit, hUnit, heightCm, weightKg, valid };
}

/** Geschlecht, Alter, Grösse, Gewicht, Alltag und Ziel – geteilt von Onboarding und Rechner unter „Mehr". */
export function BodyFields({ value, onChange, name }: { value: BodyState; onChange: (patch: Partial<BodyState>) => void; name: string }) {
  const t = useT();
  const { bodyUnit, hUnit } = useBodyMetrics(value);
  return (
    <>
      <div className="field">
        <span>{t('ob.sex')}</span>
        <div className="segmented" role="radiogroup" aria-label={t('ob.sex')}>
          {(['male', 'female'] as Sex[]).map((s) => (
            <label key={s} className={value.sex === s ? 'active' : ''}>
              <input type="radio" name={`${name}-sex`} checked={value.sex === s} onChange={() => onChange({ sex: s })} />
              {s === 'male' ? t('ob.male') : t('ob.female')}
            </label>
          ))}
        </div>
      </div>
      <div className="field-row">
        <label className="field">
          <span>{t('ob.age')}</span>
          <input type="number" inputMode="numeric" min={10} max={100} value={value.age} onChange={(e) => onChange({ age: e.target.value })} required />
        </label>
        <label className="field">
          <span>{t('ob.height', { unit: hUnit === 'cm' ? 'cm' : 'ft' })}</span>
          <input
            type="number"
            inputMode="numeric"
            min={hUnit === 'cm' ? 100 : 3}
            max={hUnit === 'cm' ? 250 : 8}
            value={value.height}
            onChange={(e) => onChange({ height: e.target.value })}
            required
          />
        </label>
        {hUnit === 'ftin' && (
          <label className="field">
            <span>in</span>
            <input type="number" inputMode="numeric" min={0} max={11} value={value.heightIn} onChange={(e) => onChange({ heightIn: e.target.value })} />
          </label>
        )}
      </div>
      <div className="field-row">
        <label className="field">
          <span>{t('ob.weight', { unit: bodyUnit === 'st' ? 'st' : bodyUnit })}</span>
          <input
            type="number"
            inputMode="decimal"
            step={bodyUnit === 'st' ? 1 : 0.1}
            min={bodyUnit === 'kg' ? 30 : bodyUnit === 'lb' ? 66 : 4}
            max={bodyUnit === 'kg' ? 300 : bodyUnit === 'lb' ? 661 : 47}
            value={value.weight}
            onChange={(e) => onChange({ weight: e.target.value })}
            required
          />
        </label>
        {bodyUnit === 'st' && (
          <label className="field">
            <span>lb</span>
            <input type="number" inputMode="decimal" step={0.1} min={0} max={13.9} value={value.weightLb} onChange={(e) => onChange({ weightLb: e.target.value })} />
          </label>
        )}
      </div>
      <label className="field">
        <span>{t('ob.lifestyle')}</span>
        <select value={value.lifestyle} onChange={(e) => onChange({ lifestyle: e.target.value as Lifestyle })}>
          <option value="sitting">{t('ob.lsSitting')}</option>
          <option value="mixed">{t('ob.lsMixed')}</option>
          <option value="standing">{t('ob.lsStanding')}</option>
          <option value="physical">{t('ob.lsPhysical')}</option>
        </select>
      </label>
      <div className="field">
        <span>{t('ob.phase')}</span>
        <div className="segmented" role="radiogroup" aria-label={t('ob.phase')}>
          {(['cut', 'maintain', 'bulk'] as Phase[]).map((p) => (
            <label key={p} className={value.phase === p ? 'active' : ''}>
              <input type="radio" name={`${name}-phase`} checked={value.phase === p} onChange={() => onChange({ phase: p })} />
              {p === 'cut' ? t('ob.cut') : p === 'maintain' ? t('ob.maintain') : t('ob.bulk')}
            </label>
          ))}
        </div>
      </div>
    </>
  );
}

/** Herleitung als Tabelle: welche Eingabe macht wie viel aus. */
export function NeedsBreakdown({ g, trainingDays, weightKg }: { g: GoalSuggestion; trainingDays: number; weightKg: number }) {
  const t = useT();
  const s = g.steps;
  const signed = (n: number) => (n > 0 ? `+${fmt(n)}` : n < 0 ? `−${fmt(-n)}` : '±0');
  return (
    <div className="needs">
      <table className="needs-table" aria-label={t('ob.breakdown')}>
        <tbody>
          <tr>
            <th scope="row">{t('ob.rowBmr')}</th>
            <td>{fmt(s.bmr)} kcal</td>
          </tr>
          <tr>
            <th scope="row">{t('ob.rowLifestyle')}</th>
            <td>{signed(s.lifestyle)} kcal</td>
          </tr>
          <tr>
            <th scope="row">{t('ob.rowTraining', { n: trainingDays })}</th>
            <td>{signed(s.training)} kcal</td>
          </tr>
          <tr className="needs-sum">
            <th scope="row">{t('ob.rowMaintenance')}</th>
            <td>{fmt(s.maintenance)} kcal</td>
          </tr>
          <tr>
            <th scope="row">{t('ob.rowPhase')}</th>
            <td>{signed(s.phase)} kcal</td>
          </tr>
          <tr className="needs-sum">
            <th scope="row">{t('ob.rowTarget')}</th>
            <td>{fmt(s.target)} kcal</td>
          </tr>
        </tbody>
      </table>
      <p className="search-hint">
        {trainingDays > 0 && trainingDays < 7
          ? t('ob.split', { train: fmt(g.training_day_kcal), rest: fmt(g.rest_day_kcal) })
          : t('ob.flat', { n: fmt(g.rest_day_kcal) })}
      </p>
      {g.floored && <p className="search-hint">{t('ob.floored')}</p>}
      {g.reference_weight_kg < Math.round(weightKg) && <p className="search-hint">{t('ob.refWeight')}</p>}
      <p className="search-hint">{t('ob.startingPoint')}</p>
    </div>
  );
}

/** Werte, die der Rechner an das Phasen-Formular weitergibt. */
export type GoalPrefill = Pick<DailyGoal, 'phase_type' | 'training_day_kcal' | 'rest_day_kcal' | 'protein_g' | 'fat_min_g' | 'fat_max_g'>;

/**
 * Rechner unter „Mehr": Körperdaten → Herleitung → übernehmen. Ändert nie selbst Ziele; der
 * Vorschlag landet im Phasen-Formular, gespeichert wird erst dort.
 */
export function NeedsCalculator({ hasActive, onApply }: { hasActive: boolean; onApply: (p: GoalPrefill, mode: 'new' | 'active') => void }) {
  const t = useT();
  const settings = useSettings();
  const weights = useWeights();
  const [body, setBody] = useState<BodyState>(() => EMPTY_BODY);
  const [prefilled, setPrefilled] = useState(false);
  const [result, setResult] = useState<GoalSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const metrics = useBodyMetrics(body);
  const trainingDays = settings?.training_weekdays?.length ?? 0;

  // Aktuelles Gewicht aus dem 7-Tage-Schnitt vorbelegen, einmal.
  if (!prefilled && weights && weights.length > 0) {
    const last = withTrend(weights).at(-1)!;
    const kg = Math.round(last.trend * 10) / 10;
    const w = metrics.bodyUnit === 'kg' ? String(kg) : metrics.bodyUnit === 'lb' ? String(Math.round(kgToLb(kg))) : '';
    setPrefilled(true);
    if (w) setBody((b) => ({ ...b, weight: w }));
  }

  function calc(ev: FormEvent) {
    ev.preventDefault();
    if (!metrics.valid) return setError(t('ob.errBody'));
    setError(null);
    setResult(suggestGoals({ sex: body.sex, age: num(body.age), height_cm: metrics.heightCm, weight_kg: metrics.weightKg, lifestyle: body.lifestyle, phase: body.phase, training_days: trainingDays }));
  }

  const prefill = (g: GoalSuggestion): GoalPrefill => ({
    phase_type: body.phase,
    training_day_kcal: g.training_day_kcal,
    rest_day_kcal: g.rest_day_kcal,
    protein_g: g.protein_g,
    fat_min_g: g.fat_min_g,
    fat_max_g: g.fat_max_g,
  });

  return (
    <form className="form" onSubmit={calc}>
      <p className="search-hint">{t('ob.bodyHint')}</p>
      <BodyFields value={body} onChange={(p) => { setBody((b) => ({ ...b, ...p })); setResult(null); }} name="calc" />
      <p className="search-hint">{t('calc.trainingDaysFrom', { n: trainingDays })}</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {!result && (
        <button type="submit" className="btn-primary btn-wide">
          {t('calc.compute')}
        </button>
      )}
      {result && (
        <>
          <NeedsBreakdown g={result} trainingDays={trainingDays} weightKg={metrics.weightKg} />
          <p className="search-hint">
            {t('calc.macros', { p: fmt(result.protein_g), fmin: fmt(result.fat_min_g), fmax: fmt(result.fat_max_g) })}
          </p>
          <div className="ob-actions">
            <button type="button" className="btn-primary btn-wide" onClick={() => onApply(prefill(result), 'new')}>
              {t('calc.applyNew')}
            </button>
            {hasActive && (
              <button type="button" className="btn-link" onClick={() => onApply(prefill(result), 'active')}>
                {t('calc.applyActive')}
              </button>
            )}
          </div>
        </>
      )}
    </form>
  );
}
