import { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { HABIT_COLORS, HABIT_ICONS } from '../context/HabitContext';
import { backupFilename, parseBackup, serializeHabits } from '../utils/backup';
import { habitsToCsv, spreadsheetFilename } from '../utils/spreadsheet';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { daysBetween } from '../utils/dateHelpers';

const COLOR_IDS = HABIT_COLORS.map((c) => c.id);

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

// Past this, a backup is old enough that losing the browser's storage would
// cost more than a few days' check-ins, and the line says so in colour.
const BACKUP_STALE_DAYS = 14;

function backupAge(lastKey, today) {
  if (!lastKey || !DATE_KEY.test(lastKey)) return null;

  const days = Math.max(0, daysBetween(lastKey, today));

  if (days === 0) return { days, text: 'today' };
  if (days === 1) return { days, text: 'yesterday' };
  return { days, text: `${days} days ago` };
}

export default function DataControls({ habits, notes = {}, today, onReplace }) {
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [note, setNote] = useState('');
  // The day the last backup was saved from this browser. The footer tells
  // everyone to keep one, and nothing on the page said whether they had —
  // or whether the one they had was from last spring.
  const [lastBackup, setLastBackup] = useLocalStorage('constellation.lastBackup', null);
  const age = backupAge(lastBackup, today);

  function download(text, type, filename) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();

    // Revoked on the next task rather than inline: the save is kicked off by
    // the click but not necessarily finished by the time it returns, and
    // pulling the URL out from under it cancels the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function handleExport() {
    download(serializeHabits(habits, notes), 'application/json', backupFilename());
    setLastBackup(today);

    setError('');
    setNote(`Saved ${habits.length} ritual${habits.length === 1 ? '' : 's'}.`);
  }

  // Not a backup, and said so: nothing in it can be restored, because a
  // sheet somebody has sorted and annotated is no longer a faithful record
  // and the app should not pretend to read one back.
  function handleSpreadsheet() {
    download(habitsToCsv(habits, notes, today), 'text/csv;charset=utf-8', spreadsheetFilename());

    setError('');
    setNote('Saved every day as a row — for reading in a spreadsheet, not for restoring.');
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    // Cleared so re-picking the same file after a failed import still fires.
    event.target.value = '';
    if (!file) return;

    setNote('');

    try {
      const parsed = parseBackup(await file.text(), {
        icons: HABIT_ICONS,
        colors: COLOR_IDS,
      });

      setError('');
      setPending(parsed);
    } catch (err) {
      setPending(null);
      setError(err.message);
    }
  }

  function confirmImport() {
    onReplace(pending.habits, pending.notes);
    setNote(
      `Restored ${pending.habits.length} ritual${pending.habits.length === 1 ? '' : 's'}` +
        (pending.skipped > 0 ? ` · skipped ${pending.skipped} unreadable` : '.')
    );
    setPending(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={habits.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-void-400 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-void-500 hover:text-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} />
          Export backup
        </button>

        <button
          type="button"
          onClick={handleSpreadsheet}
          disabled={habits.length === 0}
          className="flex items-center gap-1.5 rounded-lg border border-void-400 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-void-500 hover:text-ink-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" strokeWidth={1.75} />
          Spreadsheet (CSV)
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-void-400 px-3 py-1.5 text-xs font-medium text-ink-300 transition-colors hover:border-void-500 hover:text-ink-100"
        >
          <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />
          Restore
        </button>

        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          onChange={handleFile}
          className="sr-only"
          aria-label="Choose a backup file"
        />
      </div>

      {/* Restoring wipes what is on the device, so it says exactly what it is
          about to trade away before it does it. */}
      {pending && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold/40 bg-gold/5 px-3 py-2.5 text-xs animate-rise">
          <AlertTriangle className="h-4 w-4 shrink-0 text-gold" strokeWidth={2} />
          <p className="min-w-0 flex-1 text-ink-300">
            Replace your {habits.length} ritual{habits.length === 1 ? '' : 's'} with the{' '}
            {pending.habits.length} in this file? Everything currently on this
            device is discarded.
          </p>
          <button
            type="button"
            onClick={confirmImport}
            className="rounded-md bg-gold px-2.5 py-1 font-semibold text-void-100 hover:bg-gold-soft"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={() => setPending(null)}
            className="rounded-md px-2 py-1 font-medium text-ink-500 hover:text-ink-300"
          >
            Cancel
          </button>
        </div>
      )}

      {habits.length > 0 && (
        <p className={`font-mono text-[11px] ${age && age.days < BACKUP_STALE_DAYS ? 'text-ink-700' : 'text-gold/80'}`}>
          {age ? `Last backup saved ${age.text}.` : 'No backup saved from this browser yet.'}
        </p>
      )}

      {error && <p className="text-xs text-rose">{error}</p>}
      {note && !pending && <p className="text-xs text-ink-500">{note}</p>}
    </div>
  );
}
