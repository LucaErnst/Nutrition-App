import { useEffect, useState } from 'react';
import { useI18n, useT, type Language } from '../i18n';
import { fmt } from '../lib/nutrition';
import { saveSettings, useSettings } from '../db/hooks';
import { GoalsView } from './GoalsView';
import { BackupSection } from './BackupSection';
import { DiagnosticsSection } from './DiagnosticsSection';

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
  // Lokaler Eingabezustand: gespeichert wird erst beim Verlassen des Felds,
  // sonst springt das Feld beim Tippen auf den alten Wert zurück.
  const [goalInput, setGoalInput] = useState(String(waterGoal));
  useEffect(() => setGoalInput(String(waterGoal)), [waterGoal]);

  function commitGoal(v: number) {
    const clamped = Math.min(10000, Math.max(500, Math.round(v / 50) * 50));
    setGoalInput(String(clamped));
    if (clamped !== waterGoal) void saveSettings({ water_goal_ml: clamped });
  }

  return (
    <div className="goals">
      <section className="card section">
        <div className="section-head">
          <h2>{t('more.language')}</h2>
          <div className="segmented segmented-sm" role="radiogroup" aria-label={t('more.language')}>
            {LANGS.map((l) => (
              <label key={l.id} className={lang === l.id ? 'active' : ''}>
                <input type="radio" name="language" checked={lang === l.id} onChange={() => setLanguage(l.id)} />
                {l.label}
              </label>
            ))}
          </div>
        </div>
        <p className="search-hint">{t('more.languageHint')}</p>
      </section>

      <section className="card section">
        <h2>{t('more.water')}</h2>
        <div className="field" style={{ maxWidth: 260, marginTop: 8 }}>
          <span>{t('more.waterGoal')}</span>
          <div className="stepper">
            <button type="button" className="stepper-btn" onClick={() => commitGoal(waterGoal - 250)} aria-label={t('picker.decrease')} disabled={waterGoal <= 500}>
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              min={500}
              max={10000}
              step={50}
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onBlur={() => {
                const v = Number(goalInput);
                if (Number.isFinite(v) && v > 0) commitGoal(v);
                else setGoalInput(String(waterGoal));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              aria-label={t('more.waterGoal')}
            />
            <button type="button" className="stepper-btn" onClick={() => commitGoal(waterGoal + 250)} aria-label={t('picker.increase')} disabled={waterGoal >= 10000}>
              +
            </button>
          </div>
        </div>
        <div className="chips" style={{ marginTop: 10 }} role="group" aria-label={t('more.waterGoal')}>
          {[2000, 2500, 3000, 3500, 4000].map((ml) => (
            <button key={ml} type="button" className={`chip ${waterGoal === ml ? 'active' : ''}`} onClick={() => commitGoal(ml)}>
              {fmt(ml / 1000, 1)} l
            </button>
          ))}
        </div>
      </section>

      <GoalsView />
      <BackupSection />
      <DiagnosticsSection />
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
