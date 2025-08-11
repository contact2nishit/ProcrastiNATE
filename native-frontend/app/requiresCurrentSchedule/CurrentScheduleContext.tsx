import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Slot } from '../calendarUtils';

export type CurrentSchedule = {
	slots: Slot[];
	startTime: string; // this denotes the start of the period whose current schedule slots is filled with
	// the time interval is meant to be extended and used by multiple components
	endTime: string;
};

type CurrentScheduleContextType = {
    currSchedule: CurrentSchedule;
    setCurrSchedule: React.Dispatch<React.SetStateAction<CurrentSchedule>>;
    ensureScheduleRange: (start: string, end: string) => Promise<void>;
    refetchSchedule: () => Promise<void>;
};

const CurrentScheduleContext = createContext<CurrentScheduleContextType | undefined>(undefined);

export const CurrentScheduleProvider = ({ children }: { children: ReactNode }) => {
    const [currentSchedule, setCurrentSchedule] = useState<CurrentSchedule>({
	slots: [],
	startTime: "",
	endTime: "",
    });

    // Helper to fetch schedule for a given range
    const fetchScheduleForRange = async (start: string, end: string): Promise<Slot[]> => {
	// Use dynamic import to avoid circular dependency
	const config = (await import('../config')).default;
	const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
	const url = config.backendURL;
	const token = await AsyncStorage.getItem('token');
	if (!url || !token) throw new Error('Missing backend URL or token');
	const params = `start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}&meetings=true&assignments=true&chores=true`;
	const response = await fetch(`${url}/fetch?${params}`, {
	    method: 'GET',
	    headers: { 'Authorization': `Bearer ${token}` },
	});
	if (!response.ok) throw new Error(await response.text());
	const data = await response.json();
	const slots: Slot[] = [];
	if (data.meetings) {
	    for (const m of data.meetings) {
		m.start_end_times.forEach((pair: [string, string], idx: number) => {
		    slots.push({
			type: 'meeting',
			name: m.name,
			start: pair[0],
			end: pair[1],
			id: m.ocurrence_ids?.[idx] ?? idx,
			meeting_id: m.meeting_id,
			occurence_id: m.ocurrence_ids?.[idx] ?? idx,
		    });
		});
	    }
	}
	if (data.assignments) {
	    for (const a of data.assignments) {
		if (a.schedule && a.schedule.slots) {
		    a.schedule.slots.forEach((slot: any, idx: number) => {
			slots.push({
			    type: 'assignment',
			    name: a.name,
			    start: slot.start,
			    end: slot.end,
			    id: `assignment_${a.assignment_id}_${a.ocurrence_ids?.[idx] ?? idx}`,
			    completed: a.completed?.[idx] ?? false,
			    assignment_id: a.assignment_id,
			    occurence_id: a.ocurrence_ids?.[idx] ?? idx,
			});
		    });
		}
	    }
	}
	if (data.chores) {
	    for (const c of data.chores) {
		if (c.schedule && c.schedule.slots) {
		    c.schedule.slots.forEach((slot: any, idx: number) => {
			slots.push({
			    type: 'chore',
			    name: c.name,
			    start: slot.start,
			    end: slot.end,
			    id: `chore_${c.chore_id}_${c.ocurrence_ids?.[idx] ?? idx}`,
			    completed: c.completed?.[idx] ?? false,
			    chore_id: c.chore_id,
			    occurence_id: c.ocurrence_ids?.[idx] ?? idx,
			});
		    });
		}
	    }
	}
	slots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
	return slots;
    };

    // Ensures the context covers at least [start, end] (expands if needed)
    const ensureScheduleRange = async (start: string, end: string) => {
	// If context is empty, fetch for [start, end]
	if (!currentSchedule.startTime || !currentSchedule.endTime) {
	    try {
		const slots = await fetchScheduleForRange(start, end);
		setCurrentSchedule({ slots, startTime: start, endTime: end });
	    } catch (e) {
		// keep current state on error
	    }
	    return;
	}
	// If context already covers the range, do nothing
	if (currentSchedule.startTime <= start && currentSchedule.endTime >= end) {
	    return;
	}
	// Expand to union of current and requested range
	const newStart = currentSchedule.startTime < start ? currentSchedule.startTime : start;
	const newEnd = currentSchedule.endTime > end ? currentSchedule.endTime : end;
	try {
	    const slots = await fetchScheduleForRange(newStart, newEnd);
	    setCurrentSchedule({ slots, startTime: newStart, endTime: newEnd });
	} catch (e) {
	    // keep current state on error
	}
    };

    // Refetch for the current context range (used after update/delete/reschedule/sync)
    const refetchSchedule = async () => {
	if (!currentSchedule.startTime || !currentSchedule.endTime) return;
	try {
	    const slots = await fetchScheduleForRange(currentSchedule.startTime, currentSchedule.endTime);
	    setCurrentSchedule({ ...currentSchedule, slots });
	} catch (e) {
	    // keep current state on error
	}
    };

    return (
	<CurrentScheduleContext.Provider value={{ currSchedule: currentSchedule, setCurrSchedule: setCurrentSchedule, ensureScheduleRange, refetchSchedule }}>
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