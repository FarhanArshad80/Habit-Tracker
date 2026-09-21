import { useState } from 'react';
import { Flame, Trash2, Check, Target, ChevronUp, ChevronDown, Pencil, Pause, Play, CalendarOff } from 'lucide-react';
import { resolveIcon } from '../utils/iconMap';
import { HABIT_COLORS, HABIT_ICONS, WHY_LIMIT } from '../context/HabitContext';
import {
  getLastNDays, formatFriendlyDate, isDue, isPausedOn, isSkippedOn,
} from '../utils/dateHelpers';
import { useHabits } from '../context/HabitContext';
import DayPicker from './DayPicker';

const TRAIL_LENGTH = 14;

// How close a run has to be to the record before it is worth pointing out.
// Three days is a stretch somebody can see the end of; ten days away is not
// a target, it is just a bigger number somewhere else on the card.
const RECORD_IN_REACH = 3;

// A record of one or two days is where every ritual starts, and calling it
// "your best run yet" on day two would spend the phrase before it means
// anything.
const RECORD_WORTH_NAMING = 3;

// The sentence the flame badge cannot say. It shows the run; it does not
// show that the run is two days from the longest this ritual has ever gone,
// which is the one comparison that turns an ordinary Tuesday into a reason
// to check in. Null whenever there is nothing close enough to be motivating.
function recordNote(current, best) {
  if (current <= 0) return null;

  if (current >= best) {
    return current >= RECORD_WORTH_NAMING ? 'Your longest run yet' : null;
  }

  const gap = best - current;

  if (gap > RECORD_IN_REACH) return null;

  return `${gap} day${gap === 1 ? '' : 's'} from your best run of ${best}`;
}

function colorHex(colorId) {
  return HABIT_COLORS.find((c) => c.id === colorId)?.hex || '#F2B705';
}

