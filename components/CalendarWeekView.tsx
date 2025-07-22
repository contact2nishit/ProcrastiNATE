import React, {useState, useEffect} from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import {formatTime, getWeekDaysFromDate, groupSlotsByDay, Slot, screenWidth} from './calendarUtils';


type CalendarWeekViewProps = {
    slots: Slot[];
    loading?: boolean;
    initialReferenceDate?: Date;
    onReferenceDateChange?: (date: Date) => void;
    showMeetingActions?: boolean;
    onUpdateMeeting?: (meetingSlot: Slot) => void;
    onDeleteMeeting?: (meetingSlot: Slot) => void;
}

const screenwidth = Dimensions.get('window').width;

export default function CalendarWeekView({
    slots,
    loading = false,
    initialReferenceDate = new Date(),
    onReferenceDateChange,
    showMeetingActions = false,
    onUpdateMeeting,
    onDeleteMeeting,
}: CalendarWeekViewProps) {
    const weekDays = getWeekDaysFromDate(initialReferenceDate);
    const groupedSlots = groupSlotsByDay(slots);

    const goToPrevWeek = () => {
        const newDate = new Date(initialReferenceDate);
        newDate.setDate(newDate.getDate() - 7);
        onReferenceDateChange?.(newDate);
    };
    const goToNextWeek = () => {
        const newDate = new Date(initialReferenceDate);
        newDate.setDate(newDate.getDate() + 7);
        onReferenceDateChange?.(newDate);
    }
    const goToCurrentWeek = () => {
        const newDate = new Date(initialReferenceDate);
        onReferenceDateChange?.(newDate);
    };
    return (
        <View>
            {/*Week Navigation*/}
            <View style = {styles.weekNavContainer}>
                <TouchableOpacity onPress = {goToPrevWeek} style = {styles.navButton}>
                    <Text style = {styles.navButtonText}>Prev</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress = {goToCurrentWeek} style = {styles.currentWeekButton}>
                    <Text style = {styles.currentWeekText}>Current Week</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress = {goToNextWeek} style = {styles.navButton}>
                    <Text style = {styles.navButtonText}>Next</Text>
                </TouchableOpacity>
            </View>
            {loading ? (
                <ActivityIndicator size = "large" color = "#0f0" style = {{ marginTop: 40 }} />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {weekDays.map((day, index) => (
                        <View key={index} style={styles.dayColumn}>
                            <Text style={styles.dayLabel}>{day.label}</Text>
                            <ScrollView style={styles.dayContentS} nestedScrollEnabled = {true}>
                                {(groupedSlots[day.iso] || []).map((slot, idx) => (
                                    <View key = {idx} style={styles.slotBox}>
                                        <Text style={styles.slotTitle}>{slot.name}</Text>
                                        <Text style={styles.slotSub}>
                                            {slot.type.toUpperCase()} • {formatTime(slot.start)} - {formatTime(slot.end)}
                                        </Text>
                                        {slot.type === 'meeting' && showMeetingActions && (
                                            <View style = {{flexDirection: 'row', marginTop: 5}}>
                                                <TouchableOpacity onPress={() => onUpdateMeeting?.(slot)} style = {styles.editButton}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Edit</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => onDeleteMeeting?.(slot)} style = {styles.deleteButton}>
                                                    <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </ScrollView>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    )
}



const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 30,
        backgroundColor: '#111',
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
    editButton: {
        backgroundColor: '#2563eb',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#dc2626',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
    }
});