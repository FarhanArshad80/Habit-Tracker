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
//
// Every measurement below takes the end of its window as an argument rather
// than reading the clock itself. The board holds one idea of what day it is -
// one that survives midnight - and a helper consulting the system clock
// halfway through a render could disagree with it.
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
export function countCompletionsInLastNDays(completions, n, endKey = todayKey()) {
  if (!completions || completions.length === 0) return 0;
  const window = new Set(getLastNDays(n, endKey));
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

// Pauses. A ritual set aside for a fortnight — an injury, a holiday, a month
// where it simply is not the thing to be doing — was previously a choice
// between watching a streak die and deleting the ritual outright.
//
// Each pause is a range of date keys with `to` left null while it is still
// running. Days inside one stand exactly as rest days do: nothing was asked
// for, so nothing was missed, and the run either side of it joins up.
export function normalizePauses(pauses) {
  if (!Array.isArray(pauses)) return [];

  return pauses.filter(
    (pause) =>
      pause &&
      typeof pause.from === 'string' &&
      (pause.to === null || pause.to === undefined || typeof pause.to === 'string')
  );
}

export function isPausedOn(dateKey, pauses) {
  return normalizePauses(pauses).some(
    (pause) => dateKey >= pause.from && (!pause.to || dateKey <= pause.to)
  );
}

// Scheduled, and not set aside. This is the question everything that counts
// a day should be asking.
export function isDue(dateKey, days, pauses) {
  return isScheduled(dateKey, days) && !isPausedOn(dateKey, pauses);
}

// The previous day the ritual was genuinely owed. Unlike the schedule-only
// hop above this cannot promise to land within a week — a pause can run for
// months — so it walks a bounded distance and gives up rather than spinning
// if everything behind it turns out to be set aside.
const DUE_LOOKBACK_LIMIT = 400;

export function previousDueDay(dateKey, days, pauses = []) {
  const schedule = normalizeSchedule(days);
  let cursor = addDays(dateKey, -1);

  for (let i = 0; i < DUE_LOOKBACK_LIMIT; i++) {
    if (schedule.includes(weekdayOf(cursor)) && !isPausedOn(cursor, pauses)) {
      return cursor;
    }
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
export function calculateCurrentStreak(completions, days, pauses = [], today = todayKey()) {
  if (!completions || completions.length === 0) return 0;
  const schedule = normalizeSchedule(days);
  const set = new Set(completions);

  // Start on the most recent day the ritual was actually expected.
  let cursor = today;
  if (!isDue(cursor, schedule, pauses)) {
    cursor = previousDueDay(cursor, schedule, pauses);
  } else if (!set.has(cursor)) {
    cursor = previousDueDay(cursor, schedule, pauses);
    if (!set.has(cursor)) return 0;
  }

  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = previousDueDay(cursor, schedule, pauses);
  }
  return streak;
}

// How well a ritual has actually been kept lately, as a fraction of the days
// it was genuinely owed on.
//
// A streak answers "am I on a run right now" and nothing else: one missed
// Tuesday takes forty days down to zero, and a ritual kept nine times in ten
// scores the same as one abandoned in March. This is the other half of the
// picture - the one that survives a bad week.
//
// Rest days and pauses are not in the denominator. They were never asked for,
// and counting them would make a four-day-a-week ritual cap out at 57%.
export const CONSISTENCY_WINDOW = 30;

// Below this there is not enough history for a percentage to mean anything -
// one missed day out of three reads as 67% and sounds like a verdict.
const CONSISTENCY_MINIMUM = 7;

export function calculateConsistency(
  completions, days, pauses = [], createdAt, window = CONSISTENCY_WINDOW,
  today = todayKey()
) {
  // Days before the ritual existed were never owed either. Counting them
  // would open every new ritual on a number near zero that it had no chance
  // of avoiding.
  const owed = getLastNDays(window, today).filter(
    (dateKey) =>
      (!createdAt || dateKey >= createdAt) && isDue(dateKey, days, pauses)
  );

  if (owed.length < CONSISTENCY_MINIMUM) return null;

  const set = new Set(completions || []);
  const kept = owed.filter((dateKey) => set.has(dateKey)).length;

  return {
    kept,
    owed: owed.length,
    window,
    rate: Math.round((kept / owed.length) * 100),
  };
}

// Longest run of consecutive scheduled days ever recorded. Check-ins on a
// rest day are a bonus rather than part of the run — they were never asked
// for, so counting them would make a streak mean two different things
// depending on the day it happened to fall on.
export function calculateBestStreak(completions, days, pauses = []) {
  if (!completions || completions.length === 0) return 0;
  const schedule = normalizeSchedule(days);

  const sorted = [...new Set(completions)]
    .filter((dateKey) => isDue(dateKey, schedule, pauses))
    .sort();

  if (sorted.length === 0) return 0;

  let best = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (previousDueDay(sorted[i], schedule, pauses) === sorted[i - 1]) {
      current += 1;
    } else {
      current = 1;
    }
    best = Math.max(best, current);
  }
  return best;
}

// Where the misses cluster. A consistency rate says a ritual is kept four
// times in five; it does not say that the fifth is always a Monday. That is
// the difference between "try harder" and something you can actually act on
// — move the ritual, lower the target, or give Monday back as a rest day.
//
// Read over twelve weeks rather than the consistency window, because a
// single weekday only comes round once a week and a month of history leaves
// four data points to judge it on.
export const WEEKDAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

export const WEAKEST_DAY_WINDOW = 84;

// Fewer owed days than this behind a weekday and it is being judged on
// noise: miss one of two Mondays and it reads as a 50% collapse.
const WEAKEST_DAY_MINIMUM = 4;

// How far below the ritual's other days a weekday has to sit before it is
// worth naming. Everything drifts a little, and pointing at the lowest of
// six near-identical numbers invents a pattern that is not there.
const WEAKEST_DAY_MARGIN = 20;

export function findWeakestWeekday(
  completions, days, pauses = [], createdAt, window = WEAKEST_DAY_WINDOW,
  today = todayKey()
) {
  const schedule = normalizeSchedule(days);

  // A ritual owed on one weekday has no weakest one — it has a consistency
  // rate, which is already on the card.
  if (schedule.length < 2) return null;

  const set = new Set(completions || []);
  const tally = new Map();

  for (const dateKey of getLastNDays(window, today)) {
    if (createdAt && dateKey < createdAt) continue;
    if (!isDue(dateKey, schedule, pauses)) continue;

    const weekday = weekdayOf(dateKey);
    const row = tally.get(weekday) || { weekday, kept: 0, owed: 0 };
    row.owed += 1;
    if (set.has(dateKey)) row.kept += 1;
    tally.set(weekday, row);
  }

  // Only weekdays with enough history to speak for themselves, and only if
  // at least two of them qualify — a comparison needs something to compare.
  const scored = [...tally.values()]
    .filter((row) => row.owed >= WEAKEST_DAY_MINIMUM)
    .map((row) => ({ ...row, rate: Math.round((row.kept / row.owed) * 100) }))
    .sort((a, b) => a.rate - b.rate);

  if (scored.length < 2) return null;

  const worst = scored[0];

  // A ritual kept every single time has no weak day, and saying one is
  // "weakest" at 100% would be a warning about nothing.
  if (worst.rate === 100) return null;

  // Measured against the rest taken together rather than against the next
  // worst day, so two equally bad Mondays and Tuesdays still register.
  const rest = scored.slice(1);
  const restOwed = rest.reduce((sum, row) => sum + row.owed, 0);
  const restKept = rest.reduce((sum, row) => sum + row.kept, 0);
  const restRate = Math.round((restKept / restOwed) * 100);

  if (restRate - worst.rate < WEAKEST_DAY_MARGIN) return null;

  return {
    weekday: worst.weekday,
    name: WEEKDAY_NAMES[worst.weekday],
    kept: worst.kept,
    owed: worst.owed,
    rate: worst.rate,
    restRate,
    window,
  };
}
