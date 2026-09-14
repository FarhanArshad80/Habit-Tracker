import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { HABIT_COLORS, HABIT_ICONS, WHY_LIMIT, useHabits } from '../context/HabitContext';
import { resolveIcon } from '../utils/iconMap';
import DayPicker from './DayPicker';
import { ALL_DAYS } from '../utils/dateHelpers';

// A blank "Name" box is the hardest part of starting. These are rituals most
// people recognise straight away, each with a shape that suits it — nobody
// lifts weights seven days a week, and a late Friday or Saturday night should not break a
// sleep routine — so picking one fills in the whole form, not only the name.
//
// A starting point rather than a shortcut past the form: everything stays
// editable, and nothing is added until the button is pressed.
const STARTERS = [
  { name: 'Read 20 minutes', icon: 'BookOpen', color: 'gold', days: [0, 1, 2, 3, 4, 5, 6], goal: 7 },
  { name: 'Drink 2L of water', icon: 'Droplet', color: 'sky', days: [0, 1, 2, 3, 4, 5, 6], goal: 7 },
  { name: 'Work out', icon: 'Dumbbell', color: 'rose', days: [1, 3, 5], goal: 3 },
  { name: 'Walk 8,000 steps', icon: 'Footprints', color: 'lime', days: [0, 1, 2, 3, 4, 5, 6], goal: 5 },
  { name: 'In bed by 11', icon: 'Moon', color: 'violet', days: [0, 1, 2, 3, 4], goal: 5 },
  { name: 'Practise coding', icon: 'Code2', color: 'teal', days: [1, 2, 3, 4, 5], goal: 5 },
];

// Enough to spark an idea without turning the top of the form into a menu.
const STARTERS_SHOWN = 4;

