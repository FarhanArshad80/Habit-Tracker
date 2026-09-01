import { createContext, useContext, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  todayKey,
  calculateCurrentStreak,
  calculateBestStreak,
  countCompletionsInLastNDays,
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

export const HABIT_ICONS = [
  'BookOpen', 'Dumbbell', 'Droplet', 'Moon', 'Sun', 'Brain',
  'Heart', 'Flame', 'Music', 'Code2', 'Leaf', 'Coffee',
  'PenLine', 'Bike', 'Footprints', 'Sparkles',
];

function createId() {
  return `hb_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function HabitProvider({ children }) {
  const [habits, setHabits] = useLocalStorage('constellation.habits', []);

  const addHabit = useCallback(({ name, icon, color, goal }) => {
    const habit = {
      id: createId(),
      name: name.trim(),
      icon: icon || HABIT_ICONS[0],
      color: color || HABIT_COLORS[0].id,
      goal: goal && goal > 0 ? goal : 7,
      createdAt: todayKey(),
      completions: [],
    };
    setHabits((prev) => [...prev, habit]);
    return habit;
  }, [setHabits]);

  const deleteHabit = useCallback((habitId) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
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
      // Habits stored before the goal picker existed have no goal of their
      // own; treat those as a daily ritual.
      const weeklyGoal = h.goal > 0 ? h.goal : 7;
      const weeklyCount = countCompletionsInLastNDays(h.completions, 7);
      return {
        ...h,
        currentStreak: calculateCurrentStreak(h.completions),
        bestStreak: calculateBestStreak(h.completions),
        completedToday: h.completions.includes(todayKey()),
        totalCompletions: h.completions.length,
        weeklyGoal,
        weeklyCount,
        goalMet: weeklyCount >= weeklyGoal,
      };
    })
  ), [habits]);

  const globalStats = useMemo(() => {
    const total = habitsWithStats.length;
    const completedToday = habitsWithStats.filter((h) => h.completedToday).length;
    const bestStreak = habitsWithStats.reduce((max, h) => Math.max(max, h.bestStreak), 0);
    const goalsMet = habitsWithStats.filter((h) => h.goalMet).length;
    const totalCompletions = habitsWithStats.reduce((sum, h) => sum + h.totalCompletions, 0);
    const completionRate = total === 0 ? 0 : Math.round((completedToday / total) * 100);
    return { total, completedToday, bestStreak, totalCompletions, completionRate, goalsMet };
  }, [habitsWithStats]);

  const value = useMemo(() => ({
    habits: habitsWithStats,
    globalStats,
    addHabit,
    deleteHabit,
    toggleCompletion,
    reorderHabits,
  }), [habitsWithStats, globalStats, addHabit, deleteHabit, toggleCompletion, reorderHabits]);

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
