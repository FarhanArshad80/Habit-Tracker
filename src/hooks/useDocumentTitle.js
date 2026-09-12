import { useEffect, useRef } from 'react';

/**
 * Puts a short marker in front of the tab title.
 *
 * This is a tab people pin and then stop looking at. The board knows what is
 * still owed today, but that only helps somebody who has the tab open in
 * front of them — which is the one state where they did not need telling.
 * The title is the only part of this app that stays visible from another tab,
 * so it is the only place a reminder can actually reach.
 *
 * The base title is read from the document once, at mount, rather than
 * written out here a second time. Two copies of the same string is the
 * arrangement where the tab quietly stops matching the page.
 */
export function useDocumentTitle(prefix) {
  // Captured on the first render and never re-read: by the second render the
  // document title is whatever this hook last set, and reading it back would
  // grow a marker on the front of itself.
  const base = useRef(null);

  if (base.current === null && typeof document !== 'undefined') {
    base.current = document.title;
  }

  useEffect(() => {
    document.title = prefix ? `${prefix} ${base.current}` : base.current;
  }, [prefix]);

  // Put back on the way out, so a tab that outlives this board does not keep
  // claiming three rituals are owed on it.
  useEffect(() => () => {
    document.title = base.current;
  }, []);
}
