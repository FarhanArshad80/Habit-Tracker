import { createId } from './ids';
import { todayKey, normalizeSchedule, normalizePauses } from './dateHelpers';

// 4 adds the reason a ritual is on the board. 3 added the days a ritual was
// set aside. Until now the export dropped them
// silently, so restoring a file turned every pause and every skipped day
// back into a day that was owed and missed — the streak the restore was
// meant to preserve was the first thing it broke.
export const BACKUP_VERSION = 4;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

// Kept in step with the form that writes it, so a hand-edited file cannot
// put a paragraph on a card that has one line to render it in.
const WHY_LIMIT = 80;

export function backupFilename(date = new Date()) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `microgains-${key}.json`;
}

// A file the app wrote a year ago should still open in the app a year from
// now, so the export carries its own version number rather than assuming
// today's shape is permanent.
export function serializeHabits(habits) {
  return JSON.stringify(
    {
      app: 'microgains',
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      habits: habits.map((h) => ({
        id: h.id,
        name: h.name,
        why: h.why,
        icon: h.icon,
        color: h.color,
        days: h.days,
        goal: h.weeklyGoal ?? h.goal,
        createdAt: h.createdAt,
        completions: h.completions,
        pauses: h.pauses,
      })),
    },
    null,
    2
  );
}

// Anything coming off disk is a stranger: hand-edited, written by an older
// build, or simply the wrong file. Each ritual is rebuilt field by field
// from what is actually there, so one bad entry cannot put the app into a
// state it has no way to render.
function sanitizeHabit(raw, knownIcons, knownColors) {
  if (!raw || typeof raw !== 'object') return null;

  const name = typeof raw.name === 'string' ? raw.name.trim() : '';
  if (!name) return null;

  // A version 1 backup carries no schedule at all, which reads as daily —
  // exactly what those rituals were when the file was written.
  const days = normalizeSchedule(raw.days);
  const goal = Number(raw.goal);
  const completions = Array.isArray(raw.completions)
    ? [...new Set(raw.completions.filter((d) => typeof d === 'string' && DATE_KEY.test(d)))].sort()
    : [];

  // A version 1 or 2 backup carries no pauses, which reads as a ritual that
  // was never set aside — exactly what those rituals looked like to the
  // build that wrote the file.
  const pauses = normalizePauses(raw.pauses).filter(
    (pause) =>
      DATE_KEY.test(pause.from) &&
      (pause.to === null || pause.to === undefined || DATE_KEY.test(pause.to))
  ).map((pause) => ({ from: pause.from, to: pause.to ?? null }));

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name: name.slice(0, 40),
    // Absent in every earlier version, and blank is what those rituals had.
    why: typeof raw.why === 'string' ? raw.why.trim().slice(0, WHY_LIMIT) : '',
    icon: knownIcons.includes(raw.icon) ? raw.icon : knownIcons[0],
    color: knownColors.includes(raw.color) ? raw.color : knownColors[0],
    days,
    goal: goal >= 1 && goal <= days.length ? Math.round(goal) : days.length,
    createdAt: typeof raw.createdAt === 'string' && DATE_KEY.test(raw.createdAt)
      ? raw.createdAt
      : todayKey(),
    completions,
    pauses,
  };
}

// Throws with something a person can act on — "that's not a MicroGains
// backup" is more use than a JSON parser's offset.
export function parseBackup(text, { icons, colors }) {
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("That file isn't valid JSON.");
  }

  if (!data || typeof data !== 'object' || !Array.isArray(data.habits)) {
    throw new Error("That doesn't look like a MicroGains backup.");
  }

  if (Number(data.version) > BACKUP_VERSION) {
    throw new Error('That backup was written by a newer version of MicroGains.');
  }

  const habits = [];
  const seen = new Set();

  for (const raw of data.habits) {
    const habit = sanitizeHabit(raw, icons, colors);
    if (!habit) continue;

    // Two rituals sharing an id would make every toggle ambiguous.
    if (seen.has(habit.id)) habit.id = createId();
    seen.add(habit.id);

    habits.push(habit);
  }

  if (habits.length === 0) {
    throw new Error('There are no readable rituals in that file.');
  }

  return { habits, skipped: data.habits.length - habits.length };
}
