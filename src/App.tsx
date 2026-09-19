import { lazy, Suspense, useEffect, useState } from 'react';
import { DayView } from './components/DayView';
import { FoodDatabase } from './components/FoodDatabase';
import { MoreView } from './components/MoreView';
import { UpdateBanner } from './components/UpdateBanner';
import { ToastProvider } from './components/Toast';
import { IconDiary, IconFood, IconMore, IconWeek, IconWeight } from './components/Icons';
import type { ComponentType, SVGProps } from 'react';
import { WeekView } from './components/WeekView';
const WeightView = lazy(() => import('./components/WeightView').then((m) => ({ default: m.WeightView })));

type View = 'diary' | 'week' | 'weight' | 'database' | 'more';

const VIEWS: { id: View; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { id: 'diary', label: 'Tagebuch', Icon: IconDiary },
  { id: 'week', label: 'Woche', Icon: IconWeek },
  { id: 'weight', label: 'Gewicht', Icon: IconWeight },
  { id: 'database', label: 'Datenbank', Icon: IconFood },
  { id: 'more', label: 'Mehr', Icon: IconMore },
];

/** Platzhalter, während ein nachgeladener Bereich (Chart) geladen wird. */
function Skeleton() {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Lade…">
      <div className="skeleton-card" style={{ height: 140 }} />
      <div className="skeleton-card" style={{ height: 320 }} />
    </div>
  );
}

export default function App() {
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
          <h1>Ernährung</h1>
          <nav className="app-nav" aria-label="Hauptnavigation">
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
                <span>{v.label}</span>
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
