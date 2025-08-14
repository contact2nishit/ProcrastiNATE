import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Slot } from '../calendarUtils';
import config from '../config';
// Badge components
import BadgeFirstTimer from '../assets/first-timer';
import BadgeGettingTheHangOfIt from '../assets/getting-the-hang-of-it';
import BadgeEarlyBird from '../assets/early-bird';
import BadgeNightOwl from '../assets/night-owl';
import BadgeWeekendWarrior from '../assets/weekend-warrior';
import BadgeSevenDayStreak from '../assets/seven-day-streak';
import BadgeDailyGrinder from '../assets/daily-grinder';
import BadgeConsistencyKing from '../assets/consistency-king';
import BadgeHumbleBeginner from '../assets/humble-beginner';
import BadgeMakingProgress from '../assets/making-progress';
import BadgeMotivated from '../assets/motivated';
import BadgeHardWorker from '../assets/hard-worker';
import BadgeGrinderExpert from '../assets/grinder-expert';
import BadgeLegendOfGrinding from '../assets/legend-of-grinding';
import BadgePowerHour from '../assets/power-hour';
import BadgeFocusBeast from '../assets/focus-beast';
import TaskSlayerBadge from '../assets/task-slayer';
import HomeHeroBadge from '../assets/home-hero';
import RedemptionBadge from '../assets/redemption';
import SleepIsForTheWeakBadge from '../assets/sleep-is-for-the-weak';

export type CurrentSchedule = {
	slots: Slot[];
	startTime: string; // this denotes the start of the period whose current schedule slots is filled with
	// the time interval is meant to be extended and used by multiple components
	endTime: string;
};

type LevelInfo = { 
	xp: number; 
	level: number; 
	username: string;
	xpForNextLevel: number;
	achievements: any; 
};

type CurrentScheduleContextType = {
    currSchedule: CurrentSchedule;
    setCurrSchedule: React.Dispatch<React.SetStateAction<CurrentSchedule>>;
    ensureScheduleRange: (start: string, end: string) => Promise<void>;
    refetchSchedule: () => Promise<void>;
    levelInfo: LevelInfo;
    refreshLevelInfo: () => Promise<void>;
	getBadgeComponent: (achievementName: string) => React.ReactNode;
	achievementKeys: string[];
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
		username: "unknown",
		xpForNextLevel: 0,
		achievements: {},
	});

	// Canonical achievement keys used across the app
	const achievementKeys: string[] = [
		'first_timer',
		'getting_the_hang_of_it',
		'early_bird',
		'night_owl',
		'weekend_warrior',
		'seven_day_streak',
		'daily_grinder',
		'consistency_king',
		'humble_beginner',
		'making_progress',
		'motivated',
		'hard_worker',
		'grinder_expert',
		'legend_of_grinding',
		'power_hour',
		'focus_beast',
		'task_slayer_1',
		'task_slayer_2',
		'task_slayer_3',
		'task_slayer_4',
		'task_slayer_5',
		'home_hero_1',
		'home_hero_2',
		'home_hero_3',
		'home_hero_4',
		'home_hero_5',
		'redemption',
		'sleep_is_for_the_weak',
	];

	const getBadgeComponent = (achievementName: string): React.ReactNode => {
		switch (achievementName) {
			case 'first_timer':
				return <BadgeFirstTimer />;
			case 'getting_the_hang_of_it':
				return <BadgeGettingTheHangOfIt />;
			case 'early_bird':
				return <BadgeEarlyBird />;
			case 'night_owl':
				return <BadgeNightOwl />;
			case 'weekend_warrior':
				return <BadgeWeekendWarrior />;
			case 'seven_day_streak':
				return <BadgeSevenDayStreak />;
			case 'daily_grinder':
				return <BadgeDailyGrinder />;
			case 'consistency_king':
				return <BadgeConsistencyKing />;
			case 'humble_beginner':
				return <BadgeHumbleBeginner />;
			case 'making_progress':
				return <BadgeMakingProgress />;
			case 'motivated':
				return <BadgeMotivated />;
			case 'hard_worker':
				return <BadgeHardWorker />;
			case 'grinder_expert':
				return <BadgeGrinderExpert />;
			case 'legend_of_grinding':
				return <BadgeLegendOfGrinding />;
			case 'power_hour':
				return <BadgePowerHour />;
			case 'focus_beast':
				return <BadgeFocusBeast />;
			case 'task_slayer':
			case 'task_slayer_1':
				return <TaskSlayerBadge variant={1} />;
			case 'task_slayer_2':
				return <TaskSlayerBadge variant={2} />;
			case 'task_slayer_3':
				return <TaskSlayerBadge variant={3} />;
			case 'task_slayer_4':
				return <TaskSlayerBadge variant={4} />;
			case 'task_slayer_5':
				return <TaskSlayerBadge variant={5} />;
			case 'home_hero':
			case 'home_hero_1':
				return <HomeHeroBadge variant={1} />;
			case 'home_hero_2':
				return <HomeHeroBadge variant={2} />;
			case 'home_hero_3':
				return <HomeHeroBadge variant={3} />;
			case 'home_hero_4':
				return <HomeHeroBadge variant={4} />;
			case 'home_hero_5':
				return <HomeHeroBadge variant={5} />;
			case 'redemption':
				return <RedemptionBadge />;
			case 'sleep_is_for_the_weak':
				return <SleepIsForTheWeakBadge />;
			default:
				return null;
		}
	};
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
		try {
			const resp = await fetch(`${config.backendURL}/getLevel`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem("token")}`,
                    'Content-Type': 'application/json',
                },
            });
			if(!resp.ok) {
				alert("Server returned invalid response");
				return;
			}
			const jason = await resp.json();
			setLevelInfo({
				achievements: jason.achievements,
				level: jason.level,
				xpForNextLevel: jason.xp_for_next_level,
				username: jason.user_name,
				xp: jason.xp,
			});
		} catch(e) {
			console.error(`Failed to refresh level info: ${e}`)
		}
	};
	useEffect(() => { 
		refreshLevelInfo()
	}, []);
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
		<CurrentScheduleContext.Provider value={{ currSchedule: currentSchedule, setCurrSchedule: setCurrentSchedule, ensureScheduleRange, refetchSchedule, levelInfo, refreshLevelInfo, getBadgeComponent, achievementKeys }}>
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