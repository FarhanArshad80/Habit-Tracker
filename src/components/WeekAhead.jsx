import { useMemo } from 'react';
import {
  addDays, isDue, weekdayLabel, dayNumber, formatFriendlyDate,
} from '../utils/dateHelpers';
import { useHabits } from '../context/HabitContext';

// A week, starting today rather than on Monday. The question this answers is
// "what is coming", and a calendar week that has already half gone spends
// three of its seven columns on days nobody can do anything about.
const SPAN = 7;

export default function WeekAhead({ habits }) {
  // From the board rather than from the clock, so the strip starts on the
  // same day everything else on the page is measured against.
  const { today } = useHabits();

  const days = useMemo(() => {
    return Array.from({ length: SPAN }, (_, step) => {
      const dateKey = addDays(today, step);
      // Rest days and pauses are already what `isDue` reads, so a ritual set
      // aside indefinitely stays out of every column ahead of it rather than
      // reappearing tomorrow.
      const due = habits.filter((habit) => isDue(dateKey, habit.days, habit.pauses));

      return { dateKey, due };
    });
  }, [habits, today]);

  // Nothing to plan around with a single ritual, and nothing to plan around
  // when every day asks for the same thing — which is what a board of daily
  // rituals is. The strip earns its place by showing that the days differ.
  const counts = days.map((day) => day.due.length);
  const heaviest = Math.max(...counts);

  if (habits.length < 2 || heaviest === 0 || new Set(counts).size === 1) return null;

  return (
    <section className="rounded-2xl border border-void-400/60 bg-void-200/70 p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-ink-500">
          The week ahead
        </span>
        {/* The one sentence the columns are there to support: which day is
            going to be the work, said in words so it does not have to be
            found by comparing seven bars. */}
        <span className="font-mono text-xs text-ink-500">
          heaviest is{' '}
          <span className="text-ink-300">
            {days.find((day) => day.due.length === heaviest).dateKey === today
              ? 'today'
              : formatFriendlyDate(
                  days.find((day) => day.due.length === heaviest).dateKey
                ).split(',')[0]}
          </span>
          {' · '}
          {heaviest} due
        </span>
      </div>

      <ol className="mt-3 flex items-end gap-1.5">
        {days.map(({ dateKey, due }) => {
          const share = heaviest === 0 ? 0 : (due.length / heaviest) * 100;
          const isToday = dateKey === today;

          return (
            <li key={dateKey} className="flex flex-1 flex-col items-center gap-1.5">
              <span className="font-mono text-[10px] text-ink-700">{due.length}</span>

              {/* A day with nothing owed keeps its column as a flat line
                  rather than closing up, because an empty Sunday is the
                  point of looking at this. */}
              <div
                className="flex h-12 w-full items-end overflow-hidden rounded-md bg-void-400/40"
                title={
                  due.length === 0
                    ? `${formatFriendlyDate(dateKey)} — nothing due`
                    : `${formatFriendlyDate(dateKey)} — ${due
                        .map((habit) => habit.name)
                        .join(', ')}`
                }
              >
                <div
                  className={`w-full rounded-md transition-all duration-500 ${
                    isToday ? 'bg-gold/80' : 'bg-ink-700/50'
                  }`}
                  // A floor so a one-ritual day is still a column beside a
                  // five-ritual one instead of rounding away to nothing.
                  style={{ height: due.length === 0 ? '2px' : `${Math.max(12, share)}%` }}
                />
              </div>

              <span
                className={`font-mono text-[10px] ${isToday ? 'text-gold' : 'text-ink-700'}`}
              >
                {weekdayLabel(dateKey)}
                <span className="ml-0.5 text-ink-700">{dayNumber(dateKey)}</span>
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
