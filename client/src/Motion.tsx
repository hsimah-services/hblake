import { createContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';

// index.html applies the same key before first paint, so a stored choice never animates first.
const STORAGE_KEY = 'hblake-motion';
const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

export const MOTION_CONTEXT = createContext<MotionValue>({ reduced: false, toggle: () => undefined });

/**
 * Follows the system's reduced-motion setting until the visitor turns animations on or
 * off, which is remembered on this device. global.css reads `data-motion` on <html>.
 */
export function Motion({ children }: { children: ReactNode }) {
  const value = useMotionState();
  return <MOTION_CONTEXT value={value}>{children}</MOTION_CONTEXT>;
}

export type MotionValue = { reduced: boolean; toggle: () => void };

function useMotionState(): MotionValue {
  const [mode, setMode] = useState<StoredMotion>(readStoredMotion);
  const systemReduced = useSyncExternalStore(subscribeToSystem, () => window.matchMedia(REDUCE_QUERY).matches, () => false);
  const reduced = mode === 'reduce' || (mode === 'system' && systemReduced);
  useEffect(() => {
    if (mode === 'system') document.documentElement.removeAttribute('data-motion');
    else document.documentElement.setAttribute('data-motion', mode);
  }, [mode]);
  function toggle() {
    const next = reduced ? 'full' : 'reduce';
    setMode(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Private browsing: the choice lasts for this page only. */ }
  }
  return { reduced, toggle };
}

function readStoredMotion(): StoredMotion {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'full' || stored === 'reduce' ? stored : 'system';
  } catch { return 'system'; }
}

function subscribeToSystem(onChange: () => void) {
  const query = window.matchMedia(REDUCE_QUERY);
  query.addEventListener('change', onChange);
  return () => { query.removeEventListener('change', onChange); };
}

type StoredMotion = 'system' | 'full' | 'reduce';
