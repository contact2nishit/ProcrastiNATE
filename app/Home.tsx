"use client";

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, ScrollView, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import RescheduleModal from './RescheduleModal';
import config from './config';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Home() {
  // Loading state
  const [loading, setLoading] = useState(false);
  // Google Calendar sync handler
  const handleSyncGoogleCalendar = async () => {
    try {
      setLoading(true);
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token) {
        Alert.alert('Error', 'Backend URL or token not set.');
        setLoading(false);
        return;
      }
      const response = await fetch(`${url}/googleCalendar/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const err = await response.text();
        Alert.alert('Error', 'Failed to sync Google Calendar: ' + err);
        setLoading(false);
        return;
      }
      const data = await response.json();
      Alert.alert('Success', data.message || 'Google Calendar synced!');
      await fetchTodoList();
    } catch (e) {
      Alert.alert('Error', 'Failed to sync Google Calendar: ' + e);
    } finally {
      setLoading(false);
    }
  };
  type SessionToMaybeComplete = {
    occurence_id: string;
    is_assignment: boolean;
  };
  const navigation = useNavigation();
  const [todoList, setTodoList] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'update' | 'delete' | 'markSession' | null>(null);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [updateName, setUpdateName] = useState('');
  const [updateLoc, setUpdateLoc] = useState('');
  const [updateTime, setUpdateTime] = useState('');
  const [selectedSessionToComplete, setSelectedSessionToComplete] = useState<SessionToMaybeComplete>({occurence_id: "A", is_assignment: false});
  const [lockedInValue, setLockedInValue] = useState(5);
  const [rescheduleModalVisible, setRescheduleModalVisible] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<any>(null);

  // Refetch todo list (single definition, with loading)
  const fetchTodoList = async () => {
    try {
      setLoading(true);
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token) return;
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
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
              meeting_id: m.meeting_id, // include meeting_id for update/delete
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
                id: `assignment_${a.assignment_id}_${a.ocurrence_ids?.[idx] ?? idx}`,
                completed: a.completed?.[idx] ?? false,
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
                id: `chore_${c.chore_id}_${c.ocurrence_ids?.[idx] ?? idx}`,
                completed: c.completed?.[idx] ?? false,
              });
            });
          }
        }
      }
      items.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      setTodoList(items);
    } catch (e) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodoList();
  }, []);

  const handleBack = () => {
    AsyncStorage.removeItem("token");
    navigation.navigate('index');
  };

  const calendarProceed = async () => {
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

  // Add a local state to track completed status for assignment/chore occurrences
  const [completedMap, setCompletedMap] = useState<{ [key: string]: boolean }>({});

  // Update completedMap when todoList changes (initialize from backend)
  useEffect(() => {
    const map: { [key: string]: boolean } = {};
    todoList.forEach(item => {
      if ((item.type === 'assignment' || item.type === 'chore') && item.id !== undefined) {
        map[item.id] = !!item.completed;
      }
    });
    setCompletedMap(map);
  }, [todoList.length]);

  const markSessionCompleted = async (occurence_id: string, is_assignment: boolean, locked_in: number = 5) => {
    try {
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token) {
        Alert.alert('Error', 'Backend URL or token not set.');
        return;
      }
      // Extract numeric id from our string id
      const idParts = occurence_id.split('_');
      const realOccurenceId = idParts[idParts.length - 1];
      // Determine is_assignment correctly from id
      let isAssignmentFlag = false;
      if (occurence_id.startsWith('assignment_')) {
        isAssignmentFlag = true;
      } else if (occurence_id.startsWith('chore_')) {
        isAssignmentFlag = false;
      } else {
        isAssignmentFlag = is_assignment; // fallback to passed value
      }
      const response = await fetch(`${url}/markSessionCompleted`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          occurence_id: Number(realOccurenceId),
          completed: true,
          is_assignment: isAssignmentFlag,
          locked_in: locked_in,
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        Alert.alert('Error', 'Failed to mark session as completed: ' + err);
        return;
      }
      setCompletedMap(prev => ({
        ...prev,
        [occurence_id]: true,
      }));
      Alert.alert('Success', 'Session marked as completed!');
      setModalVisible(false);
    } catch (e) {
      Alert.alert('Error', 'Failed to mark session as completed: ' + e);
    }
  };

  // Update meeting handler
  const handleUpdateMeeting = async () => {
    try {
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token || !selectedMeeting) return;
      const body: any = {
        future_occurences: false,
        meeting_id: selectedMeeting.meeting_id, // always send meeting_id
        ocurrence_id: selectedMeeting.id,
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
      fetchTodoList();
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
        occurence_id: selectedMeeting.id,
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
      fetchTodoList();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete meeting: ' + e);
    }
  };

  const handleDeleteEvent = async (occurence_id: string, event_type: "assignment" | "chore") => {
    try {
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token) return;
      const idParts = occurence_id.split('_');
      const realOccurenceId = idParts[idParts.length - 1];
      const body = {
        occurence_id: Number(realOccurenceId),
        remove_all_future: false,
        event_type,
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
        Alert.alert('Error', 'Failed to delete: ' + err);
        return;
      }
      Alert.alert('Success', `${event_type.charAt(0).toUpperCase() + event_type.slice(1)} deleted!`);
      setModalVisible(false);
      fetchTodoList();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete: ' + e);
    }
  };

  const handleReschedule = (item: any) => {
    setRescheduleTarget(item);
    setRescheduleModalVisible(true);
  };

  const submitReschedule = async (params: any) => {
    try {
      const url = config.backendURL;
      const token = await AsyncStorage.getItem('token');
      if (!url || !token || !rescheduleTarget) return;
      const tz_offset_minutes = -new Date().getTimezoneOffset();
      // Fix: send assignment_id/chore_id, not occurence_id
      let idToSend: number | undefined;
      if (rescheduleTarget.type === 'assignment') {
        // assignment id is in id string: "assignment_<assignment_id>_<occurence_id>"
        const parts = rescheduleTarget.id.split('_');
        idToSend = Number(parts[1]);
      } else if (rescheduleTarget.type === 'chore') {
        // chore id is in id string: "chore_<chore_id>_<occurence_id>"
        const parts = rescheduleTarget.id.split('_');
        idToSend = Number(parts[1]);
      }
      const body: any = {
        event_type: rescheduleTarget.type,
        id: idToSend,
        allow_overlaps: params.allow_overlaps,
        tz_offset_minutes,
      };
      if (params.new_effort !== undefined) body.new_effort = params.new_effort;
      if (rescheduleTarget.type === 'assignment') {
        if (params.new_window_end) body.new_window_end = params.new_window_end;
      } else {
        if (params.new_window_start) body.new_window_start = params.new_window_start;
        if (params.new_window_end) body.new_window_end = params.new_window_end;
      }
      const response = await fetch(`${url}/reschedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const err = await response.text();
        Alert.alert('Error', 'Failed to reschedule: ' + err);
        return;
      }
      const data = await response.json();
      setRescheduleModalVisible(false);
      setRescheduleTarget(null);
      // Save the full ScheduleResponseFormat object directly
      await AsyncStorage.setItem("schedules", JSON.stringify(data));
      navigation.navigate('schedulePicker');
    } catch (e) {
      Alert.alert('Error', 'Failed to reschedule: ' + e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
      {loading && (
        <View style={{ alignItems: 'center', marginVertical: 10 }}>
          <Text style={{ color: '#888' }}>Loading...</Text>
        </View>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 20, marginRight: 16 }}>
        <TouchableOpacity onPress={calendarProceed} style={styles.calendarButton}>
          <MaterialCommunityIcons name='calendar-month' size={32} color='white'/>
        </TouchableOpacity>
      </View>
      <Text style={styles.welcomeText}>To Do List for Today</Text>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {todoList.map((item, idx) => (
          <View key={item.id ?? idx} style={[styles.card, getCardStyle(item.type)]}>
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardType}>{item.type.charAt(0).toUpperCase() + item.type.slice(1)}</Text>
            <Text style={styles.cardTime}>
              {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(item.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {/* Mark session completed for assignments and chores */}
            {(item.type === 'assignment' || item.type === 'chore') && (
              <>
                {completedMap[item.id] ? (
                  <Text style={{ color: 'green', fontWeight: 'bold', marginTop: 10, fontSize: 18 }}>✓ Completed</Text>
                ) : (
                  <TouchableOpacity
                    style={{
                      marginTop: 10,
                      backgroundColor: '#333',
                      borderRadius: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      alignSelf: 'flex-start',
                    }}
                    onPress={() => {
                      const now = new Date();
                      const startTime = new Date(item.start);
                      if (startTime > now) {
                        Alert.alert(
                          'Too Early!',
                          "This session hasn't started yet. You can only mark it completed after its start time. If you don't need this assignment or chore on your calendar any longer, you can delete it using the Delete button.",
                          [
                            { text: 'OK', style: 'cancel' }
                          ]
                        );
                        return;
                      }
                      setModalType('markSession');
                      setModalVisible(true);
                      setSelectedSessionToComplete({occurence_id: item.id, is_assignment: item.type === 'assignment'});
                    }}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Mark Session Completed</Text>
                  </TouchableOpacity>
                )}
                {/* Delete button for assignments/chores */}
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    backgroundColor: '#dc2626',
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => handleDeleteEvent(item.id, item.type)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
                </TouchableOpacity>
                {/* Reschedule button */}
                <TouchableOpacity
                  style={{
                    marginTop: 10,
                    backgroundColor: '#2563eb',
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    alignSelf: 'flex-start',
                  }}
                  onPress={() => handleReschedule(item)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Reschedule</Text>
                </TouchableOpacity>
              </>
            )}
            {/* Update/Delete for meetings */}
            {item.type === 'meeting' && (
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#2563eb',
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    marginRight: 10,
                  }}
                  onPress={() => {
                    setModalType('update');
                    setSelectedMeeting(item);
                    setUpdateName('');
                    setUpdateLoc('');
                    setUpdateTime('');
                    setModalVisible(true);
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Update</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#dc2626',
                    borderRadius: 6,
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                  }}
                  onPress={() => {
                    setModalType('delete');
                    setSelectedMeeting(item);
                    setModalVisible(true);
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
                </TouchableOpacity>
              </View>
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
      <View style={{flex: 1}}></View>
      <TouchableOpacity onPress={handleSyncGoogleCalendar} style={styles.syncButton} disabled={loading}>
        <Text style={styles.syncButtonText}>{loading ? 'Syncing...' : 'Sync Google Calendar'}</Text>
      </TouchableOpacity>
      {/* Update/Delete/Session completion Modal */}
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
            {modalType === 'markSession' && (
              <>
                <Text style={styles.modalHeader}>Mark Session Completed</Text>
                <Text style={{ color: '#222', marginBottom: 16, fontWeight: 'bold', fontSize: 16 }}>
                  How locked in were you? Be honest.
                </Text>
                <Slider
                  style={{ width: 200, height: 40 }}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={lockedInValue}
                  onValueChange={setLockedInValue}
                  minimumTrackTintColor="#2563eb"
                  maximumTrackTintColor="#888"
                  thumbTintColor="#2563eb"
                />
                <Text style={{ color: '#222', marginBottom: 8, fontSize: 16, fontWeight: 'bold' }}>
                  {lockedInValue}/10
                </Text>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#dc2626', marginTop: 8 }]}
                  onPress={() => markSessionCompleted(selectedSessionToComplete?.occurence_id, selectedSessionToComplete?.is_assignment, lockedInValue)}
                >
                  <Text style={styles.modalButtonText}>Mark Session Completed</Text>
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
      <RescheduleModal
        visible={rescheduleModalVisible}
        onClose={() => setRescheduleModalVisible(false)}
        onSubmit={submitReschedule}
        eventType={rescheduleTarget?.type}
        currentEffort={rescheduleTarget?.effort || 0}
        currentDue={rescheduleTarget?.end}
        currentWindowStart={rescheduleTarget?.start}
        currentWindowEnd={rescheduleTarget?.end}
      />
      <TouchableOpacity onPress={handleBack}>
        <Text style={styles.buttonBack}>Back to Login</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  syncButton: {
    backgroundColor: '#2563eb',
    padding: 12,
    borderRadius: 8,
    marginTop: 30,
    marginHorizontal: 16,
    marginBottom: 10,
    alignItems: 'center',
  },
  syncButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
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
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  calendarButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#222',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    color: '#222',
    backgroundColor: '#f5f5f5',
    marginBottom: 12,
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
    width: '100%',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
