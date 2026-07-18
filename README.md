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

## Tech stack

- React 19 + Vite
- Tailwind CSS
- lucide-react icons

## Project structure

```
src/
├── components/
│   ├── AddHabitForm.jsx      # Form to create a new habit
│   ├── FocusTimer.jsx        # Circular Pomodoro-style focus timer
│   ├── HabitItem.jsx         # Single habit row + constellation trail
│   ├── HabitList.jsx         # Renders all habits, empty state
│   └── StatsDashboard.jsx    # Today's progress + all-time stats
├── context/
│   └── HabitContext.jsx      # Global state: add/delete/toggle, derived stats
├── hooks/
│   └── useLocalStorage.js    # Persists state to the browser
├── utils/
│   ├── dateHelpers.js        # Date keys, streak math
│   └── iconMap.js            # Icon name → lucide component
├── App.jsx
├── index.css
└── main.jsx
```
