
"use client";

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import { useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function Home() 
{

  const route = useRoute();
  const navigation = useNavigation();
  const [todoList, setTodoList] = useState<any[]>([]);

  
  const handleBack = () => 
  {
    navigation.navigate('index');
  };

  const handleAddEvent = () => {
    navigation.navigate('eventSelection');
  };

  const calendarProceed = async () => 
  {
    // First check if a schedule has been set or not (aka the user has selected a schedule)
    // If not, then if the user clicks on show calendar, then an alert shows up saying
    // 'no schedule selected'

    // Otherwise, navigate to the calendarView file:
    try {
      const scheduleJSON = await AsyncStorage.getItem('schedule');
      if(!scheduleJSON){
        Alert.alert('No schedule selected');
        return;
      }

      navigation.navigate('calendarView');
    }
    catch (error) {
      Alert.alert('Error', 'Failed to check schedule.');
      console.error('Error checking schedule in AsyncStorage:', error);
    }

  }


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
