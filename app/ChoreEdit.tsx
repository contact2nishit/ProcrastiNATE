import React, {useState} from 'react';
import {View, Text, TouchableOpacity, ScrollView, StyleSheet, Keyboard, TextInput, TouchableWithoutFeedback} from 'react-native';
import {useNavigation} from 'expo-router';
import {useRoute} from '@react-navigation/native';

// This screen is for editing a meeting, which has been passed from the Meeting screen
// This screen will take in the meeting object and a list of meetings

export default function ChoreEdit() {
    
    const navigation = useNavigation();
    const route = useRoute();


    const { chore, chores, setChores } = route.params;

    const [choreName, setChoreName] = useState(chore.name);
    const [choreStart, setChoreStart] = useState(chore.windowStart);
    const [choreEnd, setChoreEnd] = useState(chore.windowEnd);
    const [choreEffort, setChoreEffort] = useState(chore.effort);
    
    const saveChanges = () => {
        // Logic to save changes to the meeting
        const updatedChore = {
            ...chore,
            name: choreName,
            windowStart: choreStart,
            windowEnd: choreEnd,
            effort: choreEffort
        };
        const updatedChores = chores.map((c) => 
            c === chore ? updatedChore : c
        );

        setChores(updatedChores);
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
            <TouchableWithoutFeedback onPress = {Keyboard.dismiss} accessible = {false}>
                <ScrollView>
                    <Text style={styles.title}>Edit Chore</Text>
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        value={choreName}
                        onChangeText={setChoreName}
                    />
                    
                    <TextInput
                        style={styles.input}
                        placeholder="Start time"
                        value={choreStart}
                        onChangeText={setChoreStart}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="End time"
                        value={choreEnd}
                        onChangeText={setChoreEnd}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Effort"
                        placeholderTextColor="#aaa"
                        keyboardType="numeric"
                        value={String(choreEffort)}
                        onChangeText={setChoreEffort}
                    />
                    
                    <TouchableOpacity style={styles.button} onPress={saveChanges}>
                        <Text style={styles.buttonText}>Save Changes</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backButton} onPress={back}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                </ScrollView>
            </TouchableWithoutFeedback>
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
        marginTop:260,
        marginBottom:20,
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
        marginBottom: 360,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

