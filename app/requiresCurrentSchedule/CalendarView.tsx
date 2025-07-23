import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, screenWidth, getStartOfWeek } from '../calendarUtils'
import  CalendarWeekView from '../../components/CalendarWeekView'
import config from '../config';
import { useRouter } from 'expo-router';


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CalendarView = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [referenceDate, setReferenceDate] = useState(new Date()); // controls the week shown
  const router = useRouter();
  // Modal state for meeting update/delete
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'update' | 'delete' | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [updateName, setUpdateName] = useState('');
  const [updateLoc, setUpdateLoc] = useState('');
  const [updateTime, setUpdateTime] = useState('');

  // Refetch schedule logic extracted for reuse
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const monthFromNow = new Date();
      monthFromNow.setMonth(now.getMonth() + 1);

      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');

      if (!url || !token) {
        Alert.alert('Configuration Error', 'Missing backend URL or authentication token');
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${url}/fetch?start_time=${encodeURIComponent(getStartOfWeek(referenceDate).toISOString().replace('Z', '+00:00'))}&end_time=${encodeURIComponent(
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

      // Helper to extract slots and IDs for meetings
      const extractSlots = (items: any[], type: string) => {
        for (const item of items) {
          if (type === 'chore' && item.window) {
              allSlots.push({
                name: item.name,
                type,
                start: item.window.start || item.window[0],
                end: item.window.end || item.window[1],
              });
          } else if (type === 'meeting' && item.start_end_times) {
            // Add meeting_id and occurence_id for each occurrence
            for (let idx = 0; idx < item.start_end_times.length; idx++) {
              const timeSlot = item.start_end_times[idx];
              allSlots.push({
                name: item.name,
                type,
                start: timeSlot.start || timeSlot[0],
                end: timeSlot.end || timeSlot[1],
                meeting_id: item.meeting_id,
                occurence_id: item.ocurrence_ids ? item.ocurrence_ids[idx] : undefined,
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

      // Remove artificial delay for instant reload after update/delete
      // await delay(1500);
    } catch (err: any) {
      console.error('Error loading schedule:', err);
      Alert.alert('Error', `Could not load schedule: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [referenceDate]);

  // Meeting update/delete handlers (same as Home.tsx)
  const handleUpdateMeeting = async () => {
    try {
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token || !selectedMeeting) return;
      const body: any = {
        future_occurences: false,
        meeting_id: selectedMeeting.meeting_id,
        ocurrence_id: selectedMeeting.occurence_id,
      };
      if (updateName) body.new_name = updateName;
      if (updateLoc) body.new_loc_or_link = updateLoc;
      if (updateTime) body.new_time = updateTime;
      const response = await fetch(`${url}/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text();
        Alert.alert('Error', 'Failed to update meeting: ' + err);
        return;
      }
      Alert.alert('Success', 'Meeting updated!');
      setModalVisible(false);
      setUpdateName('');
      setUpdateLoc('');
      setUpdateTime('');
      setSelectedMeeting(null);
      // Immediately reload calendar view
      fetchSchedule();
    } catch (e) {
      Alert.alert('Error', 'Failed to update meeting: ' + e);
    }
  };

  const handleDeleteMeeting = async (removeAllFuture = false) => {
    try {
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token || !selectedMeeting) return;
      const body = {
        occurence_id: selectedMeeting.occurence_id,
        meeting_id: selectedMeeting.meeting_id,
        remove_all_future: removeAllFuture,
      };
      const response = await fetch(`${url}/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text();
        Alert.alert('Error', 'Failed to delete meeting: ' + err);
        return;
      }
      Alert.alert('Success', removeAllFuture ? 'All future occurrences deleted!' : 'Meeting deleted!');
      setModalVisible(false);
      setSelectedMeeting(null);
      // Immediately reload calendar view
      fetchSchedule();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete meeting: ' + e);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weekly Calendar</Text>

      <CalendarWeekView
        slots={slots}
        loading={loading}
        showMeetingActions={true}
        initialReferenceDate={getStartOfWeek(referenceDate)}
        onReferenceDateChange={setReferenceDate}
        onUpdateMeeting={(slot: Slot) => {
          setModalType('update');
          setSelectedMeeting(slot);
          setUpdateName('');
          setUpdateLoc('');
          setUpdateTime('');
          setModalVisible(true);
        }}
        onDeleteMeeting={(slot: Slot) => {
          setModalType('delete');
          setSelectedMeeting(slot);
          setModalVisible(true);
        }}
        />

      {/* Meeting Update/Delete Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {modalType === 'update' && (
              <>
                <Text style={styles.modalHeader}>Update Meeting</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Name"
                  placeholderTextColor="#888"
                  value={updateName}
                  onChangeText={setUpdateName}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Location/Link"
                  placeholderTextColor="#888"
                  value={updateLoc}
                  onChangeText={setUpdateLoc}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="New Start Time (YYYY-MM-DDTHH:MM:SS+00:00)"
                  placeholderTextColor="#888"
                  value={updateTime}
                  onChangeText={setUpdateTime}
                />
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={handleUpdateMeeting}
                >
                  <Text style={styles.modalButtonText}>Submit Update</Text>
                </TouchableOpacity>
              </>
            )}
            {modalType === 'delete' && (
              <>
                <Text style={styles.modalHeader}>Delete Meeting</Text>
                <Text style={{ color: '#222', marginBottom: 16 }}>
                  Are you sure you want to delete this meeting occurrence?
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#dc2626' }]}
                  onPress={() => handleDeleteMeeting(false)}
                >
                  <Text style={styles.modalButtonText}>Delete This Occurrence</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#dc2626', marginTop: 8 }]}
                  onPress={() => handleDeleteMeeting(true)}
                >
                  <Text style={styles.modalButtonText}>Delete All Future Occurrences</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: '#888', marginTop: 10 }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style = {{flex:1}}></View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 20,
    elevation: 5,
  },
  modalHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  modalButton: {
    backgroundColor: '#0f0',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#111',
    fontWeight: 'bold',
  },
});