"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Slider, LinearProgress, Box, Typography, Checkbox } from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import config from '../config';
import { useCurrentScheduleContext } from '../context/CurrentScheduleContext';

// Create a custom theme for MUI components
const theme = createTheme({
    palette: {
        primary: {
            main: '#2563eb', // Blue-600
        },
        secondary: {
            main: '#16a34a', // Green-600
        },
    },
    components: {
        MuiSlider: {
            styleOverrides: {
                root: {
                    color: '#2563eb',
                    height: 8,
                },
                thumb: {
                    height: 24,
                    width: 24,
                    backgroundColor: '#2563eb',
                    border: '2px solid currentColor',
                    '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                        boxShadow: 'inherit',
                    },
                    '&:before': {
                        display: 'none',
                    },
                },
                valueLabel: {
                    lineHeight: 1.2,
                    fontSize: 12,
                    background: 'unset',
                    padding: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50% 50% 50% 0',
                    backgroundColor: '#2563eb',
                    transformOrigin: 'bottom left',
                    transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
                    '&:before': { display: 'none' },
                    '&.MuiSlider-valueLabelOpen': {
                        transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
                    },
                    '& > *': {
                        transform: 'rotate(45deg)',
                    },
                },
            },
        },
        MuiLinearProgress: {
            styleOverrides: {
                root: {
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: '#e5e7eb', // Gray-200
                },
                bar: {
                    borderRadius: 6,
                    backgroundColor: '#2563eb', // Blue-600
                },
            },
        },
    },
});

