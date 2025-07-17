import React, {useState, useEffect} from 'react';
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


const delay = (ms:number) => new Promise(resolve => setTimeout(resolve, ms));

const CalendarViewPotential = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Weekly Calendar</Text>

      <CalendarWeekView
        slots={slots}
        loading={loading}
        showMeetingActions={true}
        initialReferenceDate={referenceDate}
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

    </View>
  );
}

StyleSheet.create({
  container: {
    
  }
})
