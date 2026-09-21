import { createContext, useContext, useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToday } from '../hooks/useToday';
import { perfectDayStats } from '../utils/perfectDays';
import { createId } from '../utils/ids';
import {
  addDays,
  calculateCurrentStreak,
  calculateBestStreak,
  calculateConsistency,
  findWeakestWeekday,
  countCompletionsInLastNDays,
  normalizeSchedule,
  normalizePauses,
  isPausedOn,
  isSkippedOn,
  isScheduled,
  ALL_DAYS,
} from '../utils/dateHelpers';
import { capNote, normalizeNote, noteFor, sanitizeNotes, setNote } from '../utils/dayNotes';

const HabitContext = createContext(null);

export const HABIT_COLORS = [
  { id: 'gold', label: 'Gold', hex: '#F2B705' },
  { id: 'teal', label: 'Teal', hex: '#2DD4BF' },
  { id: 'rose', label: 'Rose', hex: '#FB7185' },
  { id: 'violet', label: 'Violet', hex: '#A78BFA' },
  { id: 'sky', label: 'Sky', hex: '#38BDF8' },
  { id: 'lime', label: 'Lime', hex: '#A3E635' },
];

// The reason the ritual is on the board at all.
//
// A name says what to do and nothing about why it is worth doing, and on a
// bad Tuesday the why is the only part that argues for getting up. It is a
// sentence rather than an essay — short enough to be read in the half second
// somebody spends on the card before deciding, and short enough to sit on
// one line next to the name.
export const WHY_LIMIT = 80;

function cleanWhy(why) {
  return typeof why === 'string' ? why.trim().slice(0, WHY_LIMIT) : '';
}

// Rest days. A goal cannot ask for more sessions than there are days to hold
// them, so the weekly target is clamped to the schedule wherever one is set.
function clampGoal(goal, schedule) {
  const asked = Number(goal);
  const ceiling = schedule.length;

  if (!(asked > 0)) return ceiling;

  return Math.min(Math.round(asked), ceiling);
}

export const HABIT_ICONS = [
  'BookOpen', 'Dumbbell', 'Droplet', 'Moon', 'Sun', 'Brain',
  'Heart', 'Flame', 'Music', 'Code2', 'Leaf', 'Coffee',
  'PenLine', 'Bike', 'Footprints', 'Sparkles',
];

