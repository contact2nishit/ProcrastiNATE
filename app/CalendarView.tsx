import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Slot = {
  name: string;
  type: string;
  start: string;
  end: string;
};

const screenWidth = Dimensions.get('window').width;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

const getWeekDaysFromDate = (referenceDate: Date) => {
  const date = new Date(referenceDate);
  // Set to Sunday of the week
  date.setDate(date.getDate() - date.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(date);
    day.setDate(date.getDate() + i);
    return {
      date: day,
      label: day.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      iso: day.toISOString().split('T')[0],
    };
  });
};

const groupSlotsByDay = (slots: Slot[]) => {
  const grouped: Record<string, Slot[]> = {};
  for (const slot of slots) {
    const dayKey = slot.start.split('T')[0];
    if (!grouped[dayKey]) grouped[dayKey] = [];
    grouped[dayKey].push(slot);
  }
  return grouped;
};

const CalendarView = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [referenceDate, setReferenceDate] = useState(new Date()); // controls the week shown

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const now = new Date();
        const monthFromNow = new Date();
        monthFromNow.setMonth(now.getMonth() + 1);

        const url = await AsyncStorage.getItem('backendURL');
        const token = await AsyncStorage.getItem('token');

        if (!url || !token) {
          Alert.alert('Configuration Error', 'Missing backend URL or authentication token');
          return;
        }

        const response = await fetch(
          `${url}/fetch?start_time=${encodeURIComponent(now.toISOString().replace('Z', '+00:00'))}&end_time=${encodeURIComponent(
            monthFromNow.toISOString().replace('Z', '+00:00')
          )}&meetings=true&assignments=true&chores=true`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) throw new Error(await response.text());

        const data = await response.json();
        const allSlots: Slot[] = [];

        const extractSlots = (items: any[], type: string) => {
          for (const item of items) {
            if (type === 'chore' && item.window) {
              for (const timeSlot of item.window) {
                allSlots.push({
                  name: item.name,
                  type,
                  start: timeSlot.start || timeSlot[0],
                  end: timeSlot.end || timeSlot[1],
                });
              }
            } else if (type === 'meeting' && item.start_end_times) {
              for (const timeSlot of item.start_end_times) {
                allSlots.push({
                  name: item.name,
                  type,
                  start: timeSlot.start || timeSlot[0],
                  end: timeSlot.end || timeSlot[1],
                });
              }
            } else if (type === 'assignment' && item.schedule?.slots) {
              for (const slot of item.schedule.slots) {
                allSlots.push({
                  name: item.name,
                  type,
                  start: slot.start,
                  end: slot.end,
                });
              }
            }
          }
        };

        extractSlots(data.assignments || [], 'assignment');
        extractSlots(data.chores || [], 'chore');
        extractSlots(data.meetings || [], 'meeting');

        allSlots.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        setSlots(allSlots);

        // Delay for 2000 ms
        await delay(1500);
      } catch (err: any) {
        console.error('Error loading schedule:', err);
        Alert.alert('Error', `Could not load schedule: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  // Get the days of the current reference week
  const weekDays = getWeekDaysFromDate(referenceDate);
  const groupedSlots = groupSlotsByDay(slots);

  // Handlers for buttons
  const goToPrevWeek = () => {
    setReferenceDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };
  const goToNextWeek = () => {
    setReferenceDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };
  const goToCurrentWeek = () => {
    setReferenceDate(new Date());
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weekly Calendar</Text>

      {/* Week navigation */}
      <View style={styles.weekNavContainer}>
        <TouchableOpacity style={styles.navButton} onPress={goToPrevWeek}>
          <Text style={styles.navButtonText}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.currentWeekButton} onPress={goToCurrentWeek}>
          <Text style={styles.currentWeekText}>Current Week</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
          <Text style={styles.navButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0f0" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.dayColumn}>
              <Text style={styles.dayLabel}>{day.label}</Text>
              <ScrollView style={styles.dayContentS} nestedScrollEnabled={true}>
                {(groupedSlots[day.iso] || []).map((slot, idx) => (
                  <View key={idx} style={styles.slotBox}>
                    <Text style={styles.slotTitle}>{slot.name}</Text>
                    <Text style={styles.slotSub}>
                      {slot.type.toUpperCase()} • {formatTime(slot.start)} - {formatTime(slot.end)}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ))}
        </ScrollView>
      )}

      <TouchableOpacity onPress={() => navigation.replace('Home')} style={styles.but}>
        <Text style={styles.butText}>Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CalendarView;

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
  weekNavContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  navButton: {
    backgroundColor: '#0f0',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  navButtonText: {
    fontWeight: 'bold',
    color: '#111',
    fontSize: 16,
  },
  currentWeekButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  currentWeekText: {
    color: '#0f0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dayColumn: {
    width: screenWidth * 0.85,
    padding: 10,
    borderRightWidth: 1,
    borderColor: '#333',
  },
  dayLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f0',
    marginBottom: 10,
  },
  dayContentS: {
    maxHeight: 400,
    marginBottom: 10,
  },
  slotBox: {
    backgroundColor: '#222',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  slotSub: {
    fontSize: 13,
    color: '#ccc',
    marginTop: 2,
  },
  but: {
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
  butText: {
    fontSize: 16,
    fontWeight: '600',
  },
});