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
import { router, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Slot, screenWidth, getStartOfWeek } from '../calendarUtils'
import  CalendarWeekView from '../../components/CalendarWeekView'
import config from '../config';
import { useRouter } from 'expo-router';
import { useCurrentScheduleContext } from './CurrentScheduleContext';


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const CalendarView = () => {
  const { currSchedule, setCurrSchedule, ensureScheduleRange, refetchSchedule } = useCurrentScheduleContext();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [referenceDate, setReferenceDate] = useState(new Date()); // controls the week shown
  // Modal state for meeting update/delete
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'update' | 'delete' | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [updateName, setUpdateName] = useState('');
  const [updateLoc, setUpdateLoc] = useState('');
  const [updateTime, setUpdateTime] = useState('');

  // Use context to ensure we have the week's schedule
  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const weekStart = getStartOfWeek(referenceDate);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const startISO = weekStart.toISOString().replace('Z', '+00:00');
      const endISO = weekEnd.toISOString().replace('Z', '+00:00');
      await ensureScheduleRange(startISO, endISO);
    } catch (e) {
      // handle error
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
      await refetchSchedule();
      await fetchSchedule();
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
      await refetchSchedule();
      await fetchSchedule();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete meeting: ' + e);
    }
  };

  // Filter slots for the current week from context
  const weekStart = getStartOfWeek(referenceDate);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startISO = weekStart.toISOString().replace('Z', '+00:00');
  const endISO = weekEnd.toISOString().replace('Z', '+00:00');
  const slots = currSchedule.slots.filter(slot => slot.start >= startISO && slot.end <= endISO);

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
      <TouchableOpacity onPress={() => router.push('/requiresCurrentSchedule/Home')} style={styles.but}>
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