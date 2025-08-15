import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaBookOpen, FaTasks, FaCalendarCheck } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import config from '../config';
import { usePotentialScheduleContext } from '../context/PotentialScheduleContext';
import { formatDateTimeLocal, formatDateLocal } from '../calendarUtils';
import { IconType } from 'react-icons';
import { usePopup } from '../context/PopupContext';

const EventSelection: React.FC = () => {
    const { setPotentialSchedules } = usePotentialScheduleContext();
    const [selected, setSelected] = useState('Meeting');
    const navigate = useNavigate();
    const { showPopup } = usePopup();
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
        // Optional number of additional days to recur (0..6). Used to compute end_recur_date at submission.
        recurDays?: number;
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
    // Per-chore recurrence input (optional, 0..6). Stored as string for controlled input.
    const [choreRecurDays, setChoreRecurDays] = useState('');
    // Add state for end repeat date for meetings
    const [meetingRepeatEnd, setMeetingRepeatEnd] = useState(new Date());
    interface NavItem {
        label: string;
        icon: IconType;
        textStyle?: string;
        selectedStyle?: string;
    }
    const navItems: NavItem[] = [
        {
            label: 'Meeting',
            icon: FaCalendarAlt,
            textStyle: ' bg-blue-500 text-black hover:scale-110',
            selectedStyle:' bg-blue-600 text-white border border-white hover:scale-110',
        },
        {
            label: 'Assignment',
            icon: FaBookOpen,
            textStyle: ' bg-yellow-500 text-black hover:scale-110',
            selectedStyle: ' bg-yellow-600 text-white border border-white hover:scale-110',
        },
        {
            label: 'Chore/Study',
            icon: FaTasks,
            textStyle: ' bg-green-500 text-black hover:scale-110',
            selectedStyle: ' bg-green-600 text-white border border-white hover:scale-110 ',
        },
        {
            label: 'Events',
            icon: FaCalendarCheck,
            textStyle: ' bg-stone-500 text-black hover:scale-110',
            selectedStyle: 'bg-stone-600 text-white border border-white hover:scale-110 ',
        },
    ];
    const [date, setDate] = useState(new Date());
    // Local state for meetings, assignments, and chores
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
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
    const submitSchedule = async () => {
        try {
            const url = config.backendURL;
            const token = localStorage.getItem('token');
            if (!url) {
                showPopup('Backend URL not set.');
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
                chores: chores.map(c => {
                    const base: any = {
                        name: c.name,
                        window: [c.windowStart, c.windowEnd],
                        effort: c.effort,
                    };
                    if (typeof c.recurDays === 'number' && c.recurDays > 0) {
                        // end_recur_date = windowStart + (recurDays * 24h)
                        const start = new Date(c.windowStart);
                        const ms = start.getTime() + c.recurDays * 24 * 60 * 60 * 1000;
                        base.end_recur_date = new Date(ms).toISOString();
                    }
                    return base;
                }),
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
                showPopup('Failed to submit schedule: ' + err);
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
            showPopup('Error submitting schedule: ' + e);
        }
    };

    const handleMeeting = () => {
        if (!name || !recurrence || !startDateTime || !endDateTime || !location) {
            showPopup('Please fill in all fields.');
            return;
        }
        if (startDateTime >= endDateTime) {
            showPopup('End time must be after start time.');
            return;
        }
        // Validate repeat end for recurring patterns (daily or specific weekdays)
        const recurringCodes = ["daily","mon","tue","wed","thu","fri","sat","sun"]; 
        if (recurringCodes.includes(recurrence) && meetingRepeatEnd <= startDateTime) {
            showPopup('Repeat end date must be after start date for recurring meetings.');
            return;
        }
        showPopup('Meeting added successfully!');
        console.log("Start time: " + startDateTime.toString());
        console.log("End time: " + endDateTime.toString());
        console.log("Meeting name: " + name);
        console.log("Recurrence: " + recurrence);
        console.log("Location: " + location);
        const newMeeting = {
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            name: name,
            recurrence: recurrence,
            link_or_loc: location,
            meetingID: Date.now(),
            occurrenceID: Date.now(),
            meetingRepeatEnd: recurringCodes.includes(recurrence) ? meetingRepeatEnd.toISOString() : undefined,
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
        const weekdayMap: Record<string, number> = { mon:1, tue:2, wed:3, thu:4, fri:5, sat:6, sun:0 };
        const isWeekdayPattern = recurrence in weekdayMap;
        if (recurrence === "daily") {
            while (currStart <= repeatEnd) {
                occurrences.push([currStart.toISOString(), currEnd.toISOString()]);
                currStart = new Date(currStart.getTime() + 24 * 60 * 60 * 1000);
                currEnd = new Date(currEnd.getTime() + 24 * 60 * 60 * 1000);
            }
            return occurrences;
        } else if (isWeekdayPattern) {
            const targetDow = weekdayMap[recurrence];
            const startDow = currStart.getUTCDay();
            // Align first occurrence to the target weekday (keep duration)
            let daysAhead = (targetDow - startDow + 7) % 7;
            if (daysAhead !== 0) {
                currStart = new Date(currStart.getTime() + daysAhead * 24 * 60 * 60 * 1000);
                currEnd = new Date(currEnd.getTime() + daysAhead * 24 * 60 * 60 * 1000);
            }
            while (currStart <= repeatEnd) {
                occurrences.push([currStart.toISOString(), currEnd.toISOString()]);
                currStart = new Date(currStart.getTime() + 7 * 24 * 60 * 60 * 1000);
                currEnd = new Date(currEnd.getTime() + 7 * 24 * 60 * 60 * 1000);
            }
            return occurrences;
        } else {
            // Fallback: treat as single occurrence
            occurrences.push([currStart.toISOString(), currEnd.toISOString()]);
            return occurrences;
        }
    }
    const handleAssignment = () => {
        if (assignment === '' || assignmentEffort === '' || date === null) {
            showPopup('Please fill in all fields.');
            return;
        }
        const currentDate = new Date();
        if (date < currentDate) {
            showPopup('Please select a valid date and time.');
            return;
        }
        if (isNaN(Number(assignmentEffort)) || Number(assignmentEffort) <= 0) {
            showPopup('Effort must be a positive number.');
            return;
        }
        showPopup('Assignment added successfully!');
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
            showPopup('Please fill in all fields.');
            return;
        }
        if (choreWindowStart >= choreWindowEnd) {
            showPopup('End time must be after start time.');
            return;
        }
        if (isNaN(Number(choreEffort)) || Number(choreEffort) <= 0) {
            showPopup('Effort must be a positive number.');
            return;
        }
        // Validate optional recurrence days (0..6). Negative not allowed; greater than 6 not allowed.
        let recurDaysNum: number | undefined = undefined;
        if (choreRecurDays !== '') {
            const n = Math.floor(Number(choreRecurDays));
            if (isNaN(n) || n < 0) {
                showPopup('Recurrence days must be a non-negative integer (max 6).');
                return;
            }
            if (n > 6) {
                showPopup('Recurrence days cannot be greater than 6.');
                return;
            }
            recurDaysNum = n;
        }
        showPopup('Chore added successfully!');
        const newChore = {
            name: chore,
            windowStart: choreWindowStart.toISOString(),
            windowEnd: choreWindowEnd.toISOString(),
            effort: Number(choreEffort),
            ...(recurDaysNum !== undefined ? { recurDays: recurDaysNum } : {}),
        };
        setChores([...chores, newChore]);
        setChore('');
        setChoreEffort('');
        setChoreWindowStart(new Date());
        setChoreWindowEnd(new Date());
        setChoreRecurDays('');
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
            setChoreRecurDays(
                typeof c.recurDays === 'number' && !isNaN(c.recurDays) ? String(c.recurDays) : ''
            );
            setOriginalEditValues({
                name: c.name,
                effort: String(c.effort),
                windowStart: new Date(c.windowStart),
                windowEnd: new Date(c.windowEnd),
                recurDays: typeof c.recurDays === 'number' ? c.recurDays : undefined,
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
            setChoreRecurDays(
                typeof originalEditValues.recurDays === 'number' ? String(originalEditValues.recurDays) : ''
            );
        }
        setEditMode(null);
        setOriginalEditValues(null);
    };
    // Edit handlers for each type
    const handleEditMeeting = () => {
        if (editMode && editMode.type === 'meeting') {
            if (!name || !recurrence || !startDateTime || !endDateTime || !location) {
                showPopup('Please fill in all fields.');
                return;
            }
            if (startDateTime >= endDateTime) {
                showPopup('End time must be after start time.');
                return;
            }
            const recurringCodes = ["daily","mon","tue","wed","thu","fri","sat","sun"]; 
            if (recurringCodes.includes(recurrence) && meetingRepeatEnd <= startDateTime) {
                showPopup('Repeat end date must be after start date for recurring meetings.');
                return;
            }
            // Update meetings state
            const updatedMeeting = {
                startTime: startDateTime.toISOString(),
                endTime: endDateTime.toISOString(),
                name,
                recurrence,
                link_or_loc: location,
                meetingID: meetings[editMode.index].meetingID,
                occurrenceID: meetings[editMode.index].occurrenceID,
                meetingRepeatEnd: recurringCodes.includes(recurrence) ? meetingRepeatEnd.toISOString() : undefined,
            };
            setMeetings(meetings.map((m, i) => i === editMode.index ? updatedMeeting : m));
            setEditMode(null);
            setName('');
            setStartDateTime(new Date());
            setEndDateTime(new Date());
            setRecurrence(null);
            setLocation('');
            setMeetingRepeatEnd(new Date());
            showPopup('Meeting updated!');
        }
    };
    const handleEditAssignment = () => {
        if (editMode && editMode.type === 'assignment') {
            if (assignment === '' || assignmentEffort === '' || date === null) {
                showPopup('Please fill in all fields.');
                return;
            }
            if (isNaN(Number(assignmentEffort)) || Number(assignmentEffort) <= 0) {
                showPopup('Effort must be a positive number.');
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
            showPopup('Assignment updated!');
        }
    };
    const handleEditChore = () => {
        if (editMode && editMode.type === 'chore') {
            if (chore === '' || choreEffort === '' || !choreWindowStart || !choreWindowEnd) {
                showPopup('Please fill in all fields.');
                return;
            }
            if (choreWindowStart >= choreWindowEnd) {
                showPopup('End time must be after start time.');
                return;
            }
            if (isNaN(Number(choreEffort)) || Number(choreEffort) <= 0) {
                showPopup('Effort must be a positive number.');
                return;
            }
            // Validate optional recurrence days for edit as well
            let recurDaysNum: number | undefined = undefined;
            if (choreRecurDays !== '') {
                const n = Math.floor(Number(choreRecurDays));
                if (isNaN(n) || n < 0) {
                    showPopup('Recurrence days must be a non-negative integer (max 6).');
                    return;
                }
                if (n > 6) {
                    showPopup('Recurrence days cannot be greater than 6.');
                    return;
                }
                recurDaysNum = n;
            }
            const updatedChore = {
                name: chore,
                windowStart: choreWindowStart.toISOString(),
                windowEnd: choreWindowEnd.toISOString(),
                effort: Number(choreEffort),
                ...(recurDaysNum !== undefined ? { recurDays: recurDaysNum } : { recurDays: undefined as any }),
            };
            setChores(chores.map((c, i) => i === editMode.index ? updatedChore : c));
            setEditMode(null);
            setChore('');
            setChoreEffort('');
            setChoreWindowStart(new Date());
            setChoreWindowEnd(new Date());
            setChoreRecurDays('');
            showPopup('Chore updated!');
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

    const [showMeetingInfo, setShowMeetingInfo] = useState(false);
    const [showAssignmentInfo, setShowAssignmentInfo] = useState(false);
    const [showChoreInfo, setShowChoreInfo] = useState(false);
    const [showEventsInfo, setShowEventsInfo] = useState(false);

    const InfoModal: React.FC<{ show: boolean; onClose: () => void; title: string; content: string; gradient: string; }> = ({ show, onClose, title, content, gradient }) => {
        if (!show) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`relative rounded-3xl p-6 w-full max-w-lg border-4 border-orange-400 shadow-xl ${gradient}`} style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                    <h3 className="text-2xl font-bold text-teal-800 mb-4">{title}</h3>
                    <p className="text-teal-800 text-lg leading-snug whitespace-pre-line">{content}</p>
                    <button
                        onClick={onClose}
                        className="mt-6 w-full bg-gradient-to-r from-teal-500 to-blue-500 text-white font-bold py-2 px-4 rounded-2xl hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex flex-col relative" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
            {/* Info Modals */}
            <InfoModal
                show={showMeetingInfo}
                onClose={() => setShowMeetingInfo(false)}
                title="Meetings"
                content={"Meetings are fixed blocks of times that you cannot do other work in. Examples of this are work meetings, classes, other reservations. You can also schedule recurring meetings easily. Check the Events tab once you schedule a meeting!"}
                gradient="bg-gradient-to-br from-blue-200 to-blue-300"
            />
            <InfoModal
                show={showAssignmentInfo}
                onClose={() => setShowAssignmentInfo(false)}
                title="Assignments"
                content={"This is work that you need to get done on a hard deadline. Examples include homework, work deadlines, and other commitments. Checkout the events tab too see all assignments you select!"}
                gradient="bg-gradient-to-br from-yellow-200 to-yellow-300"
            />
            <InfoModal
                show={showChoreInfo}
                onClose={() => setShowChoreInfo(false)}
                title="Chores"
                content={"A piece of work that is not on priority, though it must be done eventually. You want to get it done between a specific window. These can be recurring, like home chores. You can see all selected chores in the events tab!"}
                gradient="bg-gradient-to-br from-green-200 to-green-300"
            />
            <InfoModal
                show={showEventsInfo}
                onClose={() => setShowEventsInfo(false)}
                title="Events"
                content={"All you selected events can be seen here. Submit this to generate the potential schedules you can pick from. No events will be schedule between 11 pm and 5 am. You can also edit or delete events from here."}
                gradient="bg-gradient-to-br from-stone-200 to-stone-300"
            />
            {/* Existing modal for edit/delete */}
            {renderModal()}
            {/* Tab Navigation */}
            <div className="relative z-10 px-4 pt-6">
                <div className="flex bg-white bg-opacity-20 rounded-3xl p-2 backdrop-blur-sm border-4 border-orange-400">
                    {navItems.map((item) => (
                        <button
                            key={item.label}
                            data-testid={item.label === 'Events' ? 'nav-events' : undefined}
                            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-teal-800 flex items-center justify-center gap-2 transition-all duration-200 ${
                                selected === item.label
                                    ? 'bg-white shadow-lg transform scale-105'
                                    : 'hover:bg-white hover:bg-opacity-30'
                            }`}
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            onClick={() => setSelected(item.label)}
                        >
                            {/* <item.icon className="text-lg" /> */}
                            <item.icon size={20} />
                            <span className="hidden sm:inline">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Meeting Tab */}
            {selected === 'Meeting' && (
                <div className="flex-1 relative z-10 px-4 pb-4">
                    <div className="bg-gradient-to-br from-blue-200 to-blue-300 rounded-3xl p-6 border-4 border-orange-400 shadow-lg relative">
                        {/* Info button */}
                        <button
                            type="button"
                            aria-label="Meeting information"
                            onClick={() => setShowMeetingInfo(true)}
                            className="absolute top-3 left-3 w-9 h-9 flex items-center justify-center rounded-full bg-blue-400 text-teal-900 font-extrabold border-2 border-blue-600 shadow hover:scale-110 hover:bg-blue-500 transition"
                        >?
                        </button>
                        <h2 className="text-3xl font-bold text-teal-800 text-center mb-6" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            {editMode && editMode.type === 'meeting' ? 'Edit Meeting' : 'Set up Meeting'}
                        </h2>
                        
                        <input
                            className="border-4 border-blue-400 rounded-2xl p-3 text-teal-800 bg-blue-100 w-full mb-4 font-bold"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            placeholder="Meeting Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <input
                            className="border-4 border-blue-400 rounded-2xl p-3 text-teal-800 bg-blue-100 w-full mb-4 font-bold"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            placeholder="Location/Link"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />

                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Start Time:</label>
                                <input
                                    type="datetime-local"
                                    value={formatDateTimeLocal(startDateTime)}
                                    onChange={(e) => setStartDateTime(new Date(e.target.value))}
                                    className="border-4 border-blue-400 rounded-2xl p-3 text-teal-800 bg-blue-100 w-full font-bold"
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                />
                            </div>

                            <div className="flex-1">
                                <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>End Time:</label>
                                <input
                                    type="datetime-local"
                                    value={formatDateTimeLocal(endDateTime)}
                                    onChange={(e) => setEndDateTime(new Date(e.target.value))}
                                    className="border-4 border-blue-400 rounded-2xl p-3 text-teal-800 bg-blue-100 w-full font-bold"
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Recurrence:</label>
                            <select
                                value={recurrence || ''}
                                onChange={(e) => setRecurrence(e.target.value || null)}
                                className="border-4 border-blue-400 rounded-2xl p-3 text-teal-800 bg-blue-100 w-full font-bold"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
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

                        {(recurrence === "daily" || recurrence === "mon" || recurrence === "tue" 
                            || recurrence === "wed" || recurrence === "thu" || recurrence === "fri" ||
                            recurrence === "sat" || recurrence === "sun" 
                        ) && (
                            <div className="mb-4">
                                <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>End Repeat Date:</label>
                                <input
                                    type="date"
                                    value={formatDateLocal(meetingRepeatEnd)}
                                    onChange={(e) => setMeetingRepeatEnd(new Date(e.target.value))}
                                    className="border-4 border-blue-400 rounded-2xl p-3 text-teal-800 bg-blue-100 w-full font-bold"
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                />
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            <button
                                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl py-3 text-white font-bold hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={editMode && editMode.type === 'meeting' ? handleEditMeeting : handleMeeting}
                            >
                                {editMode && editMode.type === 'meeting' ? 'Update Meeting' : 'Add Meeting'}
                            </button>

                            <button
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl py-3 text-white font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={handlePrev}
                            >
                                Go to Home
                            </button>
                        </div>

                        {editMode && editMode.type === 'meeting' && (
                            <button
                                className="w-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl py-3 text-white font-bold hover:from-gray-500 hover:to-gray-600 transform hover:scale-105 transition-all duration-200 shadow-lg mt-4"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={handleDiscardEdit}
                            >
                                Discard Changes
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Assignment Tab */}
            {selected === "Assignment" && (
                <div className="flex-1 relative z-10 px-4 pb-4">
                    <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 rounded-3xl p-6 border-4 border-orange-400 shadow-lg relative">
                        <button
                            type="button"
                            aria-label="Assignment information"
                            onClick={() => setShowAssignmentInfo(true)}
                            className="absolute top-3 left-3 w-9 h-9 flex items-center justify-center rounded-full bg-yellow-400 text-teal-900 font-extrabold border-2 border-yellow-600 shadow hover:scale-110 hover:bg-yellow-500 transition"
                        >?
                        </button>
                        <h2 className="text-3xl font-bold text-teal-800 text-center mb-6" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            {editMode && editMode.type === 'assignment' ? 'Edit Assignment' : 'Set up Assignment'}
                        </h2>
                        
                        <input
                            className="border-4 border-yellow-400 rounded-2xl p-3 text-teal-800 bg-yellow-100 w-full mb-4 font-bold"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            placeholder="Assignment Name"
                            value={assignment}
                            onChange={(e) => setAssignment(e.target.value)}
                        />

                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Effort (minutes):</label>
                                <input
                                    type="number"
                                    className="border-4 border-yellow-400 rounded-2xl p-3 text-teal-800 bg-yellow-100 w-full font-bold"
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                    placeholder="Effort in minutes"
                                    value={assignmentEffort}
                                    onChange={(e) => setAssignmentEffort(e.target.value)}
                                />
                            </div>

                            <div className="flex-1">
                                <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Deadline:</label>
                                <input
                                    type="datetime-local"
                                    value={formatDateTimeLocal(date)}
                                    onChange={(e) => setDate(new Date(e.target.value))}
                                    className="border-4 border-yellow-400 rounded-2xl p-3 text-teal-800 bg-yellow-100 w-full font-bold"
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl py-3 text-white font-bold hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={editMode && editMode.type === 'assignment' ? handleEditAssignment : handleAssignment}
                            >
                                {editMode && editMode.type === 'assignment' ? 'Update Assignment' : 'Add Assignment'}
                            </button>

                            <button
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl py-3 text-white font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={handlePrev}
                            >
                                Go to Home
                            </button>
                        </div>

                        {editMode && editMode.type === 'assignment' && (
                            <button
                                className="w-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl py-3 text-white font-bold hover:from-gray-500 hover:to-gray-600 transform hover:scale-105 transition-all duration-200 shadow-lg mt-4"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={handleDiscardEdit}
                            >
                                Discard Changes
                            </button>
                        )}
                    </div>
                </div>
            )}
                 

            {/* Chore/Study Tab */}
            {selected === "Chore/Study" && (
                <div className="flex-1 relative z-10 px-4 pb-4">
                    <div className="bg-gradient-to-br from-green-200 to-green-300 rounded-3xl p-6 border-4 border-orange-400 shadow-lg relative">
                        <button
                            type="button"
                            aria-label="Chore information"
                            onClick={() => setShowChoreInfo(true)}
                            className="absolute top-3 left-3 w-9 h-9 flex items-center justify-center rounded-full bg-green-400 text-teal-900 font-extrabold border-2 border-green-600 shadow hover:scale-110 hover:bg-green-500 transition"
                        >?
                        </button>
                        <h2 className="text-3xl font-bold text-teal-800 text-center mb-6" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            {editMode && editMode.type === 'chore' ? 'Edit Chore/Study' : 'Set up Chore/Study'}
                        </h2>
                        
                        <input
                            className="border-4 border-green-400 rounded-2xl p-3 text-teal-800 bg-green-100 w-full mb-4 font-bold"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            placeholder="Chore/Study Name"
                            value={chore}
                            onChange={(e) => setChore(e.target.value)}
                        />

                        <div className="mb-4">
                            <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Effort (minutes):</label>
                            <input
                                type="number"
                                className="border-4 border-green-400 rounded-2xl p-3 text-teal-800 bg-green-100 w-full font-bold"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                placeholder="Effort in minutes"
                                value={choreEffort}
                                onChange={(e) => setChoreEffort(e.target.value)}
                            />
                        </div>

                        <div className="flex gap-4 mb-4">
                            <div className="flex-1">
                                <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Window Start:</label>
                                <input
                                    type="datetime-local"
                                    value={formatDateTimeLocal(choreWindowStart)}
                                    onChange={(e) => setChoreWindowStart(new Date(e.target.value))}
                                    className="border-4 border-green-400 rounded-2xl p-3 text-teal-800 bg-green-100 w-full font-bold"
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                />
                            </div>

                            <div className="flex-1">
                                <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Window End:</label>
                                <input
                                    type="datetime-local"
                                    value={formatDateTimeLocal(choreWindowEnd)}
                                    onChange={(e) => setChoreWindowEnd(new Date(e.target.value))}
                                    className="border-4 border-green-400 rounded-2xl p-3 text-teal-800 bg-green-100 w-full font-bold"
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="text-lg text-teal-800 mb-2 block font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                                Recur for how many of the next days? (optional, max 6)
                            </label>
                            <input
                                type="number"
                                min={0}
                                max={6}
                                step={1}
                                value={choreRecurDays}
                                onChange={(e) => {
                                    // Clamp to [0,6] and ensure integers only
                                    const raw = e.target.value;
                                    if (raw === '') {
                                        setChoreRecurDays('');
                                        return;
                                    }
                                    let n = Math.floor(Number(raw));
                                    if (isNaN(n)) n = 0;
                                    if (n < 0) n = 0;
                                    if (n > 6) n = 6;
                                    setChoreRecurDays(String(n));
                                }}
                                className="border-4 border-green-400 rounded-2xl p-3 text-teal-800 bg-green-100 w-full font-bold"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                placeholder="0 - 6"
                            />
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                className="flex-1 bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl py-3 text-white font-bold hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={editMode && editMode.type === 'chore' ? handleEditChore : handleChore}
                            >
                                {editMode && editMode.type === 'chore' ? 'Update Chore' : 'Add Chore'}
                            </button>

                            <button
                                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl py-3 text-white font-bold hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={handlePrev}
                            >
                                Go to Home
                            </button>
                        </div>

                        {editMode && editMode.type === 'chore' && (
                            <button
                                className="w-full bg-gradient-to-r from-gray-400 to-gray-500 rounded-2xl py-3 text-white font-bold hover:from-gray-500 hover:to-gray-600 transform hover:scale-105 transition-all duration-200 shadow-lg mt-4"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={handleDiscardEdit}
                            >
                                Discard Changes
                            </button>
                        )}
                    </div>
                </div>
            )}


            {/* Events Tab */}
            {selected === "Events" && (
                <div className="flex-1 relative z-10 px-4 pb-4">
                    <h2 className="text-3xl font-bold text-teal-800 text-center mb-6 pt-4 relative" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                        <button
                            type="button"
                            aria-label="Events information"
                            onClick={() => setShowEventsInfo(true)}
                            className="absolute -left-2 top-0 w-9 h-9 flex items-center justify-center rounded-full bg-stone-400 text-teal-900 font-extrabold border-2 border-stone-500 shadow hover:scale-110 hover:bg-stone-500 transition"
                        >?
                        </button>
                        Events
                    </h2>

                    {/* Meetings section */}
                    <h3 className="text-2xl font-semibold text-teal-800 mb-4" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Meetings:</h3>
                    <div className="overflow-x-auto whitespace-nowrap pb-4">
                        <div className="flex gap-4">
                            {meetings.map((meeting, index) => (
                                <button 
                                    key={index} 
                                    className="bg-gradient-to-br from-blue-200 to-blue-300 border-4 border-orange-400 rounded-2xl p-4 min-w-48 flex-shrink-0 hover:from-blue-300 hover:to-blue-400 transition-all duration-200 transform hover:scale-105 shadow-lg" 
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                    onClick={() => editDeleteMeeting(index)}
                                >
                                    <div className="text-lg font-semibold text-teal-800 mb-1">
                                        {format(new Date(meeting.startTime), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-lg text-teal-800 mb-1">
                                        {format(new Date(meeting.endTime), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-xl text-teal-800 font-bold mb-2">{meeting.name}</div>
                                    <div className="text-base text-teal-700 mb-1">{meeting.link_or_loc}</div>
                                    <div className="text-base text-teal-700">{meeting.recurrence}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Assignments section */}
                    <h3 className="text-2xl font-semibold text-teal-800 mb-4" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Assignments:</h3>
                    <div className="overflow-x-auto whitespace-nowrap pb-4">
                        <div className="flex gap-4">
                            {assignments.map((assignment, index) => (
                                <button 
                                    key={index} 
                                    className="bg-gradient-to-br from-yellow-200 to-yellow-300 border-4 border-orange-400 rounded-2xl p-4 min-w-48 flex-shrink-0 hover:from-yellow-300 hover:to-yellow-400 transition-all duration-200 transform hover:scale-105 shadow-lg" 
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                    onClick={() => editDeleteAssignment(index)}
                                >
                                    <div className="text-lg font-semibold text-teal-800 mb-1">
                                        {format(new Date(assignment.deadline), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-base text-teal-700 mb-1">
                                        {assignment.effort} min
                                    </div>
                                    <div className="text-xl text-teal-800 font-bold">{assignment.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Chores section */}
                    <h3 className="text-2xl font-semibold text-teal-800 mb-4" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Chores/Studies:</h3>
                    <div className="overflow-x-auto whitespace-nowrap pb-4">
                        <div className="flex gap-4">
                            {chores.map((chore, index) => (
                                <button 
                                    key={index} 
                                    className="bg-gradient-to-br from-green-200 to-green-300 border-4 border-orange-400 rounded-2xl p-4 min-w-48 flex-shrink-0 hover:from-green-300 hover:to-green-400 transition-all duration-200 transform hover:scale-105 shadow-lg" 
                                    style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                    onClick={() => editDeleteChore(index)}
                                >
                                    <div className="text-lg font-semibold text-teal-800 mb-1">
                                        {format(new Date(chore.windowStart), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-lg text-teal-800 mb-1">
                                        {format(new Date(chore.windowEnd), "MMM dd, yyyy - h:mm a")}
                                    </div>
                                    <div className="text-base text-teal-700 mb-1">
                                        {chore.effort} min
                                    </div>
                                    <div className="text-xl text-teal-800 font-bold">{chore.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        data-testid="submit-schedule"
                        className="w-full bg-gradient-to-r from-teal-500 to-blue-500 rounded-2xl py-3 text-white font-bold hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg mt-6"
                        style={{ fontFamily: 'Pixelify Sans, monospace' }}
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
