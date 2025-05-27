import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput} from 'react-native';
import {useNavigation} from 'expo-router';
import {useRoute} from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';

// This screen is for editing a meeting, which has been passed from the Meeting screen
// This screen will take in the meeting object and a list of meetings

export default function MeetingEdit() {
    
    const navigation = useNavigation();
    const route = useRoute();


    const { meeting, meetings, setMeetings } = route.params;

    const [meetingName, setMeetingName] = useState(meeting.name);
    const [startTime, setStartTime] = useState(meeting.startTime);
    const [endTime, setEndTime] = useState(meeting.endTime);
    const [recurrence, setRecurrence] = useState(meeting.recurrence || 'None');
    
    const saveChanges = () => {
        // Logic to save changes to the meeting
        const updatedMeeting = {
            ...meeting,
            name: meetingName,
            startTime: startTime,
            endTime: endTime,
            recurrence: recurrence,
        };
        const updatedMeetings = meetings.map((m) => 
            m === meeting ? updatedMeeting : m
        );

        setMeetings(updatedMeetings);
        navigation.goBack();
    }

    const back = () => {
        // Logic to go back to the previous screen
        console.log("Going back to Meeting screen");
        navigation.goBack();
    }

    
    return (
        // This screen is for editing (start/end times, meeting name) a meething which has been passed from the Meeting screen
        <View style={styles.container}>
                <Text style={styles.title}>Edit Meeting</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Meeting Name"
                    value={meetingName}
                    onChangeText={setMeetingName}
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Start Time"
                    value={startTime}
                    onChangeText={setStartTime}
                />

                {/* DateTimePicker for start time */}
                
                <TextInput
                    style={styles.input}
                    placeholder="End Time"
                    value={endTime}
                    onChangeText={setEndTime}
                />

                {/* Recurrence Picker */}
                <View style = {styles.pickerWrapperMeeting}>
                    <Picker
                    selectedValue={recurrence}
                    onValueChange={setRecurrence}
                    style={styles.pickerMeeting}
                    itemStyle={styles.pickerMeetingItem}
                    >
                        <Picker.Item label="Select Frequency" value={null} />
                        <Picker.Item label="Daily" value="daily" />
                        <Picker.Item label="Weekly" value="weekly" />
                        <Picker.Item label="Once" value="once" />
                    </Picker>
                </View>
                
                <TouchableOpacity style={styles.button} onPress={saveChanges}>
                    <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>
            
            <TouchableOpacity style={styles.backButton} onPress={back}>
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        marginTop:50,
    },
    input: {
        height: 50,
        borderColor: '#ccc',
        borderWidth: 1,
        borderRadius: 5,
        paddingHorizontal: 10,
        marginBottom: 15,
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backButton: {
        backgroundColor: '#6c757d',
        padding: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop:15,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },

    pickerMeeting: {
        height: 50,
        width: '100%',
        marginBottom: 200,
        marginTop:-80,
    },

    pickerMeetingItem: {
        fontSize: 16,
        color: '#000',
    },
    pickerWrapperMeeting: {
        borderWidth: 1,
        borderRadius: 5,
        borderColor: 'transparent',
        overflow: 'hidden',
        backgroundColor: '#fff',
        marginBottom: 100,
    },
});

