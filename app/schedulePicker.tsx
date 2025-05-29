import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, SafeAreaView, } from 'react-native';
import { useNavigation, useLocalSearchParams } from 'expo-router';

export default function SchedulePicker() {
  const navigation = useNavigation();
  // Get the scheduleData from route params
  const { scheduleData } = useLocalSearchParams();
  console.log(scheduleData);
  // Defensive: parse if stringified
  const parsedData = typeof scheduleData === 'string' ? JSON.parse(scheduleData) : scheduleData;

  const schedules = parsedData?.schedules || [];
  const meetings = parsedData?.meetings || [];
  const conflicting_meetings = parsedData?.conflicting_meetings || [];

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScheduleIdx, setSelectedScheduleIdx] = useState<number | null>(null);

  // Helper to format ISO string to readable
  const fmt = (iso: string) => new Date(iso).toLocaleString();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Pick a Schedule</Text>

      {conflicting_meetings.length > 0 && (
        <View style={styles.conflictBox}>
          <Text style={styles.conflictHeader}>Conflicting Meetings:</Text>
          {conflicting_meetings.map((m, i) => (
            <Text key={i} style={styles.conflictText}>{m}</Text>
          ))}
        </View>
      )}

      <ScrollView>
        {schedules.map((schedule, idx) => (
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

      {/* Modal for schedule details */}
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
                  {/* Assignments */}
                  <Text style={styles.sectionHeader}>Assignments</Text>
                  {schedules[selectedScheduleIdx].assignments.length === 0 && (
                    <Text style={styles.noneText}>None</Text>
                  )}
                  {schedules[selectedScheduleIdx].assignments.map((a, i) => (
                    <View key={i} style={styles.itemBox}>
                      <Text style={styles.itemTitle}>{a.name}</Text>
                      <Text>Status: {a.schedule.status}</Text>
                      <Text>Effort Assigned: {a.schedule.effort_assigned} min</Text>
                      {a.schedule.slots.map((slot, j) => (
                        <Text key={j} style={styles.timeText}>
                          {fmt(slot.start)} - {fmt(slot.end)}
                        </Text>
                      ))}
                    </View>
                  ))}

                  {/* Chores */}
                  <Text style={styles.sectionHeader}>Chores</Text>
                  {schedules[selectedScheduleIdx].chores.length === 0 && (
                    <Text style={styles.noneText}>None</Text>
                  )}
                  {schedules[selectedScheduleIdx].chores.map((c, i) => (
                    <View key={i} style={styles.itemBox}>
                      <Text style={styles.itemTitle}>{c.name}</Text>
                      <Text>Status: {c.schedule.status}</Text>
                      <Text>Effort Assigned: {c.schedule.effort_assigned} min</Text>
                      {c.schedule.slots.map((slot, j) => (
                        <Text key={j} style={styles.timeText}>
                          {fmt(slot.start)} - {fmt(slot.end)}
                        </Text>
                      ))}
                    </View>
                  ))}

                  {/* Conflicts */}
                  <Text style={styles.sectionHeader}>Conflicts</Text>
                  {schedules[selectedScheduleIdx].conflicting_assignments.length === 0 &&
                   schedules[selectedScheduleIdx].conflicting_chores.length === 0 &&
                   schedules[selectedScheduleIdx].not_enough_time_assignments.length === 0 &&
                   schedules[selectedScheduleIdx].not_enough_time_chores.length === 0 && (
                    <Text style={styles.noneText}>None</Text>
                  )}
                  {schedules[selectedScheduleIdx].conflicting_assignments.map((n, i) => (
                    <Text key={i} style={styles.conflictText}>Assignment conflict: {n}</Text>
                  ))}
                  {schedules[selectedScheduleIdx].conflicting_chores.map((n, i) => (
                    <Text key={i} style={styles.conflictText}>Chore conflict: {n}</Text>
                  ))}
                  {schedules[selectedScheduleIdx].not_enough_time_assignments.map((n, i) => (
                    <Text key={i} style={styles.conflictText}>Not enough time for assignment: {n}</Text>
                  ))}
                  {schedules[selectedScheduleIdx].not_enough_time_chores.map((n, i) => (
                    <Text key={i} style={styles.conflictText}>Not enough time for chore: {n}</Text>
                  ))}

                  {/* Meetings */}
                  <Text style={styles.sectionHeader}>Meetings</Text>
                  {meetings.length === 0 && (
                    <Text style={styles.noneText}>None</Text>
                  )}
                  {meetings.map((m, i) => (
                    <View key={i} style={styles.itemBox}>
                      <Text style={styles.itemTitle}>{m.name}</Text>
                      {m.start_end_times.map((pair, j) => (
                        <Text key={j} style={styles.timeText}>
                          {fmt(pair[0])} - {fmt(pair[1])}
                        </Text>
                      ))}
                    </View>
                  ))}
                </>
              )}
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
});

