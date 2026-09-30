import { ALL_DAYS } from '../utils/dateHelpers';

// Sunday-first, matching the weekday labels the trail already uses. Two of
// them read "T" and two read "S", so each carries its full name for anyone
// who cannot tell them apart by position alone.
const SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

// The three schedules most rituals end up on, one click each instead of
// five or six toggles. A preset that matches the current days shows as
// chosen, so the row also says at a glance which schedule this is.
const PRESETS = [
  { label: 'Every day', days: ALL_DAYS },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
];

function sameDays(a, b) {
  return a.length === b.length && a.every((day, i) => day === b[i]);
}

export default function DayPicker({ days, onChange, idPrefix = 'days' }) {
  // Turning off the last remaining day would leave a ritual that is never
  // due, so the final one stays on until another is chosen.
  function toggle(day) {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort((a, b) => a - b);

    onChange(next.length > 0 ? next : days);
  }

  const sorted = [...days].sort((a, b) => a - b);

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex gap-1.5" role="group" aria-label="Days this ritual is due">
        {ALL_DAYS.map((day) => {
          const on = days.includes(day);
          return (
            <button
              key={`${idPrefix}-${day}`}
              type="button"
              onClick={() => toggle(day)}
              aria-pressed={on}
              aria-label={FULL[day]}
              title={FULL[day]}
              className={`h-8 w-8 rounded-lg border font-mono text-xs transition-colors ${
                on
                  ? 'border-gold/70 bg-gold/10 text-gold'
                  : 'border-void-400 text-ink-700 hover:border-void-500 hover:text-ink-500'
              }`}
            >
              {SHORT[day]}
            </button>
          );
        })}
      </div>
      <div className="flex gap-1" role="group" aria-label="Common schedules">
        {PRESETS.map((preset) => {
          const on = sameDays(sorted, preset.days);
          return (
            <button
              key={`${idPrefix}-${preset.label}`}
              type="button"
              onClick={() => onChange([...preset.days])}
              aria-pressed={on}
              className={`rounded-md border px-2 py-1 text-[11px] transition-colors ${
                on
                  ? 'border-gold/50 text-gold'
                  : 'border-void-400 text-ink-700 hover:border-void-500 hover:text-ink-500'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
