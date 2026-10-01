// How much focus a day has had, kept as one small record for the current
// day only. Yesterday's minutes are not history this app keeps anywhere
// else, and a running total that never resets stops meaning anything.
export const EMPTY_FOCUS_LOG = { date: '', sessions: 0, seconds: 0 };

// The log as it reads on `today`. Anything stored for another day, or
// anything that is not the shape written here, counts as nothing yet.
export function focusFor(log, today) {
  if (
    !log ||
    log.date !== today ||
    !Number.isFinite(log.sessions) ||
    !Number.isFinite(log.seconds)
  ) {
    return { ...EMPTY_FOCUS_LOG, date: today };
  }

  return log;
}

// A finished session added to the day. Pure, so it can be handed straight
// to a state updater.
export function addFocus(log, today, seconds) {
  const current = focusFor(log, today);

  return {
    date: today,
    sessions: current.sessions + 1,
    seconds: current.seconds + Math.max(0, Math.round(seconds) || 0),
  };
}
