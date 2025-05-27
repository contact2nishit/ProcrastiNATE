import React, { useState, useEffect } from 'react';
import { KeyboardAvoidingView, Alert, View, SafeAreaView, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';

export default function EventSelection() 
{

  const [selected, setSelected] = useState('Meeting');

  // Use a useEffect state hook to reset all input fields when selected changes:
  useEffect(() => {
    setHour1('01');
    setMinute1('00');
    setPeriod1('AM');
    setHour2('01');
    setMinute2('00');
    setPeriod2('AM');
    setName('');
    setAssignment('');
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
  };

  type Chore = {
    name: string;
    deadline: string;
  }

  const [open, setOpen] = useState(false);
  const [recurrence, setRecurrence] = useState(null);
  const [items, setItems] = useState([
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' },
    { label: 'Once', value: 'Once' }
  ]);

  const [hour1, setHour1] = useState('01');
  const [minute1, setMinute1] = useState('00');
  const [period1, setPeriod1] = useState('AM');
  const [hour2, setHour2] = useState('01');
  const [minute2, setMinute2] = useState('00');
  const [period2, setPeriod2] = useState('AM');
  const [name, setName] = useState('');

  const [assignment, setAssignment] = useState('');
  const [chore, setChore] = useState('');

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

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


  const handleMeeting = () => 
  {

    if (hour1 === '' || minute1 === '' || period1 === '' || hour2 === '' || minute2 === '' || period2 === '' || name === '' || recurrence === null) {
      alert('Please fill in all fields.');
      return;
    }
    // Validate whether the user has entered all of the required fields:
    // First check if the start time is before the end time:
    const startTime = new Date();
    startTime.setHours(parseInt(hour1), parseInt(minute1), 0);
    const endTime = new Date();
    endTime.setHours(parseInt(hour2), parseInt(minute2), 0);
    if (period1 === 'PM') 
    {
      startTime.setHours(startTime.getHours() + 12);
    }
    if (period2 === 'PM') 
    {
      endTime.setHours(endTime.getHours() + 12);
    }

    if (startTime >= endTime) 
    {
      alert('End time must be after start time.');
      return;
    }
    else{
      alert('Meeting added successfully!');
      console.log("Start time: " + hour1 + ":" + minute1 + ":" + period1);
      console.log("End time: " + hour2 + ":" + minute2 + ":" + period2);
      console.log("Meeting name: " + name);
      console.log("Recurrence: " + recurrence);
    }

    // Now, we need to add the meeting to the meetings list:
    // Meeting information should include start/end times and name for now:
    const newMeeting = {
      startTime: `${hour1}:${minute1} ${period1}`,
      endTime: `${hour2}:${minute2} ${period2}`,
      name: name,
      recurrence: recurrence,
    };

    setMeetings([...meetings, newMeeting]);


     //Reset the start and end times and AM/PM to default settings:
     setHour1('01');
     setMinute1('00');
     setPeriod1('AM');

     setHour2('01');
     setMinute2('00');
     setPeriod2('AM');
     setName('');
     setRecurrence(null);
  }



  const handleAssignment = () => {
    
    // Validate whether the user has entered all of the required fields:
    if (assignment === '' || date === null) {
      alert('Please fill in all fields.');
      return;
    }
    //Second check if the date is valid (check if the date is NOT in the past):
    const currentDate = new Date();
    if (date < currentDate) {
      alert('Please select a valid date and time.');
      return;
    }
    else
    {
      alert('Assignment added successfully!');
      console.log("Assignment Name: " + assignment);
      console.log("Assignment Deadline: " + formatDate(date));
    }
    // Now, we need to add the assignment to the assignments list:
    const newAssignment = {
      name: assignment,
      deadline: formatDate(date),
    };

    setAssignments([...assignments, newAssignment]);

    // Reset the assignment name and recurrence to default settings:
    setAssignment('');
    setDate(new Date());
  }

  const handleChore = () => 
  {
    // Validate whether the user has entered all of the required fields:
    if (chore === '' || date === null) {
      alert('Please fill in all fields.');
      return;
    }
    //Second check if the date is valid (check if the date is NOT in the past):
    const currentDate = new Date();
    if (date < currentDate) {
      alert('Please select a valid date and time.');
      return;
    }
    else
    {
      alert('Chore added successfully!');
      console.log("Chore Name: " + chore);
      console.log("Chore Deadline: " + formatDate(date));
    }
    // Now, we need to add the chore to the chores list:
    const newChore = {
      name: chore,
      deadline: formatDate(date),
    };

    setChores([...chores, newChore]);

    // Reset the chore name and recurrence to default settings:
    setChore('');
    setDate(new Date());
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
            onPress={() => setSelected(item.label)}
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
              Start Time: {hour1}:{minute1} {period1}
            </Text>

            <View style={styles.pickerRow}>
              <Picker selectedValue={hour1} onValueChange={setHour1} style={styles.picker} itemStyle={styles.pickerItem}>
              {hours.map((h) => <Picker.Item key={h} label={h} value={h}/>)}
              </Picker>
              <Text style={styles.colon}>:</Text>
              <Picker selectedValue={minute1} onValueChange={setMinute1} style={styles.picker} itemStyle={styles.pickerItem}>
                {minutes.map((m) => <Picker.Item key={m} label={m} value={m} />)}
              </Picker>
              <Picker selectedValue={period1} onValueChange={setPeriod1} style={styles.pickerLast} itemStyle={styles.pickerItem}>
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>

            <Text style={styles.meetingTime2}>
              End Time: {hour2}:{minute2} {period2}
            </Text>

            <View style={styles.pickerRow}>
              <Picker selectedValue={hour2} onValueChange={setHour2} style={styles.picker} itemStyle={styles.pickerItem}>
                {hours.map((h) => <Picker.Item key={h} label={h} value={h}/>)}
              </Picker>
              <Text style={styles.colon}>:</Text>
              <Picker selectedValue={minute2} onValueChange={setMinute2} style={styles.picker} itemStyle={styles.pickerItem}>
                {minutes.map((m) => <Picker.Item key={m} label={m} value={m} />)}
              </Picker>
              <Picker selectedValue={period2} onValueChange={setPeriod2} style={styles.pickerLast} itemStyle={styles.pickerItem}>
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>

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
            {/* <ScrollView> */}
                <SafeAreaView>
                    <Text style = {styles.header}>
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

                    <Text style = {styles.assignmentDeadline}>Deadline:</Text>
                    <View style={styles.pickerWrapper2}>
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode="datetime"
                        display="compact" // or 'compact' if you want a more compact style
                        textColor="white" // Only works on iOS
                        onChange={onDateChange}
                        style={styles.pickerIOS2}
                      />
                    </View>

                    {/* <Text style = {styles.assignmentDeadline}>Recurrence:</Text>
                    <View style={styles.pickerAssignmentWrapper}>
                      
                      <DropDownPicker
                        open={open}
                        value={recurrence}
                        items={items}
                        setOpen={setOpen}
                        setValue={setRecurrence}
                        setItems={setItems}
                        placeholder="Select Frequency"
                        textStyle={{ color: 'black', fontSize: 16 }}
                        style={styles.pickerAssignment}
                        dropDownContainerStyle={{ zIndex: 1000, width: 200}}
                      />

                    </View> */}

                    {/* Button to add the event */}
                    <TouchableOpacity style={styles.addAssignment} onPress={() => {
                        handleAssignment();
                    }}>
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

            {/* </ScrollView> */}
        </>
      )}


      {selected === "Chore/Study" && (
        <>
              <SafeAreaView>
                  <Text style = {styles.header}>
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

                    <Text style = {styles.assignmentDeadline}>Deadline:</Text>
                    <View style={styles.pickerWrapper}>
                      <DateTimePicker
                        testID="dateTimePicker"
                        value={date}
                        mode="datetime"
                        display="compact" // or 'compact' if you want a more compact style
                        textColor="white" // Only works on iOS
                        onChange={onDateChange}
                        style={styles.pickerIOS}
                      />
                    </View>

                    {/* <Text style = {styles.assignmentDeadline}>Recurrence:</Text>
                    <View style={styles.pickerChoreWrapper}>
                      <DropDownPicker
                        open={open}
                        value={recurrence}
                        items={items}
                        setOpen={setOpen}
                        setValue={setRecurrence}
                        setItems={setItems}
                        placeholder="Select Frequency"
                        textStyle={{ color: 'black', fontSize: 16 }}
                        style={styles.pickerChore}
                        dropDownContainerStyle={{ zIndex: 1000, width: 200}}
                      />
                    </View> */}

                    {/* Button to add the event */}
                    <TouchableOpacity style={styles.addChore} onPress={() => {
                        handleChore();
                    }}>
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
                    {chore.deadline}
                  </Text>
                  <Text style={styles.choreNameForEvents}>{chore.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

        
        

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
