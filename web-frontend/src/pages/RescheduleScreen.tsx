import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePotentialScheduleContext } from '../context/PotentialScheduleContext';
import config from '../config';

const RescheduleScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    const effortParam = searchParams.get('effort');
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const { setPotentialSchedules } = usePotentialScheduleContext();

    const [newEffort, setNewEffort] = useState<number>(effortParam ? Number(effortParam) : 0);
    const [windowStart, setWindowStart] = useState<string>(startParam || new Date().toISOString().slice(0, 16));
    const [windowEnd, setWindowEnd] = useState<string>(endParam || new Date().toISOString().slice(0, 16));
    const [allowOverlaps, setAllowOverlaps] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token) {
                alert('Missing backend URL or token.');
                return;
            }

            const tz_offset_minutes = -new Date().getTimezoneOffset();
            const body: any = {
                event_type: type,
                id,
                allow_overlaps: allowOverlaps,
                tz_offset_minutes,
            };

            if (type === 'assignment') {
                body.new_window_end = new Date(windowEnd).toISOString();
            } else if (type === 'chore') {
                body.new_effort = newEffort;
                body.new_window_start = new Date(windowStart).toISOString();
                body.new_window_end = new Date(windowEnd).toISOString();
            }

            const response = await fetch(`${url}/reschedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.text();
                alert('Failed to reschedule: ' + err);
                return;
            }

            const data = await response.json();
            setPotentialSchedules(data);
            alert('Rescheduled successfully!');
            navigate('/requiresCurrentSchedule/requiresPotentialSchedule/schedulePicker');
        } catch (e) {
            alert('Failed to reschedule: ' + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center bg-white p-6">
            <form className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 flex flex-col gap-4" onSubmit={handleSubmit}>
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
                    Reschedule {type === 'assignment' ? 'Assignment' : 'Chore'}
                </h2>

                {(type === 'assignment' || type === 'chore') && (
                    <>
                        <label className="text-base text-gray-700 font-medium">Remaining Effort (minutes):</label>
                        <input
                            className="border border-gray-300 rounded px-3 py-2 text-base text-gray-800 focus:outline-none"
                            type="number"
                            min={0}
                            value={newEffort}
                            onChange={e => setNewEffort(Number(e.target.value))}
                            placeholder="Enter remaining effort in minutes"
                        />
                    </>
                )}

                {type === 'chore' && (
                    <>
                        <label className="text-base text-gray-700 font-medium">Window Start:</label>
                        <input
                            className="border border-gray-300 rounded px-3 py-2 text-base text-gray-800 focus:outline-none"
                            type="datetime-local"
                            value={windowStart}
                            onChange={e => setWindowStart(e.target.value)}
                        />
                    </>
                )}

                <label className="text-base text-gray-700 font-medium">
                    {type === 'assignment' ? 'Due Date:' : 'Window End:'}
                </label>
                <input
                    className="border border-gray-300 rounded px-3 py-2 text-base text-gray-800 focus:outline-none"
                    type="datetime-local"
                    value={windowEnd}
                    onChange={e => setWindowEnd(e.target.value)}
                />

                <div className="flex items-center gap-2 mt-2">
                    <label className="text-base text-gray-700 font-medium">Allow overlaps with current occurrences?</label>
                    <input
                        type="checkbox"
                        checked={allowOverlaps}
                        onChange={e => setAllowOverlaps(e.target.checked)}
                        className="w-5 h-5"
                    />
                </div>

                <button
                    type="submit"
                    className={`bg-blue-600 text-white py-3 px-8 rounded-lg text-lg font-medium mt-4 hover:bg-blue-700 transition ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
                <button
                    type="button"
                    className="bg-gray-400 text-white py-3 px-8 rounded-lg text-lg font-medium mt-2 hover:bg-gray-500 transition"
                    onClick={() => navigate(-1)}
                >
                    Cancel
                </button>
            </form>
        </div>
    );
};

export default RescheduleScreen;
