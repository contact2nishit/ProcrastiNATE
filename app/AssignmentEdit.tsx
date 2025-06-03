import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput} from 'react-native';
import {useNavigation} from 'expo-router';
import {useRoute} from '@react-navigation/native';
import { useAssignmentContext } from './AssignmentContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This screen is for editing a meeting, which has been passed from the Meeting screen
// This screen will take in the meeting object and a list of meetings

export default function AssignmentEdit() {
    
    const navigation = useNavigation();
    const route = useRoute();


    const { assignment } = route.params;
    const { assignments, setAssignments} = useAssignmentContext();

    const [assignmentName, setAssignmentName] = useState(assignment.name);
    const [assignmentEffort, setAssignmentEffort] = useState(assignment.effort);
    const [assignmentDeadline, setAssignmentDeadline] = useState(assignment.deadline);
    

    async function saveChanges()
    {
        // Logic to save changes to the assignment

        const payload = {
            assignment_id: assignment.assignment_id,
            new_name: assignmentName || null,
            new_time:  assignmentDeadline,
            new_effort: assignmentEffort,
        }

        try
        {
            const url = await AsyncStorage.getItem('backendURL');
            const token = await AsyncStorage.getItem('token');

            const response = await fetch(`${url}/update`, {
                method: "POST",
                headers:{
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });


            if (!response.ok) {
                const errorData = await response.json();
                alert("Failed to update: " + errorData.message);
                return;
            }

            const updatedAssignment = {
                ...assignment,
                name: assignmentName,
                deadline: assignmentDeadline,
                effort: assignmentEffort
            };

            const updatedAssignments = assignments.map(a =>
                a.assignment_id === assignment.assignment_id ? updatedAssignment : a
            );

            setAssignments(updatedAssignments);
            navigation.goBack();
        }
        catch (err) {
            console.error("Error updating meeting:", err);
            alert("Unexpected error updating meeting.");
        }
    }

    const back = () => {
        // Logic to go back to the previous screen
        console.log("Going back to events screen");
        navigation.goBack();
    }

    
    return (
        // This screen is for editing (start/end times, meeting name) a meething which has been passed from the Meeting screen
        <View style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>Edit Assignment</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="Name"
                    value={assignmentName}
                    onChangeText={setAssignmentName}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Effort"
                    value={String(assignmentEffort)}
                    onChangeText={setAssignmentEffort}
                />
                
                <TextInput
                    style={styles.input}
                    placeholder="Deadline"
                    value={assignmentDeadline}
                    onChangeText={setAssignmentDeadline}
                />
                
                <TouchableOpacity style={styles.button} onPress={saveChanges}>
                    <Text style={styles.buttonText}>Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.backButton} onPress={back}>
                    <Text style={styles.backButtonText}>Back</Text>
                </TouchableOpacity>

            </ScrollView>
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
        marginBottom:20,
        marginTop:300,
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
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

