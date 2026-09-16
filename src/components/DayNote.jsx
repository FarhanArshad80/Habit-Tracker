import { useEffect, useRef } from 'react';
import { PenLine } from 'lucide-react';
import { useHabits } from '../context/HabitContext';
import { DAY_NOTE_LIMIT, noteFor } from '../utils/dayNotes';

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
  const value = noteFor(notes, today);

  // Midnight can arrive with the cursor still in the box. `today` changes
  // underneath it, the textarea swings to the new day's note, and yesterday's
  // sentence is left holding whatever whitespace it had — so it is closed off
  // properly on the way past rather than being left half-saved.
  const previous = useRef(today);

  useEffect(() => {
    if (previous.current !== today) {
      commitNote(previous.current);
      previous.current = today;
    }
  }, [today, commitNote]);

  const left = DAY_NOTE_LIMIT - value.length;

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-void-400/60 bg-void-200/70 p-4 shadow-card">
      <label
        htmlFor="day-note"
        className="flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wider text-slate-500"
      >
        <PenLine className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
        How did today go?
      </label>

      <textarea
        id="day-note"
        rows={2}
        value={value}
        maxLength={DAY_NOTE_LIMIT}
        onChange={(event) => writeNote(today, event.target.value)}
        // Saved as it is typed — there is no save button and there should not
        // be one for a single line. Blur is only where it gets tidied up.
        onBlur={() => commitNote(today)}
        placeholder="Slept badly, everything was uphill…"
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
