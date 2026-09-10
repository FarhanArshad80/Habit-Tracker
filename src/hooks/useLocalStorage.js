import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Drop-in replacement for useState that mirrors its value to localStorage.
 * Reads lazily on mount and writes on every change, guarding against
 * private-browsing / storage-quota errors so the app never crashes.
 *
 * Also listens for the same key being written by another tab. Two tabs open
 * on this app both loaded the board at open time and both wrote the whole
 * board back on every change, so whichever was touched last overwrote
 * everything the other had recorded — a check-in made in one tab was undone
 * by a check-in made in the other, silently and permanently.
 */
/**
 * Whether a `storage` event is somebody else's edit to this key.
 *
 * Pulled out of the listener so the rules can be read - and tested - on their
 * own, because every one of them is a case that produced a bug somewhere:
 * another key entirely, a tab clearing storage, and this tab hearing its own
 * write come back.
 */
export function isForeignWrite(event, key, lastWritten) {
  if (!event || event.key !== key) return false;
  // A cleared key, or storage wiped wholesale. Neither is a new board, and
  // adopting null would empty this tab because another one was reset.
  if (event.newValue === null || event.newValue === undefined) return false;

  return event.newValue !== lastWritten;
}

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch (error) {
      console.warn(`Could not read localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // What this tab last put in storage. An incoming `storage` event carries
  // the new text, and comparing against this is what tells an edit made
  // elsewhere apart from an echo of our own write.
  const lastWritten = useRef(null);

  useEffect(() => {
    try {
      const text = JSON.stringify(value);

      lastWritten.current = text;
      window.localStorage.setItem(key, text);
    } catch (error) {
      console.warn(`Could not write localStorage key "${key}":`, error);
    }
  }, [key, value]);

  useEffect(() => {
    const onStorage = (event) => {
      if (!isForeignWrite(event, key, lastWritten.current)) return;

      try {
        const incoming = JSON.parse(event.newValue);

        lastWritten.current = event.newValue;
        setValue(incoming);
      } catch (error) {
        // A half-written or hand-edited value is not worth replacing a
        // working board with.
        console.warn(`Ignored an unreadable "${key}" from another tab:`, error);
      }
    };

    // Fires in every tab except the one that wrote, which is exactly the set
    // of tabs that need telling.
    window.addEventListener('storage', onStorage);

    return () => window.removeEventListener('storage', onStorage);
  }, [key]);

  // Stable across renders so it can sit in the dependency list of the
  // callbacks that use it without rebuilding them on every change.
  const update = useCallback((next) => setValue(next), []);

  return [value, update];
}
