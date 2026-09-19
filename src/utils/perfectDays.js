// Days where everything that was owed got done.
//
// Every streak on this board belongs to one ritual. That is the right way to
// measure a ritual and a poor way to measure a person: keep four of five
// every day for a month and the board shows four healthy runs and says
// nothing at all about the month.
//
// A perfect day is one where at least one thing was due and all of it was
// done. It is the only figure here that cannot be had by quietly dropping
// the ritual that keeps breaking, which is what makes it worth keeping.

import { addDays, getLastNDays, isDue, todayKey, weekdayOf, WEEKDAY_NAMES } from './dateHelpers';

// What a single day asked for and what it got. Rituals created after the day
// in question were never owed on it - counting them would open a new board
// on a month of failures it had no chance of avoiding.
export function dayScore(habits, dateKey) {
  let owed = 0;
  let done = 0;

  for (const habit of habits) {
    if (habit.createdAt && dateKey < habit.createdAt) continue;
    if (!isDue(dateKey, habit.days, habit.pauses)) continue;

    owed += 1;
    if (habit.completions.includes(dateKey)) done += 1;
  }

  return { owed, done, perfect: owed > 0 && done === owed };
}

// A day that asked for nothing is neither kept nor missed.
//
// The board already treats a rest day this way for a single ritual: the run
// steps over it rather than ending on it. A week of Sundays would otherwise
// cap everyone at six.
function isRest(habits, dateKey) {
  return dayScore(habits, dateKey).owed === 0;
}

// How far back the run is allowed to reach. A board with nothing on it would
// otherwise walk backwards for ever over days that asked for nothing.
const STREAK_LIMIT = 400;

export function currentPerfectStreak(habits, today = todayKey()) {
  if (habits.length === 0) return 0;

  let cursor = today;

  // Today does not count against anybody until it is over. Nothing has
  // necessarily been missed at nine in the morning, and a run that reset at
  // midnight would spend every morning reporting a loss that has not
  // happened yet.
  if (!dayScore(habits, cursor).perfect) cursor = addDays(cursor, -1);

  let streak = 0;

  for (let step = 0; step < STREAK_LIMIT; step += 1) {
    const score = dayScore(habits, cursor);

    if (score.perfect) streak += 1;
    else if (!isRest(habits, cursor)) break;

    cursor = addDays(cursor, -1);
  }

  return streak;
}

export const PERFECT_WINDOW = 30;

// The month behind the run: how many of the days that actually asked for
// something got all of it. Quoted against owed days rather than against
// thirty, because a board resting two days a week can never reach thirty and
// should not be measured as though it had failed to.
export function perfectDayStats(habits, today = todayKey(), window = PERFECT_WINDOW) {
  if (habits.length === 0) {
    return { streak: 0, perfect: 0, owedDays: 0, window };
  }

  let perfect = 0;
  let owedDays = 0;

  for (const dateKey of getLastNDays(window, today)) {
    const score = dayScore(habits, dateKey);

    if (score.owed === 0) continue;

    owedDays += 1;
    if (score.perfect) perfect += 1;
  }

  return {
    streak: currentPerfectStreak(habits, today),
    perfect,
    owedDays,
    window,
  };
}

// Which weekday this board actually slips on.
//
// Each ritual already works out its own weakest day, which is the right
// measure for one ritual and a poor one for a week: four rituals each
// limping on a different day say nothing, while four all failing on Friday
// is the single most useful thing the board could tell anybody. That pattern
// only appears when the days are pooled.
//
// Twelve weeks, so a run of holidays does not decide the answer, and so it
// matches the window the consistency grid draws.
export const RHYTHM_WINDOW = 84;

// A day this far below the rest of the week is a habit of its own rather
// than noise. Below it, naming a "worst day" would be reading meaning into
// the ordinary wobble of any week.
const RHYTHM_GAP = 0.15;

export function weekdayRhythm(habits, today = todayKey(), window = RHYTHM_WINDOW) {
  const days = getLastNDays(window, today);
  const byWeekday = Array.from({ length: 7 }, () => ({ owed: 0, done: 0 }));

  for (const dateKey of days) {
    // Today is still in progress. Counting it would charge the board for
    // everything not yet done this morning.
    if (dateKey === today) continue;

    const { owed, done } = dayScore(habits, dateKey);

    if (owed === 0) continue;

    const bucket = byWeekday[weekdayOf(dateKey)];

    bucket.owed += owed;
    bucket.done += done;
  }

  // A weekday needs a few showings before its rate means anything: one bad
  // Tuesday should not become "Tuesdays are your problem".
  const rated = byWeekday
    .map((bucket, weekday) => ({ ...bucket, weekday, rate: bucket.owed ? bucket.done / bucket.owed : null }))
    .filter((day) => day.owed >= 3 && day.rate !== null);

  if (rated.length < 3) return null;

  const worst = rated.reduce((low, day) => (day.rate < low.rate ? day : low));
  const others = rated.filter((day) => day.weekday !== worst.weekday);
  const restRate =
    others.reduce((sum, day) => sum + day.done, 0) /
    others.reduce((sum, day) => sum + day.owed, 0);

  if (restRate - worst.rate < RHYTHM_GAP) return null;

  return {
    weekday: worst.weekday,
    name: WEEKDAY_NAMES[worst.weekday],
    rate: worst.rate,
    restRate,
    kept: worst.done,
    owed: worst.owed,
  };
}
