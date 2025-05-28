import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Alert, View, SafeAreaView, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';
import { useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    recurrence: null | string;
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
  const [recurrence, setRecurrence] = useState(null);
  const [items, setItems] = useState([
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Once', value: 'Once' }
  ]);

  const [startDateTime, setStartDateTime] = useState(new Date());
  const [endDateTime, setEndDateTime] = useState(new Date());
  const [name, setName] = useState('');

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

  // list of all the meetings the user has added to their schedule
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [chores, setChores] = useState<Chore[]>([]);

  // Maintain a JSON object matching the backend schemas
  const [backendJSON, setBackendJSON] = useState({
    meetings: [],
    assignments: [],
    chores: [],
  });

  // Helper to update backendJSON after adding an item
  const updateBackendJSON = (type, item, recurrence = null) => {
    setBackendJSON(prev => {
      const updated = { ...prev };
      // For meetings, handle recurrence: add a new occurrence if meeting with same name exists
      if (type === 'meetings' && recurrence) {
        // Find if meeting with same name exists
        const idx = updated.meetings.findIndex(m => m.name === item.name);
        if (idx !== -1) {
          // Append occurrence to start_end_times
          updated.meetings[idx] = {
            ...updated.meetings[idx],
            start_end_times: [
              ...updated.meetings[idx].start_end_times,
              ...item.start_end_times
            ]
          };
        } else {
          updated.meetings = [...updated.meetings, item];
        }
      } else {
        updated[type] = [...updated[type], item];
      }
      return updated;
    });
  };

  const onDateChange = (event, selectedDate) => {
    const currDate = selectedDate || date;
    setDate(currDate);
  }

   const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const submitSchedule = async () => {
    try {
      const url = await AsyncStorage.getItem('backendURL');
      const token = await AsyncStorage.getItem('token');
      if (!url) {
        alert('Backend URL not set.');
        return;
      }
      const response = await fetch(`${url}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(backendJSON),
      });
      if (!response.ok) {
        const err = await response.text();
        alert('Failed to submit schedule: ' + err);
        return;
      }
      const data = await response.json();
      navigation.navigate('schedulePicker', { scheduleData: data });
    } catch (e) {
      alert('Error submitting schedule: ' + e);
    }
  };

  const handleMeeting = () => 
  {

    if (!name || !recurrence || !startDateTime || !endDateTime) {
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

    const newMeeting = {
      startTime: startDateTime.toString(),
      endTime: endDateTime.toString(),
      name: name,
      recurrence: recurrence,
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
  }

  // Helper to generate start_end_times for recurring meetings
  function generateMeetingOccurrences(start: Date, end: Date, recurrence: string | null, repeatEnd: Date) {
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
    navigation.replace('Home');
  }


  //Function to handle editing or deleting a meeting:
  const editDeleteMeeting = (index) => 
  {
    // This function will be called when the user taps on a meeting in the Events section
    // We can use an alert to ask the user whether they want to edit or delete the meeting:
    const meeting = meetings[index];
    const options = ['Edit', 'Delete', 'Cancel'];
    
    // Show an alert with options to edit or delete the meeting
    Alert.alert(
      'Meeting Options',
      `Meeting: ${meeting.name}\nStart Time: ${meeting.startTime}\nEnd Time: ${meeting.endTime}`,
      [
        {
          text: 'Edit',
          onPress: () => {
              console.log('Edit meeting');
              // Implement edit functionality here
              // Edit functionality can be implemented by navigating to the meeting edit screen:

              // Send the current meeting and the list of meetings to the MeetingEdit screen:
              navigation.navigate('MeetingEdit', { meeting, meetings, setMeetings });
          },

        },
        {
          text: 'Delete',
          onPress: () => {
            console.log('Delete meeting');
            setMeetings(meetings.filter((_, i) => i !== index));
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
    // This function will be called when the user taps on an assignment in the Events section
    // We can use an alert to ask the user whether they want to edit or delete the assignment:
    const assignment = assignments[index];
    const options = ['Edit', 'Delete', 'Cancel'];
    
    // Show an alert with options to edit or delete the assignment
    Alert.alert(
      'Assignment Options',
      `Assignment: ${assignment.name}\nDeadline: ${assignment.deadline}`,
      [
        {
          text: 'Edit',
          onPress: () => {
            console.log('Edit assignment');
            // Implement edit functionality here
            // Edit functionality can be implemented by navigating to the AssignmentEdit screen:
            navigation.navigate('AssignmentEdit', { assignment, assignments, setAssignments });
          },
        },
        {
          text: 'Delete',
          onPress: () => {
            console.log('Delete assignment');
            setAssignments(assignments.filter((_, i) => i !== index));
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
    // This function will be called when the user taps on a chore in the Events section
    // We can use an alert to ask the user whether they want to edit or delete the chore:
    const chore = chores[index];
    const options = ['Edit', 'Delete', 'Cancel'];
    
    // Show an alert with options to edit or delete the chore
    Alert.alert(
      'Chore Options',
      `Chore: ${chore.name}\nDeadline: ${chore.deadline}`,
      [
        {
          text: 'Edit',
          onPress: () => {
            console.log('Edit chore');
            // Implement edit functionality here
            navigation.navigate('ChoreEdit', { chore, chores, setChores});
          },
        },
        {
          text: 'Delete',
          onPress: () => {
            console.log('Delete chore');
            setChores(chores.filter((_, i) => i !== index));
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
            <Text style={styles.header}>Set up a Meeting</Text>

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
            {(recurrence === "daily" || recurrence === "weekly") && (
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
                  <Picker.Item label="Daily" value="daily" />
                  <Picker.Item label="Weekly" value="weekly" />
                  <Picker.Item label="Once" value="once" />
                </Picker>
              </View>

            <TouchableOpacity style={styles.addButton} onPress = {handleMeeting}>
              <Text style={styles.eventText}>Add Event</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress = {handlePrev}>
              <Text style={styles.eventText}>Go to Home</Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {selected === "Assignment" && (
        <>
          <SafeAreaView>
            <Text style={styles.header}>
              Set up an Assignment
            </Text>

            <Text style={styles.assignmentName}>Name:</Text>
            <TextInput
              style={styles.input2}
              placeholder="Assignment"
              placeholderTextColor="#aaa"
              value={assignment}
              onChangeText={setAssignment}
            />

            <Text style={styles.assignmentName}>Effort (minutes):</Text>
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

            <TouchableOpacity style={styles.addAssignment} onPress={handleAssignment}>
              <Text style={styles.eventText}>Add Event</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton2} 
              onPress={() => {
                navigation.replace('Home');
              }}
            >
              <Text style={styles.eventText}>Go to home</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </>
      )}

      {selected === "Chore/Study" && (
        <>
          <SafeAreaView>
            <Text style={styles.header}>
              Set up Chore/Study
            </Text>

            <Text style={styles.assignmentName}>Name:</Text>
            <TextInput
              style={styles.input2}
              placeholder="Chore"
              placeholderTextColor="#aaa"
              value={chore}
              onChangeText={setChore}
            />

            <Text style={styles.assignmentName}>Effort (minutes):</Text>
            <TextInput
              style={styles.input2}
              placeholder="Effort in minutes"
              placeholderTextColor="#aaa"
              keyboardType="numeric"
              value={choreEffort}
              onChangeText={setChoreEffort}
            />

            <Text style={styles.assignmentDeadline}>Window Start:</Text>
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

            <Text style={styles.assignmentDeadline}>Window End:</Text>
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

            <TouchableOpacity style={styles.addChore} onPress={handleChore}>
              <Text style={styles.eventText}>Add Event</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.backButton2} 
              onPress={() => {
                navigation.replace('Home');
              }}
            >
              <Text style={styles.eventText}>Go to home</Text>
            </TouchableOpacity>
          </SafeAreaView>
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
                    {meeting.startTime} - {meeting.endTime}
                  </Text>
                  <Text style={styles.meetingNameForEvents}>{meeting.name}</Text>
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
                    {assignment.deadline}
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
                  <Text style={styles.choreTimeForEvents}>
                    {chore.windowEnd}
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
    marginBottom: 10,
  },
  meetingTime2: {
    fontSize: 18,
    color: 'white',
    marginTop: 30,
    marginBottom: 10,
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
    backgroundColor: '#222',
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


  // Assignment Components:
  assignmentName:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginLeft: 10,
  },

  addAssignment:{
    backgroundColor:'white',
    borderRadius:8,
    paddingVertical:12,
    marginTop:150,
    width:'80%',
    alignSelf:'center',
  },

  addChore:{
    backgroundColor:'white',
    borderRadius:8,
    paddingVertical:12,
    marginTop:150,
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

  individualMeeting:{
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    width: 200,
    height:80,
    alignItems: 'center',
    color: 'black',
  },

  meetingTimeForEvents:{
    fontSize: 18,
    color: 'black',
    marginBottom: 10,
  },

  meetingNameForEvents:{
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },

  assignmentsSection:{
    fontSize: 20,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10,
  },

  individualAssignment:{
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    width: 200,
    height:80,
    alignItems: 'center',
    color: 'black',
  },

  assignmentTimeForEvents:{
    fontSize: 18,
    color: 'black',
    marginBottom: 10,
  },

  assignmentNameForEvents:{
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },

  choresSection:{
    fontSize: 20,
    color: 'white',
    marginTop: 20,
    marginBottom: 10,
    marginLeft: 10,
  },

  individualChore:{
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 8,
    marginLeft: 10,
    width: 200,
    height:80,
    alignItems: 'center',
    color: 'black',
  },

  choreTimeForEvents:{
    fontSize: 18,
    color: 'black',
    marginBottom: 10,
  },

  choreNameForEvents:{
    fontSize: 16,
    color: 'black',
    fontWeight: 'bold',
  },




});
