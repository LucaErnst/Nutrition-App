import { lazy, Suspense, useEffect, useState } from 'react';
import { DayView } from './components/DayView';
import { FoodDatabase } from './components/FoodDatabase';
import { MoreView } from './components/MoreView';
import { UpdateBanner } from './components/UpdateBanner';
import { ToastProvider } from './components/Toast';
import { IconDiary, IconFood, IconMore, IconWeek, IconWeight } from './components/Icons';
import type { ComponentType, SVGProps } from 'react';
import { useT, type MessageKeyOf } from './i18n';
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
  const [view, setView] = useState<View>('diary');
  const [diaryDate, setDiaryDate] = useState<string | undefined>(undefined);

  // Jede Ansicht beginnt oben – nicht dort, wo die vorherige aufgehört hat.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  return (
    <ToastProvider>
      <div className="app">
        <header className="app-header">
          <h1>{t('app.title')}</h1>
          <nav className="app-nav" aria-label={t('nav.label')}>
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
        <UpdateBanner />
      </div>
    </ToastProvider>
  );
}
