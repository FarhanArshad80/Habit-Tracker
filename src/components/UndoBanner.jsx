import { useEffect, useState } from 'react';
import { Undo2, X } from 'lucide-react';

const UNDO_SECONDS = 8;

export default function UndoBanner({ pending, onRestore, onDismiss }) {
  const [secondsLeft, setSecondsLeft] = useState(UNDO_SECONDS);

  // Keyed on the pending deletion itself, so deleting a second ritual while
  // the first banner is still up restarts the window rather than inheriting
  // whatever was left of it.
  useEffect(() => {
    if (!pending) return undefined;

    setSecondsLeft(UNDO_SECONDS);

    const tick = setInterval(() => {
      setSecondsLeft((left) => Math.max(left - 1, 0));
    }, 1000);
    const expiry = setTimeout(onDismiss, UNDO_SECONDS * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(expiry);
    };
  }, [pending, onDismiss]);

  // Ctrl+Z (or Cmd+Z) does what the button does, for as long as the banner
  // is up. It is the key everybody already reaches for after deleting the
  // wrong thing, and the banner sits at the bottom of the screen, a long
  // way from the card that was just removed.
  //
  // Left alone while something is being typed into, where Ctrl+Z already
  // means "undo my typing" and taking it would restore a ritual instead.
  useEffect(() => {
    if (!pending) return undefined;

    const onKeyDown = (event) => {
      if (event.key.toLowerCase() !== 'z' || !(event.ctrlKey || event.metaKey)) return;
      if (event.shiftKey || event.altKey) return;

      const target = event.target;
      const tag = target?.tagName;

      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target?.isContentEditable) {
        return;
      }

      event.preventDefault();
      onRestore();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [pending, onRestore]);

  if (!pending) return null;

  const { habit } = pending;
  const checkIns = habit.completions?.length || 0;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 animate-rise"
    >
      <div className="flex items-center gap-3 rounded-2xl border border-void-400 bg-void-200/95 px-4 py-3 shadow-card backdrop-blur">
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-ink-100">
            Deleted &ldquo;{habit.name}&rdquo;
          </p>
          <p className="font-mono text-xs text-ink-500">
            {checkIns === 0
              ? 'No check-ins recorded'
              : `${checkIns} check-in${checkIns === 1 ? '' : 's'} gone with it`}
            {' · '}
            {secondsLeft}s to undo
          </p>
        </div>

        <button
          type="button"
          onClick={onRestore}
          aria-keyshortcuts="Control+Z Meta+Z"
          title="Undo (Ctrl+Z)"
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-semibold text-void-100 transition-colors hover:bg-gold-soft"
        >
          <Undo2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          Undo
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-ink-700 transition-colors hover:text-ink-300"
        >
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
