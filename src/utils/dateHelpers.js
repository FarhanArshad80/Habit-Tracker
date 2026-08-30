// All dates are handled as local-time 'YYYY-MM-DD' strings so that
// storage, comparisons, and display never drift across timezones.

export function toDateKey(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayKey() {
  return toDateKey(new Date());
}

export function addDays(dateKey, amount) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

// Returns an array of the last `n` date keys, oldest first, ending today.
export function getLastNDays(n, endKey = todayKey()) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    days.push(addDays(endKey, -i));
  }
  return days;
}

// How many of the last `n` days (today included) were completed. Used to
// measure a habit against its weekly goal on a rolling window, so the count
// never resets to zero just because a calendar week rolled over.
export function countCompletionsInLastNDays(completions, n) {
  if (!completions || completions.length === 0) return 0;
  const window = new Set(getLastNDays(n));
  return completions.filter((dateKey) => window.has(dateKey)).length;
}

export function isToday(dateKey) {
  return dateKey === todayKey();
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function weekdayLabel(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return WEEKDAY_LABELS[date.getDay()];
}

export function dayNumber(dateKey) {
  const [, , d] = dateKey.split('-').map(Number);
  return d;
}

export function formatFriendlyDate(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// Current streak: consecutive completed days counting backward from today
// (or from yesterday, if today isn't complete yet — so a streak doesn't
// break at midnight before the person has had a chance to check in).
export function calculateCurrentStreak(completions) {
  if (!completions || completions.length === 0) return 0;
  const set = new Set(completions);
  let cursor = todayKey();
  if (!set.has(cursor)) {
    cursor = addDays(cursor, -1);
    if (!set.has(cursor)) return 0;
  }
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

// Longest streak ever recorded across all completions.
export function calculateBestStreak(completions) {
  if (!completions || completions.length === 0) return 0;
  const sorted = [...completions].sort();
  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (addDays(sorted[i - 1], 1) === sorted[i]) {
      current += 1;
    } else if (sorted[i] !== sorted[i - 1]) {
      current = 1;
    }
    best = Math.max(best, current);
  }
  return best;
}
