import { ArrowDownWideNarrow } from 'lucide-react';

// How the list is stacked.
//
// The arrows move one ritual past its neighbour, which is the right tool for
// a board of five and useless on a board of fifteen: putting the one thing
// that matters at the top took a dozen presses, and the answer changes every
// morning anyway. These are the orders worth having handed to you.
//
// Manual stays the default and stays first. A hand-arranged list is a
// decision somebody made, and the orders below are a way of looking at it
// rather than a replacement for it — nothing here rewrites the stored order,
// so switching back returns the board exactly as it was left.
export const HABIT_ORDERS = [
  {
    id: 'manual',
    label: 'My order',
    compare: null,
  },
  {
    id: 'attention',
    label: 'Needs attention',
    // What is actually at stake today, longest run first — "you could lose
    // 40 days" is a different sentence from "you could lose two". Then what
    // is merely still owed, then everything already dealt with.
    compare: (a, b) => rank(a) - rank(b) || b.currentStreak - a.currentStreak,
  },
  {
    id: 'streak',
    label: 'Longest run',
    compare: (a, b) => b.currentStreak - a.currentStreak,
  },
  {
    id: 'name',
    label: 'A–Z',
    compare: (a, b) => a.name.localeCompare(b.name),
  },
];

// At risk first, then due and unfinished, then done, then everything not
// asked for today — a rest day and a paused ritual are both fine, and
// neither is what anyone is scanning this list for.
function rank(habit) {
  if (habit.streakAtRisk) return 0;
  if (habit.dueToday && !habit.completedToday) return 1;
  if (habit.dueToday) return 2;
  return 3;
}

export function habitOrder(id) {
  return HABIT_ORDERS.find((order) => order.id === id) || HABIT_ORDERS[0];
}

// Sorted without touching the stored order, so "My order" is always still
// there to go back to.
export function sortHabits(habits, id) {
  const { compare } = habitOrder(id);

  return compare ? [...habits].sort(compare) : habits;
}

export default function HabitOrder({ habits, active, onChange }) {
  // Nothing to stack with two rituals, and the chips would take more room
  // than the list they reorder.
  if (habits.length < 3) return null;

  return (
    <label className="flex items-center gap-2 text-ink-500">
      <ArrowDownWideNarrow className="h-3.5 w-3.5" strokeWidth={2} />

      <span className="sr-only">Order rituals by</span>

      <select
        value={active}
        onChange={(event) => onChange(event.target.value)}
        aria-label="Order rituals by"
        className="rounded-full border border-void-400 bg-void-200 px-3 py-1.5 font-mono text-xs text-ink-500 outline-none transition-colors hover:border-void-500 hover:text-ink-300 focus:border-gold/60"
      >
        {HABIT_ORDERS.map((order) => (
          <option key={order.id} value={order.id}>
            {order.label}
          </option>
        ))}
      </select>
    </label>
  );
}
