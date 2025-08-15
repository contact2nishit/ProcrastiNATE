import React, { useState, useEffect } from 'react';
import { formatTime, getWeekDaysFromDate, groupSlotsByDay, Slot } from '../calendarUtils';


type CalendarWeekViewProps = {
    slots: Slot[];
    loading?: boolean;
    initialReferenceDate?: Date;
    onReferenceDateChange?: (date: Date) => void;
    showMeetingActions?: boolean; // kept for backward compatibility
    onUpdateMeeting?: (meetingSlot: Slot) => void;
    onDeleteMeeting?: (meetingSlot: Slot) => void;
    onDeleteAssignment?: (assignmentSlot: Slot) => void;
    onRescheduleAssignment?: (assignmentSlot: Slot) => void;
    onDeleteChore?: (choreSlot: Slot) => void;
    onRescheduleChore?: (choreSlot: Slot) => void;
};

export default function CalendarWeekView({
    slots,
    loading = false,
    initialReferenceDate = new Date(),
    onReferenceDateChange,
    showMeetingActions = false, // not used anymore for gating buttons; callbacks presence decides
    onUpdateMeeting,
    onDeleteMeeting,
    onDeleteAssignment,
    onRescheduleAssignment,
    onDeleteChore,
    onRescheduleChore,
}: CalendarWeekViewProps) {
    const weekDays = getWeekDaysFromDate(initialReferenceDate);
    const groupedSlots = groupSlotsByDay(slots);
    const [selectedInfo, setSelectedInfo] = useState<{ slot: Slot; x: number; y: number } | null>(null);

    // Close on ESC only (removed global outside click to avoid premature closing)
    useEffect(() => {
        const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedInfo(null); };
        window.addEventListener('keydown', escHandler);
        return () => window.removeEventListener('keydown', escHandler);
    }, []);

    const goToPrevWeek = () => { const d = new Date(initialReferenceDate); d.setDate(d.getDate() - 7); onReferenceDateChange?.(d); };
    const goToNextWeek = () => { const d = new Date(initialReferenceDate); d.setDate(d.getDate() + 7); onReferenceDateChange?.(d); };
    const goToCurrentWeek = () => { onReferenceDateChange?.(new Date()); };

    const HOUR_HEIGHT = 60;
    const HOURS = Array.from({ length: 24 }, (_, i) => i);
    const dayHeights = 24 * HOUR_HEIGHT;

    const colorForSlot = (slot: Slot) => {
        if (slot.type === 'meeting') return 'bg-blue-600 text-white border-4 border-blue-800';
        if (slot.type === 'assignment') return 'bg-yellow-500 text-white border-4 border-yellow-700';
        if (slot.type === 'chore') return 'bg-green-600 text-white border-4 border-green-800';
        return 'bg-gray-800 text-white border-4 border-gray-600';
    };

    const renderEvent = (slot: Slot, idx: number) => {
        const startDate = new Date(slot.start);
        const endDate = new Date(slot.end);
        const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
        const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
        const duration = Math.max(endMinutes - startMinutes, 5);
        const top = (startMinutes / 60) * HOUR_HEIGHT;
        const height = (duration / 60) * HOUR_HEIGHT;
        return (
            <div
                key={idx}
                className={`absolute left-1 right-1 rounded-md shadow-md p-2 overflow-hidden text-xs md:text-sm ${colorForSlot(slot)} transition hover:brightness-110`}
                style={{ top, height, fontFamily: 'Pixelify Sans, monospace', cursor: 'pointer' }}
                onClick={(e) => {
                    e.stopPropagation();
                    console.log('Event clicked:', slot.name);
                    // Get the clicked element's position
                    const rect = e.currentTarget.getBoundingClientRect();
                    const popupWidth = 288; // w-72 = 18rem = 288px
                    const popupHeight = 300; // Estimated popup height
                    const padding = 8; // Padding from screen edges
                    // Get viewport dimensions
                    const viewportWidth = window.innerWidth;
                    const viewportHeight = window.innerHeight;
                    // Calculate initial position (to the right of the event)
                    let x = rect.right + 8; // 8px gap from the event
                    let y = rect.top;
                    // Adjust horizontal position if popup would go off-screen
                    if (x + popupWidth > viewportWidth - padding) {
                        // Position to the left of the event instead
                        x = rect.left - popupWidth - 8;
                    }
                    // If still off-screen on the left, center it on the event
                    if (x < padding) {
                        x = rect.left + (rect.width / 2) - (popupWidth / 2);
                        // If centering still goes off-screen, clamp to viewport
                        x = Math.max(padding, Math.min(x, viewportWidth - popupWidth - padding));
                    }
                    // Adjust vertical position if popup would go off-screen
                    if (y + popupHeight > viewportHeight - padding) {
                        // Position above the event instead
                        y = rect.bottom - popupHeight;
                    }
                    // If still off-screen at the top, position at top with padding
                    if (y < padding) {
                        y = padding;
                    }
                    console.log('Setting selectedInfo:', { slot: slot.name, x, y });
                    setSelectedInfo({ slot, x, y });
                }}
            >
                <div className="font-bold leading-tight truncate" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{slot.name}</div>
                <div className="opacity-90">{slot.type.toUpperCase()} • {formatTime(slot.start)} - {formatTime(slot.end)}</div>
            </div>
        );
    
    };

    const durationString = (slot: Slot) => {
        const start = new Date(slot.start).getTime();
        const end = new Date(slot.end).getTime();
        const mins = Math.max(1, Math.round((end - start) / 60000));
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60); const m = mins % 60; return m ? `${h}h ${m}m` : `${h}h`;
    };

    console.log('CalendarWeekView render, selectedInfo:', selectedInfo);
    console.log('Available slots:', slots.length);

    return (
        <div style={{ fontFamily: 'Pixelify Sans, monospace' }} className="min-h-screen relative overflow-hidden">
            {/* Removed local night sky background; global App background now applies */}
            <div className="relative z-10">
                {/* Week Navigation */}
                <div className="flex justify-between px-5 mb-4 items-center" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                    <button onClick={goToPrevWeek} className="bg-gradient-to-r from-teal-500 to-blue-600 py-3 px-6 rounded-full font-bold text-white hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg border-4 border-orange-400">Prev</button>
                    <button onClick={goToCurrentWeek} className="bg-transparent px-5 text-teal-300 font-bold text-xl hover:text-teal-100 transition-colors">Current Week</button>
                    <button onClick={goToNextWeek} className="bg-gradient-to-r from-teal-500 to-blue-600 py-3 px-6 rounded-full font-bold text-white hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg border-4 border-orange-400">Next</button>
                </div>
                {loading ? (
                    <div className="flex justify-center items-center mt-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-400"></div></div>
                ) : (
                    <div className="flex flex-col">
                        {/* Combined Day Headers and Calendar Grid */}
                        {/* Day headers row with left spacer for time labels */}
                        <div className="flex">
                            <div className="w-14" />
                            <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f97316 #374151' }}>
                                <div className="flex min-w-max">
                                    {weekDays.map((day, index) => (
                                        <div key={index} className="min-w-[14rem] text-center py-2 font-bold text-teal-300 border-r border-teal-700" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{day.label}</div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Grid row: left time labels and right scrollable calendar grid aligned */}
                        <div className="flex">
                            {/* Time Labels aligned with grid rows */}
                            <div className="w-14 border-r border-teal-700 bg-transparent flex flex-col select-none">
                                {HOURS.map(h => (
                                    <div key={h} className="relative text-right pr-1 border-t border-dashed border-teal-700 opacity-50" style={{ height: HOUR_HEIGHT, fontFamily: 'Pixelify Sans, monospace' }}>
                                        <span className="absolute top-0 right-1 -translate-y-1/2 text-xs text-teal-300 tracking-wide font-bold">{h.toString().padStart(2,'0')}:00</span>
                                    </div>
                                ))}
                            </div>
                            {/* Scrollable days grid */}
                            <div className="flex-1 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f97316 #374151' }}>
                                <div className="flex relative border-t border-teal-700">
                                    {weekDays.map((day, index) => {
                                        const events = groupedSlots[day.iso] || [];
                                        return (
                                            <div key={index} className="relative min-w-[14rem] border-r border-teal-700">
                                                <div className="relative" style={{ height: dayHeights }}>
                                                    {HOURS.map(h => (
                                                        <div key={h} className="absolute left-0 right-0 border-t border-dashed border-teal-700 opacity-50" style={{ top: h * HOUR_HEIGHT }} />
                                                    ))}
                                                    {events.map(renderEvent)}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {selectedInfo && (
                    <>
                        {/* Backdrop to close */}
                        <div className="fixed inset-0 z-40" onClick={() => setSelectedInfo(null)} />
                        <div
                            id="calendar-slot-popup"
                            className="fixed z-50 w-72 max-w-xs bg-gradient-to-br from-gray-800 to-gray-900 text-white rounded-3xl shadow-2xl border-4 border-orange-400 p-6"
                            style={{ top: selectedInfo.y, left: selectedInfo.x, fontFamily: 'Pixelify Sans, monospace' }}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-lg pr-2 truncate text-teal-300" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{selectedInfo.slot.name}</h4>
                                <button className="text-gray-400 hover:text-gray-200 text-lg font-bold" onClick={() => setSelectedInfo(null)}>✕</button>
                            </div>
                            <div className="text-sm inline-block mb-3 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold tracking-wide border-2 border-orange-400" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{selectedInfo.slot.type.toUpperCase()}</div>
                            <div className="text-sm space-y-2 mb-4" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                                <div><span className="text-teal-400 font-bold">Start:</span> <span className="text-white font-bold">{formatTime(selectedInfo.slot.start)}</span></div>
                                <div><span className="text-teal-400 font-bold">End:</span> <span className="text-white font-bold">{formatTime(selectedInfo.slot.end)}</span></div>
                                <div><span className="text-teal-400 font-bold">Duration:</span> <span className="text-white font-bold">{durationString(selectedInfo.slot)}</span></div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {selectedInfo.slot.type === 'meeting' && (onUpdateMeeting || onDeleteMeeting) && (
                                    <>
                                        {onUpdateMeeting && <button onClick={() => { onUpdateMeeting(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white text-sm font-bold py-2 px-3 rounded-full border-2 border-orange-400 transform hover:scale-105 transition-all duration-200" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Update</button>}
                                        {onDeleteMeeting && <button onClick={() => { onDeleteMeeting(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold py-2 px-3 rounded-full border-2 border-orange-400 transform hover:scale-105 transition-all duration-200" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Delete</button>}
                                    </>
                                )}
                                {selectedInfo.slot.type === 'assignment' && (onRescheduleAssignment || onDeleteAssignment) && (
                                    <>
                                        {onRescheduleAssignment && <button onClick={() => { onRescheduleAssignment(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white text-sm font-bold py-2 px-3 rounded-full border-2 border-orange-400 transform hover:scale-105 transition-all duration-200" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Reschedule</button>}
                                        {onDeleteAssignment && <button onClick={() => { onDeleteAssignment(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold py-2 px-3 rounded-full border-2 border-orange-400 transform hover:scale-105 transition-all duration-200" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Delete</button>}
                                    </>
                                )}
                                {selectedInfo.slot.type === 'chore' && (onRescheduleChore || onDeleteChore) && (
                                    <>
                                        {onRescheduleChore && <button onClick={() => { onRescheduleChore(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white text-sm font-bold py-2 px-3 rounded-full border-2 border-orange-400 transform hover:scale-105 transition-all duration-200" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Reschedule</button>}
                                        {onDeleteChore && <button onClick={() => { onDeleteChore(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-bold py-2 px-3 rounded-full border-2 border-orange-400 transform hover:scale-105 transition-all duration-200" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Delete</button>}
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}


export {};