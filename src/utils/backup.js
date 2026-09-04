import { createId } from './ids';
import { todayKey } from './dateHelpers';

export const BACKUP_VERSION = 1;

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

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
        icon: h.icon,
        color: h.color,
        goal: h.weeklyGoal ?? h.goal,
        createdAt: h.createdAt,
        completions: h.completions,
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

  const goal = Number(raw.goal);
  const completions = Array.isArray(raw.completions)
    ? [...new Set(raw.completions.filter((d) => typeof d === 'string' && DATE_KEY.test(d)))].sort()
    : [];

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : createId(),
    name: name.slice(0, 40),
    icon: knownIcons.includes(raw.icon) ? raw.icon : knownIcons[0],
    color: knownColors.includes(raw.color) ? raw.color : knownColors[0],
    goal: goal >= 1 && goal <= 7 ? Math.round(goal) : 7,
    createdAt: typeof raw.createdAt === 'string' && DATE_KEY.test(raw.createdAt)
      ? raw.createdAt
      : todayKey(),
    completions,
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