const Home = () => {
    const [loading, setLoading] = useState(false);
    const { currSchedule, setCurrSchedule, ensureScheduleRange, refetchSchedule } = useCurrentScheduleContext();
    const navigate = useNavigate();
    const handleSyncGoogleCalendar = async () => {
        try {
            setLoading(true);
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token) {
                alert('Backend URL or token not set.');
                setLoading(false);
                return;
            }
            const response = await fetch(`${url}/googleCalendar/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                const err = await response.text();
                alert('Failed to sync Google Calendar: ' + err);
                setLoading(false);
                return;
            }
            const data = await response.json();
            alert(data.message || 'Google Calendar synced!');
            // Refetch the schedule after sync
            await refetchSchedule();
        } catch (e) {
            alert('Failed to sync Google Calendar: ' + e);
        } finally {
            setLoading(false);
        }
    };
    type SessionToMaybeComplete = {
        occurence_id: string;
        is_assignment: boolean;
    };
    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'update' | 'delete' | 'markSession' | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
    const [updateName, setUpdateName] = useState('');
    const [updateLoc, setUpdateLoc] = useState('');
    const [updateStartTime, setUpdateStartTime] = useState<Dayjs | null>(null);
    const [updateEndTime, setUpdateEndTime] = useState<Dayjs | null>(null);
    const [updateAllOccurrences, setUpdateAllOccurrences] = useState(false);
    const [selectedSessionToComplete, setSelectedSessionToComplete] = useState<SessionToMaybeComplete>({occurence_id: "A", is_assignment: false});
    const [lockedInValue, setLockedInValue] = useState(5);

    const [levelInfo, setLevelInfo] = useState<{xp: number; level: number; user_name: string } | null>(null);
    const [xpForNextLevel, setXpForNextLevel] = useState<number>(100); 
    const todoList = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        const startISO = start.toISOString().replace('Z', '+00:00');
        const endISO = end.toISOString().replace('Z', '+00:00');
        
        return currSchedule.slots.filter((slot: any) => slot.start >= startISO && slot.end <= endISO);
    }, [currSchedule.slots]);
    const fetchLevelInfo = async () => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token) {
                alert("Backend URL or token not set.");
                return;
            }
            const response = await fetch(`${url}/getLevel`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorText = await response.text();
                alert(`Server error: ${response.status} - ${errorText.substring(0, 100)}`);
                return;
            }
        
            const contentType = response.headers.get('content-type');
            console.log('Content-Type:', contentType);
            
            if (!contentType || !contentType.includes('application/json')) {
                const responseText = await response.text();
                console.error('Response is not JSON. Content-Type:', contentType);
                console.error('Response body:', responseText.substring(0, 500));
                alert('Server returned non-JSON response. Check console for details.');
                return;
            }
            const data = await response.json();
            setLevelInfo({
                xp: data.xp,
                level: data.level,
                user_name: data.user_name
            })
            setXpForNextLevel(Math.floor(100 * Math.pow(1.5, data.level)));
        } catch (e) {
            alert('Failed to fetch level info: ' + ((e as Error)?.message || e));
        }
    }

    useEffect(() => {
        fetchLevelInfo();
    }, []);
    useEffect(() => {
        const ensureSchedule = async () => {
            const now = new Date();
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
            const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
            const startISO = start.toISOString().replace('Z', '+00:00');
            const endISO = end.toISOString().replace('Z', '+00:00');
            await ensureScheduleRange(startISO, endISO);
        };
        ensureSchedule();
    }, [ensureScheduleRange]);

    const handleBack = () => {
        localStorage.removeItem("token");
        navigate('/');
    };

    const calendarProceed = async () => {
        try {
            navigate('/requiresCurrentSchedule/CalendarView');
        }
        catch (error) {
            alert('Failed to check schedule.');
            console.error('Error checking schedule in localStorage:', error);
        }
    }

    const handleAddEvent = () => {
        navigate('/requiresCurrentSchedule/requiresPotentialSchedule/eventSelection');
    };

    const getCardStyle = (type: string) => {
        if (type === 'meeting') return 'bg-indigo-100 border-l-6 border-indigo-500';
        if (type === 'assignment') return 'bg-yellow-100 border-l-6 border-yellow-500';
        if (type === 'chore') return 'bg-green-100 border-l-6 border-green-500';
        return '';
    };
    const [completedMap, setCompletedMap] = useState<{ [key: string]: boolean }>({});
    useEffect(() => {
        const map: { [key: string]: boolean } = {};
        todoList.forEach((item: any) => {
            if ((item.type === 'assignment' || item.type === 'chore') && item.id !== undefined) {
                map[item.id] = !!item.completed;
            }
        });
        setCompletedMap(map);
    }, [todoList]);

    const markSessionCompleted = async (occurence_id: string, is_assignment: boolean, locked_in: number = 5) => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token) {
                alert('Backend URL or token not set.');
                return;
            }
            // Extract numeric id from our string id
            const idParts = occurence_id.split('_');
            const realOccurenceId = idParts[idParts.length - 1];
            // Determine is_assignment correctly from id
            let isAssignmentFlag = false;
            if (occurence_id.startsWith('assignment_')) {
                isAssignmentFlag = true;
            } else if (occurence_id.startsWith('chore_')) {
                isAssignmentFlag = false;
            } else {
                isAssignmentFlag = is_assignment; // fallback to passed value
            }
            const response = await fetch(`${url}/markSessionCompleted`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    occurence_id: Number(realOccurenceId),
                    completed: true,
                    is_assignment: isAssignmentFlag,
                    locked_in: locked_in,
                }),
            });
            if (!response.ok) {
                const err = await response.text();
                alert('Failed to mark session as completed: ' + err);
                return;
            }
            setCompletedMap(prev => ({
                ...prev,
                [occurence_id]: true,
            }));
            alert('Session marked as completed!');
            setModalVisible(false);
            await refetchSchedule();
            await fetchLevelInfo();
        } catch (e) {
            alert('Failed to mark session as completed: ' + e);
        }
    };

    // Update meeting handler
    const handleUpdateMeeting = async () => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token || !selectedMeeting) return;
            const body: any = {
                future_occurences: false,
                meeting_id: selectedMeeting.meeting_id, // always send meeting_id
                ocurrence_id: selectedMeeting.id,
            };
            if (updateName) body.new_name = updateName;
            if (updateLoc) body.new_loc_or_link = updateLoc;
            console.log('Update meeting body:', body);
            const hasStart = !!updateStartTime;
            const hasEnd = !!updateEndTime;
            if ((hasStart && !hasEnd) || (hasEnd && !hasStart)) {
                alert('Please provide both start and end time for the meeting.');
                return;
            }
            if (updateStartTime && updateEndTime) {
                if (updateStartTime > updateEndTime) {
                    alert('Start time cannot be after end time.');
                    return;
                }
                const toIsoUtc = (d: Dayjs) => d.toDate().toISOString().replace('Z', '+00:00');
                body.new_start_time = toIsoUtc(updateStartTime);
                body.new_end_time = toIsoUtc(updateEndTime);
                console.log('Updating meeting with new start and end times:', body.new_start_time, body.new_end_time);
            }
            if (updateAllOccurrences) {
                body.future_occurences = true;
            }
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
                alert('Failed to update meeting: ' + err);
                return;
            }
            alert('Meeting updated!');
            setModalVisible(false);
            setUpdateName('');
            setUpdateLoc('');
            setUpdateStartTime(null);
            setUpdateEndTime(null);
            setUpdateAllOccurrences(false);
            setSelectedMeeting(null);
            await refetchSchedule();
        } catch (e) {
            alert('Failed to update meeting: ' + e);
        }
    };

    const handleDeleteMeeting = async (removeAllFuture = false) => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token || !selectedMeeting) return;
            const body = {
                occurence_id: selectedMeeting.id,
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
                alert('Failed to delete meeting: ' + err);
                return;
            }
            alert(removeAllFuture ? 'All future occurrences deleted!' : 'Meeting deleted!');
            setModalVisible(false);
            setSelectedMeeting(null);
            await refetchSchedule();
        } catch (e) {
            alert('Failed to delete meeting: ' + e);
        }
    };

    const handleDeleteEvent = async (occurence_id: string, event_type: "assignment" | "chore") => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url || !token) return;
            const idParts = occurence_id.split('_');
            const realOccurenceId = idParts[idParts.length - 1];
            const body = {
                occurence_id: Number(realOccurenceId),
                remove_all_future: false,
                event_type,
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
                alert('Failed to delete: ' + err);
                return;
            }
            alert(`${event_type.charAt(0).toUpperCase() + event_type.slice(1)} deleted!`);
            setModalVisible(false);
            await refetchSchedule();
        } catch (e) {
            alert('Failed to delete: ' + e);
        }
    };

    const handleReschedule = (item: any) => {
        // Extract id for assignment/chore (assignment_<assignment_id>_<occurence_id> or chore_<chore_id>_<occurence_id>)
        let idToSend: number | undefined;
        let label: string = '';
        if (item.type === 'assignment') {
            const parts = item.id.split('_');
            idToSend = Number(parts[1]);
            label = 'Reschedule Assignment';
        } else if (item.type === 'chore') {
            const parts = item.id.split('_');
            idToSend = Number(parts[1]);
            label = 'Reschedule Chore';
        }

        navigate(`/requiresCurrentSchedule/requiresPotentialSchedule/RescheduleScreen?id=${idToSend}&type=${item.type}&effort=${item.effort}&start=${item.start}&end=${item.end}&label=${label}`);
    };

    return (
        <ThemeProvider theme={theme}>
            <div className="min-h-screen bg-gray-100 flex flex-col">
                {loading && (
                    <div className="text-center py-4">
                        <p className="text-gray-600">Loading...</p>
                    </div>
                )}
                
                <div className="flex justify-between items-center mt-5 mx-4">
                    <button className="bg-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button 
                        onClick={calendarProceed} 
                        className="bg-gray-800 rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
                        data-testid="calendar-button"
                    >
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                
                <div className="text-center mt-5">
                    <h1 className="text-xl font-bold text-gray-800">
                        {levelInfo ? `Welcome, ${levelInfo.user_name}!` : `Welcome!`}
                    </h1>
                </div>
                
                {levelInfo && (
                    <div className="text-center mt-2">
                        <p className="text-lg font-bold">
                            Level: {levelInfo.level}
                        </p>
                        <p className="text-base mt-1">
                            XP: {levelInfo.xp} / {xpForNextLevel}
                        </p>
                        <Box sx={{ width: '250px', margin: '8px auto' }}>
                            <LinearProgress 
                                variant="determinate" 
                                value={Math.min((levelInfo.xp / xpForNextLevel) * 100, 100)} 
                            />
                        </Box>
                        <p className="text-sm mt-1">
                            {xpForNextLevel - levelInfo.xp} XP to next level
                        </p>
                    </div>
                )}
                
                <h2 className="text-2xl font-bold text-center mt-5 ml-2 text-gray-800">To Do List for Today</h2>
                
                <div className="flex-1 overflow-y-auto pb-24">
                    {todoList.map((item, idx) => (
                        <div key={item.id ?? idx} className={`mx-4 my-2 rounded-xl p-4 shadow-sm ${getCardStyle(item.type)}`}>
                            <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                            <p className="text-sm text-gray-600 mt-0.5 mb-1">{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</p>
                            <p className="text-base text-gray-800 mt-0.5">
                                {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            
                            {/* Mark session completed for assignments and chores */}
                            {(item.type === 'assignment' || item.type === 'chore') && item.id && (
                                <>
                                    {completedMap[item.id] ? (
                                        <p className="text-green-600 font-bold mt-2 text-lg">✓ Completed</p>
                                    ) : (
                                        <button
                                            className="mt-2 bg-gray-800 rounded-md py-2 px-4 text-white font-bold hover:bg-gray-700 transition-colors"
                                            onClick={() => {
                                                const now = new Date();
                                                const startTime = new Date(item.start);
                                                if (startTime > now) {
                                                    alert(
                                                        "This session hasn't started yet. You can only mark it completed after its start time. If you don't need this assignment or chore on your calendar any longer, you can delete it using the Delete button."
                                                    );
                                                    return;
                                                }
                                                setModalType('markSession');
                                                setModalVisible(true);
                                                setSelectedSessionToComplete({occurence_id: item.id as string, is_assignment: item.type === 'assignment'});
                                            }}
                                        >
                                            Mark Session Completed
                                        </button>
                                    )}
                                    {/* Delete button for assignments/chores */}
                                    <button
                                        className="mt-2 bg-red-600 rounded-md py-2 px-4 text-white font-bold hover:bg-red-700 transition-colors"
                                        onClick={() => handleDeleteEvent(item.id as string, item.type as "assignment" | "chore")}
                                    >
                                        Delete
                                    </button>
                                    {/* Reschedule button */}
                                    <button
                                        className="mt-2 ml-2 bg-blue-600 rounded-md py-2 px-4 text-white font-bold hover:bg-blue-700 transition-colors"
                                        onClick={() => handleReschedule(item)}
                                    >
                                        Reschedule
                                    </button>
                                </>
                            )}
                            
                            {/* Update/Delete for meetings */}
                            {item.type === 'meeting' && (
                                <div className="flex mt-2 space-x-2">
                                    <button
                                        className="bg-blue-600 rounded-md py-2 px-3 text-white font-bold hover:bg-blue-700 transition-colors"
                                        onClick={() => {
                                            setModalType('update');
                                            setSelectedMeeting(item);
                                            setUpdateName('');
                                            setUpdateLoc('');
                                            setUpdateStartTime(null);
                                            setUpdateEndTime(null);
                                            setUpdateAllOccurrences(false);
                                            setModalVisible(true);
                                        }}
                                    >
                                        Update
                                    </button>
                                    <button
                                        className="bg-red-600 rounded-md py-2 px-3 text-white font-bold hover:bg-red-700 transition-colors"
                                        onClick={() => {
                                            setModalType('delete');
                                            setSelectedMeeting(item);
                                            setModalVisible(true);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {todoList.length === 0 && (
                        <p className="text-gray-700 m-5 text-lg text-center">No events for today.</p>
                    )}
                    
                    <div className="text-center mt-10 mb-1">
                        <button onClick={handleAddEvent} className="bg-black rounded-full text-white w-12 h-12 text-4xl font-bold hover:bg-gray-800 transition-colors">
                            +
                        </button>
                        <p className="text-sm text-center mt-1">Add event</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleSyncGoogleCalendar} 
                    disabled={loading}
                    className="bg-blue-600 p-3 rounded-lg mt-8 mx-4 mb-2 text-center text-white font-bold text-base hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? 'Syncing...' : 'Sync Google Calendar'}
                </button>
                
                {/* Update/Delete/Session completion Modal */}
                {modalVisible && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl p-6 w-[85%] max-w-md">
                            {modalType === 'update' && (
                                <>
                                    <h3 className="text-xl font-bold mb-4 text-gray-900">Update Meeting</h3>
                                    <input
                                        type="text"
                                        className="border border-gray-400 rounded-lg p-2 text-base text-gray-900 bg-gray-100 mb-3 w-full"
                                        placeholder="New Name"
                                        value={updateName}
                                        onChange={(e) => setUpdateName(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="border border-gray-400 rounded-lg p-2 text-base text-gray-900 bg-gray-100 mb-3 w-full"
                                        placeholder="New Location/Link"
                                        value={updateLoc}
                                        onChange={(e) => setUpdateLoc(e.target.value)}
                                    />
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DateTimePicker
                                            label="New Start Time"
                                            value={updateStartTime}
                                            onChange={(newValue) => setUpdateStartTime(newValue)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    className: 'mb-3 bg-gray-100',
                                                },
                                            }}
                                        />
                                        <DateTimePicker
                                            label="New End Time"
                                            value={updateEndTime}
                                            onChange={(newValue) => setUpdateEndTime(newValue)}
                                            slotProps={{
                                                textField: {
                                                    fullWidth: true,
                                                    className: 'mb-3 bg-gray-100',
                                                },
                                            }}
                                        />
                                    </LocalizationProvider>
                                     <div className="flex items-center mb-3">
                                         <Checkbox
                                             id="update-all-occurrences"
                                             checked={updateAllOccurrences}
                                             onChange={(e) => setUpdateAllOccurrences(e.target.checked)}
                                             color="primary"
                                             inputProps={{ "aria-label": "Update all future occurrences" }}
                                         />
                                         <label htmlFor="update-all-occurrences" className="text-gray-800">
                                             Update all future occurrences
                                         </label>
                                     </div>
                                    <button
                                        className="bg-blue-600 rounded-lg py-3 px-6 text-white font-bold text-base w-full hover:bg-blue-700 transition-colors"
                                        onClick={handleUpdateMeeting}
                                    >
                                        Submit Update
                                    </button>
                                </>
                            )}
                            
                            {modalType === 'delete' && (
                                <>
                                    <h3 className="text-xl font-bold mb-4 text-gray-900">Delete Meeting</h3>
                                    <p className="text-gray-700 mb-4">
                                        Are you sure you want to delete this meeting occurrence?
                                    </p>
                                    <button
                                        className="bg-red-600 rounded-lg py-3 px-6 text-white font-bold text-base w-full mb-2 hover:bg-red-700 transition-colors"
                                        onClick={() => handleDeleteMeeting(false)}
                                    >
                                        Delete This Occurrence
                                    </button>
                                    <button
                                        className="bg-red-600 rounded-lg py-3 px-6 text-white font-bold text-base w-full hover:bg-red-700 transition-colors"
                                        onClick={() => handleDeleteMeeting(true)}
                                    >
                                        Delete All Future Occurrences
                                    </button>
                                </>
                            )}
                            
                            {modalType === 'markSession' && (
                                <>
                                    <h3 className="text-xl font-bold mb-4 text-gray-900">Mark Session Completed</h3>
                                    <p className="text-gray-700 mb-4 font-bold text-base">
                                        How locked in were you? Be honest.
                                    </p>
                                    <div className="mb-4 flex flex-col items-center">
                                        <Box sx={{ width: 200, marginBottom: 2 }}>
                                            <Slider
                                                min={1}
                                                max={10}
                                                step={1}
                                                value={lockedInValue}
                                                onChange={(_, newValue) => setLockedInValue(newValue as number)}
                                                valueLabelDisplay="auto"
                                                marks
                                            />
                                        </Box>
                                        <Typography variant="body1" fontWeight="bold" color="text.secondary">
                                            {lockedInValue}/10
                                        </Typography>
                                    </div>
                                    <button
                                        className="bg-red-600 rounded-lg py-3 px-6 text-white font-bold text-base w-full hover:bg-red-700 transition-colors"
                                        onClick={() => markSessionCompleted(selectedSessionToComplete?.occurence_id, selectedSessionToComplete?.is_assignment, lockedInValue)}
                                    >
                                        Mark Session Completed
                                    </button>
                                </>
                            )}
                            
                            <button
                                className="bg-gray-600 rounded-lg py-3 px-6 text-white font-bold text-base w-full mt-2 hover:bg-gray-700 transition-colors"
                                onClick={() => setModalVisible(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
                
                <button 
                    onClick={handleBack}
                    className="bg-black p-2 rounded-md mt-2 ml-2 mb-4 text-white w-36 text-base text-center hover:bg-gray-800 transition-colors"
                >
                    Back to Login
                </button>
            </div>
        </ThemeProvider>
    );
}

export default Home;