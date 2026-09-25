import {
  addDays, isDue, isPausedOn, isScheduled, isSkippedOn, weekdayOf, WEEKDAY_NAMES,
} from './dateHelpers';
import { noteFor } from './dayNotes';

// The backup is a file for this app to read back. This one is for a person
// to read, in whatever spreadsheet they already use — one row per ritual per
// day, which is the shape a pivot table or a filter wants, rather than the
// list of dates the app stores.
//
// Every day from the day a ritual started, not only the days it was done.
// The misses are the half of the record the app keeps implicitly, and they
// are exactly the rows somebody opens a spreadsheet to count.
export const SPREADSHEET_COLUMNS = ['date', 'weekday', 'ritual', 'owed', 'status', 'day note'];

export function spreadsheetFilename(date = new Date()) {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return `microgains-checkins-${key}.csv`;
}

// What the day was for this ritual, in a word a filter can match on.
//
// A check-in wins over everything else, because a bonus done on a rest day
// was still done. Today, left unfinished, is "open" rather than "missed" —
// the day is not over, and a sheet exported at breakfast should not count
// breakfast's rituals as failures.
function statusOn(habit, dateKey, done, today) {
  if (done) return 'done';
  if (isSkippedOn(dateKey, habit.pauses)) return 'skipped';
  if (isPausedOn(dateKey, habit.pauses)) return 'paused';
  if (!isScheduled(dateKey, habit.days)) return 'rest';
  return dateKey === today ? 'open' : 'missed';
}

// Where a ritual's record begins. Normally the day it was created, but an
// imported or older ritual can carry check-ins from before that, and a row
// for each of those is owed too.
function firstDay(habit, today) {
  const earliest = [...habit.completions].sort()[0];
  const created = habit.createdAt || earliest || today;

  return earliest && earliest < created ? earliest : created;
}

// Quoted only where it has to be. A ritual name is typed by hand and can
// hold a comma or a quote; one that starts like a formula is prefixed so a
// spreadsheet shows it as text rather than trying to run it.
function cell(value) {
  let text = String(value ?? '');

  if (/^[=+\-@]/.test(text)) text = `'${text}`;

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function habitsToCsv(habits, notes = {}, today) {
  const rows = [];

  for (const habit of habits) {
    const completed = new Set(habit.completions);

    for (let day = firstDay(habit, today); day <= today; day = addDays(day, 1)) {
      const done = completed.has(day);

      rows.push([
        day,
        WEEKDAY_NAMES[weekdayOf(day)],
        habit.name,
        isDue(day, habit.days, habit.pauses) ? 'yes' : 'no',
        statusOn(habit, day, done, today),
        noteFor(notes, day),
      ]);
    }
  }

  // Read by day first, the way the grid is, with each day's rituals in board
  // order. The sort is stable, so the order they were pushed in survives.
  rows.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));

  const lines = [SPREADSHEET_COLUMNS, ...rows].map((row) => row.map(cell).join(','));

  // The byte-order mark is what tells Excel the file is UTF-8. Without it an
  // em dash in a ritual's name opens as three characters of noise.
  return `﻿${lines.join('\r\n')}\r\n`;
}
