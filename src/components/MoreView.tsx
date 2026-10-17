import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
import { CollapsibleCard, SettingsPageContext } from './CollapsibleCard';
import { resetTips } from '../lib/tips';
import { useToast } from './Toast';
import { SettingIcon, type SettingKind } from './Icons';
import { usePro } from '../lib/pro';
import { isNative } from '../lib/native';

/** Rechtstexte liegen auf der Web-Adresse – auch die native App verlinkt dorthin. */
const LEGAL_BASE = 'https://lucaernst.github.io/Nutrition-App/legal/';

type Page = 'reminders' | 'health' | 'units' | 'water' | 'language' | 'tips' | 'backup' | 'diag';

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

  const pro = usePro();
  const [page, setPage] = useState<Page | null>(null);
  const edge = useRef<{ x: number; y: number } | null>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const waterContent = (
    <>
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
    </>
  );

  // Unterseiten wie in den iOS-Einstellungen: Liste antippen → eigene Seite mit allen Optionen.
  const PAGES: Record<Page, { title: string; icon: SettingKind; value?: string; content: ReactNode }> = {
    reminders: { title: t('rem.title'), icon: 'reminders', value: isNative ? (settings?.reminders?.enabled ? t('rem.on') : t('rem.off')) : undefined, content: <RemindersSection /> },
    health: { title: t('health.title'), icon: 'health', value: settings?.health_enabled ? t('rem.on') : t('rem.off'), content: <HealthSection /> },
    units: { title: t('units.title'), icon: 'units', value: t(system === 'us' ? 'units.us' : system === 'uk' ? 'units.uk' : 'units.metric'), content: <UnitsSection /> },
    water: {
      title: t('more.water'),
      icon: 'water',
      value: waterLeftLabel(waterGoal, system),
      content: <CollapsibleCard title={t('more.water')} summary={t('more.waterSummary', { goal: waterLeftLabel(waterGoal, system) })}>{waterContent}</CollapsibleCard>,
    },
    language: {
      title: t('more.language'),
      icon: 'language',
      value: LANGS.find((l) => l.id === lang)?.label,
      content: (
        <section className="card section">
          <div
            className="segmented"
            role="radiogroup"
            aria-label={t('more.language')}
            style={{ '--n': LANGS.length, '--i': Math.max(0, LANGS.findIndex((l) => l.id === lang)) } as CSSProperties}
          >
            {LANGS.map((l) => (
              <label key={l.id} className={lang === l.id ? 'active' : ''}>
                <input type="radio" name="language" checked={lang === l.id} onChange={() => setLanguage(l.id)} />
                {l.label}
              </label>
            ))}
          </div>
          <p className="search-hint">{t('more.languageHint')}</p>
        </section>
      ),
    },
    tips: { title: t('tips.title'), icon: 'tips', content: <TipsSection /> },
    backup: {
      title: t('backup.title'),
      icon: 'backup',
      value: settings?.last_backup_at ? new Date(settings.last_backup_at).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-US', { day: 'numeric', month: 'short' }) : undefined,
      content: <BackupSection />,
    },
    diag: { title: t('diag.title'), icon: 'diag', content: <DiagnosticsSection /> },
  };

  if (page) {
    const p = PAGES[page];
    return (
      <div
        className="settings-page"
        onPointerDown={(ev) => {
          // Wie in iOS: vom linken Rand nach rechts wischen geht zurück
          edge.current = ev.clientX < 32 ? { x: ev.clientX, y: ev.clientY } : null;
        }}
        onPointerUp={(ev) => {
          const e = edge.current;
          edge.current = null;
          if (e && ev.clientX - e.x > 70 && Math.abs(ev.clientY - e.y) < 60) setPage(null);
        }}
        onPointerCancel={() => (edge.current = null)}
      >
        <button className="settings-back" onClick={() => setPage(null)}>
          <svg viewBox="0 0 10 17" width="10" height="17" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M8.5 1.5 1.5 8.5l7 7" />
          </svg>
          {t('nav.more')}
        </button>
        <h2 className="large-title">{p.title}</h2>
        <SettingsPageContext.Provider value={true}>
          <div className="settings-page-body">{p.content}</div>
        </SettingsPageContext.Provider>
      </div>
    );
  }

  const row = (id: Page) => {
    const p = PAGES[id];
    return (
      <button key={id} className="card section setting-row" onClick={() => setPage(id)}>
        <SettingIcon kind={p.icon} />
        <span className="setting-title">
          {p.title}
          {id === 'health' && !pro && <span className="pro-badge">PRO</span>}
        </span>
        {p.value && <span className="setting-value">{p.value}</span>}
        <svg className="setting-chevron" viewBox="0 0 8 13" width="8" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M1.5 1.5 6.5 6.5l-5 5" />
        </svg>
      </button>
    );
  };

  return (
    <div className="goals more">
      <ProSection />
      <GoalsView />
      <TrainingDaysSection />

      <div className="settings-block">
        <h3 className="group-title">{t('more.groupSettings')}</h3>
        <div className="settings-group">{(['reminders', 'health', 'units', 'water', 'language', 'tips'] as const).map(row)}</div>
      </div>

      <div className="settings-block">
        <h3 className="group-title">{t('more.groupData')}</h3>
        <div className="settings-group">{(['backup', 'diag'] as const).map(row)}</div>
      </div>

      <div className="settings-block">
        <h3 className="group-title">{t('more.legal')}</h3>
        <div className="settings-group">
          {(
            [
              ['privacy', t('more.privacy')],
              ['terms', t('more.terms')],
              ['support', t('more.support')],
            ] as const
          ).map(([doc, label]) => (
            <a key={doc} className="card section setting-row" href={`${LEGAL_BASE}${doc}-${lang}.html`} target="_blank" rel="noopener">
              <SettingIcon kind="legal" />
              <span className="setting-title">{label}</span>
              <svg className="setting-chevron" viewBox="0 0 8 13" width="8" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1.5 1.5 6.5 6.5l-5 5" />
              </svg>
            </a>
          ))}
        </div>
      </div>
      <p className="about">{t('more.about', { app: t('app.title'), version: __APP_VERSION__ })}</p>
    </div>
  );
}

/** Hinweise beim ersten Kontakt zurücksetzen (1.2). */
function TipsSection() {
  const t = useT();
  const toast = useToast();
  return (
    <CollapsibleCard title={t('tips.title')}>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => {
          resetTips();
          toast.show({ message: t('tips.resetDone') });
        }}
      >
        {t('tips.reset')}
      </button>
    </CollapsibleCard>
  );
}
