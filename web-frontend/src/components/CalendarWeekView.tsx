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
        if (slot.type === 'meeting') return 'bg-blue-600 text-white';
        if (slot.type === 'assignment') return 'bg-yellow-500 text-white';
        if (slot.type === 'chore') return 'bg-green-600 text-white';
        return 'bg-gray-800 text-white';
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
                    // Simple fixed position to guarantee visibility
                    const x = 100;
                    const y = 100;
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
        <div style={{ fontFamily: 'Pixelify Sans, monospace' }}>
            {/* Week Navigation */}
            <div className="flex justify-between px-5 mb-4 items-center" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                <button onClick={goToPrevWeek} className="bg-green-500 py-2 px-5 rounded font-bold text-gray-900 hover:bg-green-600 transition">Prev</button>
                <button onClick={goToCurrentWeek} className="bg-transparent px-5 text-green-500 font-bold">Current Week</button>
                <button onClick={goToNextWeek} className="bg-green-500 py-2 px-5 rounded font-bold text-gray-900 hover:bg-green-600 transition">Next</button>
            </div>
            {loading ? (
                <div className="flex justify-center items-center mt-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div></div>
            ) : (
                <div className="flex flex-col">
                    <div className="flex">
                        <div className="w-14" />
                        <div className="flex overflow-x-auto flex-1">
                            {weekDays.map((day, index) => (
                                <div key={index} className="flex-1 min-w-[14rem] text-center py-2 font-bold text-green-500 border-r border-gray-700">{day.label}</div>
                            ))}
                        </div>
                    </div>
                    <div className="flex relative">
                        <div className="w-14 border-r border-gray-700 bg-gray-900 flex flex-col select-none sticky left-0 top-0 z-20">
                            {HOURS.map(h => (
                                <div key={h} className="relative text-right pr-1" style={{ height: HOUR_HEIGHT }}>
                                    <span className="absolute top-0 right-1 -translate-y-1/2 text-[10px] text-gray-300 tracking-wide">{h.toString().padStart(2,'0')}:00</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex overflow-x-auto flex-1 border-t border-gray-700">
                            {weekDays.map((day, index) => {
                                const events = groupedSlots[day.iso] || [];
                                return (
                                    <div key={index} className="relative flex-1 border-r border-gray-700 min-w-[14rem]">
                                        <div className="relative" style={{ height: dayHeights }}>
                                            {HOURS.map(h => (
                                                <div key={h} className="absolute left-0 right-0 border-t border-dashed border-gray-700" style={{ top: h * HOUR_HEIGHT }} />
                                            ))}
                                            {events.map(renderEvent)}
                                        </div>
                                    </div>
                                );
                            })}
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
                        className="fixed z-50 w-72 max-w-xs bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 p-4"
                        style={{ top: selectedInfo.y, left: selectedInfo.x }}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-sm pr-2 truncate">{selectedInfo.slot.name}</h4>
                            <button className="text-gray-400 hover:text-gray-200 text-xs" onClick={() => setSelectedInfo(null)}>✕</button>
                        </div>
                        <div className="text-[10px] inline-block mb-2 px-2 py-0.5 rounded bg-gray-700 tracking-wide">{selectedInfo.slot.type.toUpperCase()}</div>
                        <div className="text-xs space-y-1 mb-3">
                            <div><span className="text-gray-400">Start:</span> {formatTime(selectedInfo.slot.start)}</div>
                            <div><span className="text-gray-400">End:</span> {formatTime(selectedInfo.slot.end)}</div>
                            <div><span className="text-gray-400">Duration:</span> {durationString(selectedInfo.slot)}</div>
                            {selectedInfo.slot.meeting_id && <div><span className="text-gray-400">Meeting ID:</span> {selectedInfo.slot.meeting_id}</div>}
                            {selectedInfo.slot.assignment_id && <div><span className="text-gray-400">Assignment ID:</span> {selectedInfo.slot.assignment_id}</div>}
                            {selectedInfo.slot.chore_id && <div><span className="text-gray-400">Chore ID:</span> {selectedInfo.slot.chore_id}</div>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {selectedInfo.slot.type === 'meeting' && (onUpdateMeeting || onDeleteMeeting) && (
                                <>
                                    {onUpdateMeeting && <button onClick={() => { onUpdateMeeting(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">Update</button>}
                                    {onDeleteMeeting && <button onClick={() => { onDeleteMeeting(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">Delete</button>}
                                </>
                            )}
                            {selectedInfo.slot.type === 'assignment' && (onRescheduleAssignment || onDeleteAssignment) && (
                                <>
                                    {onRescheduleAssignment && <button onClick={() => { onRescheduleAssignment(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">Reschedule</button>}
                                    {onDeleteAssignment && <button onClick={() => { onDeleteAssignment(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">Delete</button>}
                                </>
                            )}
                            {selectedInfo.slot.type === 'chore' && (onRescheduleChore || onDeleteChore) && (
                                <>
                                    {onRescheduleChore && <button onClick={() => { onRescheduleChore(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-1 px-2 rounded">Reschedule</button>}
                                    {onDeleteChore && <button onClick={() => { onDeleteChore(selectedInfo.slot); setSelectedInfo(null); }} className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-1 px-2 rounded">Delete</button>}
                                </>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export {};