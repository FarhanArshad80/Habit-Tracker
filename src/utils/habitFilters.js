import { LayoutList, Target, Flame, Pause, Circle, CheckCircle2 } from 'lucide-react';

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
