import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type TimeOfDayPhase = 'night' | 'day' | 'transition';
type ThemeMode = 'auto' | 'manual';

function getPhase(d: Date): TimeOfDayPhase {
  const h = d.getHours();
  if (h >= 20 || h < 5) return 'night';
  if (h >= 8 && h < 17) return 'day';
  return 'transition';
}

function nextBoundary(from: Date): Date {
  const boundaries = [5, 8, 17, 20];
  const d = new Date(from);
  for (const hour of boundaries) {
    if (from.getHours() < hour) {
      d.setHours(hour, 0, 0, 0);
      return d;
    }
  }
  d.setDate(d.getDate() + 1);
  d.setHours(5, 0, 0, 0);
  return d;
}

interface TimeOfDayThemeContextValue {
  phase: TimeOfDayPhase;          // effective phase (auto or manual)
  mode: ThemeMode;                // 'auto' or 'manual'
  manualPhase: TimeOfDayPhase | null;
  setMode: (m: ThemeMode) => void;
  setManualPhase: (p: TimeOfDayPhase) => void;
  refresh: () => void;            // force recompute (useful if staying in auto)
}

const TimeOfDayThemeContext = createContext<TimeOfDayThemeContextValue | undefined>(undefined);

const LS_KEY_MODE = 'themeMode';
const LS_KEY_MANUAL = 'themeManualPhase';

export const TimeOfDayThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [autoPhase, setAutoPhase] = useState<TimeOfDayPhase>(() => getPhase(new Date()));
  const [mode, setModeState] = useState<ThemeMode>(() => (localStorage.getItem(LS_KEY_MODE) as ThemeMode) || 'auto');
  const [manualPhase, setManualPhaseState] = useState<TimeOfDayPhase | null>(() => {
    const saved = localStorage.getItem(LS_KEY_MANUAL);
    return (saved as TimeOfDayPhase) || null;
  });

  const timeoutRef = useRef<number | null>(null);

  const schedule = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (mode !== 'auto') return; // no scheduling when manual
    const now = new Date();
    const target = nextBoundary(now);
    const delay = target.getTime() - now.getTime();
    timeoutRef.current = window.setTimeout(() => {
      setAutoPhase(getPhase(new Date()));
      schedule();
    }, delay);
  };

  useEffect(() => {
    schedule();
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, [mode]);

  const refresh = () => {
    if (mode === 'auto') setAutoPhase(getPhase(new Date()));
  };

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    localStorage.setItem(LS_KEY_MODE, m);
    if (m === 'auto') refresh(); // immediately sync
  };

  const setManualPhase = (p: TimeOfDayPhase) => {
    setManualPhaseState(p);
    localStorage.setItem(LS_KEY_MANUAL, p);
  };

  const effectivePhase: TimeOfDayPhase = mode === 'manual' && manualPhase ? manualPhase : autoPhase;

  return (
    <TimeOfDayThemeContext.Provider
      value={{
        phase: effectivePhase,
        mode,
        manualPhase,
        setMode,
        setManualPhase,
        refresh
      }}
    >
      <div className={`app-theme-wrapper theme-${effectivePhase}`}>{children}</div>
    </TimeOfDayThemeContext.Provider>
  );
};

export const useTimeOfDayTheme = () => {
  const ctx = useContext(TimeOfDayThemeContext);
  if (!ctx) throw new Error('useTimeOfDayTheme must be used within TimeOfDayThemeProvider');
  return ctx;
};
