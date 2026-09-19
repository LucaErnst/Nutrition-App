import { lazy, Suspense, useEffect, useState } from 'react';
import { DayView } from './components/DayView';
import { FoodDatabase } from './components/FoodDatabase';
import { MoreView } from './components/MoreView';
import { WeekView } from './components/WeekView';
const WeightView = lazy(() => import('./components/WeightView').then((m) => ({ default: m.WeightView })));

type View = 'diary' | 'week' | 'weight' | 'database' | 'more';

const VIEWS: { id: View; label: string }[] = [
  { id: 'diary', label: 'Tagebuch' },
  { id: 'week', label: 'Woche' },
  { id: 'weight', label: 'Gewicht' },
  { id: 'database', label: 'Datenbank' },
  { id: 'more', label: 'Mehr' },
];

export default function App() {
  const [view, setView] = useState<View>('diary');
  const [diaryDate, setDiaryDate] = useState<string | undefined>(undefined);

  // Jede Ansicht beginnt oben – nicht dort, wo die vorherige aufgehört hat.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  return (
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
              {v.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        {view === 'diary' && <DayView initialDate={diaryDate} onOpenGoals={() => setView('more')} />}
        {view === 'week' && <WeekView onOpenDay={(d) => { setDiaryDate(d); setView('diary'); }} />}
        {view === 'weight' && (
          <Suspense fallback={<p className="search-hint">Lade…</p>}>
            <WeightView />
          </Suspense>
        )}
        {view === 'database' && <FoodDatabase />}
        {view === 'more' && <MoreView />}
      </main>
    </div>
  );
}