export function HabitProvider({ children }) {
  const [habits, setHabits] = useLocalStorage('constellation.habits', []);

  // What the days themselves were like, keyed by date. Kept in a second key
  // rather than folded into the habits, because a note belongs to the day and
  // not to any ritual in it — and because nothing already stored has to be
  // migrated to make room for a store that starts empty.
  const [storedNotes, setStoredNotes] = useLocalStorage('constellation.notes', {});

  // Every number on this board is measured from today, and "today" was being
  // read during render — which meant it only changed when something else
  // did. A tab left open past midnight went on showing the previous day's
  // streaks and trail until the next check-in happened to recompute them,
  // and that check-in was recorded against a date the board was not showing.
  const today = useToday();

  // Deleting a ritual takes months of check-ins with it, and a confirm
  // button is a poor last line of defence against a misread click. The
  // removed ritual is held here — with the row it occupied — until the undo
  // window closes.
  const [recentlyDeleted, setRecentlyDeleted] = useState(null);

  const addHabit = useCallback(({ name, icon, color, goal, days, why }) => {
    const schedule = normalizeSchedule(days);
    const habit = {
      id: createId(),
      name: name.trim(),
      why: cleanWhy(why),
      icon: icon || HABIT_ICONS[0],
      color: color || HABIT_COLORS[0].id,
      days: schedule,
      goal: clampGoal(goal, schedule),
      createdAt: today,
      completions: [],
      pauses: [],
    };
    setHabits((prev) => [...prev, habit]);
    return habit;
  }, [setHabits, today]);

  // A ritual outlives the moment it was named. Renaming and re-targeting
  // happen in place so the streak, the trail and every recorded completion
  // survive the edit — the alternative was delete and start over, which
  // throws away the history that makes the app worth opening.
  //
  // The look travels with the name. A colour picked in thirty seconds at
  // creation tints the card, the flame, the trail and the ritual's whole
  // column in the grid, and it was the one part of a ritual that could never
  // be changed afterwards — two rituals landing on the same gold stayed
  // indistinguishable for as long as both were tracked.
  const editHabit = useCallback((habitId, { name, goal, days, why, icon, color }) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== habitId) return h;
      const trimmed = typeof name === 'string' ? name.trim() : h.name;
      const schedule = normalizeSchedule(days === undefined ? h.days : days);
      return {
        ...h,
        name: trimmed || h.name,
        // Unlike the reason, these cannot be cleared — there is no card
        // without an icon and a colour — so anything unrecognised falls back
        // to what the ritual already wears rather than to a default that
        // would silently repaint it.
        icon: HABIT_ICONS.includes(icon) ? icon : h.icon,
        color: HABIT_COLORS.some((c) => c.id === color) ? color : h.color,
        // Cleared deliberately rather than only ever set: emptying the box
        // is how a reason that has stopped being true gets taken off the
        // card, so an empty string has to mean something here.
        why: why === undefined ? cleanWhy(h.why) : cleanWhy(why),
        days: schedule,
        // Dropping to three days a week has to drag a 7x goal down with it,
        // or the ritual would be permanently short of a target it can no
        // longer reach.
        goal: clampGoal(goal === undefined ? h.goal : goal, schedule),
      };
    }));
  }, [setHabits]);

  // Setting a ritual aside, and picking it back up. Until now the only way
  // to stop a ritual counting against you was to delete it, which threw away
  // every check-in behind it — so an injury, a holiday or a month where it
  // simply is not the thing to be doing all cost the history too.
  const togglePause = useCallback((habitId) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== habitId) return h;

      const pauses = normalizePauses(h.pauses);
      const open = pauses.find((pause) => !pause.to);

      if (!open) return { ...h, pauses: [...pauses, { from: today, to: null }] };

      // Resuming closes the range at yesterday, so today is owed again. A
      // pause started and ended on the same day closes to before it opened,
      // which reads as the no-op it was.
      return {
        ...h,
        pauses: pauses.map((pause) =>
          pause === open ? { ...pause, to: addDays(today, -1) } : pause
        ),
      };
    }));
  }, [setHabits, today]);

  // One day off, rather than a stretch of them.
  //
  // Pausing was the only way to say "not today", and it is the wrong shape
  // for it: it runs until it is explicitly resumed, so a single unavoidable
  // day — travelling, ill, the gym shut — cost two deliberate acts a day
  // apart, and forgetting the second one quietly set the ritual aside for a
  // week. The alternative was to take the miss, which breaks a streak that
  // was never really broken.
  //
  // Stored as a pause that opens and closes on the same day, so everything
  // that already reads pauses — the streak, the trail, the consistency rate,
  // the day's target — treats it correctly without being taught anything
  // new. Pressing again puts the day back.
  const toggleSkip = useCallback((habitId, dateKey = today) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== habitId) return h;

      const pauses = normalizePauses(h.pauses);

      if (isSkippedOn(dateKey, pauses)) {
        return {
          ...h,
          pauses: pauses.filter(
            (pause) => !(pause.from === dateKey && pause.to === dateKey)
          ),
        };
      }

      // Already covered by a longer pause, where there is nothing to set
      // aside and a second entry would only have to be undone twice.
      if (isPausedOn(dateKey, pauses)) return h;

      return { ...h, pauses: [...pauses, { from: dateKey, to: dateKey }] };
    }));
  }, [setHabits, today]);

  const deleteHabit = useCallback((habitId) => {
    const index = habits.findIndex((h) => h.id === habitId);
    if (index === -1) return;

    setRecentlyDeleted({ habit: habits[index], index });
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  }, [habits, setHabits]);

  // Restored to the row it was deleted from rather than to the end, because
  // the order of this list is how it gets read every morning.
  const restoreHabit = useCallback(() => {
    if (!recentlyDeleted) return;

    const { habit, index } = recentlyDeleted;

    setHabits((prev) => {
      if (prev.some((h) => h.id === habit.id)) return prev;

      const next = [...prev];
      next.splice(Math.min(index, next.length), 0, habit);
      return next;
    });

    setRecentlyDeleted(null);
  }, [recentlyDeleted, setHabits]);

  const dismissDeleted = useCallback(() => setRecentlyDeleted(null), []);

  // A restore replaces the whole board rather than merging into it: a backup
  // is a picture of a moment, and half-merging one leaves a history that
  // never actually happened.
  const replaceHabits = useCallback((next, nextNotes) => {
    setRecentlyDeleted(null);
    setHabits(next);

    // A backup written before notes existed carries none, and passing
    // `undefined` here has to mean "this file has nothing to say about
    // notes" rather than "this file says there are none" — the second would
    // wipe the notes on the device to restore a file that never had any.
    if (nextNotes !== undefined) setStoredNotes(sanitizeNotes(nextNotes));
  }, [setHabits, setStoredNotes]);

  // While the sentence is being typed. Capped but not trimmed, so a space
  // survives long enough to be followed by a word.
  const writeNote = useCallback((dateKey, text) => {
    setStoredNotes((prev) => setNote(prev, dateKey, capNote(text)));
  }, [setStoredNotes]);

  // Once it is finished — on blur, or when the day rolls over underneath it.
  // This is where a box left holding nothing but spaces stops being a note.
  const commitNote = useCallback((dateKey) => {
    setStoredNotes((prev) => setNote(prev, dateKey, normalizeNote(noteFor(prev, dateKey))));
  }, [setStoredNotes]);

  const toggleCompletion = useCallback((habitId, dateKey = today) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== habitId) return h;
      const has = h.completions.includes(dateKey);
      const completions = has
        ? h.completions.filter((d) => d !== dateKey)
        : [...h.completions, dateKey];
      return { ...h, completions };
    }));
  }, [setHabits, today]);

  const reorderHabits = useCallback((fromIndex, toIndex) => {
    setHabits((prev) => {
      // A negative index would make splice count from the end and quietly
      // move the ritual somewhere nobody asked for.
      if (
        fromIndex === toIndex ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex < 0 ||
        fromIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, [setHabits]);

  // Storage is shared with other tabs and with every build this app has ever
  // been, so what comes out of it is checked before anything renders it.
  const notes = useMemo(() => sanitizeNotes(storedNotes), [storedNotes]);

  const habitsWithStats = useMemo(() => (
    habits.map((h) => {
      // Habits stored before rest days existed carry no schedule, and ones
      // stored before the goal picker carry no goal. Both read as daily.
      const days = normalizeSchedule(h.days);
      const pauses = normalizePauses(h.pauses);
      const weeklyGoal = h.goal > 0 ? Math.min(h.goal, days.length) : days.length;
      const weeklyCount = countCompletionsInLastNDays(h.completions, 7, today);
      const currentStreak = calculateCurrentStreak(h.completions, days, pauses, today, h.createdAt);
      const completedToday = h.completions.includes(today);
      const paused = isPausedOn(today, pauses);
      // Set aside for today only. Drawn differently from a pause because it
      // is undone differently, and because "skipped today" and "set aside
      // until further notice" are not the same sentence to read on a card.
      const skippedToday = isSkippedOn(today, pauses);
      // A paused ritual is not due, which is the whole point of pausing it —
      // and that alone keeps it out of the day's target, out of the at-risk
      // count and out of the completion rate.
      const dueToday = !paused && isScheduled(today, days);

      return {
        ...h,
        why: cleanWhy(h.why),
        days,
        pauses,
        paused,
        skippedToday,
        currentStreak,
        bestStreak: calculateBestStreak(h.completions, days, pauses, h.createdAt),
        // Null until there is enough history behind it to be worth a number.
        consistency: calculateConsistency(h.completions, days, pauses, h.createdAt, undefined, today),
        // And where those missed days fall. Null unless one weekday is
        // genuinely worse than the others — a pattern that is not there is
        // worse than no pattern at all.
        weakestDay: findWeakestWeekday(h.completions, days, pauses, h.createdAt, undefined, today),
        completedToday,
        dueToday,
        // The one thing on this board where doing nothing costs something.
        // Everything else is an opportunity missed; this is a run of days
        // that ends at midnight unless someone acts before then.
        //
        // A streak of zero is not at risk — there is nothing to break — and
        // neither is a rest day, where the schedule already said no.
        streakAtRisk: dueToday && !completedToday && currentStreak > 0,
        totalCompletions: h.completions.length,
        weeklyGoal,
        weeklyCount,
        goalMet: weeklyCount >= weeklyGoal,
      };
    })
  ), [habits, today]);

  const globalStats = useMemo(() => {
    const total = habitsWithStats.length;
    // Weekly goals are measured against what is actually being kept. A
    // paused ritual can never meet its goal, so counting it would turn every
    // pause into a permanent dent in the weekly score.
    const active = habitsWithStats.filter((h) => !h.paused);
    // Only what is actually due counts toward closing out the day. Measuring
    // against every tracked ritual would make a rest day look like a failure
    // and leave the bar permanently short of full.
    const due = habitsWithStats.filter((h) => h.dueToday);
    const dueToday = due.length;
    const completedToday = due.filter((h) => h.completedToday).length;
    // A check-in on a rest day is still worth acknowledging, just not as
    // part of the day's target.
    const bonusToday = habitsWithStats.filter((h) => !h.dueToday && h.completedToday).length;
    const bestStreak = habitsWithStats.reduce((max, h) => Math.max(max, h.bestStreak), 0);
    const atRisk = habitsWithStats.filter((h) => h.streakAtRisk);
    // The longest of the runs on the line, because "you could lose 40 days"
    // is a different sentence from "you could lose two".
    const longestAtRisk = atRisk.reduce((max, h) => Math.max(max, h.currentStreak), 0);
    // Measured on the raw rituals rather than on today's summary, because
    // this one reads a month of history rather than the state of the day.
    const closedOut = perfectDayStats(habitsWithStats, today);
    const goalsMet = active.filter((h) => h.goalMet).length;
    const paused = total - active.length;
    const totalCompletions = habitsWithStats.reduce((sum, h) => sum + h.totalCompletions, 0);
    const completionRate = dueToday === 0 ? 100 : Math.round((completedToday / dueToday) * 100);
    return {
      total, activeTotal: active.length, paused,
      dueToday, completedToday, bonusToday, bestStreak,
      totalCompletions, completionRate, goalsMet,
      atRisk: atRisk.length, longestAtRisk,
      // The day as a whole: the run of days where everything owed was done,
      // and how many of the last month's owed days were closed out.
      closedOutStreak: closedOut.streak,
      perfectDays: closedOut.perfect,
      owedDays: closedOut.owedDays,
      perfectWindow: closedOut.window,
    };
  }, [habitsWithStats, today]);

  const value = useMemo(() => ({
    habits: habitsWithStats,
    allDays: ALL_DAYS,
    today,
    globalStats,
    recentlyDeleted,
    addHabit,
    editHabit,
    togglePause,
    toggleSkip,
    deleteHabit,
    restoreHabit,
    dismissDeleted,
    replaceHabits,
    toggleCompletion,
    reorderHabits,
    notes,
    writeNote,
    commitNote,
  }), [
    habitsWithStats, globalStats, recentlyDeleted, today, addHabit, editHabit,
    togglePause, toggleSkip, deleteHabit, restoreHabit, dismissDeleted, replaceHabits,
    toggleCompletion, reorderHabits, notes, writeNote, commitNote,
  ]);

  return (
    <HabitContext.Provider value={value}>
      {children}
    </HabitContext.Provider>
  );
}

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return ctx;
}
