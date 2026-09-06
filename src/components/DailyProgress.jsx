import { Flame } from 'lucide-react';

export default function DailyProgress({ stats }) {
  const {
    total, dueToday, completedToday, bonusToday, completionRate,
    atRisk, longestAtRisk,
  } = stats;

  if (total === 0) return null;

  const isComplete = completedToday === dueToday;

  return (
    <div className="rounded-2xl border border-void-400/60 bg-void-200/70 p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-ink-500">
          Today&apos;s progress
        </span>
        <span className="font-mono text-xs text-ink-300">
          {dueToday === 0
            ? `rest day${bonusToday > 0 ? ` · ${bonusToday} bonus` : ''}`
            : `${completedToday} of ${dueToday} due`}
        </span>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-void-400/70"
        role="progressbar"
        aria-valuenow={completionRate}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Habits completed today"
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${
            isComplete
              ? 'bg-gradient-to-r from-teal to-teal/70'
              : 'bg-gradient-to-r from-gold to-gold-soft'
          }`}
          style={{ width: `${completionRate}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-ink-500">
        {dueToday === 0
          ? 'Nothing due today. Rest is part of the plan.'
          : isComplete
            ? 'Every ritual due today is checked off — see you tomorrow.'
            : `${100 - completionRate}% left to close out the day.`}
      </p>

      {/* Below the percentage, not instead of it. A percentage says how much
          is outstanding; this says what it costs to leave it that way. */}
      {atRisk > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-gold">
          <Flame className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
          {atRisk === 1
            ? `A ${longestAtRisk}-day streak ends tonight unless it's checked off.`
            : `${atRisk} streaks end tonight unless they're checked off — the longest is ${longestAtRisk} days.`}
        </p>
      )}
    </div>
  );
}
