import { useMemo } from 'react';
import { useHabits } from './context/HabitContext';
import StatsDashboard from './components/StatsDashboard';
import DailyProgress from './components/DailyProgress';
import ConsistencyGrid from './components/ConsistencyGrid';
import AddHabitForm from './components/AddHabitForm';
import HabitList from './components/HabitList';
import FocusTimer from './components/FocusTimer';
import UndoBanner from './components/UndoBanner';
import DataControls from './components/DataControls';
import { formatFriendlyDate, todayKey } from './utils/dateHelpers';

export default function App() {
  const {
    habits, globalStats, recentlyDeleted, addHabit, editHabit, deleteHabit,
    restoreHabit, dismissDeleted, replaceHabits, toggleCompletion, reorderHabits,
  } = useHabits();
  const today = useMemo(() => formatFriendlyDate(todayKey()), []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col lg:flex-row overflow-x-hidden">
      
      {/* 1. LEFT SIDE: Complete Brand Panel with Tight, High-Impact Typography */}
      <section className="w-full lg:w-[35%] lg:h-screen lg:sticky lg:top-0 flex-shrink-0 flex flex-col justify-between px-8 py-10 lg:px-12 lg:py-12 border-b lg:border-b-0 lg:border-r border-slate-900 bg-slate-950/50 backdrop-blur-sm relative overflow-hidden">
        
        {/* Decorative Background Glow */}
        <div className="absolute -left-16 -top-16 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* TOP: Brand Logo Block */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.2)] border border-amber-500/20">
            {/* Glowing Flame SVG Logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 18c-1.1 0-2-.9-2-2 0-.5.2-1 .5-1.4.3-.4.5-.9.5-1.4 0-.8-.7-1.5-1.5-1.5-.5 0-1 .2-1.4.5-.4.3-.9.5-1.4.5-1.1 0-2-.9-2-2 0-3.3 2.7-6 6-6s6 2.7 6 6c0 1.1-.9 2-2 2-.5 0-1-.2-1.4-.5-.4-.3-.9-.5-1.4-.5-.8 0-1.5.7-1.5 1.5 0 .5.2 1 .5 1.4.3.4.5.9.5 1.4 0 1.1-.9 2-2 2z" />
              <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.96-.71 3.75-1.9 5.14z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-display font-black text-lg text-white tracking-tight uppercase">
            MicroGains
          </span>
        </div>

        {/* MIDDLE: Tight Content Stack (Matches Your Image Exactly) */}
        <div className="my-auto relative z-10 flex flex-col">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-500/80 mb-2">
            {today}
          </p>
          
          {/* Headline - No extra padding, custom tight leading, tight letters */}
          <h1 className="font-display text-4xl sm:text-[2.85rem] font-extrabold tracking-tighter text-white leading-[1.02] m-0 p-0">
            Build Better Habits, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">
              Build a Better Life.
            </span>
          </h1>

          {/* Body Paragraph - Immediately below header with tiny margin */}
          <p className="mt-3.5 text-sm sm:text-[0.95rem] text-slate-400/90 leading-relaxed max-w-sm m-0 p-0">
            Harness the power of MicroGains to streamline your everyday routines, stay consistent, and unlock 1% compounding daily growth. Your journey to an optimized identity starts with a single check-in.
          </p>
        </div>

        {/* BOTTOM: Minimal Footer Attribution */}
        <div className="text-[11px] text-slate-600 uppercase tracking-widest relative z-10">
          © 2026 MicroGains Inc.
        </div>
      </section>

      {/* 2. RIGHT SIDE: Main Application (65% Width) */}
      <main className="w-full lg:w-[65%] flex-shrink-0 flex flex-col h-screen overflow-y-auto px-6 py-12 sm:px-12 sm:py-16 bg-slate-950">
        <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto">
          
          {/* Top Row: Metric Stats */}
          <StatsDashboard stats={globalStats} />

          {/* Daily completion bar */}
          <DailyProgress stats={globalStats} />

          {/* The season behind the day — three months of check-ins at a glance */}
          <ConsistencyGrid habits={habits} />

          {/* Your Rituals Section */}
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              Your rituals
            </h2>
            <HabitList 
              habits={habits} 
              onToggle={toggleCompletion} 
              onDelete={deleteHabit} 
              onMove={reorderHabits}
              onEdit={editHabit}
            />
            <AddHabitForm onAdd={addHabit} />
          </section>

          {/* Focus Timer Section */}
          <aside className="flex flex-col gap-5 border-t border-slate-900 pt-8">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              Deep Work
            </h2>
            <FocusTimer 
              habits={habits} 
              onFinish={(habitId) => toggleCompletion(habitId, todayKey())} 
            />
          </aside>

          {/* Backup */}
          <section className="flex flex-col gap-4 border-t border-slate-900 pt-8">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              Your data
            </h2>
            <DataControls habits={habits} onReplace={replaceHabits} />
          </section>

          {/* Footer */}
          <footer className="pt-8 pb-4 text-center text-xs text-slate-700 border-t border-slate-900">
            Your data stays on this device — stored locally in your browser.
            Clearing site data clears it too, so keep a backup.
          </footer>

        </div>
      </main>

      <UndoBanner
        pending={recentlyDeleted}
        onRestore={restoreHabit}
        onDismiss={dismissDeleted}
      />
    </div>
  );
}