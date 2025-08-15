import React, { useState } from 'react';
import { Slot, getStartOfWeek } from '../calendarUtils';
import CalendarWeekView from '../components/CalendarWeekView';
import { usePotentialScheduleContext } from '../context/PotentialScheduleContext';
import { useSearchParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const CalendarViewPotential = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
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
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                fontFamily: 'Pixelify Sans, monospace',
            }}
        >
            {Number(scheduleIdx) > 0 && (
                <button
                    data-testid="prev-schedule-button"
                    className="absolute top-4 left-4 z-20 bg-gradient-to-r from-teal-500 to-blue-600 py-2 px-4 rounded-full font-bold text-white hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg border-4 border-orange-400"
                    onClick={() => navigate(`/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential?scheduleIdx=${Number(scheduleIdx) - 1}`)}
                >
                    Previous
                </button>
            )}
            {Number(scheduleIdx) < 10 && (
                <button
                    data-testid="next-schedule-button"
                    className="absolute top-4 right-4 z-20 bg-gradient-to-r from-teal-500 to-blue-600 py-2 px-4 rounded-full font-bold text-white hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg border-4 border-orange-400"
                    onClick={() => navigate(`/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential?scheduleIdx=${Number(scheduleIdx) + 1}`)}
                >
                    Next
                </button>
            )}
            <div className="relative pt-8">
                <h1 className="text-4xl font-bold text-teal-300 text-center mb-6 mt-5" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Schedule #{scheduleIdx}</h1>
                <CalendarWeekView
                    slots={extractSlots(Number(scheduleIdx))}
                    showMeetingActions={false}
                    initialReferenceDate={getStartOfWeek(referenceDate)}
                    onReferenceDateChange={setReferenceDate}
                />
                <div className="flex-1" />
                <button
                    data-testid="back-to-schedule-picker"
                    className="w-56 h-10 flex items-center justify-center rounded-lg mt-8 mb-12 mx-auto font-semibold text-lg border-4 border-orange-400 hover:border-orange-300 transition"
                    style={{ 
                        background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', 
                        fontFamily: 'Pixelify Sans, monospace',
                        color: 'white'
                    }}
                    onClick={() => navigate('/requiresCurrentSchedule/requiresPotentialSchedule/schedulePicker')}
                >
                    Back to Schedule Picker
                </button>
            </div>
        </div>
    );
};

// Stylesheet removed; all styling is now done via Tailwind CSS classes

export default CalendarViewPotential;