import { createContext, useState, useSyncExternalStore, type ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';

// index.html applies the same key before first paint, so a stored choice never flashes.
const STORAGE_KEY = 'hblake-color-mode';
const DARK_QUERY = '(prefers-color-scheme: dark)';

export const COLOR_MODE_CONTEXT = createContext<ColorModeValue>({ dark: false, toggle: () => undefined });

/** Follows the system colour scheme until the visitor picks one, which is remembered on this device. */
export function ColorMode({ children }: { children: ReactNode }) {
  const state = useColorModeState();
  return <Theme theme={neutralTheme} mode={state.mode}><COLOR_MODE_CONTEXT value={state.value}>{children}</COLOR_MODE_CONTEXT></Theme>;
}

export type ColorModeValue = { dark: boolean; toggle: () => void };

function useColorModeState() {
  const [mode, setMode] = useState<StoredMode>(readStoredMode);
  const systemDark = useSyncExternalStore(subscribeToSystem, () => window.matchMedia(DARK_QUERY).matches, () => false);
  const dark = mode === 'dark' || (mode === 'system' && systemDark);
  function toggle() {
    const next = dark ? 'light' : 'dark';
    setMode(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* Private browsing: the choice lasts for this page only. */ }
  }
  return { mode, value: { dark, toggle } };
}

function readStoredMode(): StoredMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch { return 'system'; }
}

function subscribeToSystem(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', onChange);
  return () => { query.removeEventListener('change', onChange); };
}

type StoredMode = 'system' | 'light' | 'dark';
