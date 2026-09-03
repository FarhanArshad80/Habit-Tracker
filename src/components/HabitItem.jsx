import { useState } from 'react';
import { Flame, Trash2, Check, Target, ChevronUp, ChevronDown, Pencil } from 'lucide-react';
import { resolveIcon } from '../utils/iconMap';
import { HABIT_COLORS } from '../context/HabitContext';
import { getLastNDays, isToday, todayKey, formatFriendlyDate } from '../utils/dateHelpers';

const TRAIL_LENGTH = 14;

function colorHex(colorId) {
  return HABIT_COLORS.find((c) => c.id === colorId)?.hex || '#F2B705';
}

export default function HabitItem({ habit, index, total, siblings, onToggle, onDelete, onMove, onEdit }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(habit.name);
  const [draftGoal, setDraftGoal] = useState(habit.weeklyGoal);
  const [editError, setEditError] = useState('');
  const Icon = resolveIcon(habit.icon);
  const hex = colorHex(habit.color);
  const trail = getLastNDays(TRAIL_LENGTH);
  const completedSet = new Set(habit.completions);

  // The draft is seeded from whatever the ritual says right now, so an edit
  // opened after a change elsewhere does not start from a stale value.
  function startEditing() {
    setDraftName(habit.name);
    setDraftGoal(habit.weeklyGoal);
    setEditError('');
    setEditing(true);
  }

  function saveEdit(e) {
    e.preventDefault();
    const trimmed = draftName.trim();

    if (!trimmed) {
      setEditError('A ritual needs a name.');
      return;
    }
    if (trimmed.length > 40) {
      setEditError('Keep it under 40 characters.');
      return;
    }
    // The same clash the add form rejects — except a ritual is allowed to
    // keep the name it already has.
    const clash = siblings.some(
      (other) =>
        other.id !== habit.id &&
        other.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (clash) {
      setEditError('You already track a ritual with that name.');
      return;
    }

    onEdit(habit.id, { name: trimmed, goal: Number(draftGoal) });
    setEditing(false);
  }

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
            {editing ? (
              <form onSubmit={saveEdit} className="flex w-full flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => { setDraftName(e.target.value); setEditError(''); }}
                  maxLength={40}
                  autoFocus
                  aria-label="Ritual name"
                  className="min-w-0 flex-1 rounded-lg border border-void-400 bg-void-100 px-3 py-1.5 font-display text-base text-ink-100 outline-none focus:border-gold/60"
                />
                <select
                  value={draftGoal}
                  onChange={(e) => setDraftGoal(e.target.value)}
                  aria-label="Weekly goal"
                  className="rounded-lg border border-void-400 bg-void-100 px-2 py-1.5 font-mono text-xs text-ink-100 outline-none focus:border-gold/60"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                    <option key={n} value={n}>{n}x / week</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="rounded-md bg-gold px-2.5 py-1.5 text-xs font-semibold text-void-100 hover:bg-gold-soft"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md px-2 py-1.5 text-xs font-medium text-ink-500 hover:text-ink-300"
                >
                  Cancel
                </button>
                {editError && (
                  <p className="w-full text-xs text-rose">{editError}</p>
                )}
              </form>
            ) : (
              <h3 className="truncate font-display text-base font-semibold text-ink-100">
                {habit.name}
              </h3>
            )}
            <div className={`flex items-center gap-3 shrink-0 ${editing ? 'hidden' : ''}`}>
              {/* Weekly goal — the target picked when the ritual was created,
                  measured over a rolling seven days. */}
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-medium"
                style={
                  habit.goalMet
                    ? { color: hex, backgroundColor: `${hex}14` }
                    : { color: '#8B93A7', backgroundColor: 'rgba(139,147,167,0.10)' }
                }
                title={`${habit.weeklyCount} of ${habit.weeklyGoal} completed in the last 7 days`}
              >
                {habit.goalMet && <Target className="h-3.5 w-3.5" strokeWidth={2} />}
                {habit.weeklyCount}/{habit.weeklyGoal}
              </span>
              <span
                className="flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-medium"
                style={{ color: hex, backgroundColor: `${hex}14` }}
                title={`Best streak: ${habit.bestStreak} day${habit.bestStreak === 1 ? '' : 's'}`}
              >
                <Flame className="h-3.5 w-3.5" strokeWidth={2} />
                {habit.currentStreak}
              </span>
              {/* Order is how the list is read every morning, so the ritual
                  that matters most should be able to sit at the top. Shown
                  with the delete control, and only when there is somewhere
                  to move to. */}
              {total > 1 && !confirmingDelete && (
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button
                    type="button"
                    onClick={() => onMove(index, index - 1)}
                    disabled={index === 0}
                    aria-label={`Move "${habit.name}" up`}
                    className="rounded-md p-1 text-ink-700 transition-colors hover:text-ink-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-ink-700"
                  >
                    <ChevronUp className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMove(index, index + 1)}
                    disabled={index === total - 1}
                    aria-label={`Move "${habit.name}" down`}
                    className="rounded-md p-1 text-ink-700 transition-colors hover:text-ink-300 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-ink-700"
                  >
                    <ChevronDown className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
              )}

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
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={startEditing}
                    aria-label={`Edit "${habit.name}"`}
                    className="rounded-md p-1 text-ink-700 opacity-0 transition-opacity hover:text-gold group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Pencil className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmingDelete(true)}
                    aria-label={`Delete "${habit.name}"`}
                    className="rounded-md p-1 text-ink-700 opacity-0 transition-opacity hover:text-rose group-hover:opacity-100 focus-visible:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                  </button>
                </div>
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
