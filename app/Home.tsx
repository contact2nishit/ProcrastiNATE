"use client";

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Home() {
  const navigation = useNavigation();
  const [todoList, setTodoList] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url = await AsyncStorage.getItem('backendURL');
        const token = await AsyncStorage.getItem('token');
        if (!url || !token) return;

        // Get local midnight for today and tomorrow
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);

        // Fix: Use .toISOString().replace('Z', '+00:00') for Python's fromisoformat
        const startISO = start.toISOString().replace('Z', '+00:00');
        const endISO = end.toISOString().replace('Z', '+00:00');

        const params = `start_time=${encodeURIComponent(startISO)}&end_time=${encodeURIComponent(endISO)}&meetings=true&assignments=true&chores=true`;
        const response = await fetch(`${url}/fetch?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) return;
        const data = await response.json();

        // Flatten all occurences into a single list with type info
        const items: any[] = [];
        if (data.meetings) {
          for (const m of data.meetings) {
            m.start_end_times.forEach((pair: [string, string], idx: number) => {
              items.push({
                type: 'meeting',
                name: m.name,
                start: pair[0],
                end: pair[1],
                id: m.ocurrence_ids?.[idx] ?? idx,
              });
            });
          }
        }
        if (data.assignments) {
          for (const a of data.assignments) {
            if (a.schedule && a.schedule.slots) {
              a.schedule.slots.forEach((slot: any, idx: number) => {
                items.push({
                  type: 'assignment',
                  name: a.name,
                  start: slot.start,
                  end: slot.end,
                  id: a.ocurrence_ids?.[idx] ?? idx,
                });
              });
            } else if (a.start_end_times) {
              a.start_end_times.forEach((pair: [string, string], idx: number) => {
                items.push({
                  type: 'assignment',
                  name: a.name,
                  start: pair[0],
                  end: pair[1],
                  id: a.ocurrence_ids?.[idx] ?? idx,
                });
              });
            }
          }
        }
        if (data.chores) {
          for (const c of data.chores) {
            if (c.schedule && c.schedule.slots) {
              c.schedule.slots.forEach((slot: any, idx: number) => {
                items.push({
                  type: 'chore',
                  name: c.name,
                  start: slot.start,
                  end: slot.end,
                  id: c.ocurrence_ids?.[idx] ?? idx,
                });
              });
            } else if (c.start_end_times) {
              c.start_end_times.forEach((pair: [string, string], idx: number) => {
                items.push({
                  type: 'chore',
                  name: c.name,
                  start: pair[0],
                  end: pair[1],
                  id: c.ocurrence_ids?.[idx] ?? idx,
                });
              });
            }
          }
        }
        // Sort by start time
        items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
        setTodoList(items);
      } catch (e) {
        // handle error
      }
    };
    fetchData();
  }, []);

  const handleBack = () => {
    AsyncStorage.removeItem("token");
    navigation.navigate('index');
  };

  const calendarProceed = async () => {
    // First check if a schedule has been set or not (aka the user has selected a schedule)
    // If not, then if the user clicks on show calendar, then an alert shows up saying
    // 'no schedule selected'

    // Otherwise, navigate to the calendarView file:
    try {
      navigation.navigate('CalendarView');
    }
    catch (error) {
      Alert.alert('Error', 'Failed to check schedule.');
      console.error('Error checking schedule in AsyncStorage:', error);
    }

  }

  const handleAddEvent = () => {
    navigation.navigate('eventSelection');
  };

  const getCardStyle = (type: string) => {
    if (type === 'meeting') return styles.meetingCard;
    if (type === 'assignment') return styles.assignmentCard;
    if (type === 'chore') return styles.choreCard;
    return {};
  };

  const markSessionCompleted = async (occurence_id: number, is_assignment: boolean) => {
    try {
      const url = await AsyncStorage.getItem('backendURL');
      const token = await AsyncStorage.getItem('token');
      if (!url || !token) {
        Alert.alert('Error', 'Backend URL or token not set.');
        return;
      }
      const response = await fetch(`${url}/markSessionCompleted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          occurence_id,
          completed: true,
          is_assignment,
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        Alert.alert('Error', 'Failed to mark session as completed: ' + err);
        return;
      }
      Alert.alert('Success', 'Session marked as completed!');
    } catch (e) {
      Alert.alert('Error', 'Failed to mark session as completed: ' + e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      <Text style={styles.welcomeText}>To Do List for Today</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {todoList.map((item, idx) => (
          <View key={item.id ?? idx} style={[styles.card, getCardStyle(item.type)]}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardType}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
            <Text style={styles.cardTime}>
              {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {/* Add mark session completed button for assignments and chores */}
            {(item.type === 'assignment' || item.type === 'chore') && (
              <TouchableOpacity
                style={{
                  marginTop: 10,
                  backgroundColor: '#333',
                  borderRadius: 6,
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  alignSelf: 'flex-start',
                }}
                onPress={() => markSessionCompleted(item.id, item.type === 'assignment')}
              >
                <Text style={{ color: 'white', fontWeight: 'bold' }}>Mark Session Completed</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
        {todoList.length === 0 && (
          <Text style={{ color: '#222', margin: 20, fontSize: 18, textAlign: 'center' }}>No events for today.</Text>
        )}
        <TouchableOpacity onPress={handleAddEvent} style={styles.plusButton}>
          <Text style={styles.plus}>+</Text>
        </TouchableOpacity>
      </ScrollView>
      <TouchableOpacity onPress={handleBack}>
        <Text style={styles.buttonBack}>Back to Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={calendarProceed}>
        <Text style={styles.calendarButton}>View Calendar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'left',
    marginTop: 50,
    marginLeft: 10,
    color: '#333',
  },
  buttonBack: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    marginLeft: 10,
    color: 'white',
    width: 150,
    fontSize: 16,
    textAlign: 'center',
    alignSelf: 'flex-start',
  },
  plusButton: {
    alignSelf: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  plus: {
    backgroundColor: 'black',
    borderRadius: 25,
    color: 'white',
    width: 50,
    height: 50,
    fontSize: 35,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 50,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  meetingCard: {
    backgroundColor: '#e0e7ff',
    borderLeftWidth: 6,
    borderLeftColor: '#6366f1',
  },
  assignmentCard: {
    backgroundColor: '#fef9c3',
    borderLeftWidth: 6,
    borderLeftColor: '#eab308',
  },
  choreCard: {
    backgroundColor: '#dcfce7',
    borderLeftWidth: 6,
    borderLeftColor: '#22c55e',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  cardType: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
    marginBottom: 4,
  },
  cardTime: {
    fontSize: 16,
    color: '#111',
    marginTop: 2,
  },
  calendarButton:{
     backgroundColor: '#333',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    marginLeft: 10,
    color: 'white',
    width: 150,
    fontSize: 16,
    textAlign: 'center',
  },
});
