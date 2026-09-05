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

// Which weekdays a ritual is expected on, 0 = Sunday. A ritual with no
// schedule of its own is a daily one — that is every habit created before
// rest days existed, and it is the right reading of "no days off".
export const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

export function weekdayOf(dateKey) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function normalizeSchedule(days) {
  if (!Array.isArray(days)) return ALL_DAYS;

  const clean = [...new Set(days.map(Number))]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);

  // An empty schedule would mean a ritual that is never due, which is a
  // ritual you have stopped keeping rather than one you are tracking.
  return clean.length > 0 ? clean : ALL_DAYS;
}

export function isScheduled(dateKey, days) {
  return normalizeSchedule(days).includes(weekdayOf(dateKey));
}

// The day before this one that the ritual is actually expected. A schedule
// always holds at least one weekday, so this lands within seven steps.
export function previousScheduledDay(dateKey, days) {
  const schedule = normalizeSchedule(days);
  let cursor = addDays(dateKey, -1);

  for (let i = 0; i < 7; i++) {
    if (schedule.includes(weekdayOf(cursor))) return cursor;
    cursor = addDays(cursor, -1);
  }

  return cursor;
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
// (or from the previous expected day, if today isn't complete yet — so a
// streak doesn't break at midnight before the person has had a chance to
// check in).
//
// "Consecutive" means consecutive *scheduled* days. A Monday-Wednesday-Friday
// ritual keeps its streak over the weekend, because Saturday was never a day
// it was meant to happen and a rest day is not a failure.
export function calculateCurrentStreak(completions, days) {
  if (!completions || completions.length === 0) return 0;
  const schedule = normalizeSchedule(days);
  const set = new Set(completions);

  // Start on the most recent day the ritual was actually expected.
  let cursor = todayKey();
  if (!schedule.includes(weekdayOf(cursor))) {
    cursor = previousScheduledDay(cursor, schedule);
  } else if (!set.has(cursor)) {
    cursor = previousScheduledDay(cursor, schedule);
    if (!set.has(cursor)) return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = previousScheduledDay(cursor, schedule);
  }
  return streak;
}

// Longest run of consecutive scheduled days ever recorded. Check-ins on a
// rest day are a bonus rather than part of the run — they were never asked
// for, so counting them would make a streak mean two different things
// depending on the day it happened to fall on.
export function calculateBestStreak(completions, days) {
  if (!completions || completions.length === 0) return 0;
  const schedule = normalizeSchedule(days);

  const sorted = [...new Set(completions)]
    .filter((dateKey) => schedule.includes(weekdayOf(dateKey)))
    .sort();

  if (sorted.length === 0) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (previousScheduledDay(sorted[i], schedule) === sorted[i - 1]) {
      current += 1;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
  }
  return best;
}
