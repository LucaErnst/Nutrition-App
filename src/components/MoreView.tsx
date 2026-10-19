import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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

export function MoreView({ resetKey = 0 }: { resetKey?: number }) {
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
  const [page, setPageState] = useState<Page | null>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);
  // Die Liste bleibt die ganze Zeit an ihrer Stelle (gleiche Scrollposition); die Unterseite liegt
  // als eigene Ebene darüber. Zurück muss darum nichts tauschen und nichts neu scrollen.
  const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
  const DUR = 320;
  function openPage(p: Page) {
    setPageState(p);
  }
  function back() {
    setPageState(null);
  }
  /** Ebenen hinter der Seite: Liste und grosser Titel von „Mehr“. */
  function behind(): HTMLElement[] {
    return [rootRef.current, document.querySelector<HTMLElement>('.app-header .large-title')].filter((e): e is HTMLElement => !!e);
  }
  /** Fortschritt p: 0 = Seite steht, 1 = Seite ganz weg und Liste wieder an ihrem Platz. */
  function setProgress(p: number, animate: boolean) {
    const pg = pageRef.current;
    if (!pg) return;
    const w = pg.offsetWidth || window.innerWidth;
    const tr = animate ? `transform ${DUR}ms ${EASE}` : 'none';
    pg.style.transition = tr;
    pg.style.transform = p > 0 ? `translateX(${p * w}px)` : '';
    for (const el of behind()) {
      el.style.transition = tr;
      el.style.transform = p >= 1 ? '' : `translateX(${-0.3 * w * (1 - p)}px)`;
    }
    if (dimRef.current) {
      dimRef.current.style.transition = animate ? `opacity ${DUR}ms ${EASE}` : 'none';
      dimRef.current.style.opacity = String(1 - p);
    }
    pg.classList.toggle('page-dragging', p > 0 && p < 1);
  }
  /** Zurück: Seite gleitet hinaus, Liste rückt nach – erst wenn alles steht, wird die Seite entfernt. */
  function slideBack() {
    setProgress(1, true);
    window.setTimeout(() => {
      for (const el of behind()) {
        el.style.transition = '';
        el.style.transform = '';
      }
      back();
    }, DUR + 20);
  }
  // Öffnen: Seite kommt von rechts, Liste weicht leicht nach links aus und wird dunkler.
  useLayoutEffect(() => {
    if (!page) return;
    setProgress(1, false);
    void pageRef.current?.offsetWidth;
    requestAnimationFrame(() => setProgress(0, true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);
  // Verlässt man „Mehr“ mit offener Unterseite, bleibt nichts verschoben zurück.
  useEffect(
    () => () => {
      for (const el of [document.querySelector<HTMLElement>('.app-header .large-title')]) {
        if (el) {
          el.style.transition = '';
          el.style.transform = '';
        }
      }
    },
    [],
  );

  // Wie in iOS: vom linken Rand nach rechts wischen. Die Seite folgt dem Finger, darunter schiebt
  // sich die Liste leicht versetzt und abgedunkelt herein. Weit genug oder schnell genug → zurück,
  // sonst federt die Seite zurück. Touch statt Pointer: Pointer brechen beim senkrechten Scrollen ab.
  useEffect(() => {
    if (!page) return;
    let start: { x: number; y: number; t: number } | null = null;
    let horizontal = false;
    let dx = 0;
    let last = { x: 0, t: 0, v: 0 };
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      start = t.clientX < 30 ? { x: t.clientX, y: t.clientY, t: e.timeStamp } : null;
      horizontal = false;
      dx = 0;
      last = { x: t.clientX, t: e.timeStamp, v: 0 };
    };
    const onMove = (e: TouchEvent) => {
      if (!start) return;
      const t = e.touches[0];
      const mx = t.clientX - start.x;
      const my = Math.abs(t.clientY - start.y);
      if (!horizontal) {
        if (mx > 8 && mx > my) horizontal = true;
        else if (my > 10) {
          start = null;
          return;
        } else return;
      }
      e.preventDefault();
      const dt = Math.max(1, e.timeStamp - last.t);
      last = { x: t.clientX, t: e.timeStamp, v: (t.clientX - last.x) / dt };
      dx = Math.max(0, mx);
      setProgress(Math.min(1, dx / (pageRef.current?.offsetWidth || window.innerWidth)), false);
    };
    const onEnd = () => {
      if (!start || !horizontal) {
        start = null;
        return;
      }
      start = null;
      const w = pageRef.current?.offsetWidth || window.innerWidth;
      if (dx / w > 0.4 || last.v > 0.5) slideBack();
      else setProgress(0, true);
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
    document.addEventListener('touchcancel', onEnd);
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
      document.removeEventListener('touchcancel', onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Tipp auf „Mehr“ in der Tab-Leiste führt von einer Unterseite zurück zur Liste.
  useEffect(() => {
    if (resetKey && pageRef.current) slideBack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

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

  const row = (id: Page) => {
    const p = PAGES[id];
    return (
      <button key={id} className="card section setting-row" onClick={() => openPage(id)}>
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

  const listView = (
    <div className="goals more" ref={rootRef}>
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

  const p = page ? PAGES[page] : null;
  return (
    <>
      {listView}
      {p && (
        <>
          <div className="settings-dim" ref={dimRef} aria-hidden="true" />
          <div className="settings-page" ref={pageRef} role="region" aria-label={p.title}>
            <div className="settings-page-inner">
              <button className="settings-back" onClick={slideBack} aria-label={t('nav.more')}>
                <svg viewBox="0 0 10 17" width="11" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M8.5 1.5 1.5 8.5l7 7" />
                </svg>
              </button>
              <h2 className="large-title">{p.title}</h2>
              <SettingsPageContext.Provider value={true}>
                <div className="settings-page-body">{p.content}</div>
              </SettingsPageContext.Provider>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/** Hinweise beim ersten Kontakt zurücksetzen (1.2). */
function TipsSection() {
  const t = useT();
  const toast = useToast();
  return (
    <CollapsibleCard title={t('tips.title')} summary={t('tips.desc')}>
      <button
        type="button"
        className="btn-secondary btn-centered"
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
