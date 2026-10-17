import { useEffect, useRef, useState } from 'react';
import { MEAL_TYPES } from '../db/types';
import { groupByMeal, setTrainingDay, useDayEntries, useDaySummaries, useGoals, useIsTrainingDay } from '../db/hooks';
import { sumMacros } from '../lib/nutrition';
import { addDays, formatDateLabel, todayISO, weekDates, weekStartOf } from '../lib/date';
import { weekBudget } from '../lib/week';
import { WeekBudgetCard } from './WeekBudgetCard';
import { activeGoalFor, targetsFor } from '../lib/goals';
import { DailySummary } from './DailySummary';
import { MealSlot } from './MealSlot';
import { BackupReminder } from './BackupReminder';
import { useT } from '../i18n';
import { WaterRow } from './WaterRow';
import { readActiveEnergy, readSteps } from '../lib/health';
import { useSettings } from '../db/hooks';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Tip } from './Tip';
import { swallowNextClick } from '../lib/swallowClick';

interface Props {
  initialDate?: string;
  onOpenGoals: () => void;
}

export function DayView({ initialDate, onOpenGoals }: Props) {
  const t = useT();
  const [date, setDate] = useState(initialDate ?? todayISO());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [date]);

  // Seitlich wischen wechselt den Tag (wie Seiten umblättern). Einträge haben ihr eigenes
  // Wischen zum Löschen, Eingabefelder bleiben aussen vor.
  const [slide, setSlide] = useState<'' | 'out-left' | 'out-right' | 'in-left' | 'in-right'>('');
  const swipe = useRef<{ x: number; y: number } | null>(null);
  function goTo(dir: 1 | -1) {
    setSlide(dir > 0 ? 'out-left' : 'out-right');
    window.setTimeout(() => {
      setDate((d) => addDays(d, dir));
      setSlide(dir > 0 ? 'in-right' : 'in-left');
      requestAnimationFrame(() => requestAnimationFrame(() => setSlide('')));
    }, 160);
  }
  const entries = useDayEntries(date) ?? [];
  const groups = groupByMeal(entries);
  const totals = sumMacros(entries.map((e) => e.macros));
  const goals = useGoals();
  const isTraining = useIsTrainingDay(date) ?? false;
  const goal = goals ? activeGoalFor(goals, date) : undefined;
  const targets = goal ? targetsFor(goal, isTraining) : undefined;
  const today = todayISO();
  const weekDays = useDaySummaries(weekDates(weekStartOf(date)));
  const budget = weekDays && date === today ? weekBudget(weekDays, today) : undefined;
  const settings = useSettings();
  const entryCount = useLiveQuery(() => db.mealEntries.count());
  const [activeEnergy, setActiveEnergy] = useState<number | undefined>(undefined);
  const [steps, setSteps] = useState<number | undefined>(undefined);
  useEffect(() => {
    setActiveEnergy(undefined);
    setSteps(undefined);
    if (settings?.health_enabled) {
      void readActiveEnergy(date).then(setActiveEnergy);
      void readSteps(date, date).then((m) => setSteps(m?.get(date)));
    }
  }, [date, settings?.health_enabled]);

  return (
    <div className="day">
      <nav className="date-nav" aria-label={t('weight.date')}>
        <button className="btn-icon btn-round" onClick={() => goTo(-1)} aria-label={t('day.prev')}>
          ‹
        </button>
        <div className="date-nav-center">
          <input
            type="date"
            className="date-input"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label={t('day.pickDate')}
          />
          <span className="date-label">{formatDateLabel(date)}</span>
        </div>
        <button className="btn-icon btn-round" onClick={() => goTo(1)} aria-label={t('day.next')}>
          ›
        </button>
      </nav>

      <BackupReminder />

      <div
        className={`day-pane ${slide}`}
        onPointerDown={(ev) => {
          const el = ev.target as HTMLElement;
          swipe.current = el.closest('.swipe, input, textarea, select, .segmented') ? null : { x: ev.clientX, y: ev.clientY };
        }}
        onPointerUp={(ev) => {
          const s = swipe.current;
          swipe.current = null;
          if (!s) return;
          const dx = ev.clientX - s.x;
          const dy = ev.clientY - s.y;
          if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          // Der Klick am Ende des Wischens soll keinen Knopf auslösen.
          swallowNextClick(window);
          goTo(dx < 0 ? 1 : -1);
        }}
        onPointerCancel={() => (swipe.current = null)}
      >
      {/* Auf breiten Displays (iPad, aufgeklapptes iPhone Duo) zwei Spalten: Tagesstand links, Mahlzeiten rechts */}
      <div className="split-side">
        <DailySummary
          totals={totals}
          targets={targets}
          activeEnergy={activeEnergy}
          steps={steps}
          isTraining={isTraining}
          onToggleTraining={(v) => void setTrainingDay(date, v)}
          onOpenGoals={goals && !goal ? onOpenGoals : undefined}
        />

        <WaterRow date={date} />

        {budget && <WeekBudgetCard budget={budget} isCurrent compact />}

        <Tip id="day-type" when={!!goal && !!entryCount}>
          {t('tip.dayType')}
        </Tip>
      </div>

      <div className="split-main">
        <Tip id="first-entry" when={entryCount === 0}>
          {t('tip.firstEntry')}
        </Tip>
        {MEAL_TYPES.map((mt) => (
          <MealSlot key={`${date}-${mt}`} date={date} mealType={mt} entries={groups[mt]} />
        ))}
      </div>
      </div>
    </div>
  );
}
