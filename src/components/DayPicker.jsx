import { ALL_DAYS } from '../utils/dateHelpers';

// Sunday-first, matching the weekday labels the trail already uses. Two of
// them read "T" and two read "S", so each carries its full name for anyone
// who cannot tell them apart by position alone.
const SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FULL = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export default function DayPicker({ days, onChange, idPrefix = 'days' }) {
  // Turning off the last remaining day would leave a ritual that is never
  // due, so the final one stays on until another is chosen.
  function toggle(day) {
    const next = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day].sort((a, b) => a - b);

    onChange(next.length > 0 ? next : days);
  }

  return (
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
  );
}
