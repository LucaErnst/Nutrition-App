import { useI18n, useT, type Language } from '../i18n';
import { saveSettings, useSettings } from '../db/hooks';
import { GoalsView } from './GoalsView';
import { BackupSection } from './BackupSection';
import { DiagnosticsSection } from './DiagnosticsSection';

const LANGS: { id: Language; label: string }[] = [
  { id: 'en', label: 'English' },
  { id: 'de', label: 'Deutsch' },
];

export function MoreView() {
  const t = useT();
  const { lang, setLanguage } = useI18n();
  const settings = useSettings();
  const waterGoal = settings?.water_goal_ml ?? 3000;

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
        <label className="field" style={{ maxWidth: 220, marginTop: 8 }}>
          <span>{t('more.waterGoal')}</span>
          <input
            type="number"
            inputMode="numeric"
            min={500}
            max={10000}
            step={250}
            value={waterGoal}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= 500) void saveSettings({ water_goal_ml: v });
            }}
          />
        </label>
      </section>

      <GoalsView />
      <BackupSection />
      <DiagnosticsSection />
      <p className="about">{t('more.about', { app: t('app.title'), version: __APP_VERSION__ })}</p>
    </div>
  );
}
