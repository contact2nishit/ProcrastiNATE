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
            {/* Enhanced Night Sky Background with Stars, Pixelated Clouds and Moon */}
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 30%, #0f3460 60%, #1a1a2e 100%)' }}>
                {/* Pixel Stars using box-shadow to keep crisp pixels */}
                <div className="absolute inset-0 overflow-hidden">
                    {/* One base pixel generates a starfield via box-shadows (fast and crisp) */}
                    <div
                        className="absolute"
                        style={{
                            top: '0',
                            left: '0',
                            width: '2px',
                            height: '2px',
                            background: 'white',
                            imageRendering: 'pixelated',
                            boxShadow: `
                              50px 80px #ffffff, 120px 40px #ffffff, 200px 140px #ffffff, 300px 70px #ffffff,
                              420px 20px #ffffff, 520px 110px #ffffff, 640px 60px #ffffff, 760px 130px #ffffff,
                              880px 30px #ffffff, 960px 100px #ffffff, 1080px 50px #ffffff, 1180px 150px #ffffff,
                              70px 220px #ffffff, 240px 260px #ffffff, 360px 200px #ffffff, 480px 230px #ffffff,
                              600px 180px #ffffff, 720px 260px #ffffff, 840px 210px #ffffff, 980px 240px #ffffff,
                              1100px 190px #ffffff, 1230px 230px #ffffff, 1300px 170px #ffffff, 1400px 260px #ffffff`
                        }}
                    />
                    {/* Smaller dim stars */}
                    <div
                        className="absolute"
                        style={{
                            top: '0',
                            left: '0',
                            width: '1px',
                            height: '1px',
                            background: 'rgba(255,255,255,0.7)',
                            imageRendering: 'pixelated',
                            boxShadow: `
                              30px 50px #ffffffb3, 90px 30px #ffffffb3, 160px 120px #ffffffb3, 260px 40px #ffffffb3,
                              380px 90px #ffffffb3, 480px 20px #ffffffb3, 580px 140px #ffffffb3, 700px 60px #ffffffb3,
                              820px 100px #ffffffb3, 940px 40px #ffffffb3, 1060px 130px #ffffffb3, 1160px 70px #ffffffb3`
                        }}
                    />
                </div>

                {/* Pixelated Clouds */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute top-10 left-10 w-32 h-20 bg-gray-300 opacity-20 animate-pulse" style={{ 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(0% 50%, 20% 20%, 40% 30%, 60% 10%, 80% 25%, 100% 40%, 90% 70%, 70% 80%, 50% 75%, 30% 85%, 10% 75%)', 
                        animationDuration: '6s',
                        filter: 'contrast(1.2)'
                    }}></div>
                    <div className="absolute top-32 right-16 w-28 h-16 bg-gray-300 opacity-15 animate-pulse" style={{ 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(0% 60%, 15% 25%, 35% 35%, 55% 15%, 75% 30%, 100% 45%, 85% 75%, 65% 85%, 45% 80%, 25% 90%, 5% 80%)', 
                        animationDuration: '8s',
                        filter: 'contrast(1.2)'
                    }}></div>
                    <div className="absolute top-64 left-1/4 w-36 h-24 bg-gray-300 opacity-18 animate-pulse" style={{ 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(0% 55%, 18% 22%, 38% 32%, 58% 12%, 78% 28%, 100% 42%, 88% 72%, 68% 82%, 48% 77%, 28% 87%, 8% 77%)', 
                        animationDuration: '7s',
                        filter: 'contrast(1.2)'
                    }}></div>
                    <div className="absolute top-96 right-1/3 w-24 h-14 bg-gray-300 opacity-12 animate-pulse" style={{ 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(0% 65%, 22% 30%, 42% 40%, 62% 20%, 82% 35%, 100% 50%, 85% 80%, 65% 90%, 45% 85%, 25% 95%, 5% 85%)', 
                        animationDuration: '9s',
                        filter: 'contrast(1.2)'
                    }}></div>
                    <div className="absolute bottom-32 left-16 w-40 h-28 bg-gray-300 opacity-16 animate-pulse" style={{ 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(0% 50%, 20% 18%, 40% 28%, 60% 8%, 80% 23%, 100% 38%, 85% 68%, 65% 78%, 45% 73%, 25% 83%, 5% 73%)', 
                        animationDuration: '6.5s',
                        filter: 'contrast(1.2)'
                    }}></div>
                    <div className="absolute bottom-64 right-20 w-26 h-16 bg-gray-300 opacity-14 animate-pulse" style={{ 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(0% 55%, 24% 25%, 44% 35%, 64% 15%, 84% 30%, 100% 45%, 82% 75%, 62% 85%, 42% 80%, 22% 90%, 2% 80%)', 
                        animationDuration: '8.5s',
                        filter: 'contrast(1.2)'
                    }}></div>
                </div>

                {/* Pixelated Moon */}
                <div className="absolute top-16 right-20 w-20 h-20 opacity-80" style={{ 
                    imageRendering: 'pixelated',
                    background: 'conic-gradient(from 45deg, #fef3c7, #fde68a, #fcd34d, #f59e0b, #fde68a, #fef3c7)',
                    borderRadius: '50%',
                    boxShadow: '0 0 30px rgba(255, 255, 255, 0.3), inset -8px -8px 0px rgba(0, 0, 0, 0.1)',
                    filter: 'contrast(1.1) brightness(1.1)'
                }}>
                    {/* Pixelated Moon craters */}
                    <div className="absolute top-2 left-3 w-3 h-3 opacity-50" style={{ 
                        background: '#e5e7eb', 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                    }}></div>
                    <div className="absolute top-6 right-4 w-2 h-2 opacity-40" style={{ 
                        background: '#e5e7eb', 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)'
                    }}></div>
                    <div className="absolute bottom-4 left-6 w-4 h-4 opacity-30" style={{ 
                        background: '#e5e7eb', 
                        imageRendering: 'pixelated',
                        clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)'
                    }}></div>
                    <div className="absolute top-10 left-2 w-2 h-2 opacity-25" style={{ 
                        background: '#e5e7eb', 
                        imageRendering: 'pixelated'
                    }}></div>
                    <div className="absolute top-3 right-2 w-1 h-1 opacity-35" style={{ 
                        background: '#e5e7eb', 
                        imageRendering: 'pixelated'
                    }}></div>
                </div>
            </div>

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
                        <div className="flex">
                            <div className="w-14" />
                            <div className="flex-1 overflow-x-auto" style={{
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#f97316 #374151'
                            }}>
                                <div className="flex min-w-max">
                                    {weekDays.map((day, index) => (
                                        <div key={index} className="min-w-[14rem] text-center py-2 font-bold text-teal-300 border-r border-teal-700" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{day.label}</div>
                                    ))}
                                </div>
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
                        {/* Time Labels */}
                        <div className="absolute left-0 top-20 w-14 border-r border-teal-700 bg-transparent flex flex-col select-none z-20">
                            {HOURS.map(h => (
                                <div key={h} className="relative text-right pr-1" style={{ height: HOUR_HEIGHT, fontFamily: 'Pixelify Sans, monospace' }}>
                                    <span className="absolute top-0 right-1 -translate-y-1/2 text-xs text-teal-300 tracking-wide font-bold">{h.toString().padStart(2,'0')}:00</span>
                                </div>
                            ))}
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