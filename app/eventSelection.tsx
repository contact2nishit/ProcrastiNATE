import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView, Platform } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import DropDownPicker from 'react-native-dropdown-picker';

export default function EventSelection() {

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
  }, [selected]);

  const [open, setOpen] = useState(false);
  const [recurrence, setRecurrence] = useState(null);
  const [items, setItems] = useState([
    { label: 'Daily', value: 'Daily' },
    { label: 'Weekly', value: 'Weekly' }
  ]);

  const [hour1, setHour1] = useState('01');
  const [minute1, setMinute1] = useState('00');
  const [period1, setPeriod1] = useState('AM');
  const [hour2, setHour2] = useState('01');
  const [minute2, setMinute2] = useState('00');
  const [period2, setPeriod2] = useState('AM');
  const [name, setName] = useState('');

  const [assignment, setAssignment] = useState('');

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
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    const currDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currDate);
  }

  const showDatepicker = () => {
    setShowDatePicker(true);
  };

   const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  const handleMeeting = () => {

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

    if (hour1 === '' || minute1 === '' || period1 === '' || hour2 === '' || minute2 === '' || period2 === '' || name === '') {
      alert('Please fill in all fields.');
      return;
    }
    else{
      alert('Meeting added successfully!');
      console.log("Start time: " + hour1 + ":" + minute1 + ":" + period1);
      console.log("End time: " + hour2 + ":" + minute2 + ":" + period2);
      console.log("Meeting name: " + name);
    }
     //Reset the start and end times and AM/PM to default settings:
     setHour1('01');
     setMinute1('00');
     setPeriod1('AM');

     setHour2('01');
     setMinute2('00');
     setPeriod2('AM');
     setName('');
  }

  const handleAssignment = () => {
    //First check if the date is valid (check if the date is NOT in the past):
    const currentDate = new Date();
    if (date < currentDate) {
      alert('Please select a valid date and time.');
      return;
    }
    
    // Validate whether the user has entered all of the required fields:
    if (assignment === '' || recurrence === '' || date === null) {
      alert('Please fill in all fields.');
      return;
    }
    else{
      alert('Assignment added successfully!');
      console.log("Assignment Name: " + assignment);
      console.log("Assignment Deadline: " + formatDate(date));
      console.log("Assignment Recurrence: " + recurrence);
    }

    // Reset the assignment name and recurrence to default settings:
    setAssignment('');
    setRecurrence(null);
    setDate(new Date());
  }


  const handlePrev = () => {
    navigation.replace('Home');
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
        <ScrollView contentContainerStyle={styles.containerMeeting}>
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

          <Text style={styles.meetingName}>Meeting Name:</Text>
          <TextInput
            style={styles.input}
            placeholder="Meeting"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />

          <TouchableOpacity style={styles.addButton} onPress = {handleMeeting}>
            <Text style={styles.eventText}>Add Event</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress = {handlePrev}>
            <Text style={styles.eventText}>Go to Home</Text>
          </TouchableOpacity>

        </ScrollView>
      )}


      {selected === "Assignment" && (
        <>
            {/* <ScrollView> */}
                <SafeAreaView>
                    <Text style = {styles.header}>
                        Set up an Assignment
                    </Text>

                    <Text style={styles.assignmentName}>Assignment Name:</Text>
                    <TextInput
                        style={styles.input2}
                        placeholder="Assignment"
                        placeholderTextColor="#aaa"
                        value={assignment}
                        onChangeText={setAssignment}
                    />

                    <Text style = {styles.assignmentDeadline}>Assignment Deadline:</Text>
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

                    <Text style = {styles.assignmentDeadline}>Assignment Recurrence:</Text>
                    <View style={styles.pickerAssignmentWrapper}>
                      {/* Have a dropdown which has two options: daily and weekly */}
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

                    </View>

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
            <ScrollView>
                <SafeAreaView>
                    <Text style = {styles.header}>
                        Set Up Chore/Study
                    </Text>

                </SafeAreaView>
            </ScrollView>
        
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
    padding: 20,
    paddingBottom: 60,
    marginTop:-20,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginVertical: 30,
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
    marginTop: 30,
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


});
