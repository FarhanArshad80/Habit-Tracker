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

import { addDays, getLastNDays, isDue, todayKey } from './dateHelpers';

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
