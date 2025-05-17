"use client";

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';

export default function Home() {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);

  const handleBack = () => {
    navigation.navigate('index');
  };

  const handleOption = (option) => {
    
    if(option == 'Option 1') 
    {
      navigation.navigate('Meeting');
      setModalVisible(false);
    }

    else if(option == 'Option 2') 
    {
      navigation.navigate('Assignment');
      setModalVisible(false);
    }

    else if(option == 'Option 3') 
    {
      navigation.navigate('ChoreStudy');
      setModalVisible(false);
    }
    
  };

  return (
    <SafeAreaView>
      <Text style={styles.welcomeText}>To Do List for Today (Testing):</Text>

      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Text style={styles.plus}>+</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleBack}>
        <Text style={styles.buttonBack}>Back to Login</Text>
      </TouchableOpacity>

      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.dialogBox}>
            <Text style={styles.title}>Choose a Task</Text>

            <TouchableOpacity style={styles.optionButton} onPress={() => handleOption('Option 1')}>
              <Text style={styles.optionText}>Meeting</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={() => handleOption('Option 2')}>
              <Text style={styles.optionText}>Assignment</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.optionButton} onPress={() => handleOption('Option 3')}>
              <Text style={styles.optionText}>Chore/Study</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginTop: 40,
    marginLeft: 10,
    color: 'white',
    width: 150,
    fontSize: 16,
    textAlign: 'center',
  },
  plus: {
    backgroundColor: 'black',
    borderRadius: 25,
    marginTop: 40,
    marginLeft: 10,
    color: 'white',
    width: 50,
    height: 50,
    fontSize: 35,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dialogBox: {
    backgroundColor: 'black',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },

  title: {
    fontSize: 25,
    fontWeight: 'bold',
    marginBottom: 15,
    color: 'white',
  },

  optionButton: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },

  optionText: {
    color: 'black',
    fontSize: 17,
  },

  cancelButton: {
    marginTop: 15,
    backgroundColor: 'white',
    width: '60%',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },

  cancelText: {
    color: 'black',
    fontSize: 16,
    alignSelf: 'center',
  },
});