export default function HabitItem({ habit, index, total, siblings, onToggle, onDelete, onMove, onEdit, onTogglePause, onToggleSkip, reorderable = true }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(habit.name);
  const [draftWhy, setDraftWhy] = useState(habit.why || '');
  const [draftGoal, setDraftGoal] = useState(habit.weeklyGoal);
  const [draftDays, setDraftDays] = useState(habit.days);
  const [draftIcon, setDraftIcon] = useState(habit.icon);
  const [draftColor, setDraftColor] = useState(habit.color);
  const [editError, setEditError] = useState('');
  // The trail ends on the board's today, not on whatever the clock says
  // during this particular render.
  const { today } = useHabits();
  const Icon = resolveIcon(habit.icon);
  const hex = colorHex(habit.color);
  // What the form is proposing, as opposed to what is saved. Only the
  // pickers read it; the rest of the card keeps showing the ritual as it
  // stands until Save is pressed.
  const draftHex = colorHex(draftColor);
  const trail = getLastNDays(TRAIL_LENGTH, today);
  const completedSet = new Set(habit.completions);

  // The draft is seeded from whatever the ritual says right now, so an edit
  // opened after a change elsewhere does not start from a stale value.
  function startEditing() {
    setDraftName(habit.name);
    setDraftWhy(habit.why || '');
    setDraftGoal(habit.weeklyGoal);
    setDraftDays(habit.days);
    setDraftIcon(habit.icon);
    setDraftColor(habit.color);
    setEditError('');
    setEditing(true);
  }

  function chooseDraftDays(next) {
    setDraftDays(next);
    setDraftGoal((current) => Math.min(Number(current), next.length));
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

    onEdit(habit.id, {
      name: trimmed, why: draftWhy, goal: Number(draftGoal), days: draftDays,
      icon: draftIcon, color: draftColor,
    });
    setEditing(false);
  }

  return (
    <li
      className={`group relative rounded-2xl border border-void-400/60 bg-void-200/70 p-4 sm:p-5 shadow-card transition-colors hover:border-void-500 animate-rise ${
        habit.paused ? 'opacity-60 hover:opacity-100' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Icon + toggle for today */}
        <button
          type="button"
          onClick={() => onToggle(habit.id, today)}
          aria-pressed={habit.completedToday}
          aria-label={`Mark "${habit.name}" ${habit.completedToday ? 'not done' : 'done'} for today${
            habit.dueToday
              ? ''
              : habit.paused
                ? ' — paused, so this is a bonus'
                : ' — a rest day, so this is a bonus'
          }`}
          title={
            habit.dueToday
              ? undefined
              : habit.paused
                ? 'Paused — checking in still counts, it just is not owed'
                : 'Not due today — checking in is a bonus'
          }
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
                  {Array.from({ length: draftDays.length }, (_, i) => i + 1).map((n) => (
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
                <div className="w-full">
                  <label
                    htmlFor={`why-${habit.id}`}
                    className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500"
                  >
                    Why it matters
                  </label>
                  <input
                    id={`why-${habit.id}`}
                    type="text"
                    value={draftWhy}
                    onChange={(e) => setDraftWhy(e.target.value)}
                    placeholder="Optional — emptying this clears it"
                    maxLength={WHY_LIMIT}
                    className="w-full rounded-lg border border-void-400 bg-void-100 px-3 py-1.5 text-sm text-ink-100 placeholder:text-ink-700 outline-none focus:border-gold/60"
                  />
                </div>
                <div className="w-full">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">
                    Due on
                  </span>
                  <DayPicker
                    days={draftDays}
                    onChange={chooseDraftDays}
                    idPrefix={habit.id}
                  />
                </div>
                {/* Last in the form, because it is the part least likely to
                    be what the edit was opened for — and tinted live from the
                    draft rather than the saved colour, so the swatch being
                    considered is the one the card is wearing while it is
                    being considered. */}
                <div className="w-full">
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">
                    Look
                  </span>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex flex-wrap gap-1">
                      {HABIT_ICONS.map((iconName) => {
                        const IconComp = resolveIcon(iconName);
                        const active = draftIcon === iconName;
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setDraftIcon(iconName)}
                            aria-label={iconName}
                            aria-pressed={active}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
                            style={{
                              borderColor: active ? draftHex : 'rgba(139,147,167,0.25)',
                              backgroundColor: active ? `${draftHex}1A` : 'transparent',
                              color: active ? draftHex : undefined,
                            }}
                          >
                            <IconComp className="h-4 w-4" strokeWidth={1.75} />
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {HABIT_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setDraftColor(c.id)}
                          aria-label={c.label}
                          aria-pressed={draftColor === c.id}
                          className="h-6 w-6 rounded-full transition-transform"
                          style={{
                            backgroundColor: c.hex,
                            transform: draftColor === c.id ? 'scale(1.15)' : 'scale(1)',
                            boxShadow:
                              draftColor === c.id
                                ? `0 0 0 2px #131826, 0 0 0 4px ${c.hex}`
                                : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                {editError && (
                  <p className="w-full text-xs text-rose">{editError}</p>
                )}
              </form>
            ) : (
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="truncate font-display text-base font-semibold text-ink-100">
                  {habit.name}
                </h3>
                {/* Said in words, not just implied by the dimming — a faded
                    row could as easily be a rendering quirk as a decision. */}
                {habit.paused && (
                  <span className="shrink-0 rounded-full bg-void-400/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-500">
                    Paused
                  </span>
                )}
              </div>
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
              {/* A streak with something to lose today is outlined rather
                  than recoloured: the colour is the ritual's own and says
                  which ritual this is, so the warning has to arrive as a
                  ring around it instead of replacing it. */}
              <span
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-mono text-xs font-medium ${
                  habit.streakAtRisk ? 'ring-1 ring-inset animate-pulse-soft' : ''
                }`}
                style={{
                  color: hex,
                  backgroundColor: `${hex}14`,
                  '--tw-ring-color': habit.streakAtRisk ? `${hex}99` : undefined,
                }}
                title={
                  habit.streakAtRisk
                    ? `${habit.currentStreak}-day streak — due today and not checked off yet`
                    : `Best streak: ${habit.bestStreak} day${habit.bestStreak === 1 ? '' : 's'}`
                }
              >
                <Flame className="h-3.5 w-3.5" strokeWidth={2} />
                {habit.currentStreak}
              </span>
              {/* Order is how the list is read every morning, so the ritual
                  that matters most should be able to sit at the top. Shown
                  with the delete control, and only when there is somewhere
                  to move to. */}
              {/* Hidden while a filter is on. The arrows move a ritual past
                  its neighbour in the full list, and when the neighbour is
                  one the filter is hiding, the row appears not to move at
                  all - so the control is withdrawn rather than left to lie. */}
              {reorderable && total > 1 && !confirmingDelete && (
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
                  {/* Today off, without the ritual going quiet indefinitely.
                      Withdrawn while paused, where the day is already set
                      aside and skipping it would be a second thing to undo.
                      Held open once used, because a day skipped by mistake
                      needs a visible way back. */}
                  {(habit.skippedToday || !habit.paused) && (
                    <button
                      type="button"
                      onClick={() => onToggleSkip(habit.id, today)}
                      aria-pressed={habit.skippedToday}
                      aria-label={`${
                        habit.skippedToday ? 'Stop skipping' : 'Skip'
                      } "${habit.name}" today`}
                      title={
                        habit.skippedToday
                          ? 'Skipped today — press to make it due again'
                          : 'Skip today — one day off, streak intact'
                      }
                      className={`rounded-md p-1 transition-opacity hover:text-gold focus-visible:opacity-100 ${
                        habit.skippedToday
                          ? 'text-gold opacity-100'
                          : 'text-ink-700 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      <CalendarOff className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  )}

                  {/* Shown at full strength while paused, unlike its
                      neighbours: on a set-aside ritual, picking it back up is
                      the only thing anyone is here to do. */}
                  <button
                    type="button"
                    onClick={() => onTogglePause(habit.id)}
                    aria-pressed={habit.paused}
                    aria-label={`${habit.paused ? 'Resume' : 'Pause'} "${habit.name}"`}
                    title={
                      habit.paused
                        ? 'Resume — due again from today'
                        : 'Pause — set aside without losing the streak'
                    }
                    className={`rounded-md p-1 transition-opacity hover:text-gold focus-visible:opacity-100 ${
                      habit.paused
                        ? 'text-gold opacity-100'
                        : 'text-ink-700 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {habit.paused
                      ? <Play className="h-4 w-4" strokeWidth={1.75} />
                      : <Pause className="h-4 w-4" strokeWidth={1.75} />}
                  </button>
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

          {/* The reason, under the name where the name's own promise is.
              Above the streak notes rather than below them: those describe
              how it is going, and this is what it is for. */}
          {!editing && habit.why && (
            <p className="mt-1.5 truncate text-[13px] italic text-ink-500" title={habit.why}>
              {habit.why}
            </p>
          )}

          {recordNote(habit.currentStreak, habit.bestStreak) && (
            <p className="mt-2 font-mono text-[11px]" style={{ color: hex }}>
              {recordNote(habit.currentStreak, habit.bestStreak)}
            </p>
          )}

          {/* The number a streak cannot give you. A run says what is true
              right now; this says what has been true for a month, and it is
              the one that survives a missed Tuesday. Held back until there
              are enough owed days behind it to mean something. */}
          {habit.consistency && (
            <p className="mt-2 font-mono text-[11px] text-ink-700">
              <span style={{ color: hex }}>{habit.consistency.rate}%</span>
              {' kept · '}
              {habit.consistency.kept} of {habit.consistency.owed} days owed in
              {' '}the last {habit.consistency.window}
            </p>
          )}

          {/* Where the misses land. Held back unless one weekday is clearly
              worse than the rest, because a ritual dropped evenly across the
              week has nothing here to fix — and naming the lowest of six
              near-identical days would invent a habit out of noise. */}
          {habit.weakestDay && (
            <p className="mt-1 font-mono text-[11px] text-ink-700">
              {habit.weakestDay.name}s are the drop —{' '}
              <span style={{ color: hex }}>
                {habit.weakestDay.kept} of {habit.weakestDay.owed}
              </span>
              {' kept, against '}
              {habit.weakestDay.restRate}% on the other days
            </p>
          )}

          {/* Constellation trail — last 14 nights */}
          <div className="mt-3 flex items-center" role="group" aria-label="Last 14 days">
            {trail.map((dateKey, i) => {
              const done = completedSet.has(dateKey);
              // Read against the pauses as well as the schedule. Asking the
              // schedule alone drew a day that had been deliberately set
              // aside as a day that was owed and missed, which is the one
              // thing skipping a day is meant to avoid.
              const due = isDue(dateKey, habit.days, habit.pauses);
              const aside = isPausedOn(dateKey, habit.pauses);
              // Before the ritual was started there is nothing to record.
              // The dot stays on the line so the fortnight keeps its shape,
              // but it is not a day anyone can claim to have kept.
              const started = !habit.createdAt || dateKey >= habit.createdAt;
              const nextDone = i < trail.length - 1 && completedSet.has(trail[i + 1]);
              return (
                <div key={dateKey} className="flex items-center" style={{ flex: i < trail.length - 1 ? 1 : 'none' }}>
                  <button
                    type="button"
                    disabled={!started}
                    onClick={() => onToggle(habit.id, dateKey)}
                    title={
                      started
                        ? `${formatFriendlyDate(dateKey)}${
                            due
                              ? ''
                              : aside
                                ? isSkippedOn(dateKey, habit.pauses)
                                  ? ' · skipped'
                                  : ' · set aside'
                                : ' · rest day'
                          }`
                        : `${formatFriendlyDate(dateKey)} · before this ritual started`
                    }
                    aria-label={`${formatFriendlyDate(dateKey)}: ${
                      !started
                        ? 'before this ritual started'
                        : done
                          ? 'completed'
                          : due
                            ? 'not completed'
                            : aside ? 'set aside' : 'rest day'
                    }`}
                    className={`relative h-2.5 w-2.5 shrink-0 rounded-full transition-transform ${started ? 'hover:scale-150' : 'cursor-default opacity-40'} ${dateKey === today ? 'ring-2 ring-offset-2 ring-offset-void-200' : ''}`}
                    style={{
                      // A missed rest day is hollow rather than dim: dimming
                      // reads as a fainter version of "missed", where nothing
                      // was ever owed.
                      backgroundColor: done ? hex : 'transparent',
                      border: done
                        ? 'none'
                        : due
                          ? '1px solid rgba(139,147,167,0.45)'
                          : '1px dashed rgba(139,147,167,0.30)',
                      boxShadow: done ? `0 0 8px ${hex}99` : 'none',
                      // Tailwind's ring color comes from this custom property;
                      // a `ringColor` style key is not real CSS and is dropped.
                      '--tw-ring-color': dateKey === today ? hex : undefined,
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
