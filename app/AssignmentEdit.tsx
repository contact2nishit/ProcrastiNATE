import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput} from 'react-native';
import {useNavigation} from 'expo-router';
import {useRoute} from '@react-navigation/native';

// This screen is for editing a meeting, which has been passed from the Meeting screen
// This screen will take in the meeting object and a list of meetings

export default function AssignmentEdit() {
    
    const navigation = useNavigation();
    const route = useRoute();


    const { assignment, assignments, setAssignments } = route.params;

    const [assignmentName, setAssignmentName] = useState(assignment.name);
    const [assignmentDeadline, setAssignmentDeadline] = useState(assignment.deadline);
    
    const saveChanges = () => {
        // Logic to save changes to the meeting
        const updatedAssignment = {
            ...assignment,
            name: assignmentName,
            deadline: assignmentDeadline,
        };
        const updatedAssignments = assignments.map((m) => 
            m === assignment ? updatedAssignment : m
        );

        setAssignments(updatedAssignments);
        navigation.goBack();
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
                    placeholder="Meeting Name"
                    value={assignmentName}
                    onChangeText={setAssignmentName}
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
            </ScrollView>
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
        marginBottom: 430,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