export default function AddHabitForm({ onAdd }) {
  const { habits } = useHabits();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [why, setWhy] = useState('');
  const [icon, setIcon] = useState(HABIT_ICONS[0]);
  const [color, setColor] = useState(HABIT_COLORS[0].id);
  const [days, setDays] = useState(ALL_DAYS);
  const [goal, setGoal] = useState(7);
  const [error, setError] = useState('');

  function reset() {
    setName('');
    setWhy('');
    setIcon(HABIT_ICONS[0]);
    setColor(HABIT_COLORS[0].id);
    setDays(ALL_DAYS);
    setGoal(7);
    setError('');
  }

  // Rituals already on the board are not suggested again: offering one would
  // only lead to the duplicate-name error below.
  const tracked = new Set(habits.map((h) => h.name.trim().toLowerCase()));
  const starters = STARTERS
    .filter((starter) => !tracked.has(starter.name.toLowerCase()))
    .slice(0, STARTERS_SHOWN);

  function applyStarter(starter) {
    setName(starter.name);
    setIcon(starter.icon);
    setColor(starter.color);
    setDays(starter.days);
    setGoal(Math.min(starter.goal, starter.days.length));
    setError('');
  }

  // Narrowing the schedule pulls an out-of-reach goal down with it, so the
  // number in the box is always one the week can actually hold.
  function chooseDays(next) {
    setDays(next);
    setGoal((current) => Math.min(Number(current), next.length));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give your ritual a name.');
      return;
    }
    if (trimmed.length > 40) {
      setError('Keep it under 40 characters.');
      return;
    }
    const clash = habits.some(
      (h) => h.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (clash) {
      setError('You already track a ritual with that name.');
      return;
    }
    onAdd({ name: trimmed, why, icon, color, days, goal: Number(goal) });
    reset();
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-void-500 bg-void-200/40 px-4 py-3.5 font-display text-sm font-medium text-ink-300 transition-all hover:border-gold/60 hover:bg-void-200 hover:text-gold"
      >
        <Plus className="h-4 w-4" strokeWidth={2.25} />
        New ritual
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-void-400 bg-void-200 p-5 shadow-card animate-rise"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink-100">New ritual</h3>
        <button
          type="button"
          onClick={() => { setOpen(false); reset(); }}
          aria-label="Close form"
          className="rounded-md p-1 text-ink-500 hover:text-ink-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4">
        <label htmlFor="habit-name" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">
          Name
        </label>
        <input
          id="habit-name"
          type="text"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(''); }}
          placeholder="e.g. Read 20 minutes"
          maxLength={40}
          autoFocus
          className="w-full rounded-lg border border-void-400 bg-void-100 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-700 outline-none transition-colors focus:border-gold/60"
        />
        {error && <p className="mt-1.5 text-xs text-rose">{error}</p>}

        {/* Only while the box is empty. Once somebody has started typing
            their own idea, suggestions underneath it are in the way. */}
        {!name.trim() && starters.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Ideas to start from">
            <span className="text-xs text-ink-700">Ideas:</span>
            {starters.map((starter) => {
              const StarterIcon = resolveIcon(starter.icon);

              return (
                <button
                  key={starter.name}
                  type="button"
                  onClick={() => applyStarter(starter)}
                  className="flex items-center gap-1 rounded-full border border-void-400 px-2.5 py-1 text-xs text-ink-500 transition-colors hover:border-gold/60 hover:text-gold"
                >
                  <StarterIcon className="h-3 w-3" strokeWidth={2} />
                  {starter.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Optional, and quiet about it. A required "why" box would turn
          adding a ritual into an exam, and the reason is often only clear
          after a fortnight of keeping it. */}
      <div className="mt-4">
        <label htmlFor="habit-why" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">
          Why it matters <span className="text-ink-700">— optional</span>
        </label>
        <input
          id="habit-why"
          type="text"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="e.g. so I finish a book a month"
          maxLength={WHY_LIMIT}
          className="w-full rounded-lg border border-void-400 bg-void-100 px-3.5 py-2.5 text-sm text-ink-100 placeholder:text-ink-700 outline-none transition-colors focus:border-gold/60"
        />
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Icon</span>
        <div className="grid grid-cols-8 gap-2">
          {HABIT_ICONS.map((iconName) => {
            const IconComp = resolveIcon(iconName);
            const active = icon === iconName;
            return (
              <button
                key={iconName}
                type="button"
                onClick={() => setIcon(iconName)}
                aria-label={iconName}
                aria-pressed={active}
                className={`flex h-9 items-center justify-center rounded-lg border transition-colors ${
                  active
                    ? 'border-gold/70 bg-gold/10 text-gold'
                    : 'border-void-400 text-ink-500 hover:border-void-500 hover:text-ink-300'
                }`}
              >
                <IconComp className="h-4 w-4" strokeWidth={1.75} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">
          Due on
        </span>
        <DayPicker days={days} onChange={chooseDays} idPrefix="new" />
        <p className="mt-1.5 text-xs text-ink-700">
          {days.length === 7
            ? 'Every day.'
            : `${days.length} days a week — the rest are rest days, and they won't break a streak.`}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">Color</span>
          <div className="flex gap-2">
            {HABIT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setColor(c.id)}
                aria-label={c.label}
                aria-pressed={color === c.id}
                className="h-7 w-7 rounded-full transition-transform"
                style={{
                  backgroundColor: c.hex,
                  transform: color === c.id ? 'scale(1.15)' : 'scale(1)',
                  boxShadow: color === c.id ? `0 0 0 2px #131826, 0 0 0 4px ${c.hex}` : 'none',
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="habit-goal" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-ink-500">
            Weekly goal
          </label>
          <select
            id="habit-goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="rounded-lg border border-void-400 bg-void-100 px-3 py-2 text-sm text-ink-100 outline-none focus:border-gold/60"
          >
            {Array.from({ length: days.length }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}x / week</option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 font-display text-sm font-semibold text-void-100 transition-colors hover:bg-gold-soft"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Add Habit
      </button>
    </form>
  );
}
