import { useEffect, useState } from 'react';

/**
 * Today's date key, kept honest across midnight.
 *
 * A habit tracker is a tab people leave open. Checking off the evening's
 * rituals at half past eleven and then again after midnight is the ordinary
 * way this app gets used, and until now the second visit was still looking at
 * the day before: the trail ended on yesterday, the streak counted from
 * yesterday, and the tick people put in the box was recorded against a day
 * the board was not showing.
 *
 * The date is state rather than a call to `todayKey()` during render, so the
 * roll-over is a re-render rather than something the next unrelated change
 * happens to pick up.
 */
import { todayKey } from '../utils/dateHelpers';

// A second past the hour rather than exactly on it. Timers fire a hair early
// often enough that landing on 23:59:59.999 and reading yesterday's date is a
// real outcome, and being a second late costs nothing.
const MIDNIGHT_BUFFER_MS = 1000;

function msUntilMidnight(now = new Date()) {
  const midnight = new Date(now);

  midnight.setHours(24, 0, 0, 0);

  return midnight.getTime() - now.getTime() + MIDNIGHT_BUFFER_MS;
}

export function useToday() {
  const [today, setToday] = useState(todayKey);

  useEffect(() => {
    let timer;

    // Only when it has actually changed, so a machine waking from sleep does
    // not re-render the board for a date it is already showing.
    const check = () => {
      setToday((current) => {
        const now = todayKey();

        return now === current ? current : now;
      });
    };

    // Re-armed after each firing rather than run on an interval: the gap to
    // the next midnight is a different length every time, and a fixed
    // interval would either drift or have to tick far more often than once a
    // day to stay accurate.
    const arm = () => {
      timer = setTimeout(() => {
        check();
        arm();
      }, msUntilMidnight());
    };

    arm();

    // A laptop closed at eleven and opened at nine has a timer that fired
    // late, or a tab that was frozen and did not fire at all. Either way the
    // date is wrong the moment somebody looks at it, which is exactly when
    // these two events arrive.
    const onWake = () => {
      if (document.visibilityState === 'visible') check();
    };

    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', check);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', check);
    };
  }, []);

  return today;
}
