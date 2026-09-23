import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Timer as TimerIcon } from 'lucide-react';

const PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '25m', seconds: 25 * 60 },
  { label: '45m', seconds: 45 * 60 },
];

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function FocusTimer({ habits, onFinish, onCountdown }) {
  const [durationSeconds, setDurationSeconds] = useState(PRESETS[2].seconds);
  const [remaining, setRemaining] = useState(PRESETS[2].seconds);
  const [running, setRunning] = useState(false);
  const [linkedHabitId, setLinkedHabitId] = useState('');
  const [justFinished, setJustFinished] = useState(false);
  // When this session is due to end, in wall-clock time.
  //
  // The countdown used to be a subtraction per tick, which made the timer a
  // count of the ticks the browser chose to deliver rather than of the time
  // that passed. A hidden tab gets those ticks slowed to about one a minute,
  // so a 25-minute session ran for the better part of an hour — and hidden
  // is exactly where this tab is during a focus session. Holding the
  // deadline instead makes every tick a reading rather than an increment,
  // and a missed one costs nothing.
  const endAtRef = useRef(null);
  // Read by the tick rather than closed over by it, so a ritual chosen after
  // the timer started is still the one marked off when it ends.
  const linkedRef = useRef(linkedHabitId);
  const finishRef = useRef(onFinish);

  linkedRef.current = linkedHabitId;
  finishRef.current = onFinish;

  useEffect(() => {
    if (!running) return undefined;

    const tick = () => {
      const left = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));

      setRemaining(left);

      if (left > 0) return;

      endAtRef.current = null;
      setRunning(false);
      setJustFinished(true);

      if (linkedRef.current) finishRef.current(linkedRef.current);
    };

    // Twice a second, so the last digit turns over when it should rather
    // than up to a second late.
    const id = setInterval(tick, 500);

    // Coming back to the tab is the moment the reading is most likely to be
    // stale and most likely to be looked at, so it is re-read then rather
    // than waited for.
    document.addEventListener('visibilitychange', tick);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [running]);

  // What the tab strip is told, in whole minutes.
  //
  // The point of a focus session is that this tab is not the one being
  // looked at, which left the timer running somewhere nobody could see it —
  // the app's own argument for putting what is owed today in the title.
  //
  // Minutes rather than seconds: a tab title that changes every second is a
  // flicker in the corner of the eye, and "how long have I got" is not a
  // question anybody asks a tab strip to the second. Rounded up, so a
  // running session never reads 0m.
  const minutesLeft = running ? Math.ceil(remaining / 60) : null;

  useEffect(() => {
    onCountdown?.(minutesLeft);
  }, [minutesLeft, onCountdown]);

  // A timer that is unmounted is not running, whatever the tab last said.
  useEffect(() => () => onCountdown?.(null), [onCountdown]);

  useEffect(() => {
    if (justFinished) {
      const t = setTimeout(() => setJustFinished(false), 4000);
      return () => clearTimeout(t);
    }
  }, [justFinished]);

  function selectPreset(seconds) {
    setDurationSeconds(seconds);
    setRemaining(seconds);
    setRunning(false);
    endAtRef.current = null;
    setJustFinished(false);
  }

  function toggleRunning() {
    if (remaining === 0) return;
    setJustFinished(false);

    // Starting sets the deadline from what is left, so pausing for a minute
    // costs the session nothing and resuming does not have to recover it.
    if (!running) endAtRef.current = Date.now() + remaining * 1000;
    else endAtRef.current = null;

    setRunning((r) => !r);
  }

  function reset() {
    setRunning(false);
    endAtRef.current = null;
    setRemaining(durationSeconds);
    setJustFinished(false);
  }

  const progress = durationSeconds === 0 ? 0 : (durationSeconds - remaining) / durationSeconds;
  const dashOffset = useMemo(() => CIRCUMFERENCE * (1 - progress), [progress]);

  return (
    <div className="rounded-2xl border border-void-400/60 bg-void-200/70 p-5 shadow-card">
      <div className="flex items-center gap-2 text-ink-500">
        <TimerIcon className="h-3.5 w-3.5 text-teal" strokeWidth={2} />
        <span className="text-xs font-medium uppercase tracking-wide">Focus timer</span>
      </div>

      <div className="mt-4 flex flex-col items-center">
        <div className="relative h-36 w-36">
          <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
            <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="#1B2333" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={RADIUS}
              fill="none"
              stroke={justFinished ? '#2DD4BF' : '#F2B705'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-2xl font-medium tabular-nums text-ink-100">
              {formatTime(remaining)}
            </span>
            {justFinished && (
              <span className="mt-0.5 text-[11px] font-medium text-teal animate-rise">Session complete</span>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => selectPreset(p.seconds)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                durationSeconds === p.seconds
                  ? 'bg-gold/15 text-gold'
                  : 'text-ink-500 hover:text-ink-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={reset}
            aria-label="Reset timer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-void-400 text-ink-500 transition-colors hover:text-ink-100"
          >
            <RotateCcw className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={toggleRunning}
            aria-label={running ? 'Pause timer' : 'Start timer'}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-void-100 shadow-glow transition-transform active:scale-95"
          >
            {running ? <Pause className="h-5 w-5" strokeWidth={2.25} /> : <Play className="ml-0.5 h-5 w-5" strokeWidth={2.25} />}
          </button>
          <div className="h-10 w-10" aria-hidden="true" />
        </div>

        {habits.length > 0 && (
          <div className="mt-5 w-full">
            <label htmlFor="linked-habit" className="mb-1.5 block text-center text-[11px] font-medium uppercase tracking-wide text-ink-500">
              Mark complete on finish
            </label>
            <select
              id="linked-habit"
              value={linkedHabitId}
              onChange={(e) => setLinkedHabitId(e.target.value)}
              className="w-full rounded-lg border border-void-400 bg-void-100 px-3 py-2 text-center text-sm text-ink-300 outline-none focus:border-gold/60"
            >
              <option value="">No ritual selected</option>
              {habits.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
