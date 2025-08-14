import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

export type TimeOfDayPhase = 'night' | 'day' | 'transition';

function getPhase(d: Date): TimeOfDayPhase {
  const h = d.getHours();
  if (h >= 20 || h < 5) return 'night';
  if (h >= 8 && h < 17) return 'day';
  return 'transition';
}

function nextBoundary(from: Date): Date {
  // Boundaries: 05, 08, 17, 20
  const boundaries = [5, 8, 17, 20];
  const d = new Date(from);
  for (const hour of boundaries) {
    if (from.getHours() < hour || (from.getHours() === hour && from.getMinutes() < 0)) {
      d.setHours(hour, 0, 0, 0);
      return d;
    }
  }
  // Next day 05:00
  d.setDate(d.getDate() + 1);
  d.setHours(5, 0, 0, 0);
  return d;
}

interface TimeOfDayThemeContextValue {
  phase: TimeOfDayPhase;
  refresh: () => void;
}

const TimeOfDayThemeContext = createContext<TimeOfDayThemeContextValue | undefined>(undefined);

export const TimeOfDayThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [phase, setPhase] = useState<TimeOfDayPhase>(() => getPhase(new Date()));
  const timeoutRef = useRef<number | null>(null);

  const schedule = () => {
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    const now = new Date();
    const target = nextBoundary(now);
    const delay = target.getTime() - now.getTime();
    timeoutRef.current = window.setTimeout(() => {
      setPhase(getPhase(new Date()));
      schedule();
    }, delay);
  };

  useEffect(() => {
    schedule();
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, []);

  const refresh = () => setPhase(getPhase(new Date()));

  return (
    <TimeOfDayThemeContext.Provider value={{ phase, refresh }}>
      <div className={`app-theme-wrapper theme-${phase}`}>{children}</div>
    </TimeOfDayThemeContext.Provider>
  );
};

export const useTimeOfDayTheme = () => {
  const ctx = useContext(TimeOfDayThemeContext);
  if (!ctx) throw new Error('useTimeOfDayTheme must be used within TimeOfDayThemeProvider');
  return ctx;
};
