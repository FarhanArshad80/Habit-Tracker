# Constellation — Habit Tracker

A habit tracker where every completed ritual lights up a point in a 14-day
"constellation" trail, so streaks are something you can actually see.

## Features

- **Add / delete habits** with a name, icon, color, and weekly goal
- **One-tap check-in** for today, plus the ability to toggle any of the last
  14 days (great for logging a day you forgot)
- **Constellation streak trail** — a connected line of stars per habit shows
  your current run at a glance
- **Current & best streak** tracked automatically per habit
- **Stats dashboard** — today's completion rate, best streak, active
  rituals, and all-time check-ins
- **Focus timer** — a Pomodoro-style timer (5/15/25/45 min presets) that can
  automatically mark a linked habit complete when the session finishes
- **Persists locally** — everything is saved to `localStorage`, no backend
  or account needed
- Fully responsive, keyboard-accessible, and respects
  `prefers-reduced-motion`

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (usually http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

Run `npm run lint` to check the code with oxlint.

## Tech stack

- React 19 + Vite
- Tailwind CSS
- lucide-react icons

## Project structure

```
src/
├── components/
│   ├── AddHabitForm.jsx      # Form to create a new habit
│   ├── ConsistencyGrid.jsx   # Week-by-week grid of past check-ins
│   ├── DailyProgress.jsx     # Today's completion progress
│   ├── DataControls.jsx      # Backup, restore and spreadsheet export
│   ├── DayNote.jsx           # Short note kept against a day
│   ├── DayPicker.jsx         # Choose which weekdays a habit is due
│   ├── FocusTimer.jsx        # Circular Pomodoro-style focus timer
│   ├── HabitFilters.jsx      # View chips (All, Due today, ...)
│   ├── HabitItem.jsx         # Single habit row + constellation trail
│   ├── HabitList.jsx         # Renders all habits, empty state
│   ├── HabitOrder.jsx        # Sort and reorder controls
│   ├── HabitSearch.jsx       # Search box for long lists ("/" to focus)
│   ├── StatsDashboard.jsx    # Today's progress + all-time stats
│   ├── UndoBanner.jsx        # Undo after deleting a habit
│   └── WeekAhead.jsx         # What is due over the next seven days
├── context/
│   └── HabitContext.jsx      # Global state: add/delete/toggle, derived stats
├── hooks/
│   ├── useDocumentTitle.js   # Shows what is left today in the tab title
│   ├── useLocalStorage.js    # Persists state to the browser
│   └── useToday.js           # Today's date, updated across midnight
├── utils/
│   ├── backup.js             # Backup file format and validation
│   ├── dateHelpers.js        # Date keys, streak math
│   ├── dayNotes.js           # Storage for day notes
│   ├── focusLog.js           # Today's focus minutes
│   ├── habitFilters.js       # Rules behind each filter view
│   ├── habitOrder.js         # Sort orders and manual ordering
│   ├── habitSearch.js        # Search matching
│   ├── iconMap.js            # Icon name → lucide component
│   ├── ids.js                # Unique habit ids
│   ├── perfectDays.js        # Days where every due habit was done
│   └── spreadsheet.js        # CSV export for spreadsheets
├── App.jsx
├── index.css
└── main.jsx
```
