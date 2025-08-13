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
        <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #87CEEB 0%, #E0F6FF 30%, #B8E6FF 60%, #87CEEB 100%)' }}>
            {/* Pixelated Clouds */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-10 left-10 w-32 h-20 bg-white opacity-80 animate-float-slow" style={{ clipPath: 'polygon(0% 50%, 20% 20%, 40% 30%, 60% 10%, 80% 25%, 100% 40%, 90% 70%, 70% 80%, 50% 75%, 30% 85%, 10% 75%)' }}></div>
                <div className="absolute top-32 right-16 w-28 h-16 bg-white opacity-70 animate-float-medium" style={{ clipPath: 'polygon(0% 60%, 15% 25%, 35% 35%, 55% 15%, 75% 30%, 100% 45%, 85% 75%, 65% 85%, 45% 80%, 25% 90%, 5% 80%)' }}></div>
                <div className="absolute top-64 left-1/4 w-36 h-24 bg-white opacity-75 animate-float-fast" style={{ clipPath: 'polygon(0% 55%, 18% 22%, 38% 32%, 58% 12%, 78% 28%, 100% 42%, 88% 72%, 68% 82%, 48% 77%, 28% 87%, 8% 77%)' }}></div>
                <div className="absolute top-96 right-1/3 w-24 h-14 bg-white opacity-65 animate-float-slow" style={{ clipPath: 'polygon(0% 65%, 22% 30%, 42% 40%, 62% 20%, 82% 35%, 100% 50%, 85% 80%, 65% 90%, 45% 85%, 25% 95%, 5% 85%)' }}></div>
                <div className="absolute top-20 right-1/4 w-30 h-18 bg-white opacity-60 animate-float-medium" style={{ clipPath: 'polygon(0% 45%, 25% 15%, 45% 25%, 65% 5%, 85% 20%, 100% 35%, 80% 65%, 60% 75%, 40% 70%, 20% 80%, 0% 70%)' }}></div>
                <div className="absolute bottom-32 left-16 w-40 h-28 bg-white opacity-70 animate-float-fast" style={{ clipPath: 'polygon(0% 50%, 20% 18%, 40% 28%, 60% 8%, 80% 23%, 100% 38%, 85% 68%, 65% 78%, 45% 73%, 25% 83%, 5% 73%)' }}></div>
                <div className="absolute bottom-64 right-20 w-26 h-16 bg-white opacity-65 animate-float-slow" style={{ clipPath: 'polygon(0% 55%, 24% 25%, 44% 35%, 64% 15%, 84% 30%, 100% 45%, 82% 75%, 62% 85%, 42% 80%, 22% 90%, 2% 80%)' }}></div>
            </div>

            {/* Ray Effect */}
            <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.3) 55%, transparent 100%)' }}></div>

            <div className="relative z-10 min-h-screen flex flex-col justify-center items-center p-6">
                <form className="w-full max-w-md bg-gradient-to-br from-white to-gray-100 rounded-3xl shadow-2xl p-8 flex flex-col gap-6 border-4 border-orange-400" onSubmit={handleSubmit}>
                    <h2 className="text-3xl font-bold text-center text-teal-800 mb-4" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                        Reschedule {type === 'assignment' ? 'Assignment' : 'Chore'}
                    </h2>

                {(type === 'assignment' || type === 'chore') && (
                    <>
                        <label className="text-lg text-teal-800 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Remaining Effort (minutes):</label>
                        <input
                            className="border-4 border-orange-400 rounded-2xl px-4 py-3 text-lg text-teal-800 font-bold focus:outline-none focus:border-orange-500 bg-white shadow-lg"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
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
                        <label className="text-lg text-teal-800 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Window Start:</label>
                        <input
                            className="border-4 border-orange-400 rounded-2xl px-4 py-3 text-lg text-teal-800 font-bold focus:outline-none focus:border-orange-500 bg-white shadow-lg"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            type="datetime-local"
                            value={windowStart}
                            onChange={e => setWindowStart(e.target.value)}
                        />
                    </>
                )}

                <label className="text-lg text-teal-800 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                    {type === 'assignment' ? 'Due Date:' : 'Window End:'}
                </label>
                <input
                    className="border-4 border-orange-400 rounded-2xl px-4 py-3 text-lg text-teal-800 font-bold focus:outline-none focus:border-orange-500 bg-white shadow-lg"
                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                    type="datetime-local"
                    value={windowEnd}
                    onChange={e => setWindowEnd(e.target.value)}
                />

                <div className="flex items-center gap-3 mt-2">
                    <label className="text-lg text-teal-800 font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Allow overlaps with current occurrences?</label>
                    <input
                        type="checkbox"
                        checked={allowOverlaps}
                        onChange={e => setAllowOverlaps(e.target.checked)}
                        className="w-6 h-6 accent-orange-400"
                    />
                </div>

                <button
                    type="submit"
                    className={`bg-gradient-to-r from-teal-500 to-blue-600 text-white py-4 px-8 rounded-full text-xl font-bold mt-6 hover:from-teal-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
                <button
                    type="button"
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white py-4 px-8 rounded-full text-xl font-bold mt-3 hover:from-gray-600 hover:to-gray-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                    onClick={() => navigate(-1)}
                >
                    Cancel
                </button>
            </form>
        </div>
    </div>
    );
};

export default RescheduleScreen;
