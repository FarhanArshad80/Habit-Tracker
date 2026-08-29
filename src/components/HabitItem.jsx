import { useState } from 'react';
import { Flame, Trash2, Check } from 'lucide-react';
import { resolveIcon } from '../utils/iconMap';
import { HABIT_COLORS } from '../context/HabitContext';
import { getLastNDays, isToday, todayKey, formatFriendlyDate } from '../utils/dateHelpers';

const TRAIL_LENGTH = 14;

function colorHex(colorId) {
  return HABIT_COLORS.find((c) => c.id === colorId)?.hex || '#F2B705';
}

export default function HabitItem({ habit, onToggle, onDelete }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const Icon = resolveIcon(habit.icon);
  const hex = colorHex(habit.color);
  const trail = getLastNDays(TRAIL_LENGTH);
  const completedSet = new Set(habit.completions);

  return (
    <li
      className="group relative rounded-2xl border border-void-400/60 bg-void-200/70 p-4 sm:p-5 shadow-card transition-colors hover:border-void-500 animate-rise"
    >
      <div className="flex items-start gap-4">
        {/* Icon + toggle for today */}
        <button
          type="button"
          onClick={() => onToggle(habit.id, todayKey())}
          aria-pressed={habit.completedToday}
          aria-label={`Mark "${habit.name}" ${habit.completedToday ? 'not done' : 'done'} for today`}
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-all duration-200 active:scale-90"
          style={{
            borderColor: habit.completedToday ? hex : 'rgba(139,147,167,0.25)',
            backgroundColor: habit.completedToday ? `${hex}1A` : 'transparent',
            boxShadow: habit.completedToday ? `0 0 18px ${hex}55` : 'none',
          }}
        >
          {habit.completedToday ? (
            <Check className="h-6 w-6 animate-pop-in" style={{ color: hex }} strokeWidth={2.5} />
          ) : (
            <Icon className="h-5 w-5 text-ink-500 transition-colors group-hover:text-ink-300" strokeWidth={1.75} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h3 className="truncate font-display text-base font-semibold text-ink-100">
              {habit.name}
            </h3>
            <div className="flex items-center gap-3 shrink-0">
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-medium"
                style={{ color: hex, backgroundColor: `${hex}14` }}
                title={`Best streak: ${habit.bestStreak} day${habit.bestStreak === 1 ? '' : 's'}`}
              >
                <Flame className="h-3.5 w-3.5" strokeWidth={2} />
                {habit.currentStreak}
              </span>
              {confirmingDelete ? (
                <div className="flex items-center gap-1.5 animate-rise">
                  <button
                    type="button"
                    onClick={() => onDelete(habit.id)}
                    className="rounded-md bg-rose/90 px-2 py-1 text-xs font-medium text-void-100 hover:bg-rose"
                  >
                    Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-ink-500 hover:text-ink-300"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmingDelete(true)}
                  aria-label={`Delete "${habit.name}"`}
                  className="rounded-md p-1 text-ink-700 opacity-0 transition-opacity hover:text-rose group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            </div>
          </div>

          {/* Constellation trail — last 14 nights */}
          <div className="mt-3 flex items-center" role="group" aria-label="Last 14 days">
            {trail.map((dateKey, i) => {
              const done = completedSet.has(dateKey);
              const nextDone = i < trail.length - 1 && completedSet.has(trail[i + 1]);
              return (
                <div key={dateKey} className="flex items-center" style={{ flex: i < trail.length - 1 ? 1 : 'none' }}>
                  <button
                    type="button"
                    onClick={() => onToggle(habit.id, dateKey)}
                    title={formatFriendlyDate(dateKey)}
                    aria-label={`${formatFriendlyDate(dateKey)}: ${done ? 'completed' : 'not completed'}`}
                    className={`relative h-2.5 w-2.5 shrink-0 rounded-full transition-transform hover:scale-150 ${isToday(dateKey) ? 'ring-2 ring-offset-2 ring-offset-void-200' : ''}`}
                    style={{
                      backgroundColor: done ? hex : 'rgba(139,147,167,0.22)',
                      boxShadow: done ? `0 0 8px ${hex}99` : 'none',
                      // Tailwind's ring color comes from this custom property;
                      // a `ringColor` style key is not real CSS and is dropped.
                      '--tw-ring-color': isToday(dateKey) ? hex : undefined,
                    }}
                  />
                  {i < trail.length - 1 && (
                    <div
                      className="h-px flex-1"
                      style={{
                        backgroundColor: done && nextDone ? `${hex}88` : 'rgba(139,147,167,0.12)',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </li>
  );
}
