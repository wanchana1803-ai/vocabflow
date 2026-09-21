"use client";

import { useState, useCallback, useEffect, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void, boolean] {
  const isClient = useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

  const [state, setState] = useState<T>(initialValue);

  // Sync state with localStorage after client hydration to prevent SSR mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          setState(JSON.parse(item) as T);
        }
      } catch {
        // fallback
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [key]);

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      setState((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          if (typeof window !== "undefined") {
            window.localStorage.setItem(key, JSON.stringify(next));
          }
        } catch (err) {
          console.warn(`Error writing localStorage key "${key}":`, err);
        }
        return next;
      });
    },
    [key]
  );

  return [state, setValue, isClient];
}
