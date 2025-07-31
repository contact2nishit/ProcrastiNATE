import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    Switch,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePotentialScheduleContext } from './PotentialScheduleContext';
import config from '../../config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const RescheduleScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { id, type, effort, start, end } = params;
    const { setPotentialSchedules } = usePotentialScheduleContext();

    const [newEffort, setNewEffort] = useState<number>(typeof effort === 'number' ? effort : 0);
    const [windowStart, setWindowStart] = useState<Date>(type === 'chore' && typeof start === 'string' ? new Date(start) : new Date());
    const [windowEnd, setWindowEnd] = useState<Date>(typeof end === 'string' ? new Date(end) : new Date());
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);
    const [allowOverlaps, setAllowOverlaps] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const url = config.backendURL;
            const token = await AsyncStorage.getItem('token');
            if (!url || !token) {
                Alert.alert('Error', 'Missing backend URL or token.');
                return;
            }

            const tz_offset_minutes = -new Date().getTimezoneOffset();
            const body: any = {
                event_type: type,
                id,
                allow_overlaps: allowOverlaps,
                tz_offset_minutes,
            };

            if (type === 'assignment') {
                body.new_window_end = windowEnd.toISOString();
            } else if (type === 'chore') {
                body.new_effort = newEffort;
                body.new_window_start = windowStart.toISOString();
                body.new_window_end = windowEnd.toISOString();
            }

            const response = await fetch(`${url}/reschedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.text();
                Alert.alert('Error', 'Failed to reschedule: ' + err);
                return;
            }

            const data = await response.json();
            setPotentialSchedules(data);
            Alert.alert('Success', 'Rescheduled successfully!');
            router.push('/requiresCurrentSchedule/requiresPotentialSchedule/schedulePicker');
        } catch (e) {
            Alert.alert('Error', 'Failed to reschedule: ' + e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <View style={styles.container}>
                <Text style={styles.header}>Reschedule {type === 'assignment' ? 'Assignment' : 'Chore'}</Text>

                {type === 'assignment' && (
                    <>
                        <Text style={styles.label}>Remaining Effort (minutes):</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(newEffort)}
                            onChangeText={(txt) => {
                                const num = parseInt(txt, 10);
                                if (!isNaN(num) && num > 0) setNewEffort(num);
                                else if (txt === '') setNewEffort(0);
                            }}
                            placeholder="Enter remaining effort in minutes"
                            placeholderTextColor="#888"
                            returnKeyType="done"
                        />
                    </>
                )}

                {type === 'chore' && (
                    <>
                        <Text style={styles.label}>Remaining Effort (minutes):</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={String(newEffort)}
                            onChangeText={(txt) => {
                                const num = parseInt(txt, 10);
                                if (!isNaN(num) && num > 0) setNewEffort(num);
                                else if (txt === '') setNewEffort(0);
                            }}
                            placeholder="Enter remaining effort in minutes"
                            placeholderTextColor="#888"
                            returnKeyType="done"
                        />
                        <Text style={styles.label}>Window Start:</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setShowStartPicker(true)}
                        >
                            <Text style={styles.dateButtonText}>{windowStart.toLocaleString()}</Text>
                        </TouchableOpacity>
                        {showStartPicker && (
                            <DateTimePicker
                                value={windowStart}
                                mode="datetime"
                                display="default"
                                onChange={(_, date) => {
                                    setShowStartPicker(false);
                                    if (date) setWindowStart(date);
                                }}
                            />
                        )}
                    </>
                )}

                <Text style={styles.label}>{type === 'assignment' ? 'Due Date:' : 'Window End:'}</Text>
                <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => setShowEndPicker(true)}
                >
                    <Text style={styles.dateButtonText}>{windowEnd.toLocaleString()}</Text>
                </TouchableOpacity>
                {showEndPicker && (
                    <DateTimePicker
                        value={windowEnd}
                        mode="datetime"
                        display="default"
                        onChange={(_, date) => {
                            setShowEndPicker(false);
                            if (date) setWindowEnd(date);
                        }}
                    />
                )}

                <View style={styles.switchRow}>
                    <Text style={styles.label}>Allow overlaps with current occurrences?</Text>
                    <Switch value={allowOverlaps} onValueChange={setAllowOverlaps} />
                </View>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitButtonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 24,
        justifyContent: 'center',
    },
    header: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#222',
        textAlign: 'center',
    },
    label: {
        fontSize: 16,
        color: '#222',
        marginTop: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: '#888',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        color: '#222',
        backgroundColor: '#f5f5f5',
        marginBottom: 8,
        width: '100%',
        textAlign: 'center',
    },
    dateButton: {
        backgroundColor: '#eee',
        borderRadius: 8,
        padding: 10,
        marginTop: 8,
    },
    dateButtonText: {
        color: '#222',
        fontSize: 16,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
    },
    submitButton: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        padding: 12,
        marginTop: 20,
        width: '100%',
        alignItems: 'center',
    },
    submitButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cancelButton: {
        backgroundColor: '#888',
        borderRadius: 8,
        padding: 12,
        marginTop: 10,
        width: '100%',
        alignItems: 'center',
    },
    cancelButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default RescheduleScreen;
