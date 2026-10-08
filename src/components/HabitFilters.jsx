import { useEffect } from 'react';
import { LayoutList, Target, Flame, Pause, Circle, CheckCircle2 } from 'lucide-react';
import { isTyping } from './HabitSearch';

// The four ways the board is worth reading. Each view carries the test that
// decides what belongs in it, so the number on a chip and the list underneath
// can never disagree — they are the same predicate run twice.
//
// `empty` is the sentence to show when a view matches nothing. It is written
// per view because "nothing here" means something different every time: an
// empty "At risk" is the best news on this page, while an empty "All" means
// the app has not been started yet.
export const HABIT_FILTERS = [
  {
    id: 'all',
    label: 'All',
    icon: LayoutList,
    match: () => true,
    empty: 'No rituals yet.',
  },
  {
    id: 'today',
    label: 'Due today',
    icon: Target,
    match: (habit) => habit.dueToday,
    empty: 'Nothing is owed today — the schedule says rest.',
  },
  // What is left to do today, streak or not. "At risk" only counts rituals
  // with a run going, so a new or lapsed one that is due today never showed
  // up in any view that meant "still to do".
  {
    id: 'todo',
    label: 'Still to do',
    icon: Circle,
    match: (habit) => habit.dueToday && !habit.completedToday,
    empty: 'Everything due today is checked off.',
  },
  {
    id: 'risk',
    label: 'At risk',
    icon: Flame,
    match: (habit) => habit.streakAtRisk,
    empty: 'No streak is at risk. Everything due today is done.',
  },
  {
    id: 'paused',
    label: 'Paused',
    icon: Pause,
    match: (habit) => habit.paused,
    empty: 'Nothing is set aside right now.',
  },
  // Last in the row so the number keys the other views already answer to
  // stay where they were.
  //
  // The other half of "Still to do": what today has already been given.
  // Bonus check-ins on a rest day count too, since they were done today.
  {
    id: 'done',
    label: 'Done today',
    icon: CheckCircle2,
    match: (habit) => habit.completedToday,
    empty: 'Nothing checked off yet today.',
  },
];

export function habitFilter(id) {
  return HABIT_FILTERS.find((view) => view.id === id) || HABIT_FILTERS[0];
}

// With one ritual there is nothing to sift, and a row of chips above a
// single line is furniture rather than a tool.
export function canFilter(habits) {
  return habits.length >= 2;
}

export default function HabitFilters({ habits, active, onChange }) {
  const shown = canFilter(habits);

  // The number keys pick a view by its place in the row - 1 for All, 2 for
  // Due today and so on - so moving between them does not need the mouse.
  // Never while typing, where a digit is a digit.
  useEffect(() => {
    if (!shown) return undefined;

    const onKeyDown = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;

      const view = HABIT_FILTERS[Number(event.key) - 1];
      if (!view) return;

      event.preventDefault();
      onChange(view.id);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shown, onChange]);

  if (!shown) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter rituals">
      {HABIT_FILTERS.map(({ id, label, icon: Icon, match }, index) => {
        const count = habits.filter(match).length;
        const on = id === active;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={on}
            title={`Press ${index + 1}`}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs transition-colors ${
              on
                ? 'border-gold/70 bg-gold/10 text-gold'
                : 'border-void-400 text-ink-500 hover:border-void-500 hover:text-ink-300'
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} />
            {label}
            {/* Shown even at zero. A chip that vanishes when it empties takes
                with it the one place on the board that says nothing is at
                risk, which is precisely the thing worth knowing. */}
            <span className={on ? 'text-gold/70' : 'text-ink-700'}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
