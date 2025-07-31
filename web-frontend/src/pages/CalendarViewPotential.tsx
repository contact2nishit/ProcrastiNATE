import React, { useState } from 'react';
import { Slot, getStartOfWeek } from '../calendarUtils';
import CalendarWeekView from '../components/CalendarWeekView';
import { usePotentialScheduleContext } from '../context/PotentialScheduleContext';
import { useSearchParams } from 'react-router-dom';

const CalendarViewPotential = () => {
    const [searchParams] = useSearchParams();
    const scheduleIdx = searchParams.get('scheduleIdx') ?? '0';
    const { potentialSchedules } = usePotentialScheduleContext();
    const [referenceDate, setReferenceDate] = useState(new Date());
    const extractSlots = (scheduleIdx: number): Slot[] => {
        const allSlots: Slot[] = [];
        const schedule = potentialSchedules.schedules?.[scheduleIdx];
        if (!schedule) {
            return allSlots;
        }
        // Assignments
        if (Array.isArray(schedule.assignments)) {
            for (const assignment of schedule.assignments) {
                if (assignment.schedule) {
                    for (const slot of assignment.schedule.slots) {
                        allSlots.push({
                            name: assignment.name,
                            type: 'assignment',
                            start: slot.start,
                            end: slot.end,
                        });
                    }
                }
            }
        }
        // Chores
        if (Array.isArray(schedule.chores)) {
            for (const chore of schedule.chores) {
                if (chore.schedule && Array.isArray(chore.schedule.slots)) {
                    for (const slot of chore.schedule.slots) {
                        allSlots.push({
                            name: chore.name,
                            type: 'chore',
                            start: slot.start,
                            end: slot.end,
                        });
                    }
                }
            }
        }
        // No meetings in potential schedules
        return allSlots;
    };

    return (
        <div className="min-h-screen bg-gray-900 pt-8">
            <h1 className="text-3xl font-bold text-white text-center mb-6 mt-5">Schedule #{scheduleIdx}</h1>
            <CalendarWeekView
                slots={extractSlots(Number(scheduleIdx))}
                showMeetingActions={false}
                initialReferenceDate={getStartOfWeek(referenceDate)}
                onReferenceDateChange={setReferenceDate}
            />
            <div className="flex-1" />
            <button
                className="bg-white w-44 h-10 flex items-center justify-center rounded-lg mt-8 mb-12 mx-auto font-semibold text-lg"
                onClick={() => window.history.back()}
            >
                Back
            </button>
        </div>
    );
};

// Stylesheet removed; all styling is now done via Tailwind CSS classes

export default CalendarViewPotential;