import { useEffect, useState } from 'react';
import { useI18n, useT, type Language } from '../i18n';
import { waterGoalField, waterLeftLabel, WATER_GOAL_MAX_ML, WATER_GOAL_MIN_ML } from '../lib/nutrition';
import { saveSettings, useSettings, useUnitSystem } from '../db/hooks';
import { GoalsView, TrainingDaysSection } from './GoalsView';
import { BackupSection } from './BackupSection';
import { DiagnosticsSection } from './DiagnosticsSection';
import { RemindersSection } from './RemindersSection';
import { HealthSection } from './HealthSection';
import { ProSection } from './ProSection';
import { UnitsSection } from './UnitsSection';
import { CollapsibleCard } from './CollapsibleCard';

/** Rechtstexte liegen auf der Web-Adresse – auch die native App verlinkt dorthin. */
const LEGAL_BASE = 'https://lucaernst.github.io/Nutrition-App/legal/';

const LANGS: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
];

export function MoreView() {
  const t = useT();
  const { lang, setLanguage } = useI18n();
  const settings = useSettings();
  const waterGoal = settings?.water_goal_ml ?? 3000;
  // Angezeigt wird die Einheit des Nutzers, gespeichert bleiben Milliliter.
  const system = useUnitSystem();
  const field = waterGoalField(system);
  // Lokaler Eingabezustand: gespeichert wird erst beim Verlassen des Felds,
  // sonst springt das Feld beim Tippen auf den alten Wert zurück.
  const [goalInput, setGoalInput] = useState(String(field.toDisplay(waterGoal)));
  useEffect(() => setGoalInput(String(field.toDisplay(waterGoal))), [waterGoal, field.label]);

  /** `ml` kommt aus den Stufen-Knöpfen, `displayed` aus dem Feld. */
  function commitGoal(ml: number) {
    const clamped = Math.min(WATER_GOAL_MAX_ML, Math.max(WATER_GOAL_MIN_ML, ml));
    setGoalInput(String(field.toDisplay(clamped)));
    if (clamped !== waterGoal) void saveSettings({ water_goal_ml: clamped });
  }

  return (
    <div className="goals">
      <GoalsView />
      <ProSection />
      <TrainingDaysSection />
      <RemindersSection />
      <HealthSection />
      <BackupSection />
      <UnitsSection />

      <CollapsibleCard title={t('more.water')} summary={t('more.waterSummary', { goal: waterLeftLabel(waterGoal, system) })}>
        <div className="field" style={{ maxWidth: 260, marginTop: 8, marginInline: 'auto' }}>
          <span>{t('more.waterGoal', { unit: field.label })}</span>
          <div className="stepper">
            <button type="button" className="stepper-btn" onClick={() => commitGoal(waterGoal - field.stepMl)} aria-label={t('picker.decrease')} disabled={waterGoal <= WATER_GOAL_MIN_ML}>
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={field.toDisplay(WATER_GOAL_MIN_ML)}
              max={field.toDisplay(WATER_GOAL_MAX_ML)}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onBlur={() => {
                const v = Number(goalInput);
                if (Number.isFinite(v) && v > 0) commitGoal(field.toMl(v));
                else setGoalInput(String(field.toDisplay(waterGoal)));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              aria-label={t('more.waterGoal', { unit: field.label })}
            />
            <button type="button" className="stepper-btn" onClick={() => commitGoal(waterGoal + field.stepMl)} aria-label={t('picker.increase')} disabled={waterGoal >= WATER_GOAL_MAX_ML}>
              +
            </button>
          </div>
        </div>
        <div className="chips" style={{ marginTop: 10 }} role="group" aria-label={t('more.waterGoal', { unit: field.label })}>
          {field.presetsMl.map((ml) => (
            <button key={ml} type="button" className={`chip ${waterGoal === ml ? 'active' : ''}`} onClick={() => commitGoal(ml)}>
              {waterLeftLabel(ml, system)}
            </button>
          ))}
        </div>
      </CollapsibleCard>

      <DiagnosticsSection />

      <section className="card section">
        <h2>{t('more.language')}</h2>
        <div className="segmented segmented-centered" role="radiogroup" aria-label={t('more.language')}>
          {LANGS.map((l) => (
            <label key={l.id} className={lang === l.id ? 'active' : ''}>
              <input type="radio" name="language" checked={lang === l.id} onChange={() => setLanguage(l.id)} />
              {l.label}
            </label>
          ))}
        </div>
        <p className="search-hint">{t('more.languageHint')}</p>
      </section>

      <section className="card section">
        <h2>{t('more.legal')}</h2>
        <p className="legal-links">
          <a href={`${LEGAL_BASE}privacy-${lang}.html`} target="_blank" rel="noopener">
            {t('more.privacy')}
          </a>
          <a href={`${LEGAL_BASE}terms-${lang}.html`} target="_blank" rel="noopener">
            {t('more.terms')}
          </a>
          <a href={`${LEGAL_BASE}support-${lang}.html`} target="_blank" rel="noopener">
            {t('more.support')}
          </a>
        </p>
      </section>
      <p className="about">{t('more.about', { app: t('app.title'), version: __APP_VERSION__ })}</p>
    </div>
  );
}
