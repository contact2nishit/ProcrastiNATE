/* import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, SafeAreaView } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import config from '../../config';
import { usePotentialScheduleContext } from './PotentialScheduleContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SchedulePicker = () => {

  const navigation = useNavigation();
  const router = useRouter();
  const { potentialSchedules, setPotentialSchedules } = usePotentialScheduleContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScheduleIdx, setSelectedScheduleIdx] = useState<number | null>(null);

  const mapStatus: { [key: string]: string } = {
    fully_scheduled: "Fully Scheduled",
    partially_scheduled: "Partially Scheduled",
    unschedulable: "Unschedulable",
  };

  // Use context for all data
  const parsedData: {
    conflicting_meetings?: string[];
    schedules?: {
      assignments: { name: string; schedule: { status: string; slots: { start: string; end: string }[] } }[];
      chores: { name: string; schedule: { status: string; slots: { start: string; end: string }[] } }[];
      conflicting_assignments: string[];
      conflicting_chores: string[];
      not_enough_time_assignments: string[];
      not_enough_time_chores: string[];
      total_potential_xp: number;
    }[];
    meetings?: { name: string; start_end_times: [string, string][] }[];
  } = potentialSchedules || {};

  const conflicting_meetings = parsedData.conflicting_meetings || [];
  const schedules = parsedData.schedules || [];
  const meetings = parsedData.meetings || [];

  const fmt = (iso: string) => new Date(iso).toLocaleString();

  const submitSchedule = async (schedule: any) => {
    try {
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token) {
        alert('Backend URL or token not set.');
        return;
      }
      const response = await fetch(`${url}/setSchedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(schedule),
      });
      if (!response.ok) {
        const err = await response.text();
        alert('Failed to set schedule: ' + err);
        return;
      }
      alert('Schedule set successfully!');
      setModalVisible(false); // Close modal immediately
      router.push('/requiresCurrentSchedule/Home');
    } catch (e) {
      alert('Error setting schedule: ' + e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Pick a Schedule</Text>

      {conflicting_meetings.length > 0 && (
        <View style={styles.conflictBox}>
          <Text style={styles.conflictHeader}>Conflicting Meetings:</Text>
          {conflicting_meetings.map((m: string, i: number) => (
            <Text key={i} style={styles.conflictText}>{m}</Text>
          ))}
        </View>
      )}

      <ScrollView>
        {schedules.map((schedule, idx: number) => (
          <TouchableOpacity
            key={idx}
            style={styles.scheduleBox}
            onPress={() => {
              setSelectedScheduleIdx(idx);
              setModalVisible(true);
            }}
          >
            <Text style={styles.scheduleTitle}>Schedule #{idx + 1}</Text>
            <Text style={styles.scheduleHint}>Tap to view details</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              {selectedScheduleIdx !== null && (
                <>
                  <Text style={styles.modalHeader}>Schedule #{selectedScheduleIdx + 1}</Text>
                  <Text style={styles.sectionHeader}>Assignments</Text>
                  {schedules[selectedScheduleIdx].assignments.length === 0 && (
                    <Text style={styles.noneText}>None</Text>
                  )}
                  {schedules[selectedScheduleIdx].assignments.map((a: any, i: number) => (
                    <View key={i} style={styles.itemBox}>
                      <Text style={styles.itemTitle}>{a.name}</Text>
                      <Text>Status: {mapStatus[a.schedule.status]}</Text>
                      {a.schedule.slots.map((slot: { start: string; end: string }, j: number) => (
                        <Text key={j} style={styles.timeText}>
                          {fmt(slot.start)} - {fmt(slot.end)}
                        </Text>
                      ))}
                    </View>
                  ))}

                  <Text style={styles.sectionHeader}>Chores</Text>
                  {schedules[selectedScheduleIdx].chores.length === 0 && (
                    <Text style={styles.noneText}>None</Text>
                  )}
                  {schedules[selectedScheduleIdx].chores.map((c: any, i: number) => (
                    <View key={i} style={styles.itemBox}>
                      <Text style={styles.itemTitle}>{c.name}</Text>
                      <Text>Status: {mapStatus[c.schedule.status]}</Text>
                      {c.schedule.slots.map((slot: { start: string; end: string }, j: number) => (
                        <Text key={j} style={styles.timeText}>
                          {fmt(slot.start)} - {fmt(slot.end)}
                        </Text>
                      ))}
                    </View>
                  ))}

                  <Text style={styles.sectionHeader}>Conflicts</Text>
                  {schedules[selectedScheduleIdx].conflicting_assignments.length === 0 &&
                   schedules[selectedScheduleIdx].conflicting_chores.length === 0 &&
                   schedules[selectedScheduleIdx].not_enough_time_assignments.length === 0 &&
                   schedules[selectedScheduleIdx].not_enough_time_chores.length === 0 && (
                    <Text style={styles.noneText}>None</Text>
                  )}
                  {schedules[selectedScheduleIdx].conflicting_assignments.map((n: string, i: number) => (
                    <Text key={i} style={styles.conflictText}>Assignment conflict: {n}</Text>
                  ))}
                  {schedules[selectedScheduleIdx].conflicting_chores.map((n: string, i: number) => (
                    <Text key={i} style={styles.conflictText}>Chore conflict: {n}</Text>
                  ))}
                  {schedules[selectedScheduleIdx].not_enough_time_assignments.map((n: string, i: number) => (
                    <Text key={i} style={styles.conflictText}>Not enough time for assignment: {n}</Text>
                  ))}
                  {schedules[selectedScheduleIdx].not_enough_time_chores.map((n: string, i: number) => (
                    <Text key={i} style={styles.conflictText}>Not enough time for chore: {n}</Text>
                  ))}

                  <Text style={styles.sectionHeader}>Meetings</Text>
                  {meetings.length === 0 && (
                    <Text style={styles.noneText}>None</Text>
                  )}
                  {meetings.map((m: { name: string; start_end_times: [string, string][] }, i: number) => (
                    <View key={i} style={styles.itemBox}>
                      <Text style={styles.itemTitle}>{m.name}</Text>
                      {m.start_end_times.map((pair: [string, string], j: number) => (
                        <Text key={j} style={styles.timeText}>
                          {fmt(pair[0])} - {fmt(pair[1])}
                        </Text>
                      ))}
                    </View>
                  ))}
                  <Text style={styles.itemTitle}>Potential XP: {schedules[selectedScheduleIdx].total_potential_xp}</Text>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#28a745',
                      borderRadius: 8,
                      paddingVertical: 12,
                      marginTop: 20,
                      alignItems: 'center',
                    }}
                    onPress={() => submitSchedule(schedules[selectedScheduleIdx])}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                      Set This Schedule
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  router.push(`/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential?scheduleIdx=${selectedScheduleIdx}`);
                }}
              >
                <Text style={styles.closeButtonText}>View Potential Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      {/* Button to navigate back to the All Events Page}
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.goBack}
      >
        <Text style={styles.txt}>Go Back</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', padding: 10 },
  header: { fontSize: 28, fontWeight: 'bold', color: 'white', textAlign: 'center', marginVertical: 20 },
  scheduleBox: { backgroundColor: 'white', borderRadius: 10, padding: 20, marginVertical: 10, alignItems: 'center' },
  scheduleTitle: { fontSize: 20, fontWeight: 'bold', color: 'black' },
  scheduleHint: { fontSize: 14, color: '#555', marginTop: 5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', maxHeight: '80%' },
  modalHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: 'black' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginTop: 15, color: '#222' },
  itemBox: { marginBottom: 10, padding: 8, backgroundColor: '#f2f2f2', borderRadius: 6 },
  itemTitle: { fontWeight: 'bold', fontSize: 16, color: '#222' },
  timeText: { fontSize: 14, color: '#333', marginLeft: 8 },
  conflictBox: { backgroundColor: '#ffdddd', borderRadius: 8, padding: 10, marginBottom: 10 },
  conflictHeader: { color: '#a00', fontWeight: 'bold', fontSize: 16 },
  conflictText: { color: '#a00', fontSize: 14 },
  noneText: { color: '#888', fontStyle: 'italic', marginLeft: 8 },
  closeButton: { backgroundColor: '#222', borderRadius: 8, padding: 12, marginTop: 20, alignItems: 'center' },
  closeButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  goBack:{
    backgroundColor:'white',
    alignSelf:'center',
    width: 150,
    height: 35,
    marginBottom:40,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:10,
  },
  txt:{
    fontSize:18,
    fontWeight:200,
    color:'black',
  }
});


export default SchedulePicker;    */

export {};