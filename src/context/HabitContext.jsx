import { createContext, useContext, useMemo, useCallback, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { createId } from '../utils/ids';
import {
  todayKey,
  addDays,
  calculateCurrentStreak,
  calculateBestStreak,
  calculateConsistency,
  findWeakestWeekday,
  countCompletionsInLastNDays,
  normalizeSchedule,
  normalizePauses,
  isPausedOn,
  isScheduled,
  ALL_DAYS,
} from '../utils/dateHelpers';

const HabitContext = createContext(null);

export const HABIT_COLORS = [
  { id: 'gold', label: 'Gold', hex: '#F2B705' },
  { id: 'teal', label: 'Teal', hex: '#2DD4BF' },
  { id: 'rose', label: 'Rose', hex: '#FB7185' },
  { id: 'violet', label: 'Violet', hex: '#A78BFA' },
  { id: 'sky', label: 'Sky', hex: '#38BDF8' },
  { id: 'lime', label: 'Lime', hex: '#A3E635' },
];

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

  // Deleting a ritual takes months of check-ins with it, and a confirm
  // button is a poor last line of defence against a misread click. The
  // removed ritual is held here — with the row it occupied — until the undo
  // window closes.
  const [recentlyDeleted, setRecentlyDeleted] = useState(null);

  const addHabit = useCallback(({ name, icon, color, goal, days }) => {
    const schedule = normalizeSchedule(days);
    const habit = {
      id: createId(),
      name: name.trim(),
      icon: icon || HABIT_ICONS[0],
      color: color || HABIT_COLORS[0].id,
      days: schedule,
      goal: clampGoal(goal, schedule),
      createdAt: todayKey(),
      completions: [],
      pauses: [],
    };
    setHabits((prev) => [...prev, habit]);
    return habit;
  }, [setHabits]);

  // A ritual outlives the moment it was named. Renaming and re-targeting
  // happen in place so the streak, the trail and every recorded completion
  // survive the edit — the alternative was delete and start over, which
  // throws away the history that makes the app worth opening.
  const editHabit = useCallback((habitId, { name, goal, days }) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== habitId) return h;
      const trimmed = typeof name === 'string' ? name.trim() : h.name;
      const schedule = normalizeSchedule(days === undefined ? h.days : days);
      return {
        ...h,
        name: trimmed || h.name,
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
      const today = todayKey();

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
  }, [setHabits]);

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
  const replaceHabits = useCallback((next) => {
    setRecentlyDeleted(null);
    setHabits(next);
  }, [setHabits]);

  const toggleCompletion = useCallback((habitId, dateKey = todayKey()) => {
    setHabits((prev) => prev.map((h) => {
      if (h.id !== habitId) return h;
      const has = h.completions.includes(dateKey);
      const completions = has
        ? h.completions.filter((d) => d !== dateKey)
        : [...h.completions, dateKey];
      return { ...h, completions };
    }));
  }, [setHabits]);

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

  const habitsWithStats = useMemo(() => (
    habits.map((h) => {
      // Habits stored before rest days existed carry no schedule, and ones
      // stored before the goal picker carry no goal. Both read as daily.
      const days = normalizeSchedule(h.days);
      const pauses = normalizePauses(h.pauses);
      const weeklyGoal = h.goal > 0 ? Math.min(h.goal, days.length) : days.length;
      const weeklyCount = countCompletionsInLastNDays(h.completions, 7);
      const currentStreak = calculateCurrentStreak(h.completions, days, pauses);
      const completedToday = h.completions.includes(todayKey());
      const paused = isPausedOn(todayKey(), pauses);
      // A paused ritual is not due, which is the whole point of pausing it —
      // and that alone keeps it out of the day's target, out of the at-risk
      // count and out of the completion rate.
      const dueToday = !paused && isScheduled(todayKey(), days);

      return {
        ...h,
        days,
        pauses,
        paused,
        currentStreak,
        bestStreak: calculateBestStreak(h.completions, days, pauses),
        // Null until there is enough history behind it to be worth a number.
        consistency: calculateConsistency(h.completions, days, pauses, h.createdAt),
        // And where those missed days fall. Null unless one weekday is
        // genuinely worse than the others — a pattern that is not there is
        // worse than no pattern at all.
        weakestDay: findWeakestWeekday(h.completions, days, pauses, h.createdAt),
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
  ), [habits]);

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
    const goalsMet = active.filter((h) => h.goalMet).length;
    const paused = total - active.length;
    const totalCompletions = habitsWithStats.reduce((sum, h) => sum + h.totalCompletions, 0);
    const completionRate = dueToday === 0 ? 100 : Math.round((completedToday / dueToday) * 100);
    return {
      total, activeTotal: active.length, paused,
      dueToday, completedToday, bonusToday, bestStreak,
      totalCompletions, completionRate, goalsMet,
      atRisk: atRisk.length, longestAtRisk,
    };
  }, [habitsWithStats]);

  const value = useMemo(() => ({
    habits: habitsWithStats,
    allDays: ALL_DAYS,
    globalStats,
    recentlyDeleted,
    addHabit,
    editHabit,
    togglePause,
    deleteHabit,
    restoreHabit,
    dismissDeleted,
    replaceHabits,
    toggleCompletion,
    reorderHabits,
  }), [
    habitsWithStats, globalStats, recentlyDeleted, addHabit, editHabit,
    togglePause, deleteHabit, restoreHabit, dismissDeleted, replaceHabits,
    toggleCompletion, reorderHabits,
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
