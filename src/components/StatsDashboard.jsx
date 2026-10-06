import { Flame, Target, Trophy, CalendarCheck } from 'lucide-react';

function StatCard({ icon: Icon, label, value, suffix, accent, note }) {
  return (
    <div className="rounded-2xl border border-void-400/60 bg-void-200/70 p-4 shadow-card">
      <div className="flex items-center gap-2 text-ink-500">
        <Icon className="h-3.5 w-3.5" strokeWidth={2} style={{ color: accent }} />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-2xl font-semibold text-ink-100 sm:text-3xl">
        {value}
        {suffix && <span className="ml-1 text-sm font-normal text-ink-500">{suffix}</span>}
      </p>
      {note && (
        <p className="mt-1 truncate font-mono text-[11px] text-ink-700" title={note}>
          {note}
        </p>
      )}
    </div>
  );
}
//
export default function StatsDashboard({ stats }) {
  const {
    total, activeTotal, dueToday, completedToday, bestStreak, totalCompletions, recentCompletions,
    completionRate, goalsMet, bestStreakHolder, bestStreakHolders,
  } = stats;

  // Whose record it is. One name when one ritual holds it, a count when
  // several are level, and nothing before there is a record at all.
  const recordNote = bestStreakHolder
    ? bestStreakHolder
    : bestStreakHolders > 1
      ? `shared by ${bestStreakHolders} rituals`
      : null;

  // What is still owed today, which is the number the fraction leaves to be
  // worked out. Silent on a rest day and before anything is tracked.
  const leftToday = dueToday - completedToday;
  const todayNote = total === 0 || dueToday === 0
    ? null
    : leftToday > 0
      ? `${leftToday} still to do`
      : 'All done for today';

  // The fraction says how many goals are met; what the rest of the week has
  // to do is the other half of it. Silent before anything is tracked.
  const goalsOpen = activeTotal - goalsMet;
  const weekNote = activeTotal === 0
    ? null
    : goalsOpen > 0
      ? `${goalsOpen} still open`
      : 'Every goal met';

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {/* Measured against what is due, not everything tracked — a day where
          nothing was scheduled is a rest day, not a 0%. */}
      <StatCard
        icon={Target}
        label="Today"
        value={total === 0 ? '—' : dueToday === 0 ? 'Rest' : `${completedToday}/${dueToday}`}
        suffix={total === 0 || dueToday === 0 ? '' : `· ${completionRate}%`}
        accent="#2DD4BF"
        note={todayNote}
      />
      <StatCard
        icon={Flame}
        label="Best streak"
        value={bestStreak}
        suffix={bestStreak === 1 ? 'day' : 'days'}
        accent="#F2B705"
        note={recordNote}
      />
      {/* Weekly goals rather than a plain ritual count — the count is already
          the denominator of the Today card. */}
      <StatCard
        icon={CalendarCheck}
        label="This week"
        value={activeTotal === 0 ? '—' : `${goalsMet}/${activeTotal}`}
        suffix={activeTotal === 0 ? '' : 'goals met'}
        accent="#A78BFA"
        note={weekNote}
      />
      <StatCard
        icon={Trophy}
        label="All-time"
        value={totalCompletions}
        suffix={totalCompletions === 1 ? 'check-in' : 'check-ins'}
        accent="#FB7185"
        note={totalCompletions > 0 ? `${recentCompletions} in the last 7 days` : null}
      />
    </div>
  );
}
