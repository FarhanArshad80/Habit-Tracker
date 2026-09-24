import { useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

// Below this the list is something you read, not something you hunt through,
// and a search box above five lines is furniture. It is the same reasoning
// the filter chips (two) and the sort chips (three) already use — each
// control shows up at the point the list stops answering without it.
export const SEARCH_MIN_HABITS = 5;

// Whether the board is big enough to be worth searching. Exported because
// two places need the same answer: the box, which hides itself, and the
// list, which must not stay filtered by a query nobody can see or clear.
export function canSearch(habits) {
  return habits.length >= SEARCH_MIN_HABITS;
}

// Name first, then the "why". The why is where the detail lives — "read ten
// pages" is the ritual, "so the stack by the bed stops growing" is the thing
// somebody half-remembers and types in. Searching only the names would miss
// exactly the case the box is for.
export function habitMatchesQuery(habit, query) {
  const needle = query.trim().toLowerCase();

  if (!needle) return true;

  return (
    (habit.name || '').toLowerCase().includes(needle) ||
    (habit.why || '').toLowerCase().includes(needle)
  );
}

// Whether a key press already belongs to something being typed into, and
// so is not ours to take.
function isTyping(target) {
  if (!target) return false;

  const tag = target.tagName;

  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}

export default function HabitSearch({ habits, value, onChange }) {
  const inputRef = useRef(null);
  const shown = canSearch(habits);

  // "/" jumps to the box, the way it does on most sites with one. The box
  // exists for a board long enough that scrolling to find a ritual is work,
  // and on that board the box itself is a scroll away — so it has to be
  // reachable without being found first.
  useEffect(() => {
    if (!shown) return undefined;

    const onKeyDown = (event) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTyping(event.target)) return;

      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [shown]);

  if (!shown) return null;

  return (
    <div className="relative">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-700"
        strokeWidth={2}
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        // And Escape is the way back out: it clears what was typed and
        // gives the keys back to the page, so the list is whole again
        // without reaching for the mouse.
        onKeyDown={(event) => {
          if (event.key !== 'Escape') return;
          onChange('');
          event.currentTarget.blur();
        }}
        placeholder="Find a ritual  /"
        aria-label="Search rituals by name or reason"
        aria-keyshortcuts="/"
        className="w-44 rounded-full border border-void-400 bg-transparent py-1.5 pl-8 pr-8 font-mono text-xs text-ink-100 placeholder:text-ink-700 transition-colors focus:border-gold/70 focus:outline-none sm:w-56"
      />
      {/* A search input draws its own clear button in some browsers and not
          in others, and never on the ones that matter most here. Ours is
          always there when there is something to clear, and never when there
          is not. */}
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-700 transition-colors hover:text-ink-300"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
