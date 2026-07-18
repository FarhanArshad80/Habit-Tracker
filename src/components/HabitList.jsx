import { Sparkles } from 'lucide-react';
import HabitItem from './HabitItem';

export default function HabitList({ habits, onToggle, onDelete }) {
  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-void-400 bg-void-200/40 px-6 py-16 text-center animate-rise">
        <Sparkles className="h-8 w-8 text-gold/70" strokeWidth={1.5} />
        <h3 className="mt-4 font-display text-lg font-semibold text-ink-100">
          No rituals yet
        </h3>
        <p className="mt-1.5 max-w-xs text-sm text-ink-500">
          Add your first habit below and start lighting up the sky, one night at a time.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {habits.map((habit) => (
        <HabitItem
          key={habit.id}
          habit={habit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
