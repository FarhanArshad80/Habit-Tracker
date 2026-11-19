import { createContext, useContext } from 'react';

// Kept apart from HabitProvider so that file exports only a component and
// React fast refresh can keep the board's state while it is edited.
export const HabitContext = createContext(null);

export function useHabits() {
  const ctx = useContext(HabitContext);
  if (!ctx) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return ctx;
}
