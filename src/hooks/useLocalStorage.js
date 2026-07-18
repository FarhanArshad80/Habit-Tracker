import { useEffect, useRef, useState } from 'react';

/**
 * Drop-in replacement for useState that mirrors its value to localStorage.
 * Reads lazily on mount and writes on every change, guarding against
 * private-browsing / storage-quota errors so the app never crashes.
 */
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

  const isFirstRun = useRef(true);

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Could not write localStorage key "${key}":`, error);
    }
  }, [key, value]);

  useEffect(() => {
    isFirstRun.current = false;
  }, []);

  return [value, setValue];
}
