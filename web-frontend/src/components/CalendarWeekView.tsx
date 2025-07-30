import React from 'react';
import { formatTime, getWeekDaysFromDate, groupSlotsByDay, Slot } from '../calendarUtils';


type CalendarWeekViewProps = {
    slots: Slot[];
    loading?: boolean;
    initialReferenceDate?: Date;
    onReferenceDateChange?: (date: Date) => void;
    showMeetingActions?: boolean;
    onUpdateMeeting?: (meetingSlot: Slot) => void;
    onDeleteMeeting?: (meetingSlot: Slot) => void;
}

export default function CalendarWeekView({
    slots,
    loading = false,
    initialReferenceDate = new Date(),
    onReferenceDateChange,
    showMeetingActions = false,
    onUpdateMeeting,
    onDeleteMeeting,
}: CalendarWeekViewProps) {
    const weekDays = getWeekDaysFromDate(initialReferenceDate);
    const groupedSlots = groupSlotsByDay(slots);

    const goToPrevWeek = () => {
        const newDate = new Date(initialReferenceDate);
        newDate.setDate(newDate.getDate() - 7);
        onReferenceDateChange?.(newDate);
    };
    const goToNextWeek = () => {
        const newDate = new Date(initialReferenceDate);
        newDate.setDate(newDate.getDate() + 7);
        onReferenceDateChange?.(newDate);
    };
    const goToCurrentWeek = () => {
        onReferenceDateChange?.(new Date());
    };

    return (
        <div>
            {/* Week Navigation */}
            <div className="flex justify-between px-5 mb-4 items-center">
                <button
                    onClick={goToPrevWeek}
                    className="bg-green-500 py-2 px-5 rounded font-bold text-gray-900 hover:bg-green-600 transition"
                >
                    Prev
                </button>
                <button
                    onClick={goToCurrentWeek}
                    className="bg-transparent px-5 text-green-500 font-bold"
                >
                    Current Week
                </button>
                <button
                    onClick={goToNextWeek}
                    className="bg-green-500 py-2 px-5 rounded font-bold text-gray-900 hover:bg-green-600 transition"
                >
                    Next
                </button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center mt-10">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                </div>
            ) : (
                <div className="flex overflow-x-auto">
                    {weekDays.map((day, index) => (
                        <div
                            key={index}
                            className="w-96 min-w-[22rem] p-3 border-r border-gray-700"
                        >
                            <div className="text-lg font-semibold text-green-500 mb-3">{day.label}</div>
                            <div className="max-h-[400px] overflow-y-auto mb-2">
                                {(groupedSlots[day.iso] || []).map((slot, idx) => (
                                    <div key={idx} className="bg-gray-800 p-3 rounded-lg mt-3">
                                        <div className="text-base font-bold text-white">{slot.name}</div>
                                        <div className="text-sm text-gray-300 mt-1">
                                            {slot.type.toUpperCase()} • {formatTime(slot.start)} - {formatTime(slot.end)}
                                        </div>
                                        {slot.type === 'meeting' && showMeetingActions && (
                                            <div className="flex flex-row mt-2 gap-2">
                                                <button
                                                    onClick={() => onUpdateMeeting?.(slot)}
                                                    className="bg-blue-600 rounded px-3 py-2 text-white font-bold mr-2 hover:bg-blue-700 transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => onDeleteMeeting?.(slot)}
                                                    className="bg-red-600 rounded px-3 py-2 text-white font-bold hover:bg-red-700 transition"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}



// Stylesheet removed; all styling is now done via Tailwind CSS classes

export {};