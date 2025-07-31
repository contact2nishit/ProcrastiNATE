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
        <div className="flex-1 bg-black p-2.5 min-h-screen">
            <h1 className="text-3xl font-bold text-white text-center my-5">Pick a Schedule</h1>

            {conflicting_meetings.length > 0 && (
                <div className="bg-red-100 rounded-lg p-2.5 mb-2.5">
                    <h3 className="text-red-800 font-bold text-base">Conflicting Meetings:</h3>
                    {conflicting_meetings.map((m: string, i: number) => (
                        <p key={i} className="text-red-800 text-sm">{m}</p>
                    ))}
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {schedules.map((schedule, idx: number) => (
                    <button
                        key={idx}
                        className="bg-white rounded-lg p-5 my-2.5 w-full text-center hover:bg-gray-100 transition-colors"
                        onClick={() => {
                            setSelectedScheduleIdx(idx);
                            setModalVisible(true);
                        }}
                    >
                        <h3 className="text-xl font-bold text-black">Schedule #{idx + 1}</h3>
                        <p className="text-sm text-gray-600 mt-1.5">Tap to view details</p>
                    </button>
                ))}
            </div>

            {/* Modal */}
            {modalVisible && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-5 w-[90%] max-w-2xl max-h-[80%] overflow-y-auto">
                        {selectedScheduleIdx !== null && schedules[selectedScheduleIdx] && (
                            <>
                                <h2 className="text-2xl font-bold mb-2.5 text-black">Schedule #{selectedScheduleIdx + 1}</h2>
                                
                                <h3 className="text-lg font-bold mt-4 text-gray-800">Assignments</h3>
                                {schedules[selectedScheduleIdx]?.assignments.length === 0 && (
                                    <p className="text-gray-500 italic ml-2">None</p>
                                )}
                                {schedules[selectedScheduleIdx]?.assignments.map((a: any, i: number) => (
                                    <div key={i} className="mb-2.5 p-2 bg-gray-100 rounded-md">
                                        <p className="font-bold text-base text-gray-800">{a.name}</p>
                                        <p>Status: {mapStatus[a.schedule.status]}</p>
                                        {a.schedule.slots.map((slot: { start: string; end: string }, j: number) => (
                                            <p key={j} className="text-sm text-gray-600 ml-2">
                                                {fmt(slot.start)} - {fmt(slot.end)}
                                            </p>
                                        ))}
                                    </div>
                                ))}

                                <h3 className="text-lg font-bold mt-4 text-gray-800">Chores</h3>
                                {schedules[selectedScheduleIdx]?.chores.length === 0 && (
                                    <p className="text-gray-500 italic ml-2">None</p>
                                )}
                                {schedules[selectedScheduleIdx]?.chores.map((c: any, i: number) => (
                                    <div key={i} className="mb-2.5 p-2 bg-gray-100 rounded-md">
                                        <p className="font-bold text-base text-gray-800">{c.name}</p>
                                        <p>Status: {mapStatus[c.schedule.status]}</p>
                                        {c.schedule.slots.map((slot: { start: string; end: string }, j: number) => (
                                            <p key={j} className="text-sm text-gray-600 ml-2">
                                                {fmt(slot.start)} - {fmt(slot.end)}
                                            </p>
                                        ))}
                                    </div>
                                ))}

                                <h3 className="text-lg font-bold mt-4 text-gray-800">Conflicts</h3>
                                {schedules[selectedScheduleIdx]?.conflicting_assignments.length === 0 &&
                                 schedules[selectedScheduleIdx]?.conflicting_chores.length === 0 &&
                                 schedules[selectedScheduleIdx]?.not_enough_time_assignments.length === 0 &&
                                 schedules[selectedScheduleIdx]?.not_enough_time_chores.length === 0 && (
                                    <p className="text-gray-500 italic ml-2">None</p>
                                )}
                                {schedules[selectedScheduleIdx]?.conflicting_assignments.map((n: string, i: number) => (
                                    <p key={i} className="text-red-800 text-sm">Assignment conflict: {n}</p>
                                ))}
                                {schedules[selectedScheduleIdx]?.conflicting_chores.map((n: string, i: number) => (
                                    <p key={i} className="text-red-800 text-sm">Chore conflict: {n}</p>
                                ))}
                                {schedules[selectedScheduleIdx]?.not_enough_time_assignments.map((n: string, i: number) => (
                                    <p key={i} className="text-red-800 text-sm">Not enough time for assignment: {n}</p>
                                ))}
                                {schedules[selectedScheduleIdx]?.not_enough_time_chores.map((n: string, i: number) => (
                                    <p key={i} className="text-red-800 text-sm">Not enough time for chore: {n}</p>
                                ))}

                                <h3 className="text-lg font-bold mt-4 text-gray-800">Meetings</h3>
                                {meetings.length === 0 && (
                                    <p className="text-gray-500 italic ml-2">None</p>
                                )}
                                {meetings.map((m: { name: string; start_end_times: [string, string][] }, i: number) => (
                                    <div key={i} className="mb-2.5 p-2 bg-gray-100 rounded-md">
                                        <p className="font-bold text-base text-gray-800">{m.name}</p>
                                        {m.start_end_times.map((pair: [string, string], j: number) => (
                                            <p key={j} className="text-sm text-gray-600 ml-2">
                                                {fmt(pair[0])} - {fmt(pair[1])}
                                            </p>
                                        ))}
                                    </div>
                                ))}
                                
                                <p className="font-bold text-base text-gray-800">Potential XP: {schedules[selectedScheduleIdx]?.total_potential_xp}</p>
                                
                                <button
                                    className="bg-green-600 hover:bg-green-700 rounded-lg py-3 mt-5 w-full text-white font-bold text-base transition-colors"
                                    onClick={() => schedules[selectedScheduleIdx] && submitSchedule(schedules[selectedScheduleIdx])}
                                >
                                    Set This Schedule
                                </button>
                            </>
                        )}
                        
                        <button
                            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 mt-5 w-full text-white font-bold text-base transition-colors"
                            onClick={() => {
                                setModalVisible(false);
                                navigate(`/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential?scheduleIdx=${selectedScheduleIdx}`);
                            }}
                        >
                            View Potential Schedule
                        </button>
                        
                        <button
                            className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 mt-5 w-full text-white font-bold text-base transition-colors"
                            onClick={() => setModalVisible(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Go Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="bg-white self-center w-36 h-9 mb-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
                <span className="text-lg font-extralight text-black">Go Back</span>
            </button>
        </div>
    );
}

export default SchedulePicker;