import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Slot } from '../calendarUtils';

export type CurrentSchedule = {
    slots: Slot[];
    startTime: string; // this denotes the start of the period whose current schedule slots is filled with
    endTime: string;
};

type CurrentScheduleContextType = {
	currSchedule: CurrentSchedule;
	setCurrSchedule: React.Dispatch<React.SetStateAction<CurrentSchedule>>;
};

const CurrentScheduleContext = createContext<CurrentScheduleContextType | undefined>(undefined);

export const CurrentScheduleProvider = ({ children }: { children: ReactNode }) => {
	const [currentSchedule, setCurrentSchedule] = useState<CurrentSchedule>(
		{
			slots: [],
			startTime: "",
			endTime: "",
		}
	);

	return (
		<CurrentScheduleContext.Provider value={{ currSchedule: currentSchedule, setCurrSchedule: setCurrentSchedule }}>
			{children}
		</CurrentScheduleContext.Provider>
	);
};

export const useCurrentScheduleContext = () => {
  const context = useContext(CurrentScheduleContext);
  if (!context) {
	throw new Error('useCurrentScheduleContext must be used within a CurrentScheduleProvider');
  }
  return context;
};