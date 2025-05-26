import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

export default function Meeting() {
  const navigation = useNavigation();
  const [hour1, setHour1] = useState('01');
  const [minute1, setMinute1] = useState('00');
  const [period1, setPeriod1] = useState('AM');

  const [hour2, setHour2] = useState('01');
  const [minute2, setMinute2] = useState('00');
  const [period2, setPeriod2] = useState('AM');

  const [name, setName] = useState('');

  const handleMeeting = () => {
    navigation.replace("Home");
  };

  const hours = [];

  for(let i = 0; i <= 11; i++)
  {
    hours.push(String(i+1).padStart(2, '0'));
  }

  const minutes = [];

  for(let i = 0; i <= 59; i++)
  {
    minutes.push(String(i).padStart(2, '0'));
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Set Up a Meeting</Text>

      <Text style={styles.meetingTime}>
        Meeting Start Time: {hour1}:{minute1} {period1}
      </Text>

      <View style={styles.pickerRow}>
        <Picker
          selectedValue={hour1}
          onValueChange={(value) => setHour1(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {hours.map(h => (
            <Picker.Item key={h} label={h} value={h} />
          ))}
        </Picker>

        <Text style={styles.colon}>:</Text>

        <Picker
          selectedValue={minute1}
          onValueChange={(value) => setMinute1(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {minutes.map(m => (
            <Picker.Item key={m} label={m} value={m} />
          ))}
        </Picker>

        <Picker
          selectedValue={period1}
          onValueChange={(value) => setPeriod1(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="AM" value="AM" />
          <Picker.Item label="PM" value="PM" />
        </Picker>
      </View>


      <Text style={styles.meetingTime2}>
        Meeting End Time: {hour2}:{minute2} {period2}
      </Text>

      <View style={styles.pickerRow}>
        <Picker
          selectedValue={hour2}
          onValueChange={(value) => setHour2(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {hours.map(h => (
            <Picker.Item key={h} label={h} value={h} />
          ))}
        </Picker>

        <Text style={styles.colon}>:</Text>

        <Picker
          selectedValue={minute2}
          onValueChange={(value) => setMinute2(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          {minutes.map(m => (
            <Picker.Item key={m} label={m} value={m} />
          ))}
        </Picker>

        <Picker
          selectedValue={period2}
          onValueChange={(value) => setPeriod2(value)}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="AM" value="AM" />
          <Picker.Item label="PM" value="PM" />
        </Picker>
      </View>

      <Text style = {styles.meetingName}> Meeting Name:</Text>
        <TextInput
            style={styles.input}
            placeholder="Meeting"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
        />


      <TouchableOpacity onPress={handleMeeting} style={styles.addButton}>
        <Text style={styles.eventText}>Add Event</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    fontSize: 30,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
  },
  meetingTime: {
    fontSize: 20,
    textAlign: 'left',
    marginVertical: 20,
    marginLeft: 20,
    marginTop: 50,
    marginBottom:10,
  },
  meetingTime2: {
    fontSize: 20,
    textAlign: 'left',
    marginVertical: 20,
    marginLeft: 20,
    marginTop: -20,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginLeft:10,
    marginTop:-20,
  },
  colon: {
    fontSize: 25,
    fontWeight: 'bold',
    marginHorizontal: 5,
  },
  picker: {
    height: 150,
    width: 100,
  },
  pickerItem: {
    fontSize: 25,
    height: 120,
  },
  addButton: {
    backgroundColor: 'black',
    width: '60%',
    alignSelf: 'center',
    marginTop: 160,
    borderRadius: 10,
  },
  eventText: {
    color: 'white',
    fontSize: 17,
    alignSelf: 'center',
    paddingVertical: 10,
  },
  meetingName:{
    fontSize: 20,
    textAlign: 'left',
    marginVertical: 20,
    marginLeft: 20,
    marginTop: -15,
    marginBottom:20,
  },

  input:{
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginLeft: 20,
    width:'80%',
    marginTop:-10,
  }
});
