import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

type RescheduleModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (params: {
    new_effort?: number;
    new_window_start?: string;
    new_window_end?: string;
    new_due?: string;
    allow_overlaps: boolean;
  }) => void;
  eventType: 'assignment' | 'chore';
  currentEffort: number;
  currentDue?: string;
  currentWindowStart?: string;
  currentWindowEnd?: string;
};

export default function RescheduleModal({
  visible,
  onClose,
  onSubmit,
  eventType,
  currentEffort,
  currentDue,
  currentWindowStart,
  currentWindowEnd,
}: RescheduleModalProps) {
  const [effort, setEffort] = useState<number>(currentEffort);
  const [due, setDue] = useState<Date>(currentDue ? new Date(currentDue) : new Date());
  const [windowStart, setWindowStart] = useState<Date>(currentWindowStart ? new Date(currentWindowStart) : new Date());
  const [windowEnd, setWindowEnd] = useState<Date>(currentWindowEnd ? new Date(currentWindowEnd) : new Date());
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [allowOverlaps, setAllowOverlaps] = useState(false);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.header}>Reschedule {eventType === 'assignment' ? 'Assignment' : 'Chore'}</Text>
          <Text style={styles.label}>Effort (minutes):</Text>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.effortButton}
              onPress={() => setEffort(Math.max(1, effort - 1))}
            >
              <Text style={styles.effortButtonText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.effortValue}>{effort}</Text>
            <TouchableOpacity
              style={styles.effortButton}
              onPress={() => setEffort(effort + 1)}
            >
              <Text style={styles.effortButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          {eventType === 'assignment' ? (
            <>
              <Text style={styles.label}>Due Date:</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDuePicker(true)}
              >
                <Text style={styles.dateButtonText}>{due.toLocaleString()}</Text>
              </TouchableOpacity>
              {showDuePicker && (
                <DateTimePicker
                  value={due}
                  mode="datetime"
                  display="default"
                  onChange={(_, date) => {
                    setShowDuePicker(false);
                    if (date) setDue(date);
                  }}
                />
              )}
            </>
          ) : (
            <>
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
              <Text style={styles.label}>Window End:</Text>
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
            </>
          )}
          <View style={styles.switchRow}>
            <Text style={styles.label}>Allow overlaps with current occurrences?</Text>
            <Switch value={allowOverlaps} onValueChange={setAllowOverlaps} />
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              const params: any = { allow_overlaps: allowOverlaps };
              if (effort !== currentEffort) params.new_effort = effort;
              if (eventType === 'assignment') {
                if (due.toISOString() !== currentDue) params.new_window_end = due.toISOString();
              } else {
                if (windowStart.toISOString() !== currentWindowStart) params.new_window_start = windowStart.toISOString();
                if (windowEnd.toISOString() !== currentWindowEnd) params.new_window_end = windowEnd.toISOString();
              }
              onSubmit(params);
            }}
          >
            <Text style={styles.submitButtonText}>Submit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  content: { backgroundColor: 'white', borderRadius: 12, padding: 24, width: '85%', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, color: '#222' },
  label: { fontSize: 16, color: '#222', marginTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  effortButton: { backgroundColor: '#2563eb', borderRadius: 8, padding: 8, marginHorizontal: 10 },
  effortButtonText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  effortValue: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  dateButton: { backgroundColor: '#eee', borderRadius: 8, padding: 10, marginTop: 8 },
  dateButtonText: { color: '#222', fontSize: 16 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16 },
  submitButton: { backgroundColor: '#2563eb', borderRadius: 8, padding: 12, marginTop: 20, width: '100%', alignItems: 'center' },
  submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { backgroundColor: '#888', borderRadius: 8, padding: 12, marginTop: 10, width: '100%', alignItems: 'center' },
  cancelButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
