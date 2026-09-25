import { useMemo, useState } from 'react';
import { useHabits } from './context/HabitContext';
import StatsDashboard from './components/StatsDashboard';
import DailyProgress from './components/DailyProgress';
import DayNote from './components/DayNote';
import ConsistencyGrid from './components/ConsistencyGrid';
import WeekAhead from './components/WeekAhead';
import AddHabitForm from './components/AddHabitForm';
import HabitList from './components/HabitList';
import HabitFilters, { canFilter, habitFilter } from './components/HabitFilters';
import HabitOrder, { canOrder, habitOrder, sortHabits } from './components/HabitOrder';
import HabitSearch, { canSearch, habitMatchesQuery } from './components/HabitSearch';
import FocusTimer from './components/FocusTimer';
import UndoBanner from './components/UndoBanner';
import DataControls from './components/DataControls';
import { useDocumentTitle } from './hooks/useDocumentTitle';
import { useLocalStorage } from './hooks/useLocalStorage';
import { formatFriendlyDate } from './utils/dateHelpers';

export default function App() {
  const {
    habits, globalStats, recentlyDeleted, today, addHabit, editHabit, togglePause,
    toggleSkip, deleteHabit, restoreHabit, dismissDeleted, replaceHabits,
    toggleCompletion, reorderHabits, notes,
  } = useHabits();
  // The date in the header comes from the same place every streak on the page
  // does, so the two cannot disagree after midnight.
  const todayLabel = useMemo(() => formatFriendlyDate(today), [today]);

  // What the tab says from across a window of them. A count in brackets is
  // the convention every unread-anything uses, and it survives being
  // squeezed down to forty pixels in a pinned tab where a sentence would
  // not.
  //
  // The tick is deliberate: closing out a day is the thing this board is
  // for, and a tab that only ever nags has nothing to say on the day it
  // goes right. Nothing at all when nothing is due, because a rest day is
  // not an achievement and a badge on it would be noise.
  const owed = globalStats.dueToday - globalStats.completedToday;

  // Minutes left on a focus session, while one is running. Held here rather
  // than in the timer because the title has one slot and three things that
  // want it, and something has to decide between them.
  //
  // A running session wins the slot. The count of what is owed is a standing
  // fact that will still be true in ten minutes; a session is the one thing
  // on this board that is ending at a particular moment, and the tab strip
  // is where it can be watched without breaking the focus it is timing.
  const [focusMinutes, setFocusMinutes] = useState(null);
  const tabMarker =
    focusMinutes !== null
      ? `${focusMinutes}m`
      : owed > 0
        ? `(${owed})`
        : globalStats.dueToday > 0 ? '✓' : '';

  useDocumentTitle(tabMarker);

  // Which slice of the board is on screen. Past a handful of rituals the
  // list stops being something you read and becomes something you scan, and
  // "what is still owed today" is the question it is usually being scanned
  // for.
  //
  // Both this and the order below are kept between visits. Somebody who
  // reads the board by what needs attention reads it that way every
  // morning, and picking the view again on every open was a chore paid
  // each day for a decision already made. Kept out of the backup: it is how
  // this device is read, not part of the record.
  const [storedFilter, setFilter] = useLocalStorage('constellation.view.filter', 'all');
  // And in what order. Kept apart from the filter because they answer
  // different questions — which rituals am I looking at, and which of them
  // do I want to see first.
  const [storedOrder, setOrder] = useLocalStorage('constellation.view.order', 'manual');
  // And the third axis: by name. The chips answer "which rituals are like
  // this", the search answers "where is that one" — the question that only
  // starts being asked once the board is long enough that scanning it is
  // work. Not remembered: a word typed yesterday is not today's question.
  const [query, setQuery] = useState('');
  // Whatever came out of storage is run back through the known views, so a
  // value from another build cannot leave no chip lit. And like the search
  // below, each only counts while its control is on screen — a view
  // remembered from a longer board must not quietly narrow a shorter one
  // that has nothing on it to say so, or to take it back.
  const filter = canFilter(habits) ? habitFilter(storedFilter).id : 'all';
  const order = canOrder(habits) ? habitOrder(storedOrder).id : 'manual';
  const view = habitFilter(filter);
  // The box hides itself on a short board, so the query it holds must stop
  // counting at the same moment. Otherwise deleting a ritual could drop the
  // board under the threshold and leave the list narrowed by a word with
  // nothing on screen that says so, and no way to take it back.
  const searching = canSearch(habits) && query.trim() !== '';
  const visible = useMemo(
    () =>
      sortHabits(
        habits.filter(
          (habit) => view.match(habit) && (!searching || habitMatchesQuery(habit, query))
        ),
        order
      ),
    [habits, view, order, searching, query]
  );

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
            {todayLabel}
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

          {/* And the half the bar cannot hold: why the day went the way it
              did. Directly under the numbers it explains, while the day is
              still close enough to remember. */}
          <DayNote />

          {/* What is coming, before the record of what has been. Today's bar
              is above this and three months of history below it, so the page
              reads forward from the day rather than only backward. */}
          <WeekAhead habits={habits} />

          {/* The season behind the day — three months of check-ins at a glance */}
          <ConsistencyGrid habits={habits} />

          {/* Your Rituals Section */}
          <section className="flex flex-col gap-5">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              Your rituals
            </h2>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <HabitFilters habits={habits} active={filter} onChange={setFilter} />
              <div className="flex flex-wrap items-center gap-3">
                <HabitSearch habits={habits} value={query} onChange={setQuery} />
                <HabitOrder habits={habits} active={order} onChange={setOrder} />
              </div>
            </div>
            <HabitList 
              habits={visible} 
              onToggle={toggleCompletion} 
              onDelete={deleteHabit} 
              onMove={reorderHabits}
              onEdit={editHabit}
              onTogglePause={togglePause}
              onToggleSkip={toggleSkip}
              // The arrows move a ritual past its neighbour in the stored
              // order. Under a filter that neighbour may be hidden, and
              // under a sort it is not the row above — either way the press
              // appears to do nothing, so the control is withdrawn rather
              // than left to lie. A search narrows the list the same way a
              // filter does, and lies about the arrows for the same reason.
              reorderable={filter === 'all' && order === 'manual' && !searching}
              emptyMessage={
                searching
                  ? `No ritual matches “${query.trim()}”.`
                  : habits.length > 0
                    ? view.empty
                    : undefined
              }
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
              onFinish={(habitId) => toggleCompletion(habitId, today)} 
              onCountdown={setFocusMinutes}
            />
          </aside>

          {/* Backup */}
          <section className="flex flex-col gap-4 border-t border-slate-900 pt-8">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              Your data
            </h2>
            <DataControls habits={habits} notes={notes} onReplace={replaceHabits} />
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