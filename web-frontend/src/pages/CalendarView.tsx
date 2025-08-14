import React, { useEffect, useState } from 'react';
import { Slot, getStartOfWeek } from '../calendarUtils';
import CalendarWeekView from '../components/CalendarWeekView';
import config from '../config';
import { useCurrentScheduleContext } from '../context/CurrentScheduleContext';
import { useNavigate } from 'react-router-dom';


const CalendarView = () => {
    const { currSchedule, setCurrSchedule, ensureScheduleRange, refetchSchedule } = useCurrentScheduleContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [referenceDate, setReferenceDate] = useState(new Date()); // controls the week shown
    // Modal state for meeting update/delete
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'update' | 'delete' | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
    const [updateName, setUpdateName] = useState('');
    const [updateLoc, setUpdateLoc] = useState('');
    const [updateTime, setUpdateTime] = useState('');

    // Use context to ensure we have the week's schedule
    const fetchSchedule = async () => {
        try {
            setLoading(true);
            const weekStart = getStartOfWeek(referenceDate);
            const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
            const startISO = weekStart.toISOString().replace('Z', '+00:00');
            const endISO = weekEnd.toISOString().replace('Z', '+00:00');
            await ensureScheduleRange(startISO, endISO);
        } catch (e) {
            // handle error
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedule();
    }, [referenceDate]);

    // Meeting update/delete handlers (same as Home.tsx)
    const handleUpdateMeeting = async () => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token || !selectedMeeting) return;
            const body: any = {
                future_occurences: false,
                meeting_id: selectedMeeting.meeting_id,
                ocurrence_id: selectedMeeting.occurence_id,
            };
            if (updateName) body.new_name = updateName;
            if (updateLoc) body.new_loc_or_link = updateLoc;
            if (updateTime) body.new_time = updateTime;
            const response = await fetch(`${url}/update`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const err = await response.text();
                window.alert('Failed to update meeting: ' + err);
                return;
            }
            window.alert('Meeting updated!');
            setModalVisible(false);
            setUpdateName('');
            setUpdateLoc('');
            setUpdateTime('');
            setSelectedMeeting(null);
            await refetchSchedule();
            await fetchSchedule();
        } catch (e) {
            window.alert('Failed to update meeting: ' + e);
        }
    };

    const handleDeleteMeeting = async (removeAllFuture = false) => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token || !selectedMeeting) return;
            const body = {
                occurence_id: selectedMeeting.occurence_id,
                meeting_id: selectedMeeting.meeting_id,
                remove_all_future: removeAllFuture,
            };
            const response = await fetch(`${url}/delete`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const err = await response.text();
                window.alert('Failed to delete meeting: ' + err);
                return;
            }
            window.alert(removeAllFuture ? 'All future occurrences deleted!' : 'Meeting deleted!');
            setModalVisible(false);
            setSelectedMeeting(null);
            await refetchSchedule();
            await fetchSchedule();
        } catch (e) {
            window.alert('Failed to delete meeting: ' + e);
        }
    };

    // Assignment / Chore helpers
    const deleteAssignmentOrChore = async (slot: Slot, type: 'assignment' | 'chore') => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token) return;
            const body = {
                occurence_id: slot.occurence_id ?? (() => { const parts = (slot.id as any)?.toString().split('_'); return Number(parts[parts.length - 1]); })(),
                remove_all_future: false,
                event_type: type,
            };
            const response = await fetch(`${url}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(body),
            });
            if (!response.ok) {
                const err = await response.text();
                window.alert(`Failed to delete ${type}: ` + err);
                return;
            }
            window.alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted!`);
            await refetchSchedule();
            await fetchSchedule();
        } catch (e) {
            window.alert('Delete error: ' + e);
        }
    };

    const rescheduleAssignmentOrChore = (slot: Slot, type: 'assignment' | 'chore') => {
        const idParts = (slot.id as any).toString().split('_');
        const entityId = Number(idParts[1]);
        const label = type === 'assignment' ? 'Reschedule Assignment' : 'Reschedule Chore';
        navigate(`/requiresCurrentSchedule/requiresPotentialSchedule/RescheduleScreen?id=${entityId}&type=${type}&effort=${(slot as any).effort ?? ''}&start=${slot.start}&end=${slot.end}&label=${label}`);
    };

    // Filter slots for the current week from context
    const weekStart = getStartOfWeek(referenceDate);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const startISO = weekStart.toISOString().replace('Z', '+00:00');
    const endISO = weekEnd.toISOString().replace('Z', '+00:00');
    const slots = currSchedule.slots.filter((slot: Slot) => slot.start >= startISO && slot.end <= endISO);

    return (
        <div
            className="min-h-screen relative overflow-hidden"
            style={{
                // Removed page-specific background; using global App background
                fontFamily: 'Pixelify Sans, monospace',
            }}
        >
            <div className="relative pt-8">
                <h1 className="text-4xl font-bold text-teal-300 text-center mb-6 mt-5" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Weekly Calendar</h1>

                <CalendarWeekView
                    slots={slots}
                    loading={loading}
                    showMeetingActions={true}
                    initialReferenceDate={getStartOfWeek(referenceDate)}
                    onReferenceDateChange={setReferenceDate}
                    onUpdateMeeting={(slot: Slot) => {
                        setModalType('update');
                        setSelectedMeeting(slot);
                        setUpdateName('');
                        setUpdateLoc('');
                        setUpdateTime('');
                        setModalVisible(true);
                    }}
                    onDeleteMeeting={(slot: Slot) => {
                        setModalType('delete');
                        setSelectedMeeting(slot);
                        setModalVisible(true);
                    }}
                    onDeleteAssignment={(slot: Slot) => deleteAssignmentOrChore(slot, 'assignment')}
                    onRescheduleAssignment={(slot: Slot) => rescheduleAssignmentOrChore(slot, 'assignment')}
                    onDeleteChore={(slot: Slot) => deleteAssignmentOrChore(slot, 'chore')}
                    onRescheduleChore={(slot: Slot) => rescheduleAssignmentOrChore(slot, 'chore')}
                />

                {/* Meeting Update/Delete Modal*/}
                {modalVisible && (
                    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
                        <div className="bg-gray-800 rounded-lg p-8 w-full max-w-md shadow-lg border-4 border-orange-400" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            {modalType === 'update' && (
                                <>
                                    <h2 className="text-xl font-bold text-teal-300 mb-4" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Update Meeting</h2>
                                    <input
                                        className="bg-gray-700 text-white p-3 rounded mb-3 w-full border-2 border-teal-400" style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                        placeholder="New Name"
                                        value={updateName}
                                        onChange={e => setUpdateName(e.target.value)}
                                    />
                                    <input
                                        className="bg-gray-700 text-white p-3 rounded mb-3 w-full border-2 border-teal-400" style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                        placeholder="New Location/Link"
                                        value={updateLoc}
                                        onChange={e => setUpdateLoc(e.target.value)}
                                    />
                                    <input
                                        className="bg-gray-700 text-white p-3 rounded mb-3 w-full border-2 border-teal-400" style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                        placeholder="New Start Time (YYYY-MM-DDTHH:MM:SS+00:00)"
                                        value={updateTime}
                                        onChange={e => setUpdateTime(e.target.value)}
                                    />
                                    <button
                                        className="w-full mt-2 px-4 py-2 rounded font-bold transition border-4 border-orange-400 hover:border-orange-300"
                                        style={{ 
                                            background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', 
                                            fontFamily: 'Pixelify Sans, monospace',
                                            color: 'white'
                                        }}
                                        onClick={handleUpdateMeeting}
                                    >
                                        Submit Update
                                    </button>
                                </>
                            )}
                            {modalType === 'delete' && (
                                <>
                                    <h2 className="text-xl font-bold text-teal-300 mb-4" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Delete Meeting</h2>
                                    <p className="text-gray-200 mb-4" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Are you sure you want to delete this meeting occurrence?</p>
                                    <button
                                        className="w-full mb-2 px-4 py-2 rounded font-bold transition border-4 border-orange-400 hover:border-orange-300"
                                        style={{ 
                                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                                            fontFamily: 'Pixelify Sans, monospace',
                                            color: 'white'
                                        }}
                                        onClick={() => handleDeleteMeeting(false)}
                                    >
                                        Delete This Occurrence
                                    </button>
                                    <button
                                        className="w-full mb-2 px-4 py-2 rounded font-bold transition border-4 border-orange-400 hover:border-orange-300"
                                        style={{ 
                                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', 
                                            fontFamily: 'Pixelify Sans, monospace',
                                            color: 'white'
                                        }}
                                        onClick={() => handleDeleteMeeting(true)}
                                    >
                                        Delete All Future Occurrences
                                    </button>
                                </>
                            )}
                            <button
                                className="w-full mt-2 px-4 py-2 rounded font-bold transition border-4 border-orange-400 hover:border-orange-300"
                                style={{ 
                                    background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)', 
                                    fontFamily: 'Pixelify Sans, monospace',
                                    color: 'white'
                                }}
                                onClick={() => setModalVisible(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                <div className="flex-1" />
                <button
                    onClick={() => window.location.href = '/requiresCurrentSchedule/Home'}
                    className="w-44 h-10 flex items-center justify-center rounded-lg mt-8 mb-12 mx-auto font-semibold text-lg border-4 border-orange-400 hover:border-orange-300 transition"
                    style={{ 
                        background: 'linear-gradient(135deg, #14b8a6 0%, #0891b2 100%)', 
                        fontFamily: 'Pixelify Sans, monospace',
                        color: 'white'
                    }}
                >
                    Back to Home
                </button>
            </div>
        </div>
    );
};

export default CalendarView;


export {};