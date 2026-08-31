import { Flame, Target, Trophy, CalendarCheck } from 'lucide-react';

function StatCard({ icon: Icon, label, value, suffix, accent }) {
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
    </div>
  );
}
//
export default function StatsDashboard({ stats }) {
  const { total, completedToday, bestStreak, totalCompletions, completionRate, goalsMet } = stats;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        icon={Target}
        label="Today"
        value={total === 0 ? '—' : `${completedToday}/${total}`}
        suffix={total === 0 ? '' : `· ${completionRate}%`}
        accent="#2DD4BF"
      />
      <StatCard
        icon={Flame}
        label="Best streak"
        value={bestStreak}
        suffix={bestStreak === 1 ? 'day' : 'days'}
        accent="#F2B705"
      />
      {/* Weekly goals rather than a plain ritual count — the count is already
          the denominator of the Today card. */}
      <StatCard
        icon={CalendarCheck}
        label="This week"
        value={total === 0 ? '—' : `${goalsMet}/${total}`}
        suffix={total === 0 ? '' : 'goals met'}
        accent="#A78BFA"
      />
      <StatCard
        icon={Trophy}
        label="All-time"
        value={totalCompletions}
        suffix={totalCompletions === 1 ? 'check-in' : 'check-ins'}
        accent="#FB7185"
      />
    </div>
  );
}
