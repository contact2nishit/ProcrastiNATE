import React, {useState, useEffect} from 'react';
import { useLocalSearchParams } from 'expo-router';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Slot, formatTime, screenWidth, } from './calendarUtils'
import CalendarWeekView from './CalendarWeekView';
import { getData } from './schedulePicker'
import { set } from 'date-fns';

const CalendarViewPotential = () => {
  const { scheduleIdx } = useLocalSearchParams();
  const navigation = useNavigation();
  const [schedules, setSchedules] = useState<any>({});

  useEffect(() => {
    getData(setSchedules);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Schedule #{scheduleIdx}</Text>

      <CalendarWeekView
        slots={schedules[scheduleIdx]?.all_slots || []}
        showMeetingActions={false}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    paddingTop: 30,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
    marginTop:20,
  }
})

export default CalendarViewPotential;
