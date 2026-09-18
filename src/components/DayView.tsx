import { useEffect, useState } from 'react';
import { MEAL_TYPES } from '../db/types';
import { groupByMeal, setTrainingDay, useDayEntries, useGoals, useIsTrainingDay } from '../db/hooks';
import { sumMacros } from '../lib/nutrition';
import { addDays, formatDateLabel, todayISO } from '../lib/date';
import { activeGoalFor, targetsFor } from '../lib/goals';
import { DailySummary } from './DailySummary';
import { MealSlot } from './MealSlot';

interface Props {
  initialDate?: string;
  onOpenGoals: () => void;
}

export function DayView({ initialDate, onOpenGoals }: Props) {
  const [date, setDate] = useState(initialDate ?? todayISO());

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [date]);
  const entries = useDayEntries(date) ?? [];
  const groups = groupByMeal(entries);
  const totals = sumMacros(entries.map((e) => e.macros));
  const goals = useGoals();
  const isTraining = useIsTrainingDay(date) ?? false;
  const goal = goals ? activeGoalFor(goals, date) : undefined;
  const targets = goal ? targetsFor(goal, isTraining) : undefined;

  return (
    <div className="day">
      <nav className="date-nav" aria-label="Datum">
        <button className="btn-icon" onClick={() => setDate(addDays(date, -1))} aria-label="Vorheriger Tag">
          ‹
        </button>
        <div className="date-nav-center">
          <input
            type="date"
            className="date-input"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            aria-label="Datum wählen"
          />
          <span className="date-label">{formatDateLabel(date)}</span>
        </div>
        <button className="btn-icon" onClick={() => setDate(addDays(date, 1))} aria-label="Nächster Tag">
          ›
        </button>
      </nav>

      <DailySummary
        totals={totals}
        targets={targets}
        isTraining={isTraining}
        onToggleTraining={(v) => void setTrainingDay(date, v)}
        onOpenGoals={goals && !goal ? onOpenGoals : undefined}
      />

      {MEAL_TYPES.map((mt) => (
        <MealSlot key={`${date}-${mt}`} date={date} mealType={mt} entries={groups[mt]} />
      ))}
    </div>
  );
}
