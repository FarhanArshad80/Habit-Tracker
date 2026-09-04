import { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import { HABIT_COLORS, HABIT_ICONS } from '../context/HabitContext';
import { backupFilename, parseBackup, serializeHabits } from '../utils/backup';

const COLOR_IDS = HABIT_COLORS.map((c) => c.id);

export default function DataControls({ habits, onReplace }) {
  const fileRef = useRef(null);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const [note, setNote] = useState('');

  function handleExport() {
    const blob = new Blob([serializeHabits(habits)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = backupFilename();
    link.click();

    // Revoked on the next task rather than inline: the save is kicked off by
    // the click but not necessarily finished by the time it returns, and
    // pulling the URL out from under it cancels the download.
    setTimeout(() => URL.revokeObjectURL(url), 0);

    setError('');
    setNote(`Saved ${habits.length} ritual${habits.length === 1 ? '' : 's'}.`);
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
    onReplace(pending.habits);
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

      {error && <p className="text-xs text-rose">{error}</p>}
      {note && !pending && <p className="text-xs text-ink-500">{note}</p>}
    </div>
  );
}
