import { useEffect, useState } from 'react';
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

  return (
    <div className="day">
      <nav className="date-nav" aria-label={t('weight.date')}>
        <button className="btn-icon" onClick={() => setDate(addDays(date, -1))} aria-label={t('day.prev')}>
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
        <button className="btn-icon" onClick={() => setDate(addDays(date, 1))} aria-label={t('day.next')}>
          ›
        </button>
      </nav>

      <BackupReminder />

      <DailySummary
        totals={totals}
        targets={targets}
        isTraining={isTraining}
        onToggleTraining={(v) => void setTrainingDay(date, v)}
        onOpenGoals={goals && !goal ? onOpenGoals : undefined}
      />

      {budget && <WeekBudgetCard budget={budget} isCurrent compact />}

      <WaterRow date={date} />

      {MEAL_TYPES.map((mt) => (
        <MealSlot key={`${date}-${mt}`} date={date} mealType={mt} entries={groups[mt]} />
      ))}
    </div>
  );
}
