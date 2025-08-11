import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaBookOpen, FaTasks, FaCalendarCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import config from '../config';
import { usePotentialScheduleContext } from '../context/PotentialScheduleContext';
import { formatDateTimeLocal, formatDateLocal } from '../calendarUtils';


const EventSelection: React.FC = () => {
    const { potentialSchedules, setPotentialSchedules } = usePotentialScheduleContext();
    const [selected, setSelected] = useState('Meeting');
    const navigate = useNavigate();

    // Use a useEffect state hook to reset all input fields when selected changes:
    useEffect(() => {
        setStartDateTime(new Date());
        setEndDateTime(new Date());
        setMeetingRepeatEnd(new Date());
        setName('');
        setAssignment('');
        setAssignmentEffort('');
        setChore('');
        setChoreEffort('');
        setChoreWindowStart(new Date());
        setChoreWindowEnd(new Date());
        setRecurrence(null);
        setDate(new Date());
    }, [selected]);

    type Meeting = {
        startTime: string;
        endTime: string;
        name: string;
        recurrence: string | null;
        link_or_loc: string | null;
        meetingID: number;
        occurrenceID: number;
        meetingRepeatEnd?: string; // optional, for editing
    };

    type Assignment = {
        name: string;
        deadline: string;
        effort: number;
    };

    type Chore = {
        name: string;
        windowStart: string;
        windowEnd: string;
        effort: number;
    }

    const [recurrence, setRecurrence] = useState<string | null>(null);

    const [startDateTime, setStartDateTime] = useState(new Date());
    const [endDateTime, setEndDateTime] = useState(new Date());
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');

    const [assignment, setAssignment] = useState('');
    const [chore, setChore] = useState('');

    // Assignment and Chore state for new fields
    const [assignmentEffort, setAssignmentEffort] = useState('');
    const [choreEffort, setChoreEffort] = useState('');
    const [choreWindowStart, setChoreWindowStart] = useState(new Date());
    const [choreWindowEnd, setChoreWindowEnd] = useState(new Date());

    // Add state for end repeat date for meetings
    const [meetingRepeatEnd, setMeetingRepeatEnd] = useState(new Date());

   const navItems = [
  {
    label: 'Meeting',
    icon: 'FaCalendarAlt',
    textStyle: { color: '#ff5e57', fontWeight: 'bold' },
    selectedStyle: { backgroundColor: '#ff5e57' },
  },
  {
    label: 'Assignment',
    icon: 'FaBookOpen',
    textStyle: { color: '#3498db' },
    selectedStyle: { backgroundColor: '#3498db' },
  },
  {
    label: 'Chore/Study',
    icon: 'FaTasks',
    textStyle: { color: '#2ecc71', fontStyle: 'italic' },
    selectedStyle: { backgroundColor: '#2ecc71' },
  },
  {
    label: 'Events',
    icon: 'FaCalendarCheck',
    textStyle: { color: '#9b59b6', textDecorationLine: 'underline' },
    selectedStyle: { backgroundColor: '#9b59b6' },
  },
];

    // const navigation = useNavigation();
    const [date, setDate] = useState(new Date());
    // const [showDatePicker, setShowDatePicker] = useState(false);

    // Local state for meetings, assignments, and chores
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    //Will fix this one as well later using useChoreContext() function
    const [chores, setChores] = useState<Chore[]>([]);

    // Track if we're editing and which item is being edited
    const [editMode, setEditMode] = useState<null | { type: 'meeting' | 'assignment' | 'chore', index: number }> (null);

    // Modal state for edit/delete actions
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState<{
        type: 'meeting' | 'assignment' | 'chore';
        index: number;
        item: any;
    } | null>(null);

    const onDateChange = (_event: any, selectedDate: Date | undefined) => {
        const currDate = selectedDate || date;
        setDate(currDate);
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const submitSchedule = async () => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url) {
                alert('Backend URL not set.');
                return;
            }
            // Get device timezone offset in minutes (JavaScript: getTimezoneOffset returns minutes behind UTC, so invert sign)
            const tz_offset_minutes = -new Date().getTimezoneOffset();
            const reqBody = {
                meetings: meetings.map(m => ({
                    name: m.name,
                    start_end_times: generateMeetingOccurrences(
                        new Date(m.startTime),
                        new Date(m.endTime),
                        m.recurrence && typeof m.recurrence === 'string' ? m.recurrence.toLowerCase() : null,
                        m.meetingRepeatEnd ? new Date(m.meetingRepeatEnd) : new Date(m.endTime)
                    ),
                    link_or_loc: m.link_or_loc
                })),
                assignments: assignments.map(a => ({
                    name: a.name,
                    effort: a.effort,
                    due: a.deadline
                })),
                chores: chores.map(c => ({
                    name: c.name,
                    window: [c.windowStart, c.windowEnd],
                    effort: c.effort
                })),
                tz_offset_minutes,
            };
            console.log('Submitting schedule:', reqBody);
            const response = await fetch(`${url}/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(reqBody),
            });
            if (!response.ok) {
                const err = await response.text();
                alert('Failed to submit schedule: ' + err);
                return;
            }
            const data = await response.json();
            console.log(data);
            setPotentialSchedules(data);
            // Clear the scheduling cart after successful scheduling
            setMeetings([]);
            setAssignments([]);
            setChores([]);
            navigate('/requiresCurrentSchedule/requiresPotentialSchedule/schedulePicker');
        } catch (e) {
            alert('Error submitting schedule: ' + e);
        }
    };

    const handleMeeting = () => 
    {

        if (!name || !recurrence || !startDateTime || !endDateTime || !location) {
            alert('Please fill in all fields.');
            return;
        }
        if (startDateTime >= endDateTime) {
            alert('End time must be after start time.');
            return;
        }
        if ((recurrence === "daily" || recurrence === "weekly") && meetingRepeatEnd <= startDateTime) {
            alert('Repeat end date must be after start date for recurring meetings.');
            return;
        }
        alert('Meeting added successfully!');
        console.log("Start time: " + startDateTime.toString());
        console.log("End time: " + endDateTime.toString());
        console.log("Meeting name: " + name);
        console.log("Recurrence: " + recurrence);
        console.log("Location: " + location);

        const newMeeting = {
            startTime: startDateTime.toString(),
            endTime: endDateTime.toString(),
            name: name,
            recurrence: recurrence,
            link_or_loc: location,
            meetingID: Date.now(),
            occurrenceID: Date.now()
        };

        setMeetings([...meetings, newMeeting]);

        setStartDateTime(new Date());
        setEndDateTime(new Date());
        setMeetingRepeatEnd(new Date());
        setName('');
        setRecurrence(null);
        setLocation('');
        
    }

    // Helper to generate start_end_times for recurring meetings
    const generateMeetingOccurrences = (start: Date, end: Date, recurrence: string | null, repeatEnd: Date) => {
        const occurrences: [string, string][] = [];
        let currStart = new Date(start);
        let currEnd = new Date(end);

        if (!recurrence || recurrence === "once") {
            occurrences.push([currStart.toISOString(), currEnd.toISOString()]);
            return occurrences;
        }

        // Ensure repeatEnd is after start
        if (repeatEnd <= currStart) {
            occurrences.push([currStart.toISOString(), currEnd.toISOString()]);
            return occurrences;
        }

        let step: number;
        if (recurrence === "daily") {
            step = 1;
        } else if (recurrence === "weekly") {
            step = 7;
        } else {
            occurrences.push([currStart.toISOString(), currEnd.toISOString()]);
            return occurrences;
        }

        while (currStart <= repeatEnd) {
            occurrences.push([currStart.toISOString(), currEnd.toISOString()]);
            currStart = new Date(currStart.getTime() + step * 24 * 60 * 60 * 1000);
            currEnd = new Date(currEnd.getTime() + step * 24 * 60 * 60 * 1000);
        }
        return occurrences;
    }

    const handleAssignment = () => {
        if (assignment === '' || assignmentEffort === '' || date === null) {
            alert('Please fill in all fields.');
            return;
        }
        const currentDate = new Date();
        if (date < currentDate) {
            alert('Please select a valid date and time.');
            return;
        }
        if (isNaN(Number(assignmentEffort)) || Number(assignmentEffort) <= 0) {
            alert('Effort must be a positive number.');
            return;
        }
        alert('Assignment added successfully!');
        const newAssignment = {
            name: assignment,
            deadline: date.toISOString(),
            effort: Number(assignmentEffort),
        };
        setAssignments([...assignments, newAssignment]);
        setAssignment('');
        setAssignmentEffort('');
        setDate(new Date());
    }

    const handleChore = () => {
        if (chore === '' || choreEffort === '' || !choreWindowStart || !choreWindowEnd) {
            alert('Please fill in all fields.');
            return;
        }
        if (choreWindowStart >= choreWindowEnd) {
            alert('End time must be after start time.');
            return;
        }
        if (isNaN(Number(choreEffort)) || Number(choreEffort) <= 0) {
            alert('Effort must be a positive number.');
            return;
        }
        alert('Chore added successfully!');
        const newChore = {
            name: chore,
            windowStart: choreWindowStart.toISOString(),
            windowEnd: choreWindowEnd.toISOString(),
            effort: Number(choreEffort),
        };
        setChores([...chores, newChore]);
        setChore('');
        setChoreEffort('');
        setChoreWindowStart(new Date());
        setChoreWindowEnd(new Date());
    };


    const handlePrev = () => {
        navigate('/requiresCurrentSchedule/Home'); // Home screen
    }


    // Track the original values for discard functionality
    const [originalEditValues, setOriginalEditValues] = useState<any>(null);

    // When editMode changes, populate fields with the selected item's data and save originals
    useEffect(() => {
        if (!editMode) return;
        
        if (editMode.type === 'meeting') {
            const m = meetings[editMode.index];
            setSelected('Meeting');
            setName(m.name);
            setStartDateTime(new Date(m.startTime));
            setEndDateTime(new Date(m.endTime));
            setRecurrence(m.recurrence);
            setLocation(m.link_or_loc || '');
            setMeetingRepeatEnd(m.meetingRepeatEnd ? new Date(m.meetingRepeatEnd) : new Date());
            setOriginalEditValues({
                name: m.name,
                startDateTime: new Date(m.startTime),
                endDateTime: new Date(m.endTime),
                recurrence: m.recurrence,
                location: m.link_or_loc || '',
                meetingRepeatEnd: m.meetingRepeatEnd ? new Date(m.meetingRepeatEnd) : new Date(),
            });
        } else if (editMode.type === 'assignment') {
            const a = assignments[editMode.index];
            setSelected('Assignment');
            setAssignment(a.name);
            setAssignmentEffort(String(a.effort));
            setDate(new Date(a.deadline));
            setOriginalEditValues({
                name: a.name,
                effort: String(a.effort),
                deadline: new Date(a.deadline),
            });
        } else if (editMode.type === 'chore') {
            const c = chores[editMode.index];
            setSelected('Chore/Study');
            setChore(c.name);
            setChoreEffort(String(c.effort));
            setChoreWindowStart(new Date(c.windowStart));
            setChoreWindowEnd(new Date(c.windowEnd));
            setOriginalEditValues({
                name: c.name,
                effort: String(c.effort),
                windowStart: new Date(c.windowStart),
                windowEnd: new Date(c.windowEnd),
            });
        }
    }, [editMode, meetings, assignments, chores]);

    // Discard edit handler
    const handleDiscardEdit = () => {
        if (!editMode || !originalEditValues) {
            setEditMode(null);
            setOriginalEditValues(null);
            return;
        }
        
        if (editMode.type === 'meeting') {
            setName(originalEditValues.name);
            setStartDateTime(originalEditValues.startDateTime);
            setEndDateTime(originalEditValues.endDateTime);
            setRecurrence(originalEditValues.recurrence);
            setLocation(originalEditValues.location);
            setMeetingRepeatEnd(originalEditValues.meetingRepeatEnd);
        } else if (editMode.type === 'assignment') {
            setAssignment(originalEditValues.name);
            setAssignmentEffort(originalEditValues.effort);
            setDate(originalEditValues.deadline);
        } else if (editMode.type === 'chore') {
            setChore(originalEditValues.name);
            setChoreEffort(originalEditValues.effort);
            setChoreWindowStart(originalEditValues.windowStart);
            setChoreWindowEnd(originalEditValues.windowEnd);
        }
        
        setEditMode(null);
        setOriginalEditValues(null);
    };

    // Edit handlers for each type
    const handleEditMeeting = () => {
        if (editMode && editMode.type === 'meeting') {
            if (!name || !recurrence || !startDateTime || !endDateTime || !location) {
                alert('Please fill in all fields.');
                return;
            }
            if (startDateTime >= endDateTime) {
                alert('End time must be after start time.');
                return;
            }
            // Update meetings state
            const updatedMeeting = {
                startTime: startDateTime.toString(),
                endTime: endDateTime.toString(),
                name,
                recurrence,
                link_or_loc: location,
                meetingID: meetings[editMode.index].meetingID,
                occurrenceID: meetings[editMode.index].occurrenceID,
            };
            setMeetings(meetings.map((m, i) => i === editMode.index ? updatedMeeting : m));
            const start_end_times = generateMeetingOccurrences(
                startDateTime,
                endDateTime,
                recurrence && typeof recurrence === "string" ? recurrence.toLowerCase() : null,
                meetingRepeatEnd
            );
            setEditMode(null);
            setName('');
            setStartDateTime(new Date());
            setEndDateTime(new Date());
            setRecurrence(null);
            setLocation('');
            setMeetingRepeatEnd(new Date());
            alert('Meeting updated!');
        }
    };

    const handleEditAssignment = () => {
        if (editMode && editMode.type === 'assignment') {
            if (assignment === '' || assignmentEffort === '' || date === null) {
                alert('Please fill in all fields.');
                return;
            }
            if (isNaN(Number(assignmentEffort)) || Number(assignmentEffort) <= 0) {
                alert('Effort must be a positive number.');
                return;
            }
            const updatedAssignment = {
                name: assignment,
                deadline: date.toISOString(),
                effort: Number(assignmentEffort),
            };
            setAssignments(assignments.map((a, i) => i === editMode.index ? updatedAssignment : a));
            setEditMode(null);
            setAssignment('');
            setAssignmentEffort('');
            setDate(new Date());
            alert('Assignment updated!');
        }
    };

    const handleEditChore = () => {
        if (editMode && editMode.type === 'chore') {
            if (chore === '' || choreEffort === '' || !choreWindowStart || !choreWindowEnd) {
                alert('Please fill in all fields.');
                return;
            }
            if (choreWindowStart >= choreWindowEnd) {
                alert('End time must be after start time.');
                return;
            }
            if (isNaN(Number(choreEffort)) || Number(choreEffort) <= 0) {
                alert('Effort must be a positive number.');
                return;
            }
            const updatedChore = {
                name: chore,
                windowStart: choreWindowStart.toISOString(),
                windowEnd: choreWindowEnd.toISOString(),
                effort: Number(choreEffort),
            };
            setChores(chores.map((c, i) => i === editMode.index ? updatedChore : c));
            setEditMode(null);
            setChore('');
            setChoreEffort('');
            setChoreWindowStart(new Date());
            setChoreWindowEnd(new Date());
            alert('Chore updated!');
        }
    };

    //Function to handle editing or deleting a meeting:
    const editDeleteMeeting = (index: number) => {
        const meeting = meetings[index];
        setModalData({
            type: 'meeting',
            index,
            item: meeting
        });
        setShowModal(true);
    }

    //Function to handle editing or deleting an assignment:
    const editDeleteAssignment = (index: number) => {
        const assignment = assignments[index];
        setModalData({
            type: 'assignment',
            index,
            item: assignment
        });
        setShowModal(true);
    }

    //Function to handle editing or deleting a chore:
    const editDeleteChore = (index: number) => {
        const chore = chores[index];
        setModalData({
            type: 'chore',
            index,
            item: chore
        });
        setShowModal(true);
    }

    // Modal action handlers
    const handleEdit = () => {
        if (!modalData) return;
        setEditMode({ type: modalData.type, index: modalData.index });
        setShowModal(false);
        setModalData(null);
    };

    const handleDelete = () => {
        if (!modalData) return;
        
        if (modalData.type === 'meeting') {
            setMeetings(meetings.filter((_, i) => i !== modalData.index));
        } else if (modalData.type === 'assignment') {
            setAssignments(assignments.filter((_, i) => i !== modalData.index));
        } else if (modalData.type === 'chore') {
            setChores(chores.filter((_, i) => i !== modalData.index));
        }
        
        setShowModal(false);
        setModalData(null);
    };

    const handleCancel = () => {
        setShowModal(false);
        setModalData(null);
    };
    
    // Modal component
    const renderModal = () => {
        if (!showModal || !modalData) return null;

        const { type, item } = modalData;
        let title, details;

        if (type === 'meeting') {
            title = 'Meeting Details';
            details = (
                <div className="text-white space-y-2">
                    <p><span className="font-semibold">Name:</span> {item.name}</p>
                    <p><span className="font-semibold">Start:</span> {format(new Date(item.startTime), "MMM dd, yyyy - h:mm a")}</p>
                    <p><span className="font-semibold">End:</span> {format(new Date(item.endTime), "MMM dd, yyyy - h:mm a")}</p>
                    <p><span className="font-semibold">Location:</span> {item.link_or_loc || 'N/A'}</p>
                    <p><span className="font-semibold">Recurrence:</span> {item.recurrence || 'Once'}</p>
                </div>
            );
        } else if (type === 'assignment') {
            title = 'Assignment Details';
            details = (
                <div className="text-white space-y-2">
                    <p><span className="font-semibold">Name:</span> {item.name}</p>
                    <p><span className="font-semibold">Deadline:</span> {format(new Date(item.deadline), "MMM dd, yyyy - h:mm a")}</p>
                    <p><span className="font-semibold">Effort:</span> {item.effort} minutes</p>
                </div>
            );
        } else if (type === 'chore') {
            title = 'Chore Details';
            details = (
                <div className="text-white space-y-2">
                    <p><span className="font-semibold">Name:</span> {item.name}</p>
                    <p><span className="font-semibold">Window Start:</span> {format(new Date(item.windowStart), "MMM dd, yyyy - h:mm a")}</p>
                    <p><span className="font-semibold">Window End:</span> {format(new Date(item.windowEnd), "MMM dd, yyyy - h:mm a")}</p>
                    <p><span className="font-semibold">Effort:</span> {item.effort} minutes</p>
                </div>
            );
        }

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                    <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
                    {details}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={handleEdit}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                            Delete
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    };


    return (
        <div className="min-h-screen bg-black flex flex-col">
            {renderModal()}
            
            {/* Navigation Bar */}
            <div className="flex justify-around py-2.5 bg-white">
                {navItems.map((item) => (
 
                    <button
                        key={item.label}
                        className={`py-2.5 px-3 rounded-lg flex flex-col items-center min-w-[85px] ${
                            selected === item.label 
                                ? 'bg-black border border-white text-white' 
                                : 'bg-white text-black'
                        }`}
                        onClick={() => {
                            setSelected(item.label);
                        }}
                    >
                        {/* Icon placeholder - you can add actual icons here */}
                        <div className="w-4 h-4 mb-1.5">item.icon</div>
                        <span className="text-xs font-medium">
                            {item.label}
                        </span>
                    </button>
                ))}
            </div>

            {/* Meeting Tab */}
            {selected === 'Meeting' && (
                <div className="flex-1 px-5">
                    <div className="bg-black px-5 pt-7.5 -mt-5">
                        <h2 className="text-3xl font-bold text-white text-center my-5">
                            {editMode && editMode.type === 'meeting' ? 'Edit Meeting' : 'Set up a Meeting'}
                        </h2>

                        <label className="text-lg text-white mb-0">Start Time:</label>
                        <div className="bg-gray-800 rounded-xl self-start mt-2.5">
                            <input
                                type="datetime-local"
                                value={formatDateTimeLocal(startDateTime)}
                                onChange={(e) => setStartDateTime(new Date(e.target.value))}
                                className="h-32 w-56 text-white bg-gray-600 rounded-2xl p-2"
                            />
                        </div>

                        <label className="text-lg text-white mt-7.5 mb-0">End Time:</label>
                        <div className="bg-gray-800 rounded-xl self-start mt-2.5">
                            <input
                                type="datetime-local"
                                value={formatDateTimeLocal(endDateTime)}
                                onChange={(e) => setEndDateTime(new Date(e.target.value))}
                                className="h-32 w-56 text-white bg-gray-600 rounded-2xl p-2"
                            />
                        </div>

                        {/* End Repeat Date Picker for recurring meetings */}
                        {(recurrence === "daily" || recurrence === "mon" || recurrence === "tue" 
                            || recurrence === "wed" || recurrence === "thu" || recurrence === "fri" ||
                            recurrence === "sat" || recurrence === "sun" 
                        ) && (
                            <>
                                <label className="text-lg text-white mt-7.5 mb-0">End Repeat Date:</label>
                                <div className="bg-gray-800 rounded-xl self-start mt-2.5">
                                    <input
                                        type="date"
                                        value={formatDateLocal(meetingRepeatEnd)}
                                        onChange={(e) => setMeetingRepeatEnd(new Date(e.target.value))}
                                        className="h-32 w-56 text-white bg-gray-600 rounded-2xl p-2"
                                    />
                                </div>
                            </>
                        )}

                        <label className="text-lg text-white mt-7.5 mb-2.5">Name:</label>
                        <input
                            className="border border-gray-600 rounded-lg p-2.5 text-white bg-gray-800 w-full"
                            placeholder="Meeting"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <label className="text-lg text-white mt-7.5 mb-2.5">Link / Location:</label>
                        <input
                            className="border border-gray-600 rounded-lg p-2.5 text-white bg-gray-800 w-full"
                            placeholder="Link/location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />

                        <label className="text-lg text-white mt-5 mb-2.5">Recurrence:</label>
                        <div className="bg-gray-800 rounded-xl self-start mt-2.5">
                            <select
                                value={recurrence || ''}
                                onChange={(e) => setRecurrence(e.target.value || null)}
                                className="h-32 w-56 text-white bg-gray-600 rounded-2xl p-2"
                            >
                                <option value="">Select Frequency</option>
                                <option value="once">Once</option>
                                <option value="daily">Daily</option>
                                <option value="mon">Every Mon</option>
                                <option value="tue">Every Tue</option>
                                <option value="wed">Every Wed</option>
                                <option value="thu">Every Thu</option>
                                <option value="fri">Every Fri</option>
                                <option value="sat">Every Sat</option>
                                <option value="sun">Every Sun</option>
                            </select>
                        </div>

                        <button
                            className="bg-white rounded-lg mt-15 py-3 w-full text-black font-bold text-base hover:bg-gray-100 transition-colors"
                            onClick={editMode && editMode.type === 'meeting' ? handleEditMeeting : handleMeeting}
                        >
                            {editMode && editMode.type === 'meeting' ? 'Update Meeting' : 'Add Event'}
                        </button>

                        {editMode && editMode.type === 'meeting' && (
                            <button
                                className="bg-gray-400 rounded-lg py-3 w-full mt-2.5 text-gray-800 font-bold text-base hover:bg-gray-300 transition-colors"
                                onClick={handleDiscardEdit}
                            >
                                Discard Changes
                            </button>
                        )}

                        <button 
                            className="bg-white rounded-lg py-3 w-full mt-2 text-black font-bold text-base hover:bg-gray-100 transition-colors"
                            onClick={handlePrev}
                        >
                            Go to Home
                        </button>
                    </div>
                </div>
            )}

            {/* Assignment Tab */}
            {selected === "Assignment" && (
                <div className="min-h-screen bg-black p-4">
                    <h2 className="text-3xl font-bold text-white text-center my-5">
                        {editMode && editMode.type === 'assignment' ? 'Edit Assignment' : 'Set up an Assignment'}
                    </h2>

                    <label className="text-xl text-white mb-2.5 ml-2.5">Name:</label>
                    <input
                        className="border border-gray-600 rounded-lg p-2.5 text-white bg-gray-800 ml-2.5 w-[90%]"
                        placeholder="Assignment"
                        value={assignment}
                        onChange={(e) => setAssignment(e.target.value)}
                    />

                    <label className="text-xl text-white mb-2.5 ml-2.5 mt-5">Effort (minutes):</label>
                    <input
                        type="number"
                        className="border border-gray-600 rounded-lg p-2.5 text-white bg-gray-800 ml-2.5 w-[90%]"
                        placeholder="Effort in minutes"
                        value={assignmentEffort}
                        onChange={(e) => setAssignmentEffort(e.target.value)}
                    />

                    <label className="text-xl text-white mb-2.5 ml-2.5 mt-5">Deadline:</label>
                    <div className="bg-gray-800 rounded-xl self-start mt-2.5 ml-2.5">
                        <input
                            type="datetime-local"
                            value={formatDateTimeLocal(date)}
                            onChange={(e) => setDate(new Date(e.target.value))}
                            className="bg-gray-600 rounded-2xl p-2 text-white"
                        />
                    </div>

                    <button
                        className="bg-white rounded-lg py-3 mt-35 w-4/5 self-center mx-auto block text-black font-bold text-base hover:bg-gray-100 transition-colors"
                        onClick={editMode && editMode.type === 'assignment' ? handleEditAssignment : handleAssignment}
                    >
                        {editMode && editMode.type === 'assignment' ? 'Update Assignment' : 'Add Event'}
                    </button>

                    {editMode && editMode.type === 'assignment' && (
                        <button
                            className="bg-gray-400 rounded-lg py-3 mt-2.5 w-4/5 self-center mx-auto block text-gray-800 font-bold text-base hover:bg-gray-300 transition-colors"
                            onClick={handleDiscardEdit}
                        >
                            Discard Changes
                        </button>
                    )}

                    <button 
                        className="bg-white rounded-lg py-3 mt-2 w-4/5 self-center mx-auto block text-black font-bold text-base hover:bg-gray-100 transition-colors"
                        onClick={() => navigate('/requiresCurrentSchedule/Home')}
                    >
                        Go to home
                    </button>
                </div>
            )}

            {/* Chore/Study Tab */}
            {selected === "Chore/Study" && (
                <div className="min-h-screen bg-black p-4">
                    <h2 className="text-3xl font-bold text-white text-center my-5">
                        {editMode && editMode.type === 'chore' ? 'Edit Chore/Study' : 'Set up Chore/Study'}
                    </h2>

                    <label className="text-xl text-white mb-2.5 ml-2.5">Name:</label>
                    <input
                        className="border border-gray-600 rounded-lg p-2.5 text-white bg-gray-800 ml-2.5 w-[90%]"
                        placeholder="Chore"
                        value={chore}
                        onChange={(e) => setChore(e.target.value)}
                    />

                    <label className="text-xl text-white mb-2.5 ml-2.5 mt-5">Effort (minutes):</label>
                    <input
                        type="number"
                        className="border border-gray-600 rounded-lg p-2.5 text-white bg-gray-800 ml-2.5 w-[90%]"
                        placeholder="Effort in minutes"
                        value={choreEffort}
                        onChange={(e) => setChoreEffort(e.target.value)}
                    />

                    <label className="text-xl text-white mb-0 mt-5 ml-2.5">Window Start:</label>
                    <div className="bg-gray-800 rounded-xl self-start mt-2.5 ml-2.5">
                        <input
                            type="datetime-local"
                            value={formatDateTimeLocal(choreWindowStart)}
                            onChange={(e) => setChoreWindowStart(new Date(e.target.value))}
                            className="bg-gray-600 rounded-2xl p-2 text-white"
                        />
                    </div>

                    <label className="text-xl text-white mb-0 mt-5 ml-2.5">Window End:</label>
                    <div className="bg-gray-800 rounded-xl self-start mt-2.5 ml-2.5">
                        <input
                            type="datetime-local"
                            value={formatDateTimeLocal(choreWindowEnd)}
                            onChange={(e) => setChoreWindowEnd(new Date(e.target.value))}
                            className="bg-gray-600 rounded-2xl p-2 text-white"
                        />
                    </div>

                    <button
                        className="bg-white rounded-lg py-3 mt-27 w-4/5 self-center mx-auto block text-black font-bold text-base hover:bg-gray-100 transition-colors"
                        onClick={editMode && editMode.type === 'chore' ? handleEditChore : handleChore}
                    >
                        {editMode && editMode.type === 'chore' ? 'Update Chore' : 'Add Event'}
                    </button>

                    {editMode && editMode.type === 'chore' && (
                        <button
                            className="bg-gray-400 rounded-lg py-3 mt-2.5 w-4/5 self-center mx-auto block text-gray-800 font-bold text-base hover:bg-gray-300 transition-colors"
                            onClick={handleDiscardEdit}
                        >
                            Discard Changes
                        </button>
                    )}

                    <button 
                        className="bg-white rounded-lg py-3 mt-2 w-4/5 self-center mx-auto block text-black font-bold text-base hover:bg-gray-100 transition-colors"
                        onClick={() => navigate('/requiresCurrentSchedule/Home')}
                    >
                        Go to home
                    </button>
                </div>
            )}


            {selected === "Events" && (
                <div className="min-h-screen bg-black">
                    <h2 className="text-3xl font-bold text-white text-center pt-6 pb-5">Events</h2>

                    {/* Meetings section */}
                    <h3 className="text-2xl font-semibold text-white ml-4 mb-4">Meetings:</h3>
                    <div className="overflow-x-auto whitespace-nowrap pb-4">
                        <div className="flex gap-4 pl-4 pr-4">
                            {meetings.map((meeting, index) => (
                                <button 
                                    key={index} 
                                    className="bg-gray-800 rounded-lg p-4 min-w-48 flex-shrink-0 hover:bg-gray-700 transition-colors" 
                                    onClick={() => editDeleteMeeting(index)}
                                >
                                    <div className="text-lg font-semibold text-white mb-1">
                                        {format(new Date(meeting.startTime), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-lg text-white mb-1">
                                        {format(new Date(meeting.endTime), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-xl text-white font-medium mb-2">{meeting.name}</div>
                                    <div className="text-base text-gray-300 mb-1">{meeting.link_or_loc}</div>
                                    <div className="text-base text-gray-300">{meeting.recurrence}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assignments section */}
                    <h3 className="text-2xl font-semibold text-white ml-4 mb-4">Assignments:</h3>
                    <div className="overflow-x-auto whitespace-nowrap pb-4">
                        <div className="flex gap-4 pl-4 pr-4">
                            {assignments.map((assignment, index) => (
                                <button 
                                    key={index} 
                                    className="bg-gray-800 rounded-lg p-4 min-w-48 flex-shrink-0 hover:bg-gray-700 transition-colors" 
                                    onClick={() => editDeleteAssignment(index)}
                                >
                                    <div className="text-lg font-semibold text-white mb-1">
                                        {format(new Date(assignment.deadline), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-base text-gray-300 mb-1">
                                        {assignment.effort} min
                                    </div>
                                    <div className="text-xl text-white font-medium">{assignment.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chores section */}
                    <h3 className="text-2xl font-semibold text-white ml-4 mb-4">Chores/Studies:</h3>
                    <div className="overflow-x-auto whitespace-nowrap pb-4">
                        <div className="flex gap-4 pl-4 pr-4">
                            {chores.map((chore, index) => (
                                <button 
                                    key={index} 
                                    className="bg-gray-800 rounded-lg p-4 min-w-48 flex-shrink-0 hover:bg-gray-700 transition-colors" 
                                    onClick={() => editDeleteChore(index)}
                                >
                                    <div className="text-lg font-semibold text-white mb-1">
                                        {format(new Date(chore.windowStart), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-lg text-white mb-1">
                                        {format(new Date(chore.windowEnd), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-base text-gray-300 mb-1">
                                        {chore.effort} min
                                    </div>
                                    <div className="text-xl text-white font-medium">{chore.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        className="bg-white rounded-lg py-3 mt-5 w-4/5 self-center mx-auto block text-black font-bold text-base hover:bg-gray-100 transition-colors"
                        onClick={submitSchedule}
                    >
                        Submit Schedule
                    </button>
                </div>
            )}




        </div>
    );
}

export default EventSelection;