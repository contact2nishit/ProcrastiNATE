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