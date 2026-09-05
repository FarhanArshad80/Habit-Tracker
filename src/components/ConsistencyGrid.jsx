import { useMemo } from 'react';
import {
  todayKey, addDays, weekdayOf, isScheduled, formatFriendlyDate,
} from '../utils/dateHelpers';

const WEEKS = 12;
const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// The grid always starts on a Sunday so every column is a whole week and the
// weekday rows line up down the page. Counting back from the start of this
// week rather than from today is what keeps the last column the current one.
function buildWeeks(today) {
  const start = addDays(today, -weekdayOf(today) - 7 * (WEEKS - 1));

  return Array.from({ length: WEEKS }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day))
  );
}

// What was owed on a given day and how much of it was done. A ritual that did
// not exist yet is not counted — a grid that showed three months of misses
// for a habit started on Tuesday would be measuring the wrong thing.
function scoreDay(habits, dateKey) {
  let due = 0;
  let done = 0;

  for (const habit of habits) {
    if (habit.createdAt && dateKey < habit.createdAt) continue;
    if (!isScheduled(dateKey, habit.days)) continue;

    due += 1;
    if (habit.completions.includes(dateKey)) done += 1;
  }

  return { due, done };
}

export default function ConsistencyGrid({ habits }) {
  const today = todayKey();
  const weeks = useMemo(() => buildWeeks(today), [today]);

  const scores = useMemo(() => {
    const map = new Map();

    for (const week of weeks) {
      for (const dateKey of week) {
        if (dateKey > today) continue;
        map.set(dateKey, scoreDay(habits, dateKey));
      }
    }

    return map;
  }, [weeks, habits, today]);

  if (habits.length === 0) return null;

  // Month names sit above the week a month first appears in, which is how
  // the eye finds "some time in July" without counting columns.
  const monthLabels = weeks.map((week, index) => {
    const month = Number(week[0].slice(5, 7)) - 1;
    const previous = index === 0 ? null : Number(weeks[index - 1][0].slice(5, 7)) - 1;

    return month === previous ? '' : MONTH_LABELS[month];
  });

  return (
    <div className="rounded-2xl border border-void-400/60 bg-void-200/70 p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-display text-xs font-bold uppercase tracking-wider text-ink-500">
          Last 12 weeks
        </span>
        <span className="font-mono text-xs text-ink-700">
          less · more
        </span>
      </div>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
        {/* Weekday gutter. Only alternate rows are labelled — seven single
            letters down the side is noise, and two of them read "T". */}
        <div className="flex shrink-0 flex-col gap-1 pt-[18px]">
          {WEEKDAY_LABELS.map((label, day) => (
            <span
              key={day}
              className="h-3 w-3 text-center font-mono text-[9px] leading-3 text-ink-700"
            >
              {day % 2 === 1 ? label : ''}
            </span>
          ))}
        </div>

        {weeks.map((week, index) => (
          <div key={week[0]} className="flex shrink-0 flex-col gap-1">
            <span className="h-[14px] font-mono text-[9px] leading-[14px] text-ink-700">
              {monthLabels[index]}
            </span>

            {week.map((dateKey) => {
              const future = dateKey > today;
              const score = scores.get(dateKey);
              const rate = score && score.due > 0 ? score.done / score.due : null;

              return (
                <div
                  key={dateKey}
                  title={
                    future
                      ? ''
                      : `${formatFriendlyDate(dateKey)} — ${
                          score.due === 0
                            ? 'nothing due'
                            : `${score.done} of ${score.due} done`
                        }`
                  }
                  className={`h-3 w-3 rounded-[3px] ${
                    dateKey === today ? 'ring-1 ring-gold/70' : ''
                  }`}
                  style={{
                    // Nothing due and nothing recorded are different days, so
                    // they are drawn differently: an outline for a rest day,
                    // a filled-but-empty square for a day that was missed.
                    backgroundColor:
                      future || rate === null
                        ? 'transparent'
                        : `rgba(242, 183, 5, ${0.12 + rate * 0.78})`,
                    border:
                      future
                        ? '1px solid rgba(139,147,167,0.10)'
                        : rate === null
                          ? '1px dashed rgba(139,147,167,0.25)'
                          : 'none',
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
