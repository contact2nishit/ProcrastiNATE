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
    const [showInfo, setShowInfo] = useState(false);
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

    const InfoModal: React.FC<{ show: boolean; onClose: () => void; }> = ({ show, onClose }) => {
        if (!show) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="relative rounded-3xl p-6 w-full max-w-lg border-4 border-orange-400 shadow-xl bg-gradient-to-br from-white to-gray-100" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                    <h3 className="text-2xl font-bold text-teal-800 mb-4">Schedule Picker</h3>
                    <p className="text-teal-800 text-lg leading-snug">Pick a schedule you like. The higher up a schedule in this list, the more likely it is to give you higher amounts of XP</p>
                    <button
                        onClick={onClose}
                        className="mt-6 w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold py-2 px-4 rounded-2xl hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >Close</button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col relative" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
            <InfoModal show={showInfo} onClose={() => setShowInfo(false)} />
            {/* Removed per-page background & clouds; using global App background */}
            <div className="relative z-10 flex-1 p-4">
                <h1 data-testid="schedule-picker-title" className="text-3xl font-bold text-teal-800 text-center my-6 relative" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                    <button
                        type="button"
                        aria-label="Schedule picker information"
                        onClick={() => setShowInfo(true)}
                        className="absolute left-0 -top-2 w-9 h-9 flex items-center justify-center rounded-full bg-gray-300 text-teal-900 font-extrabold border-2 border-gray-400 shadow hover:scale-110 hover:bg-gray-400 transition"
                    >?
                    </button>
                    Pick a Schedule
                </h1>

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
                    onClick={() => navigate("/requiresCurrentSchedule/Home")}
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