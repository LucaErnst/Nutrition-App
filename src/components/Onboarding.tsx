import { useState, type FormEvent } from 'react';
import { db } from '../db/db';
import { saveSettings, upsertWeight, useUnitSystem } from '../db/hooks';
import { bodyWeightUnitFor, ftInToCm, heightUnitFor, lbToKg, stoneToKg } from '../lib/units';
import { useI18n, useT, type Language } from '../i18n';
import { todayISO } from '../lib/date';
import { fmt } from '../lib/nutrition';
import { suggestGoals, type Activity, type Phase, type Sex } from '../lib/onboarding';
import { getLocale } from '../i18n';

interface Props {
  onDone: () => void;
}

type Step = 'welcome' | 'body' | 'result';

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

function num(v: string): number {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Erststart-Assistent: Sprache, Körperdaten, Zielvorschlag → Phase, Gewicht, Trainingstage, Wasserziel. */
export function Onboarding({ onDone }: Props) {
  const t = useT();
  const { lang, setLanguage } = useI18n();
  const [step, setStep] = useState<Step>('welcome');
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  /** Zoll-Anteil, nur bei Fuss/Zoll */
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  /** Pfund-Anteil, nur bei Stone */
  const [weightLb, setWeightLb] = useState('');
  const [activity, setActivity] = useState<Activity>('high');
  const [phase, setPhase] = useState<Phase>('bulk');
  const [trainingDays, setTrainingDays] = useState<number[]>([1, 2, 4, 5]);
  const [error, setError] = useState<string | null>(null);

  // Körpermasse werden in Zentimetern und Kilogramm gerechnet; eingegeben wird in der
  // Einheit des Geräts (USA: lb und ft/in, England: st und ft/in).
  const system = useUnitSystem();
  const bodyUnit = bodyWeightUnitFor(system);
  const hUnit = heightUnitFor(system);
  const heightCm = hUnit === 'cm' ? num(height) : ftInToCm(num(height), num(heightIn));
  const weightKg =
    bodyUnit === 'kg' ? num(weight) : bodyUnit === 'lb' ? lbToKg(num(weight)) : stoneToKg(num(weight), num(weightLb));

  // Vorschlag (editierbar)
  const [trainKcal, setTrainKcal] = useState('');
  const [restKcal, setRestKcal] = useState('');
  const [protein, setProtein] = useState('');
  const [fatMin, setFatMin] = useState('');
  const [fatMax, setFatMax] = useState('');
  const [water, setWater] = useState('');
  const [phaseName, setPhaseName] = useState('');
  const [bmrInfo, setBmrInfo] = useState<{ bmr: number; tdee: number } | null>(null);

  async function finish(skip: boolean) {
    if (!skip) {
      const name = phaseName.trim() || phaseLabel(phase);
      await db.goals.add({
        phase_name: name,
        phase_type: phase,
        start_date: todayISO(),
        training_day_kcal: num(trainKcal),
        rest_day_kcal: num(restKcal),
        protein_g: num(protein),
        fat_min_g: num(fatMin),
        fat_max_g: num(fatMax),
      });
      if (weightKg > 0) await upsertWeight(todayISO(), Math.round(weightKg * 10) / 10);
      await saveSettings({ training_weekdays: trainingDays, water_goal_ml: num(water) || undefined, onboarding_done: true });
    } else {
      await saveSettings({ onboarding_done: true });
    }
    onDone();
  }

  function phaseLabel(p: Phase): string {
    return p === 'cut' ? t('ob.phaseCut') : p === 'maintain' ? t('ob.phaseMaintain') : t('ob.phaseBulk');
  }

  function toBody(ev: FormEvent) {
    ev.preventDefault();
    if (num(age) <= 0 || heightCm <= 0 || weightKg <= 0) return setError(t('ob.errBody'));
    setError(null);
    const g = suggestGoals({ sex, age: num(age), height_cm: heightCm, weight_kg: weightKg, activity, phase, training_days: trainingDays.length });
    setTrainKcal(String(g.training_day_kcal));
    setRestKcal(String(g.rest_day_kcal));
    setProtein(String(g.protein_g));
    setFatMin(String(g.fat_min_g));
    setFatMax(String(g.fat_max_g));
    setWater(String(g.water_ml));
    setPhaseName(phaseLabel(phase));
    setBmrInfo({ bmr: g.bmr, tdee: g.tdee });
    setStep('result');
  }

  const weekdayName = (d: number) => new Date(2026, 8, 6 + d).toLocaleDateString(getLocale(), { weekday: 'short' }).replace('.', '');

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-label={t('ob.welcome')}>
      <div className="onboarding-card">
        {step === 'welcome' && (
          <>
            <div className="ob-logo" aria-hidden="true">
              <img src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width={72} height={72} />
            </div>
            <h1>{t('ob.welcome')}</h1>
            <p className="ob-intro">{t('ob.intro')}</p>
            <div className="field">
              <span>{t('ob.chooseLanguage')}</span>
              <div className="segmented" role="radiogroup" aria-label={t('ob.chooseLanguage')}>
                {(['en', 'de'] as Language[]).map((l) => (
                  <label key={l} className={lang === l ? 'active' : ''}>
                    <input type="radio" name="ob-lang" checked={lang === l} onChange={() => setLanguage(l)} />
                    {l === 'en' ? 'English' : 'Deutsch'}
                  </label>
                ))}
              </div>
            </div>
            <div className="ob-actions">
              <button className="btn-primary btn-wide" onClick={() => setStep('body')}>
                {t('ob.next')}
              </button>
              <button className="btn-link" onClick={() => void finish(true)}>
                {t('ob.skip')}
              </button>
            </div>
          </>
        )}

        {step === 'body' && (
          <form className="form" onSubmit={toBody}>
            <h2>{t('ob.bodyTitle')}</h2>
            <p className="search-hint">{t('ob.bodyHint')}</p>
            <div className="field">
              <span>{t('ob.sex')}</span>
              <div className="segmented" role="radiogroup" aria-label={t('ob.sex')}>
                {(['male', 'female'] as Sex[]).map((s) => (
                  <label key={s} className={sex === s ? 'active' : ''}>
                    <input type="radio" name="ob-sex" checked={sex === s} onChange={() => setSex(s)} />
                    {s === 'male' ? t('ob.male') : t('ob.female')}
                  </label>
                ))}
              </div>
            </div>
            <div className="field-row">
              <label className="field">
                <span>{t('ob.age')}</span>
                <input type="number" inputMode="numeric" min={10} max={100} value={age} onChange={(e) => setAge(e.target.value)} required />
              </label>
              <label className="field">
                <span>{t('ob.height', { unit: hUnit === 'cm' ? 'cm' : 'ft' })}</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={hUnit === 'cm' ? 100 : 3}
                  max={hUnit === 'cm' ? 250 : 8}
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  required
                />
              </label>
              {hUnit === 'ftin' && (
                <label className="field">
                  <span>in</span>
                  <input type="number" inputMode="numeric" min={0} max={11} value={heightIn} onChange={(e) => setHeightIn(e.target.value)} />
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
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  required
                />
              </label>
              {bodyUnit === 'st' && (
                <label className="field">
                  <span>lb</span>
                  <input type="number" inputMode="decimal" step={0.1} min={0} max={13.9} value={weightLb} onChange={(e) => setWeightLb(e.target.value)} />
                </label>
              )}
            </div>
            <label className="field">
              <span>{t('ob.activity')}</span>
              <select value={activity} onChange={(e) => setActivity(e.target.value as Activity)}>
                <option value="low">{t('ob.actLow')}</option>
                <option value="moderate">{t('ob.actModerate')}</option>
                <option value="high">{t('ob.actHigh')}</option>
                <option value="athlete">{t('ob.actAthlete')}</option>
              </select>
            </label>
            <div className="field">
              <span>{t('ob.phase')}</span>
              <div className="segmented" role="radiogroup" aria-label={t('ob.phase')}>
                {(['cut', 'maintain', 'bulk'] as Phase[]).map((p) => (
                  <label key={p} className={phase === p ? 'active' : ''}>
                    <input type="radio" name="ob-phase" checked={phase === p} onChange={() => setPhase(p)} />
                    {p === 'cut' ? t('ob.cut') : p === 'maintain' ? t('ob.maintain') : t('ob.bulk')}
                  </label>
                ))}
              </div>
            </div>
            <div className="field">
              <span>{t('ob.trainingDays')}</span>
              <div className="weekday-picker" role="group" aria-label={t('ob.trainingDays')}>
                {WEEKDAYS.map((d) => {
                  const on = trainingDays.includes(d);
                  return (
                    <button
                      key={d}
                      type="button"
                      className={`weekday ${on ? 'active' : ''}`}
                      aria-pressed={on}
                      onClick={() => setTrainingDays((list) => (on ? list.filter((x) => x !== d) : [...list, d]))}
                    >
                      {weekdayName(d)}
                    </button>
                  );
                })}
              </div>
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="ob-actions">
              <button type="submit" className="btn-primary btn-wide">
                {t('ob.next')}
              </button>
              <button type="button" className="btn-link" onClick={() => setStep('welcome')}>
                {t('ob.back')}
              </button>
            </div>
          </form>
        )}

        {step === 'result' && (
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              void finish(false);
            }}
          >
            <h2>{t('ob.resultTitle')}</h2>
            <p className="search-hint">{t('ob.resultHint')}</p>
            {bmrInfo && <p className="search-hint">{t('ob.bmr', { n: fmt(bmrInfo.bmr), tdee: fmt(bmrInfo.tdee) })}</p>}
            <label className="field">
              <span>{t('ob.phaseName')}</span>
              <input value={phaseName} onChange={(e) => setPhaseName(e.target.value)} />
            </label>
            <div className="field-row">
              <label className="field">
                <span>{t('goals.kcalTraining')}</span>
                <input type="number" inputMode="numeric" min={0} value={trainKcal} onChange={(e) => setTrainKcal(e.target.value)} required />
              </label>
              <label className="field">
                <span>{t('goals.kcalRest')}</span>
                <input type="number" inputMode="numeric" min={0} value={restKcal} onChange={(e) => setRestKcal(e.target.value)} required />
              </label>
            </div>
            <div className="field-row">
              <label className="field">
                <span>{t('goals.proteinMinG')}</span>
                <input type="number" inputMode="numeric" min={0} value={protein} onChange={(e) => setProtein(e.target.value)} required />
              </label>
              <label className="field">
                <span>{t('goals.fatMin')}</span>
                <input type="number" inputMode="numeric" min={0} value={fatMin} onChange={(e) => setFatMin(e.target.value)} required />
              </label>
              <label className="field">
                <span>{t('goals.fatMax')}</span>
                <input type="number" inputMode="numeric" min={0} value={fatMax} onChange={(e) => setFatMax(e.target.value)} required />
              </label>
            </div>
            <label className="field" style={{ maxWidth: 200 }}>
              <span>{t('ob.waterGoal')}</span>
              <input type="number" inputMode="numeric" min={500} step={250} value={water} onChange={(e) => setWater(e.target.value)} required />
            </label>
            <div className="ob-actions">
              <button type="submit" className="btn-primary btn-wide">
                {t('ob.start')}
              </button>
              <button type="button" className="btn-link" onClick={() => setStep('body')}>
                {t('ob.back')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
