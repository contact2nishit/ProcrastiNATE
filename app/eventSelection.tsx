import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Alert, View, SafeAreaView, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import config from './config';


export default function EventSelection() 
{
  const [selected, setSelected] = useState('Meeting');

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

  const [open, setOpen] = useState(false);
  const [recurrence, setRecurrence] = useState<string | null>(null);
  const [items, setItems] = useState([
    { label: 'Daily', value: 'Daily' },
    { label: 'Once', value: 'Once' },
    { label: 'Every Mon', value: 'Mon' }
  ]);

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
    { label: 'Meeting', icon: 'calendar-alt' },
    { label: 'Assignment', icon: 'book' },
    { label: 'Chore/Study', icon: 'tasks' },
    { label: 'Events', icon: 'calendar-check' },
  ];

  const navigation = useNavigation();
  const [date, setDate] = useState(new Date());
  // const [showDatePicker, setShowDatePicker] = useState(false);

  // Local state for meetings, assignments, and chores
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  //Will fix this one as well later using useChoreContext() function
  const [chores, setChores] = useState<Chore[]>([]);

  // Track if we're editing and which item is being edited
  const [editMode, setEditMode] = useState<null | { type: 'meeting' | 'assignment' | 'chore', index: number }> (null);

  // Maintain a JSON object matching the backend schemas
  type BackendJSON = {
    meetings: Array<{ name: string; start_end_times: [string, string][]; link_or_loc: string | null }>;
    assignments: Array<{ name: string; effort: number; due: string }>;
    chores: Array<{ name: string; window: [string, string]; effort: number }>;
  };
  const [backendJSON, setBackendJSON] = useState<BackendJSON>({
    meetings: [],
    assignments: [],
    chores: [],
  });

  // Helper to update backendJSON after adding an item
  const updateBackendJSON = (
    type: 'meetings' | 'assignments' | 'chores',
    item: any,
    recurrence: string | null = null
  ) => {
    setBackendJSON(prev => {
      const updated = { ...prev };
      // For meetings, handle recurrence: add a new occurrence if meeting with same name exists
      if (type === 'meetings' && recurrence) {
        // Find if meeting with same name exists
      const idx = updated.meetings.findIndex((m: any) => m.name === item.name);
        if (idx !== -1) {
          // Append occurrence to start_end_times
          updated.meetings[idx] = {
            ...updated.meetings[idx],
            start_end_times: [
              ...(updated.meetings[idx].start_end_times || []),
              ...item.start_end_times
            ]
          };
        } else {
          updated.meetings = [...updated.meetings, item];
        }
      } else {
        (updated[type] as any[]).push(item);
      }
      return updated;
    });
  };

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
      const token = await AsyncStorage.getItem('token');
      if (!url) {
        alert('Backend URL not set.');
        return;
      }
      // Get device timezone offset in minutes (JavaScript: getTimezoneOffset returns minutes behind UTC, so invert sign)
      const tz_offset_minutes = -new Date().getTimezoneOffset();
      const reqBody = { ...backendJSON, tz_offset_minutes };
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
      // Fix: AsyncStorage only stores strings, so use JSON.stringify
      await AsyncStorage.setItem("schedules", JSON.stringify(data));
      // Clear the scheduling cart after successful scheduling
      setMeetings([]);
      setAssignments([]);
      setChores([]);
      setBackendJSON({ meetings: [], assignments: [], chores: [] });
      navigation.navigate('schedulePicker', { scheduleData: data }); // If TS error, cast navigation as any
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

    // Generate all occurrences for MeetingInRequest
    const start_end_times = generateMeetingOccurrences(
      startDateTime,
      endDateTime,
      recurrence && typeof recurrence === "string" ? recurrence.toLowerCase() : null,
      meetingRepeatEnd
    );

    updateBackendJSON(
      'meetings',
      {
        name,
        start_end_times,
        link_or_loc: null,
      }
    );

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

    // Backend schema: AssignmentInRequest
    updateBackendJSON('assignments', {
      name: assignment,
      effort: Number(assignmentEffort),
      due: date.toISOString(),
    });

    setAssignment('');
    setAssignmentEffort('');
    setDate(new Date());
    console.log(backendJSON);
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

    // Backend schema: ChoreInRequest
    updateBackendJSON('chores', {
      name: chore,
      window: [choreWindowStart.toISOString(), choreWindowEnd.toISOString()],
      effort: Number(choreEffort),
    });

    setChore('');
    setChoreEffort('');
    setChoreWindowStart(new Date());
    setChoreWindowEnd(new Date());
  };


  const handlePrev = () => {
    (navigation as any).replace('Home'); // If TS error, cast navigation as any
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
  }, [editMode]);

  // Discard edit handler
  const handleDiscardEdit = () => {
    if (!editMode || !originalEditValues) {
      setEditMode(null);
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
      // Update backendJSON
      const start_end_times = generateMeetingOccurrences(
        startDateTime,
        endDateTime,
        recurrence && typeof recurrence === "string" ? recurrence.toLowerCase() : null,
        meetingRepeatEnd
      );
      setBackendJSON(prev => ({
        ...prev,
        meetings: prev.meetings.map((m, i) =>
          i === editMode.index
            ? { name, start_end_times, link_or_loc: null }
            : m
        )
      }));
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
      setBackendJSON(prev => ({
        ...prev,
        assignments: prev.assignments.map((a, i) =>
          i === editMode.index
            ? { name: assignment, effort: Number(assignmentEffort), due: date.toISOString() }
            : a
        )
      }));
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
      setBackendJSON(prev => ({
        ...prev,
        chores: prev.chores.map((c, i) =>
          i === editMode.index
            ? { name: chore, window: [choreWindowStart.toISOString(), choreWindowEnd.toISOString()], effort: Number(choreEffort) }
            : c
        )
      }));
      setEditMode(null);
      setChore('');
      setChoreEffort('');
      setChoreWindowStart(new Date());
      setChoreWindowEnd(new Date());
      alert('Chore updated!');
    }
  };

  //Function to handle editing or deleting a meeting:
  const editDeleteMeeting = (index) => 
  {
    const meeting = meetings[index];
    Alert.alert(
      'Meeting Options',
      `Meeting: ${meeting.name}\nStart Time: ${format(new Date(meeting.startTime), "MMM dd, yyyy - h:mm a")}\nEnd Time: ${format(new Date(meeting.endTime), "MMM dd, yyyy - h:mm a")}\nMeeting Location: ${meeting.link_or_loc}\nMeeting Recurrence: ${meeting.recurrence}`,
      [
        {
          text: 'Edit',
          onPress: () => {
            setEditMode({ type: 'meeting', index });
          }, 
        },
        {
          text: 'Delete',
          onPress: () => {
            setMeetings(meetings.filter((_, i) => i !== index));
            setBackendJSON(prev => ({
              ...prev,
              meetings: prev.meetings.filter((_, i) => i !== index)
            }));
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  }

  //Function to handle editing or deleting an assignment:
  const editDeleteAssignment = (index) => 
  {
    const assignment = assignments[index];
    Alert.alert(
      'Assignment Options',
      `Assignment: ${assignment.name}\nEffort: ${assignment.effort} min\nDeadline: ${format(new Date(assignment.deadline), "MMM dd, yyyy - h:mm a")}`,
      [
        {
          text: 'Edit',
          onPress: () => {
            setEditMode({ type: 'assignment', index });
          },
        },
        {
          text: 'Delete',
          onPress: () => {
            setAssignments(assignments.filter((_, i) => i !== index));
            setBackendJSON(prev => ({
              ...prev,
              assignments: prev.assignments.filter((_, i) => i !== index)
            }));
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  }

  //Function to handle editing or deleting a chore:
  const editDeleteChore = (index) => 
  {
    const chore = chores[index];
    Alert.alert(
      'Chore Options',
      `Chore: ${chore.name}\nEffort: ${chore.effort} min\nDeadline: ${format(new Date(chore.windowEnd), "MMM dd, yyyy - h:mm a")}`,
      [
        {
          text: 'Edit',
          onPress: () => {
            setEditMode({ type: 'chore', index });
          },
        },
        {
          text: 'Delete',
          onPress: () => {
            setChores(chores.filter((_, i) => i !== index));
            setBackendJSON(prev => ({
              ...prev,
              chores: prev.chores.filter((_, i) => i !== index)
            }));
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
    );
  }
  


  return (
    
    <SafeAreaView style={styles.container}>
      <View style={styles.navBar}>
        {navItems.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.navButton,
              selected === item.label && styles.navButtonSelected,
            ]}
            onPress={() => {setSelected(item.label);
              console.log(backendJSON);
            }}
            // Don't want flickers when switching between tabs
            activeOpacity={0.8}
          >
            <FontAwesome5
              name={item.icon}
              size={16}
              color={selected === item.label ? 'white' : 'black'}
              style={{ marginBottom: 5 }}
            />
            <Text
              style={[
                styles.navButtonText,
                selected === item.label && styles.navButtonTextSelected,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected === 'Meeting' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.containerMeeting} keyboardShouldPersistTaps="handled">
            <Text style={styles.header}>{editMode && editMode.type === 'meeting' ? 'Edit Meeting' : 'Set up a Meeting'}</Text>

            <Text style={styles.meetingTime}>
              Start Time:
            </Text>
            <View style={styles.pickerWrapperMeeting}>
              <DateTimePicker
                testID="meetingStartTimePicker"
                value={startDateTime}
                mode="datetime"
                display="compact"
                textColor="white"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setStartDateTime(selectedDate);
                }}
                style={styles.pickerMeeting}
              />
            </View>

            <Text style={styles.meetingTime2}>
              End Time:
            </Text>
            <View style={styles.pickerWrapperMeeting}>
              <DateTimePicker
                testID="meetingEndTimePicker"
                value={endDateTime}
                mode="datetime"
                display="compact"
                textColor="white"
                onChange={(event, selectedDate) => {
                  if (selectedDate) setEndDateTime(selectedDate);
                }}
                style={styles.pickerMeeting}
              />
            </View>

            {/* Add End Repeat Date Picker for recurring meetings */}
            {(recurrence === "daily" || recurrence === "mon" || recurrence === "tue" 
              || recurrence === "wed" || recurrence === "thu" || recurrence === "fri" ||
              recurrence === "sat" || recurrence === "sun" 
            ) && (
              <>
                <Text style={styles.meetingTime2}>
                  End Repeat Date:
                </Text>
                <View style={styles.pickerWrapperMeeting}>
                  <DateTimePicker
                    testID="meetingRepeatEndPicker"
                    value={meetingRepeatEnd}
                    mode="date"
                    display="compact"
                    textColor="white"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) setMeetingRepeatEnd(selectedDate);
                    }}
                    style={styles.pickerMeeting}
                  />
                </View>
              </>
            )}

            <Text style={styles.meetingName}>Name:</Text>
            <TextInput
              style={styles.input}
              placeholder="Meeting"
              placeholderTextColor="#aaa"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.meetingLocation}>Link / Location:</Text>
            <TextInput
              style={styles.input}
              placeholder="Link/location"
              placeholderTextColor="#aaa"
              value={location}
              onChangeText={setLocation}
            />

            {/* Place to add the dropdown for meeting recurrence: */}
            <Text style={styles.meetingRecurrence}>Recurrence:</Text>
              <View style={styles.pickerWrapperMeeting}>
                <Picker
                  selectedValue={recurrence}
                  onValueChange={setRecurrence}
                  style={styles.pickerMeeting}
                  itemStyle={styles.pickerMeetingItem}
                >
                  <Picker.Item label="Select Frequency" value={null} />
                  <Picker.Item label="Once" value="once" />
                  <Picker.Item label="Daily" value="daily" />
                  <Picker.Item label="Every Mon" value="mon" />
                  <Picker.Item label="Every Tue" value="tue" />
                  <Picker.Item label="Every Wed" value="wed" />
                  <Picker.Item label="Every Thu" value="thu" />
                  <Picker.Item label="Every Fri" value="fri" />
                  <Picker.Item label="Every Sat" value="sat" />
                  <Picker.Item label="Every Sun" value="sun" />
                </Picker>
              </View>

            <TouchableOpacity
              style={styles.addButton}
              onPress={editMode && editMode.type === 'meeting' ? handleEditMeeting : handleMeeting}
            >
              <Text style={styles.eventText}>{editMode && editMode.type === 'meeting' ? 'Update Meeting' : 'Add Event'}</Text>
            </TouchableOpacity>
            {editMode && editMode.type === 'meeting' && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#ccc', marginTop: 10 }]}
                onPress={handleDiscardEdit}
              >
                <Text style={[styles.eventText, { color: '#222' }]}>Discard Changes</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.backButton} onPress = {handlePrev}>
              <Text style={styles.eventText}>Go to Home</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {selected === "Assignment" && (
        <>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible = {false}>
            <SafeAreaView>
              <Text style={styles.header}>{editMode && editMode.type === 'assignment' ? 'Edit Assignment' : 'Set up an Assignment'}</Text>

              <Text style={styles.assignmentName}>Name:</Text>
              <TextInput
                style={styles.input2}
                placeholder="Assignment"
                placeholderTextColor="#aaa"
                value={assignment}
                onChangeText={setAssignment}
              />

              <Text style={styles.assignmentEffort}>Effort (minutes):</Text>
              <TextInput
                style={styles.input2}
                placeholder="Effort in minutes"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={assignmentEffort}
                onChangeText={setAssignmentEffort}
              />

              <Text style={styles.assignmentDeadline}>Deadline:</Text>
              <View style={styles.pickerWrapper2}>
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode="datetime"
                  display="compact"
                  textColor="white"
                  onChange={onDateChange}
                  style={styles.pickerIOS2}
                />
              </View>

              <TouchableOpacity
                style={styles.addAssignment}
                onPress={editMode && editMode.type === 'assignment' ? handleEditAssignment : handleAssignment}
              >
                <Text style={styles.eventText}>{editMode && editMode.type === 'assignment' ? 'Update Assignment' : 'Add Event'}</Text>
              </TouchableOpacity>
              {editMode && editMode.type === 'assignment' && (
                <TouchableOpacity
                  style={[styles.addAssignment, { backgroundColor: '#ccc', marginTop: 10 }]}
                  onPress={handleDiscardEdit}
                >
                  <Text style={[styles.eventText, { color: '#222' }]}>Discard Changes</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.backButton2} 
                onPress={() => {
                  navigation.replace('Home');
                }}
              >
                <Text style={styles.eventText}>Go to home</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </>
      )}

      {selected === "Chore/Study" && (
        <>
          <TouchableWithoutFeedback onPress = {Keyboard.dismiss} accessible = {false}>
            <SafeAreaView>
              <Text style={styles.header}>{editMode && editMode.type === 'chore' ? 'Edit Chore/Study' : 'Set up Chore/Study'}</Text>

              <Text style={styles.choreName}>Name:</Text>
              <TextInput
                style={styles.input2}
                placeholder="Chore"
                placeholderTextColor="#aaa"
                value={chore}
                onChangeText={setChore}
              />

              <Text style={styles.choreEffort}>Effort (minutes):</Text>
              <TextInput
                style={styles.input2}
                placeholder="Effort in minutes"
                placeholderTextColor="#aaa"
                keyboardType="numeric"
                value={choreEffort}
                onChangeText={setChoreEffort}
              />

              <Text style={styles.choreStartDeadline}>Window Start:</Text>
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  testID="choreWindowStartPicker"
                  value={choreWindowStart}
                  mode="datetime"
                  display="compact"
                  textColor="white"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setChoreWindowStart(selectedDate);
                  }}
                  style={styles.pickerIOS}
                />
              </View>

              <Text style={styles.choreEndDeadline}>Window End:</Text>
              <View style={styles.pickerWrapper}>
                <DateTimePicker
                  testID="choreWindowEndPicker"
                  value={choreWindowEnd}
                  mode="datetime"
                  display="compact"
                  textColor="white"
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setChoreWindowEnd(selectedDate);
                  }}
                  style={styles.pickerIOS}
                />
              </View>

              <TouchableOpacity
                style={styles.addChore}
                onPress={editMode && editMode.type === 'chore' ? handleEditChore : handleChore}
              >
                <Text style={styles.eventText}>{editMode && editMode.type === 'chore' ? 'Update Chore' : 'Add Event'}</Text>
              </TouchableOpacity>
              {editMode && editMode.type === 'chore' && (
                <TouchableOpacity
                  style={[styles.addChore, { backgroundColor: '#ccc', marginTop: 10 }]}
                  onPress={handleDiscardEdit}
                >
                  <Text style={[styles.eventText, { color: '#222' }]}>Discard Changes</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.backButton2} 
                onPress={() => {
                  navigation.replace('Home');
                }}
              >
                <Text style={styles.eventText}>Go to home</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </TouchableWithoutFeedback>
        </>
      )}


      {selected === "Events" && (
        <>

          <SafeAreaView>
            <Text style = {styles.header}>
              Events
            </Text>

            {/* This section shows all of the meetings that the user has added to their
            schedule */}
            <Text style = {styles.meetingsSection}>
              Meetings:
            </Text>
            {/* We need to map over all of the meetings and render each of them in 
            a horizantal list fashion */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              {meetings.map((meeting, index) => (
                <TouchableOpacity key={index} style={styles.individualMeeting} onPress={() => editDeleteMeeting(index)}>
                  <Text style={styles.meetingTimeForEvents}>
                    {format(new Date(meeting.startTime), "MMM dd, yyyy - h:mm a")}
                  </Text>
                  <Text style={styles.meetingTimeForEvents}>
                    {format(new Date(meeting.endTime), "MMM dd, yyyy - h:mm a")}
                  </Text>
                  <Text style={styles.meetingNameForEvents}>{meeting.name}</Text>
                  <Text style={styles.meetingLocationForEvents}>{meeting.link_or_loc}</Text>
                  <Text style={styles.meetingRecurrenceText}>{meeting.recurrence}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* This section shows all of the assignments that the user has added to their
            schedule */}
            <Text style = {styles.assignmentsSection}>
              Assignments:
            </Text>
            {/* We need to map over all of the assignments and render each of them in
            a horizantal list fashion */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              {assignments.map((assignment, index) => (
                <TouchableOpacity key={index} style={styles.individualAssignment} onPress={() => editDeleteAssignment(index)}>
                  <Text style={styles.assignmentTimeForEvents}>
                    {format(new Date(assignment.deadline), "MMM dd, yyyy - h:mm a")}
                  </Text>
                  <Text style = {styles.assignmentEffortForEvents}>
                    {assignment.effort} min
                  </Text>
                  <Text style={styles.assignmentNameForEvents}>{assignment.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* This section shows all of the chores that the user has added to their
            schedule */}
            <Text style = {styles.choresSection}>
              Chores/Studies:
            </Text>

            {/* We need to map over all of the chores and render each of them in
            a horizantal list fashion */}
            <ScrollView horizontal showsHorizontalScrollIndicator={true}>
              {chores.map((chore, index) => (
                <TouchableOpacity key={index} style={styles.individualChore} onPress={() => editDeleteChore(index)}>
                  <Text style = {styles.choreTimeForEvents}>
                    {format(new Date(chore.windowStart), "MMM dd, yyyy - h:mm a")}
                  </Text>
                  <Text style={styles.choreTimeForEvents}>
                    {format(new Date(chore.windowEnd), "MMM dd, yyyy - h:mm a")}
                  </Text>
                  <Text style = {styles.choreEffortForEvents}>
                    {chore.effort} min
                  </Text>
                  <Text style={styles.choreNameForEvents}>{chore.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={{
                backgroundColor: 'white',
                borderRadius: 8,
                paddingVertical: 12,
                margin: 20,
                alignSelf: 'center',
                width: '80%',
              }}
              onPress={submitSchedule}
            >
              <Text style={styles.eventText}>Submit Schedule</Text>
            </TouchableOpacity>

        
        

          </SafeAreaView>
        
        
        </>
      )}




    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'black',
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  navButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: 'white',
    alignItems: 'center',
    minWidth: 85,
  },
  navButtonSelected: {
    backgroundColor: 'black',
    borderColor: 'white',
    borderWidth: 1,
  },
  navButtonText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '500',
  },
  navButtonTextSelected: {
    color: 'white',
  },

  containerMeeting: {
    backgroundColor: 'black',
    paddingHorizontal: 20,
    paddingTop: 30,
    marginTop:-20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 20,
  },
  meetingTime: {
    fontSize: 18,
    color: 'white',
    marginBottom: -2,
  },
  meetingTime2: {
    fontSize: 18,
    color: 'white',
    marginTop: 30,
    marginBottom: -2,
  },

  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  colon: {
    fontSize: 24,
    color: 'white',
    marginHorizontal: 5,
  },

  picker: {
    height: 150,
    width: 100,
    color: 'white',
    backgroundColor: '#222',
    borderRadius: 20,
  },

  pickerItem:{
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    height: 120,
    lineHeight: 120,
  },

  pickerLast:
  {
    height: 150,
    width: 100,
    color: 'white',
    backgroundColor: '#222',
    borderRadius: 20,
    marginLeft:15,
  },

  pickerWrapperMeeting: {
    backgroundColor: '#222',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
  },

  pickerMeeting: {
    height: 130,
    width: 220,
    color: 'white',
    backgroundColor: 'gray',
    borderRadius: 20,
  },

  pickerMeetingItem: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    height: 120,
    lineHeight: 120,
  },

  meetingRecurrence:{
    fontSize: 18,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
  },

  meetingName: {
    fontSize: 18,
    color: 'white',
    marginTop: 30,
    marginBottom: 10,
  },

  meetingLocation:{
    fontSize: 18,
    color: 'white',
    marginTop: 30,
    marginBottom: 10,
  },

  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: 'white',
    backgroundColor: '#222',
  },

  input2:{
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: 'white',
    backgroundColor: '#222',
    marginLeft: 10,
    width: '90%',
  },

  addButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginTop: 60,
    paddingVertical: 12,
  },

  backButton:{
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop:8,

  },

  eventText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },

  eventText3:{
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },


  // Assignment Components:
  assignmentName:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginLeft: 10,
  },

  assignmentEffort:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginLeft: 10,
    marginTop:20,
  },

  choreName:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginLeft: 10,
  },

  choreEffort:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginLeft: 10,
    marginTop:20,
  },

  addAssignment:{
    backgroundColor:'white',
    borderRadius:8,
    paddingVertical:12,
    marginTop:140,
    width:'80%',
    alignSelf:'center',
  },

  addChore:{
    backgroundColor:'white',
    borderRadius:8,
    paddingVertical:12,
    marginTop:110,
    width:'80%',
    alignSelf:'center',
  },

  backButton2:{
    backgroundColor:'white',
    borderRadius:8,
    paddingVertical:12,
    marginTop:8,
    width:'80%',
    alignSelf:'center',
  },

  assignmentNum:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginTop:20,
    marginLeft: 10,
  },

  assignmentDeadline:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginTop:20,
    marginLeft: 10,
  },

  choreStartDeadline:{
    fontSize:20,
    color:'white',
    marginBottom:-2,
    marginTop:20,
    marginLeft: 10,
  },

  choreEndDeadline:{
    fontSize:20,
    color:'white',
    marginBottom:-2,
    marginTop:20,
    marginLeft: 10,
  },

  pickerWrapper: {
    backgroundColor: '#222',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 10,
  },

  pickerIOS: {
    backgroundColor: 'gray',
    borderRadius:10,
    width: 'auto',
  },

  pickerWrapper2:{
    backgroundColor: '#222',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 10,
  },

  pickerIOS2: {
    backgroundColor: 'gray',
    borderRadius:10,
    width: 'auto',
  },

  pickerAssignmentWrapper:{
    backgroundColor: 'black',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 10,
  },

  pickerAssignment:{
    marginVertical: 5, 
    zIndex: 1000, 
    width: 200,
  },

  pickerChoreWrapper:{
    backgroundColor: 'black',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 10,
    marginLeft: 10,
  },

  pickerChore:{
    marginVertical: 5, 
    zIndex: 1000, 
    width: 200,
  },

  // Events Section:

  meetingsSection:{
    fontSize: 20,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10,
  },

  // individualMeeting:{
  //   backgroundColor: 'white',
  //   padding: 10,
  //   borderRadius: 8,
  //   marginLeft: 10,
  //   width: 200,
  //   height:100,
  //   alignItems: 'center',
  //   color: 'black',
  // },

  // meetingTimeForEvents:{
  //   fontSize: 15,
  //   color: 'black',
  //   marginBottom: 5,
  // },

  // meetingNameForEvents:{
  //   fontSize: 14,
  //   color: 'black',
  //   fontWeight: 'bold',
  // },

  // meetingRecurrenceText:{
  //   fontSize: 16,
  //   color: 'black',
  //   marginTop: 2,
  //   fontWeight: 'bold',
  // },
  individualMeeting: {
    backgroundColor: '#f4f4f8',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android shadow
  },

meetingNameForEvents: {
  fontSize: 16,
  color: '#1a1a1a',
  fontWeight: '600',
  marginBottom: 2,
  marginTop:3,
},

meetingLocationForEvents:{
  fontSize: 16,
  color: 'black',
  fontWeight: '600',
  marginBottom: 4,
  marginTop:3,
},

meetingTimeForEvents: {
  fontSize: 14,
  color: '#555',
  marginBottom: 2,
},

meetingRecurrenceText: {
  fontSize: 14,
  color: '#3b82f6', // subtle blue to indicate recurring nature
  fontWeight: '500',
  marginTop:3,
  marginBottom:2,
},


  assignmentsSection:{
    fontSize: 20,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10,
  },

  individualAssignment: {
    backgroundColor: '#f4f4f8',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android shadow
  },

  assignmentTimeForEvents: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },

  assignmentEffortForEvents:
  {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },

  assignmentNameForEvents: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 2,
    marginTop:3,
  },

  choresSection:{
    fontSize: 20,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10,
  },

  individualChore: {
    backgroundColor: '#f4f4f8',
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // for Android shadow
  },

  choreTimeForEvents: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },

  choreNameForEvents: {
    fontSize: 16,
    color: '#1a1a1a',
    fontWeight: '600',
    marginBottom: 2,
    marginTop:3,
  },

  choreEffortForEvents:{
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },

  generateButton: {
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 80,
    width: '80%',
    alignSelf: 'center',
  },

  generateText: {
    color: 'black',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },




});
