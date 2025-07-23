import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Slot } from '../../calendarUtils';


export type AssignmentPotential = {
  name: string;
  deadline: string;
  effort: number;
  schedule: {
    status: string;
    effort_assigned: number;
    slots: Slot[];
  };
};

export type ChorePotential = {
  name: string;
  windowStart: string;
  windowEnd: string;
  effort: number;
  schedule: {
    status: string;
    effort_assigned: number;
    slots: Slot[];
  };
};

export type MeetingPotential = {
  name: string;
  start_end_times: [string, string][];
  link_or_loc: string | null;
};

export type PotentialSchedule = {
  assignments: AssignmentPotential[];
  chores: ChorePotential[];
  conflicting_assignments: string[];
  conflicting_chores: string[];
  not_enough_time_assignments: string[];
  not_enough_time_chores: string[];
  total_potential_xp: number;
};

export type PotentialSchedulesData = {
  schedules: PotentialSchedule[];
  meetings: MeetingPotential[];
  conflicting_meetings: string[];
};


export type PotentialScheduleContextType = {
  potentialSchedules: PotentialSchedulesData | null;
  setPotentialSchedules: (data: PotentialSchedulesData) => void;
  clearPotentialSchedules: () => void;
};

const PotentialScheduleContext = createContext<PotentialScheduleContextType | undefined>(undefined);

export const PotentialScheduleProvider = ({ children }: { children: ReactNode }) => {
  const [potentialSchedules, setPotentialSchedulesState] = useState<PotentialSchedulesData | null>(null);

  const setPotentialSchedules = (data: PotentialSchedulesData) => {
    setPotentialSchedulesState(data);
  };

  const clearPotentialSchedules = () => {
    setPotentialSchedulesState(null);
  };

  return (
    <PotentialScheduleContext.Provider
      value={{
        potentialSchedules,
        setPotentialSchedules,
        clearPotentialSchedules,
      }}
    >
      {children}
    </PotentialScheduleContext.Provider>
  );
};

export const usePotentialScheduleContext = () => {
  const ctx = useContext(PotentialScheduleContext);
  if (!ctx) {
    throw new Error('usePotentialScheduleContext must be used within PotentialScheduleProvider');
  }
  return ctx;
};