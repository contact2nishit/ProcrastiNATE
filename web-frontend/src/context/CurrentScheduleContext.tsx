import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Slot } from '../calendarUtils';
import config from '../config';

export type CurrentSchedule = {
	slots: Slot[];
	startTime: string; // this denotes the start of the period whose current schedule slots is filled with
	// the time interval is meant to be extended and used by multiple components
	endTime: string;
};

type LevelInfo = { 
	xp: number; 
	level: number; 
	user_name: string;
	xpForNextLevel: number;
};

type CurrentScheduleContextType = {
    currSchedule: CurrentSchedule;
    setCurrSchedule: React.Dispatch<React.SetStateAction<CurrentSchedule>>;
    ensureScheduleRange: (start: string, end: string) => Promise<void>;
    refetchSchedule: () => Promise<void>;
    levelInfo: LevelInfo;
    refreshLevelInfo: () => Promise<void>;
};

const CurrentScheduleContext = createContext<CurrentScheduleContextType | undefined>(undefined);

export const CurrentScheduleProvider = ({ children }: { children: ReactNode }) => {
    const [currentSchedule, setCurrentSchedule] = useState<CurrentSchedule>({
		slots: [],
		startTime: "",
		endTime: "",
    });
	const [levelInfo, setLevelInfo] = useState<LevelInfo>({
		xp: 0,
		level: 0,
		user_name: "unknown",
		xpForNextLevel: 0,
	});
    const fetchScheduleForRange = async (start: string, end: string): Promise<Slot[]> => {
		const url = config.backendURL;
		const token = localStorage.getItem('token');
		if (!url || !token) throw new Error('Missing backend URL or token');
		const params = `start_time=${encodeURIComponent(start)}&end_time=${encodeURIComponent(end)}&meetings=true&assignments=true&chores=true`;
		const response = await fetch(`${url}/fetch?${params}`, {
			method: 'GET',
			credentials: 'include',
			headers: { 
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json',
			},
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

	/**
	 * Refresh the user's level info with a call to the backend
	 */
	const refreshLevelInfo = async () => {
		
	};

    // Ensures the context covers at least [start, end] (expands if needed)
    const ensureScheduleRange = async (start: string, end: string) => {
		if (!currentSchedule.startTime || !currentSchedule.endTime) {
			try {
				const slots = await fetchScheduleForRange(start, end);
				setCurrentSchedule({ slots, startTime: start, endTime: end });
			} catch (e) {
				console.error('Unable to fetch schedule');
			}
			return;
		}
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
			console.error('Unable to fetch schedule');
		}
    };

    // Refetch for the current context range (used after update/delete/reschedule/sync)
    const refetchSchedule = async () => {
		if (!currentSchedule.startTime || !currentSchedule.endTime) return;
		try {
			const slots = await fetchScheduleForRange(currentSchedule.startTime, currentSchedule.endTime);
			setCurrentSchedule({ ...currentSchedule, slots });
		} catch (e) {
			console.error('Unable to fetch schedule');
		}
    };

    return (
		<CurrentScheduleContext.Provider value={{ currSchedule: currentSchedule, setCurrSchedule: setCurrentSchedule, ensureScheduleRange, refetchSchedule,  }}>
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