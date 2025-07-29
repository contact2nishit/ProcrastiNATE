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
//import AsyncStorage from '@react-native-async-storage/async-storage';
import {Slot, formatTime, screenWidth, getStartOfWeek} from '../../calendarUtils'
import CalendarWeekView from '../../../components/CalendarWeekView';
import { useRouter } from 'expo-router';
import { usePotentialScheduleContext } from './PotentialScheduleContext';

const CalendarViewPotential = () => {
  const { scheduleIdx } = useLocalSearchParams();
  const navigation = useNavigation();
  const { potentialSchedules, setPotentialSchedules } = usePotentialScheduleContext();
  const [referenceDate, setReferenceDate] = useState(new Date());
  const router = useRouter();


  const extractSlots = (scheduleIdx: number): Slot[] => {
    const allSlots: Slot[] = [];
    const schedule = potentialSchedules.schedules?.[scheduleIdx];
    if (!schedule) {
      return allSlots;
    }

    // Assignments
    if (Array.isArray(schedule.assignments)) {
      for (const assignment of schedule.assignments) {
        if (assignment.schedule) {
          for (const slot of assignment.schedule.slots) {
            allSlots.push({
              name: assignment.name,
              type: 'assignment',
              start: slot.start,
              end: slot.end,
            });
          }
        }
      }
    }

    // Chores
    if (Array.isArray(schedule.chores)) {
      for (const chore of schedule.chores) {
        if (chore.schedule && Array.isArray(chore.schedule.slots)) {
          for (const slot of chore.schedule.slots) {
            allSlots.push({
              name: chore.name,
              type: 'chore',
              start: slot.start,
              end: slot.end,
            });
          }
        }
      }
    }

    // No meetings in potential schedules

    return allSlots;
  }
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Schedule #{scheduleIdx}</Text>
      <CalendarWeekView
        slots={extractSlots(Number(scheduleIdx))}
        showMeetingActions={false}
        initialReferenceDate={getStartOfWeek(referenceDate)}
        onReferenceDateChange={setReferenceDate}
      />
    <View style={{flex:1}}></View>
    <TouchableOpacity
      style={styles.backButton}
      onPress = {() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
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
  },
  backButton: {
    backgroundColor: 'white',
    width: 180,
    height: 40,
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    marginTop: 20,
    marginBottom:45,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  }
})

export default CalendarViewPotential;
