import React, { useState } from 'react';
import {
  View,
  SafeAreaView,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Platform
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EventSelection() {
  const [selected, setSelected] = useState('Meeting');

  const [hour1, setHour1] = useState('01');
  const [minute1, setMinute1] = useState('00');
  const [period1, setPeriod1] = useState('AM');
  const [hour2, setHour2] = useState('01');
  const [minute2, setMinute2] = useState('00');
  const [period2, setPeriod2] = useState('AM');
  const [name, setName] = useState('');

  const [assignment, setAssignment] = useState('');
  const [number, setNumber] = useState('');

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

    console.log("Start time: " + hour1 + ":" + minute1 + ":" + period1);
    console.log("End time: " + hour2 + ":" + minute2 + ":" + period2);
    console.log("Meeting name: " + name);

     //Reset the start and end times and AM/PM to default settings:
     setHour1('01');
     setMinute1('00');
     setPeriod1('AM');

     setHour2('01');
     setMinute2('00');
     setPeriod2('AM');
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
          <Text style={styles.header}>Set Up a Meeting</Text>

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
            <ScrollView>
                <SafeAreaView>
                    <Text style = {styles.header}>
                        Set Up an Assignment
                    </Text>

                    <Text style={styles.assignmentName}>Assignment Name:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Assignment"
                        placeholderTextColor="#aaa"
                        value={assignment}
                        onChangeText={setAssignment}
                    />

                    <Text style = {styles.assignmentNum}># of Assignments:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter a number"
                        placeholderTextColor="#aaa"
                        value={number}
                        onChangeText={setNumber}
                        keyboardType='number-pad'
                    />

                    <Text style = {styles.assignmentDeadline}>Assignment Deadline:</Text>
                    {/* Calendar Popup */}
                    <TouchableOpacity 
                        style={styles.dateButton} 
                        onPress={showDatepicker}
                    >
                        <Text style={styles.dateButtonText}>
                            {formatDate(date)}
                        </Text>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <DateTimePicker
                            testID="dateTimePicker"
                            value={date}
                            mode="date"
                            is24Hour={true}
                            display="default"
                            onChange={onDateChange}
                            style = {styles.calendar}
                        />
                    )}
                </SafeAreaView>

            </ScrollView>

        
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
  },

  assignmentNum:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginTop:20,
  },

  assignmentDeadline:{
    fontSize:20,
    color:'white',
    marginBottom:10,
    marginTop:20,
  },


  dateButton:{
    backgroundColor:'white',
    width: 100,
    height:30,
  },

  dateButtonText:{
    textAlignVertical:'center',
    fontSize:15,
    alignContent:'center',
  },

  calendar:{
    backgroundColor:'white',
    marginLeft:150,
    marginTop:-30,
    padding: 0,
  }





    
    



});
