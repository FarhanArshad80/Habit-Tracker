import { useEffect, useRef, useState } from 'react';
import { PenLine } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { DAY_NOTE_LIMIT, noteFor } from '../utils/dayNotes';
import { addDays } from '../utils/dateHelpers';

// Where the counter starts being useful. Showing it from the first character
// turns a margin note into a form with a budget; showing it only at the wall
// is a limit somebody meets by being cut off mid-word.
const COUNTDOWN_FROM = 60;

// One line about the day, under the bar that says how the day went in
// numbers.
//
// The grid records that Tuesday was missed. It has no way to record that
// Tuesday was missed because of a delayed flight, and without that the
// history slowly becomes a list of failures with the reasons filed off — the
// exact reading that makes people give up on a tracker that is, in fact,
// telling them the truth about a hard week.
export default function DayNote() {
  const { notes, today, writeNote, commitNote } = useHabits();

  // Which day is being written about.
  //
  // A day is only finished once it is over, and the box moved on at midnight
  // — so the hour when there is finally something to say about a day was the
  // one hour the box would no longer take it. Reflecting on last night over
  // this morning's coffee is the ordinary case, not the edge one.
  //
  // Yesterday and no further. The grid already reads older notes back beside
  // the squares they explain, and a box that can reach any day in three
  // months is a journal with a date picker — which is a different app, and
  // one this note was deliberately kept from becoming.
  const [back, setBack] = useState(false);
  const dateKey = back ? addDays(today, -1) : today;
  const value = noteFor(notes, dateKey);

  // Midnight can arrive with the cursor still in the box. `today` changes
  // underneath it, the textarea swings to the new day's note, and yesterday's
  // sentence is left holding whatever whitespace it had — so it is closed off
  // properly on the way past rather than being left half-saved.
  //
  // The day being written about is what gets closed, not today: with the box
  // turned back, those are two different dates and only one of them has been
  // typed into. The box also returns to today, because "yesterday" now names
  // a day nobody has yet had the chance to miss writing about.
  const previous = useRef(dateKey);

  useEffect(() => {
    if (previous.current !== dateKey) {
      commitNote(previous.current);
      previous.current = dateKey;
    }
  }, [dateKey, commitNote]);

  useEffect(() => {
    setBack(false);
  }, [today]);

  const left = DAY_NOTE_LIMIT - value.length;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-void-400/60 bg-void-200/70 p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="day-note"
          className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-slate-500"
        >
          <PenLine className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
          How did {back ? 'yesterday' : 'today'} go?
        </label>

        {/* Two days, so two buttons rather than a picker — and the one being
            written is named in the heading above, which is where somebody
            about to type a sentence is already looking. */}
        <div className="flex items-center gap-1" role="group" aria-label="Which day this note is about">
          {[
            { label: 'Today', on: !back, value: false },
            { label: 'Yesterday', on: back, value: true },
          ].map((choice) => (
            <button
              key={choice.label}
              type="button"
              onClick={() => setBack(choice.value)}
              aria-pressed={choice.on}
              className={`rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
                choice.on
                  ? 'border-gold/70 bg-gold/10 text-gold'
                  : 'border-void-400 text-ink-700 hover:border-void-500 hover:text-ink-300'
              }`}
            >
              {choice.label}
            </button>
          ))}
        </div>
      </div>

      <textarea
        id="day-note"
        rows={2}
        value={value}
        maxLength={DAY_NOTE_LIMIT}
        onChange={(event) => writeNote(dateKey, event.target.value)}
        // Saved as it is typed — there is no save button and there should not
        // be one for a single line. Blur is only where it gets tidied up.
        onBlur={() => commitNote(dateKey)}
        placeholder={
          back
            ? 'Got it done late, but got it done…'
            : 'Slept badly, everything was uphill…'
        }
        className="w-full resize-none rounded-xl border border-void-400 bg-transparent px-3 py-2 text-sm leading-relaxed text-ink-100 placeholder:text-ink-700 transition-colors focus:border-gold/70 focus:outline-none"
      />

      {left <= COUNTDOWN_FROM && (
        <p className="self-end font-mono text-[11px] text-ink-700" aria-live="polite">
          {left} left
        </p>
      )}
    </div>
  );
}
