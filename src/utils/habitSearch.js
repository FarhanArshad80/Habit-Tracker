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
export function isTyping(target) {
  if (!target) return false;

  const tag = target.tagName;

  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
}
