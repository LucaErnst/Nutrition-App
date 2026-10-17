import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DayView } from './components/DayView';
import { FoodDatabase } from './components/FoodDatabase';
import { MoreView } from './components/MoreView';
import { isNative } from './lib/native';
import { Onboarding } from './components/Onboarding';
import { PaywallHost } from './components/Paywall';
import { useGoals, useSettings, saveSettings } from './db/hooks';
import { detectUnitSystem, setUnitSystemCache } from './lib/units';
import { syncReferenceLanguage } from './db/seed';
import { decideTipsMode, tipsMode } from './lib/tips';
import { askForStepsOnce } from './lib/health';
import { db } from './db/db';
const UpdateBanner = lazy(() => import('./components/UpdateBanner').then((m) => ({ default: m.UpdateBanner })));
import { ToastProvider } from './components/Toast';
import { IconDiary, IconFood, IconMore, IconWeek, IconWeight } from './components/Icons';
import type { ComponentType, SVGProps } from 'react';
import { useT, type MessageKeyOf, useI18n } from './i18n';
import { WeekView } from './components/WeekView';
const WeightView = lazy(() => import('./components/WeightView').then((m) => ({ default: m.WeightView })));

type View = 'diary' | 'week' | 'weight' | 'database' | 'more';

const VIEWS: { id: View; label: MessageKeyOf<'nav'>; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'diary', label: 'nav.diary', Icon: IconDiary },
  { id: 'week', label: 'nav.week', Icon: IconWeek },
  { id: 'weight', label: 'nav.weight', Icon: IconWeight },
  { id: 'database', label: 'nav.database', Icon: IconFood },
  { id: 'more', label: 'nav.more', Icon: IconMore },
];

/** Platzhalter, während ein nachgeladener Bereich (Chart) geladen wird. */
function Skeleton() {
  const t = useT();
  return (
    <div className="skeleton" aria-busy="true" aria-label={t('common.loading')}>
      <div className="skeleton-card" style={{ height: 140 }} />
      <div className="skeleton-card" style={{ height: 320 }} />
    </div>
  );
}

export default function App() {
  const t = useT();
  const { lang } = useI18n();
  const settings = useSettings();
  const goals = useGoals();
  const [view, setView] = useState<View>('diary');

  // Bestehende Nutzer mit Phase brauchen kein Onboarding – einmalig als erledigt markieren.
  useEffect(() => {
    if (settings && goals && !settings.onboarding_done && goals.length > 0) void saveSettings({ onboarding_done: true });
  }, [settings, goals]);
  const showOnboarding = !!settings && !!goals && !settings.onboarding_done && goals.length === 0;

  // Grundnahrungsmittel in der Sprache der Oberfläche halten. Beim ersten Start ist die
  // Sprache aus den Einstellungen noch nicht geladen, darum hier und nicht beim Anlegen.
  useEffect(() => {
    void syncReferenceLanguage(lang === 'de' ? 'de' : 'en');
  }, [lang]);

  // Einheitensystem merken, sobald die Einstellungen da sind: Dialoge frieren ihre Vorgabe
  // beim Öffnen ein und dürfen nicht auf die Gerätesprache zurückfallen.
  useEffect(() => {
    if (settings) setUnitSystemCache(settings.units_system ?? detectUnitSystem());
  }, [settings]);

  // Hinweise beim ersten Kontakt: einmal entscheiden, ob dieses Gerät sie bekommt.
  useEffect(() => {
    if (tipsMode() === null) void db.mealEntries.count().then((n) => decideTipsMode(n > 0));
  }, []);

  // Health vor 1.2 verbunden: einmal nach Schritten fragen (iOS zeigt nur offene Typen).
  useEffect(() => {
    if (settings?.health_enabled) void askForStepsOnce();
  }, [settings?.health_enabled]);

  // Start-Screen (index.html) ausblenden, sobald die ersten Daten da sind
  useEffect(() => {
    if (settings && goals) window.__hideSplash?.();
  }, [settings, goals]);
  const [diaryDate, setDiaryDate] = useState<string | undefined>(undefined);

  // Jede Ansicht beginnt oben – nicht dort, wo die vorherige aufgehört hat.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  // Tab-Leiste: die Glas-Markierung gleitet zum gewählten Tab und misst dessen Breite
  // (Tabs sind so breit wie ihr Wort – „Lebensmittel“ braucht mehr als „Mehr“).
  const navRef = useRef<HTMLElement>(null);
  const thumbRef = useRef<HTMLSpanElement>(null);
  const firstPlace = useRef(true);
  useLayoutEffect(() => {
    function place() {
      const nav = navRef.current;
      const thumb = thumbRef.current;
      const btn = nav?.querySelector<HTMLElement>('button[aria-current="page"]');
      if (!nav || !thumb || !btn) return;
      if (firstPlace.current) thumb.style.transition = 'none';
      else {
        thumb.classList.remove('moving');
        void thumb.offsetWidth;
        thumb.classList.add('moving');
      }
      thumb.style.width = `${btn.offsetWidth}px`;
      thumb.style.height = `${btn.offsetHeight}px`;
      thumb.style.transform = `translate(${btn.offsetLeft}px, ${btn.offsetTop}px)`;
      if (firstPlace.current) {
        firstPlace.current = false;
        requestAnimationFrame(() => (thumb.style.transition = ''));
      }
    }
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [view, lang]);

  // Grosser Titel wie in iOS; Tagebuch und Woche tragen stattdessen ihr Datum als Titel.
  const current = VIEWS.find((v) => v.id === view)!;
  const titled = view !== 'diary' && view !== 'week';

  return (
    <ToastProvider>
      {showOnboarding && <Onboarding onDone={() => window.scrollTo(0, 0)} />}
      <PaywallHost />
      <div className="app">
        <div className="watermark" aria-hidden="true" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}splash-logo.png)` }} />
        <header className={`app-header ${titled ? '' : 'app-header-dated'}`}>
          <h1 className={titled ? 'large-title' : 'visually-hidden'}>{titled ? t(current.label) : t('app.title')}</h1>
          <nav className="app-nav" aria-label={t('nav.label')} ref={navRef}>
            <span className="nav-thumb" ref={thumbRef} aria-hidden="true" />
            {VIEWS.map((v) => (
              <button
                key={v.id}
                className={view === v.id ? 'active' : ''}
                aria-current={view === v.id ? 'page' : undefined}
                onClick={() => {
                  setDiaryDate(undefined);
                  setView(v.id);
                }}
              >
                <v.Icon className="nav-icon" />
                <span>{t(v.label)}</span>
              </button>
            ))}
          </nav>
        </header>
        <main className="app-main">
          {view === 'diary' && <DayView initialDate={diaryDate} onOpenGoals={() => setView('more')} />}
          {view === 'week' && <WeekView onOpenDay={(d) => { setDiaryDate(d); setView('diary'); }} />}
          {view === 'weight' && (
            <Suspense fallback={<Skeleton />}>
              <WeightView />
            </Suspense>
          )}
          {view === 'database' && <FoodDatabase />}
          {view === 'more' && <MoreView />}
        </main>
        {!isNative && (
          <Suspense fallback={null}>
            <UpdateBanner />
          </Suspense>
        )}
      </div>
    </ToastProvider>
  );
}
