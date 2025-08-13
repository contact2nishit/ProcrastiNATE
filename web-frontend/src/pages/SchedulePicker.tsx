import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { usePotentialScheduleContext } from '../context/PotentialScheduleContext';
import { useCurrentScheduleContext } from '../context/CurrentScheduleContext';

const SchedulePicker = () => {
    const navigate = useNavigate();
    const { currSchedule, setCurrSchedule, ensureScheduleRange, refetchSchedule } = useCurrentScheduleContext();
    const { potentialSchedules, setPotentialSchedules } = usePotentialScheduleContext();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedScheduleIdx, setSelectedScheduleIdx] = useState<number | null>(null);

    const mapStatus: { [key: string]: string } = {
        fully_scheduled: "Fully Scheduled",
        partially_scheduled: "Partially Scheduled",
        unschedulable: "Unschedulable",
    };

    // Use context for all data
    const parsedData: {
        conflicting_meetings?: string[];
        schedules?: {
            assignments: { name: string; schedule: { status: string; slots: { start: string; end: string }[] } }[];
            chores: { name: string; schedule: { status: string; slots: { start: string; end: string }[] } }[];
            conflicting_assignments: string[];
            conflicting_chores: string[];
            not_enough_time_assignments: string[];
            not_enough_time_chores: string[];
            total_potential_xp: number;
        }[];
        meetings?: { name: string; start_end_times: [string, string][] }[];
    } = potentialSchedules || {};

    const conflicting_meetings = parsedData.conflicting_meetings || [];
    const schedules = parsedData.schedules || [];
    const meetings = parsedData.meetings || [];

    const fmt = (iso: string) => new Date(iso).toLocaleString();

    const submitSchedule = async (schedule: any) => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token) {
                alert('Backend URL or token not set.');
                return;
            }
            const response = await fetch(`${url}/setSchedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(schedule),
            });
            if (!response.ok) {
                const err = await response.text();
                alert('Failed to set schedule: ' + err);
                return;
            }
            alert('Schedule set successfully!');
            setModalVisible(false);
            await refetchSchedule();
            navigate('/requiresCurrentSchedule/Home');
        } catch (e) {
            alert('Error setting schedule: ' + e);
        }
    };

    return (
        <div className="min-h-screen flex flex-col" style={{ 
            background: 'linear-gradient(135deg, #87CEEB 0%, #E0F6FF 30%, #B8E6FF 60%, #87CEEB 100%)',
            fontFamily: 'Pixelify Sans, monospace'
        }}>
            {/* Floating Clouds - Pixelated Style */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Large Pixelated Clouds */}
                <div className="absolute top-20 right-12 w-26 h-18 bg-white opacity-80 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '5s', clipPath: 'polygon(0 0, 8% 0, 8% 22%, 23% 22%, 23% 0, 69% 0, 69% 17%, 85% 17%, 85% 44%, 92% 44%, 92% 67%, 77% 67%, 77% 83%, 46% 83%, 46% 100%, 15% 100%, 15% 78%, 0 78%)' }}>
                    <div className="absolute top-2 left-6 w-18 h-14 bg-white" style={{ clipPath: 'polygon(0 0, 11% 0, 11% 29%, 33% 29%, 33% 0, 72% 0, 72% 21%, 89% 21%, 89% 64%, 67% 64%, 67% 100%, 22% 100%, 22% 71%, 0 71%)' }}></div>
                    <div className="absolute top-4 left-2 w-14 h-10 bg-white" style={{ clipPath: 'polygon(0 0, 14% 0, 14% 30%, 29% 30%, 29% 0, 79% 0, 79% 20%, 93% 20%, 93% 70%, 64% 70%, 64% 100%, 21% 100%, 21% 60%, 0 60%)' }}></div>
                </div>
                
                <div className="absolute top-36 left-16 w-22 h-14 bg-white opacity-75 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '4.5s', clipPath: 'polygon(0 0, 14% 0, 14% 29%, 27% 29%, 27% 0, 73% 0, 73% 21%, 86% 21%, 86% 57%, 100% 57%, 100% 79%, 73% 79%, 73% 100%, 27% 100%, 27% 71%, 0 71%)' }}>
                    <div className="absolute top-1 left-4 w-14 h-10 bg-white" style={{ clipPath: 'polygon(0 0, 14% 0, 14% 30%, 36% 30%, 36% 0, 79% 0, 79% 20%, 100% 20%, 100% 70%, 57% 70%, 57% 100%, 21% 100%, 21% 60%, 0 60%)' }}></div>
                </div>
                
                {/* Medium Pixelated Clouds */}
                <div className="absolute top-52 left-28 w-16 h-10 bg-white opacity-60 animate-pulse" style={{ animationDelay: '1.8s', animationDuration: '5.8s', clipPath: 'polygon(0 0, 13% 0, 13% 30%, 31% 30%, 31% 0, 69% 0, 69% 20%, 88% 20%, 88% 60%, 100% 60%, 100% 80%, 69% 80%, 69% 100%, 31% 100%, 31% 70%, 0 70%)' }}>
                    <div className="absolute top-1 left-2 w-10 h-6 bg-white" style={{ clipPath: 'polygon(0 0, 20% 0, 20% 33%, 40% 33%, 40% 0, 80% 0, 80% 17%, 100% 17%, 100% 67%, 60% 67%, 60% 100%, 20% 100%, 20% 67%, 0 67%)' }}></div>
                </div>
                
                <div className="absolute top-24 right-24 w-14 h-8 bg-white opacity-55 animate-pulse" style={{ animationDelay: '2.8s', animationDuration: '4.3s', clipPath: 'polygon(0 0, 14% 0, 14% 38%, 29% 38%, 29% 0, 71% 0, 71% 25%, 86% 25%, 86% 63%, 100% 63%, 100% 88%, 71% 88%, 71% 100%, 29% 100%, 29% 75%, 0 75%)' }}>
                    <div className="absolute top-1 left-1 w-8 h-4 bg-white" style={{ clipPath: 'polygon(0 0, 25% 0, 25% 50%, 50% 50%, 50% 0, 100% 0, 100% 75%, 50% 75%, 50% 100%, 0 100%)' }}></div>
                </div>
                
                {/* Small Pixelated Clouds */}
                <div className="absolute top-32 left-2/3 w-10 h-5 bg-white opacity-45 animate-pulse" style={{ animationDelay: '2.1s', animationDuration: '6.8s', clipPath: 'polygon(0 0, 20% 0, 20% 40%, 40% 40%, 40% 0, 80% 0, 80% 20%, 100% 20%, 100% 80%, 60% 80%, 60% 100%, 20% 100%, 20% 60%, 0 60%)' }}>
                    <div className="absolute top-0 left-1 w-5 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 40% 0, 40% 67%, 60% 67%, 60% 0, 100% 0, 100% 100%, 40% 100%, 40% 67%, 0 67%)' }}></div>
                </div>
                
                <div className="absolute top-12 right-1/3 w-8 h-4 bg-white opacity-48 animate-pulse" style={{ animationDelay: '1.2s', animationDuration: '5.1s', clipPath: 'polygon(0 0, 25% 0, 25% 50%, 50% 50%, 50% 0, 75% 0, 75% 25%, 100% 25%, 100% 75%, 75% 75%, 75% 100%, 25% 100%, 25% 75%, 0 75%)' }}>
                    <div className="absolute top-0 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>
            </div>

            <div className="relative z-10 flex-1 p-4">
                <h1 data-testid="schedule-picker-title" className="text-3xl font-bold text-teal-800 text-center my-6" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Pick a Schedule</h1>

                {conflicting_meetings.length > 0 && (
                    <div data-testid="conflicting-meetings-warning" className="bg-gradient-to-br from-red-200 to-red-300 rounded-3xl p-4 mb-4 border-4 border-orange-400 shadow-lg">
                        <h3 className="text-teal-800 font-bold text-lg mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Conflicting Meetings:</h3>
                        {conflicting_meetings.map((m: string, i: number) => (
                            <p key={i} data-testid={`conflicting-meeting-${i}`} className="text-teal-700 text-base font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{m}</p>
                        ))}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto space-y-4">
                    {schedules.map((schedule, idx: number) => (
                        <button
                            key={idx}
                            data-testid={`schedule-button-${idx + 1}`}
                            className="bg-gradient-to-br from-white to-gray-100 rounded-3xl p-6 w-full text-center hover:from-gray-100 hover:to-gray-200 transform hover:scale-105 transition-all duration-200 border-4 border-orange-400 shadow-lg"
                            onClick={() => {
                                setSelectedScheduleIdx(idx);
                                setModalVisible(true);
                            }}
                        >
                            <h3 className="text-2xl font-bold text-teal-800 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Schedule #{idx + 1}</h3>
                            <p className="text-base text-teal-700 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Tap to view details</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Modal */}
            {modalVisible && (
                <div data-testid="schedule-modal" className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-gradient-to-br from-white to-gray-100 rounded-3xl p-8 w-[90%] max-w-2xl max-h-[80%] overflow-y-auto border-4 border-orange-400 shadow-2xl">
                        {selectedScheduleIdx !== null && schedules[selectedScheduleIdx] && (
                            <>
                                <h2 data-testid="modal-schedule-title" className="text-3xl font-bold mb-6 text-teal-800" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Schedule #{selectedScheduleIdx + 1}</h2>
                                
                                <h3 data-testid="assignments-section" className="text-xl font-bold mt-6 mb-3 text-teal-800" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Assignments</h3>
                                {schedules[selectedScheduleIdx]?.assignments.length === 0 && (
                                    <p data-testid="assignments-none" className="text-teal-600 italic ml-2 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>None</p>
                                )}
                                {schedules[selectedScheduleIdx]?.assignments.map((a: any, i: number) => (
                                    <div key={i} data-testid={`assignment-item-${i}`} className="mb-4 p-4 bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-3xl border-4 border-orange-400 shadow-lg">
                                        <p className="font-bold text-lg text-teal-800 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{a.name}</p>
                                        <p className="text-teal-700 font-bold mb-1" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Status: {mapStatus[a.schedule.status]}</p>
                                        {a.schedule.slots.map((slot: { start: string; end: string }, j: number) => (
                                            <p key={j} className="text-base text-teal-700 ml-2 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                                                {fmt(slot.start)} - {fmt(slot.end)}
                                            </p>
                                        ))}
                                    </div>
                                ))}

                                <h3 data-testid="chores-section" className="text-xl font-bold mt-6 mb-3 text-teal-800" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Chores</h3>
                                {schedules[selectedScheduleIdx]?.chores.length === 0 && (
                                    <p data-testid="chores-none" className="text-teal-600 italic ml-2 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>None</p>
                                )}
                                {schedules[selectedScheduleIdx]?.chores.map((c: any, i: number) => (
                                    <div key={i} data-testid={`chore-item-${i}`} className="mb-4 p-4 bg-gradient-to-br from-green-200 to-green-300 rounded-3xl border-4 border-orange-400 shadow-lg">
                                        <p className="font-bold text-lg text-teal-800 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{c.name}</p>
                                        <p className="text-teal-700 font-bold mb-1" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Status: {mapStatus[c.schedule.status]}</p>
                                        {c.schedule.slots.map((slot: { start: string; end: string }, j: number) => (
                                            <p key={j} className="text-base text-teal-700 ml-2 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                                                {fmt(slot.start)} - {fmt(slot.end)}
                                            </p>
                                        ))}
                                    </div>
                                ))}

                                <h3 data-testid="conflicts-section" className="text-xl font-bold mt-6 mb-3 text-teal-800" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Conflicts</h3>
                                {schedules[selectedScheduleIdx]?.conflicting_assignments.length === 0 &&
                                 schedules[selectedScheduleIdx]?.conflicting_chores.length === 0 &&
                                 schedules[selectedScheduleIdx]?.not_enough_time_assignments.length === 0 &&
                                 schedules[selectedScheduleIdx]?.not_enough_time_chores.length === 0 && (
                                    <p data-testid="conflicts-none" className="text-teal-600 italic ml-2 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>None</p>
                                )}
                                {schedules[selectedScheduleIdx]?.conflicting_assignments.map((n: string, i: number) => (
                                    <p key={i} data-testid={`conflict-assignment-${i}`} className="text-red-700 text-base font-bold mb-1" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Assignment conflict: {n}</p>
                                ))}
                                {schedules[selectedScheduleIdx]?.conflicting_chores.map((n: string, i: number) => (
                                    <p key={i} data-testid={`conflict-chore-${i}`} className="text-red-700 text-base font-bold mb-1" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Chore conflict: {n}</p>
                                ))}
                                {schedules[selectedScheduleIdx]?.not_enough_time_assignments.map((n: string, i: number) => (
                                    <p key={i} data-testid={`not-enough-time-assignment-${i}`} className="text-red-700 text-base font-bold mb-1" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Not enough time for assignment: {n}</p>
                                ))}
                                {schedules[selectedScheduleIdx]?.not_enough_time_chores.map((n: string, i: number) => (
                                    <p key={i} data-testid={`not-enough-time-chore-${i}`} className="text-red-700 text-base font-bold mb-1" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Not enough time for chore: {n}</p>
                                ))}

                                <h3 data-testid="meetings-section" className="text-xl font-bold mt-6 mb-3 text-teal-800" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Meetings</h3>
                                {meetings.length === 0 && (
                                    <p data-testid="meetings-none" className="text-teal-600 italic ml-2 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>None</p>
                                )}
                                {meetings.map((m: { name: string; start_end_times: [string, string][] }, i: number) => (
                                    <div key={i} data-testid={`meeting-item-${i}`} className="mb-4 p-4 bg-gradient-to-br from-blue-200 to-blue-300 rounded-3xl border-4 border-orange-400 shadow-lg">
                                        <p className="font-bold text-lg text-teal-800 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>{m.name}</p>
                                        {m.start_end_times.map((pair: [string, string], j: number) => (
                                            <p key={j} className="text-base text-teal-700 ml-2 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                                                {fmt(pair[0])} - {fmt(pair[1])}
                                            </p>
                                        ))}
                                    </div>
                                ))}
                                
                                <p data-testid="potential-xp-display" className="font-bold text-xl text-teal-800 mb-6" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Potential XP: {schedules[selectedScheduleIdx]?.total_potential_xp}</p>
                                
                                <button
                                    data-testid="set-schedule-button"
                                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-full py-4 mt-6 w-full text-white font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                    onClick={() => schedules[selectedScheduleIdx] && submitSchedule(schedules[selectedScheduleIdx])}
                                >
                                    Set This Schedule
                                </button>
                            </>
                        )}
                        
                        <button
                            data-testid="view-potential-schedule-button"
                            className="bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 rounded-full py-4 mt-4 w-full text-white font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            onClick={() => {
                                setModalVisible(false);
                                navigate(`/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential?scheduleIdx=${selectedScheduleIdx}`);
                            }}
                        >
                            View Potential Schedule
                        </button>
                        
                        <button
                            data-testid="close-modal-button"
                            className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 rounded-full py-4 mt-4 w-full text-white font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            onClick={() => setModalVisible(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Go Back Button */}
            <div className="relative z-10 flex justify-center pb-10">
                <button
                    data-testid="go-back-button"
                    onClick={() => navigate(-1)}
                    className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl py-3 px-8 text-white font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                >
                    Go Back
                </button>
            </div>
        </div>
    );
}

export default SchedulePicker;