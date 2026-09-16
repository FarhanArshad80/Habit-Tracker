// A line about the day itself, kept beside the check-ins rather than on any
// one of them.
//
// Deliberately keyed by date and stored on its own, not hung off a habit.
// "Slept badly, everything was uphill" is not a fact about the run or about
// the reading — it is the reason both of them were hard, and filing it under
// one of them would be filing it under the wrong thing. Keeping it in its own
// map also means the habit shape never changes, so nothing already stored has
// to be migrated to make room for it.
const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

// Long enough for the sentence that explains a day, short enough that the box
// stays a margin note and never becomes a journal the app then has to be good
// at storing, searching and showing.
export const DAY_NOTE_LIMIT = 280;

// While the keys are still being pressed. Capped but not trimmed — trimming
// mid-sentence takes the space away as fast as it is typed, and there is no
// way to write a second word.
export function capNote(input) {
  return typeof input === 'string' ? input.slice(0, DAY_NOTE_LIMIT) : '';
}

// Once the sentence is finished. A note of nothing but whitespace is not a
// note, and this is where it becomes an empty string.
export function normalizeNote(input) {
  return capNote(input).trim();
}

export function noteFor(notes, dateKey) {
  const value = notes?.[dateKey];

  return typeof value === 'string' ? value : '';
}

// Pure, so the caller keeps the same "replace the state" shape every other
// writer in this app uses. Clearing a note removes the key rather than
// storing an empty string: an empty note is the absence of one, and a map
// full of blanks would make every "did this day have a note" test lie.
export function setNote(notes, dateKey, text) {
  const next = { ...notes };

  if (text) next[dateKey] = text;
  else delete next[dateKey];

  return next;
}

export function hasNote(notes, dateKey) {
  return normalizeNote(noteFor(notes, dateKey)) !== '';
}

export function countNotes(notes) {
  return Object.keys(notes || {}).length;
}

// Anything off disk or out of storage is a stranger, the same way the habits
// are: hand-edited, written by an older build, or simply not this. Rebuilt
// key by key so one bad entry cannot put a paragraph, or an object, where the
// app expects a short string.
//
// Capped rather than trimmed, and this matters: what comes back through here
// is also what the textarea is drawing. Trimming on the way out would take
// every space away the moment it was typed, and there would be no way to
// write a second word. Only a note that is *entirely* whitespace is dropped —
// that is not a note, whoever wrote it.
export function sanitizeNotes(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};

  const clean = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!DATE_KEY.test(key) || typeof value !== 'string') continue;

    if (value.trim()) clean[key] = capNote(value);
  }

  return clean;
}
