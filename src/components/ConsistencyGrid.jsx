import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  addDays, weekdayOf, isScheduled, isPausedOn, formatFriendlyDate,
} from '../utils/dateHelpers';
import { noteFor } from '../utils/dayNotes';
import { useHabits } from '../context/HabitContext';

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
    // Pauses are dated, so the grid can be honest about them: a fortnight
    // set aside reads as nothing due rather than as a fortnight of misses.
    if (isPausedOn(dateKey, habit.pauses)) continue;
    if (!isScheduled(dateKey, habit.days)) continue;

    due += 1;
    if (habit.completions.includes(dateKey)) done += 1;
  }

  return { due, done };
}

export default function ConsistencyGrid({ habits }) {
  // The last column of the grid is today's week, so the grid has to learn
  // about a new day at the same moment the rest of the board does.
  const { today, notes } = useHabits();
  const weeks = useMemo(() => buildWeeks(today), [today]);

  // The day whose note is open under the grid. A note is written against
  // today and, until now, could only ever be read on today: the box moves on
  // at midnight and yesterday's sentence was never seen again. The grid is
  // where the past already lives, so it is where the notes are read back —
  // beside the square that says how that day went.
  const [reading, setReading] = useState(null);

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

  // Trimmed here rather than trusted, since today's note is stored as it is
  // being typed and may still be nothing but a space.
  const noteOn = (dateKey) => (dateKey > today ? '' : noteFor(notes, dateKey).trim());
  const readingNote = reading ? noteOn(reading) : '';
  const anyNotes = weeks.some((week) => week.some((dateKey) => noteOn(dateKey)));

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
        <span className="flex items-center gap-2 font-mono text-xs text-ink-700">
          less · more
          {anyNotes && (
            <>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <span className="h-1 w-1 rounded-full bg-teal" aria-hidden="true" />
                note
              </span>
            </>
          )}
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
              const note = noteOn(dateKey);
              const summary = future
                ? ''
                : `${formatFriendlyDate(dateKey)} — ${
                    score.due === 0
                      ? 'nothing due'
                      : `${score.done} of ${score.due} done`
                  }`;
              // Only a day with something to read becomes a button. Making
              // all eighty-four squares focusable would put eighty-four tab
              // stops between the progress bar and the rituals.
              const Cell = note ? 'button' : 'div';

              return (
                <Cell
                  key={dateKey}
                  {...(note
                    ? {
                        type: 'button',
                        onClick: () => setReading((open) => (open === dateKey ? null : dateKey)),
                        'aria-pressed': reading === dateKey,
                        'aria-label': `${summary}. Read the note.`,
                      }
                    : {})}
                  title={note ? `${summary}\n“${note}”` : summary}
                  className={`relative flex h-3 w-3 items-center justify-center rounded-[3px] ${
                    dateKey === today ? 'ring-1 ring-gold/70' : ''
                  } ${reading === dateKey ? 'ring-1 ring-teal' : ''} ${
                    note ? 'cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-teal' : ''
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
                >
                  {/* Inside the square rather than on its corner: the grid
                      scrolls sideways, and a mark hanging off the last
                      column would be clipped by the edge it sits against.
                      Teal reads on a gold day and on an empty one alike. */}
                  {note && (
                    <span className="h-1 w-1 rounded-full bg-teal" aria-hidden="true" />
                  )}
                </Cell>
              );
            })}
          </div>
        ))}
      </div>

      {/* Under the grid, not in a tooltip. A hover title never appears on a
          phone, and the note is a sentence someone wrote to be read. */}
      {readingNote && (
        <div
          className="mt-3 flex items-start gap-3 rounded-xl border border-teal/30 bg-teal-dim/30 px-3 py-2.5 animate-rise"
          role="status"
        >
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] uppercase tracking-wider text-teal">
              {formatFriendlyDate(reading)}
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink-100">
              {readingNote}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReading(null)}
            aria-label="Close the note"
            className="shrink-0 text-ink-500 transition-colors hover:text-ink-100"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      )}
    </div>
  );
}
