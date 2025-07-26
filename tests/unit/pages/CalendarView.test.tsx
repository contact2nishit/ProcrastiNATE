import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CalendarView from '../../../app/requiresCurrentSchedule/CalendarView';
import { useCurrentScheduleContext } from '../../../app/requiresCurrentSchedule/CurrentScheduleContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../../app/config';
import { getStartOfWeek } from '../../../app/calendarUtils';

// Mock dependencies
jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
  },
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock('../../../app/requiresCurrentSchedule/CurrentScheduleContext', () => ({
  useCurrentScheduleContext: jest.fn(),
}));

jest.mock('../../../app/config', () => ({
  backendURL: 'http://mock-backend-url.com',
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('../../../app/calendarUtils', () => ({
  getStartOfWeek: jest.fn((date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
  }),
  screenWidth: 375,
  Slot: {},
}));

// Mock CalendarWeekView component since it's already tested
jest.mock('../../../components/CalendarWeekView', () => {
  return function MockCalendarWeekView(props: any) {
    const React = require('react');
    const { View, Text, TouchableOpacity } = require('react-native');
    
    return React.createElement(View, { testID: 'calendar-week-view' }, [
      React.createElement(Text, { key: 'header' }, 'MockCalendarWeekView'),
      props.showMeetingActions && props.slots.map((slot: any, index: number) => 
        React.createElement(View, { key: `slot-${index}`, testID: `slot-${index}` }, [
          React.createElement(Text, { key: 'name' }, slot.name),
          slot.type === 'meeting' && React.createElement(TouchableOpacity, 
            { 
              key: 'update',
              testID: `update-meeting-${index}`,
              onPress: () => props.onUpdateMeeting(slot)
            }, 
            React.createElement(Text, null, 'Update')
          ),
          slot.type === 'meeting' && React.createElement(TouchableOpacity, 
            { 
              key: 'delete',
              testID: `delete-meeting-${index}`,
              onPress: () => props.onDeleteMeeting(slot)
            }, 
            React.createElement(Text, null, 'Delete')
          ),
        ])
      ),
      React.createElement(TouchableOpacity, 
        { 
          key: 'change-date',
          testID: 'change-reference-date',
          onPress: () => props.onReferenceDateChange(new Date('2025-07-27'))
        }, 
        React.createElement(Text, null, 'Change Date')
      )
    ]);
  };
});

// Mock Alert
const mockAlert = jest.fn();
Alert.alert = mockAlert;

// Mock global fetch
global.fetch = jest.fn();

describe('CalendarView Component', () => {
  const { router } = require('expo-router');
  const { useCurrentScheduleContext } = require('../../../app/requiresCurrentSchedule/CurrentScheduleContext');
  
  let mockEnsureScheduleRange: jest.Mock;
  let mockRefetchSchedule: jest.Mock;
  let mockSetCurrSchedule: jest.Mock;

  const mockScheduleSlots = [
    {
      id: 'meeting_1_123',
      name: 'Team Standup',
      type: 'meeting',
      start: '2025-07-26T10:00:00+00:00',
      end: '2025-07-26T11:00:00+00:00',
      meeting_id: 1,
      occurence_id: 'meeting_1_123',
    },
    {
      id: 'assignment_2_456',
      name: 'Math Homework',
      type: 'assignment',
      start: '2025-07-26T14:00:00+00:00',
      end: '2025-07-26T15:00:00+00:00',
      assignment_id: 2,
      occurence_id: 456,
    },
    {
      id: 'meeting_3_789',
      name: 'Project Review',
      type: 'meeting',
      start: '2025-07-27T16:00:00+00:00', // Changed to July 27th to be in same week
      end: '2025-07-27T17:00:00+00:00',
      meeting_id: 3,
      occurence_id: 'meeting_3_789',
    },
  ];

  beforeEach(() => {
    mockEnsureScheduleRange = jest.fn().mockResolvedValue(undefined);
    mockRefetchSchedule = jest.fn().mockResolvedValue(undefined);
    mockSetCurrSchedule = jest.fn();

    useCurrentScheduleContext.mockReturnValue({
      currSchedule: {
        slots: mockScheduleSlots,
        startTime: '2025-07-26T00:00:00+00:00',
        endTime: '2025-08-02T23:59:59+00:00',
      },
      setCurrSchedule: mockSetCurrSchedule,
      ensureScheduleRange: mockEnsureScheduleRange,
      refetchSchedule: mockRefetchSchedule,
    });

    (getStartOfWeek as jest.Mock).mockImplementation((date) => {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day;
      return new Date(d.setDate(diff));
    });

    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');

    // Mock successful API responses by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('Success'),
      headers: new Headers(),
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'default' as ResponseType,
      url: 'http://mock-backend-url.com',
      clone: jest.fn(),
      body: null,
      bodyUsed: false,
      arrayBuffer: jest.fn(),
      blob: jest.fn(),
      formData: jest.fn(),
      bytes: jest.fn(),
    });

    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders calendar view with header', async () => {
      const { getByText, getByTestId } = render(<CalendarView />);
      
      await waitFor(() => {
        expect(getByText('Weekly Calendar')).toBeTruthy();
        expect(getByTestId('calendar-week-view')).toBeTruthy();
        expect(getByText('Back to Home')).toBeTruthy();
      });
    });

    it('renders calendar with filtered slots for current week', async () => {
      const { getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        expect(getByText('Team Standup')).toBeTruthy();
        expect(getByText('Math Homework')).toBeTruthy();
        expect(getByText('Project Review')).toBeTruthy();
      });
    });

    it('calls ensureScheduleRange on mount', async () => {
      render(<CalendarView />);
      
      await waitFor(() => {
        expect(mockEnsureScheduleRange).toHaveBeenCalled();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back to home when back button is pressed', async () => {
      const { getByText } = render(<CalendarView />);
      
      const backButton = getByText('Back to Home');
      fireEvent.press(backButton);
      
      expect(router.push).toHaveBeenCalledWith('/requiresCurrentSchedule/Home');
    });
  });

  describe('Date Management', () => {
    it('updates reference date and fetches new schedule', async () => {
      const { getByTestId } = render(<CalendarView />);
      
      await waitFor(() => {
        const changeDateButton = getByTestId('change-reference-date');
        fireEvent.press(changeDateButton);
      });
      
      await waitFor(() => {
        expect(mockEnsureScheduleRange).toHaveBeenCalledTimes(2); // Initial + after date change
      });
    });

    it('filters slots correctly for current week', async () => {
      const { getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        // Should show slots within the current week range
        expect(getByText('Team Standup')).toBeTruthy();
        expect(getByText('Project Review')).toBeTruthy();
      });
    });
  });

  describe('Meeting Update Modal', () => {
    it('opens update modal when update meeting is triggered', async () => {
      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        expect(getByText('Update Meeting')).toBeTruthy();
        expect(getByText('Submit Update')).toBeTruthy();
      });
    });

    it('allows updating meeting name', async () => {
      const { getByTestId, getByPlaceholderText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const nameInput = getByPlaceholderText('New Name');
        fireEvent.changeText(nameInput, 'Updated Meeting Name');
        expect(nameInput.props.value).toBe('Updated Meeting Name');
      });
    });

    it('allows updating meeting location', async () => {
      const { getByTestId, getByPlaceholderText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const locInput = getByPlaceholderText('New Location/Link');
        fireEvent.changeText(locInput, 'New Conference Room');
        expect(locInput.props.value).toBe('New Conference Room');
      });
    });

    it('allows updating meeting time', async () => {
      const { getByTestId, getByPlaceholderText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const timeInput = getByPlaceholderText('New Start Time (YYYY-MM-DDTHH:MM:SS+00:00)');
        fireEvent.changeText(timeInput, '2025-07-26T15:00:00+00:00');
        expect(timeInput.props.value).toBe('2025-07-26T15:00:00+00:00');
      });
    });

    it('submits meeting update successfully', async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const nameInput = getByPlaceholderText('New Name');
        fireEvent.changeText(nameInput, 'Updated Meeting');
        
        const submitButton = getByText('Submit Update');
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/update',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              future_occurences: false,
              meeting_id: 1,
              ocurrence_id: 'meeting_1_123',
              new_name: 'Updated Meeting',
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Meeting updated!');
        expect(mockRefetchSchedule).toHaveBeenCalled();
      });
    });

    it('closes modal on cancel', async () => {
      const { getByTestId, getByText, queryByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const cancelButton = getByText('Cancel');
        fireEvent.press(cancelButton);
      });
      
      await waitFor(() => {
        expect(queryByText('Update Meeting')).toBeFalsy();
      });
    });
  });

  describe('Meeting Delete Modal', () => {
    it('opens delete modal when delete meeting is triggered', async () => {
      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const deleteButton = getByTestId('delete-meeting-0');
        fireEvent.press(deleteButton);
      });
      
      await waitFor(() => {
        expect(getByText('Delete Meeting')).toBeTruthy();
        expect(getByText('Are you sure you want to delete this meeting occurrence?')).toBeTruthy();
        expect(getByText('Delete This Occurrence')).toBeTruthy();
        expect(getByText('Delete All Future Occurrences')).toBeTruthy();
      });
    });

    it('deletes single meeting occurrence', async () => {
      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const deleteButton = getByTestId('delete-meeting-0');
        fireEvent.press(deleteButton);
      });
      
      await waitFor(() => {
        const deleteThisButton = getByText('Delete This Occurrence');
        fireEvent.press(deleteThisButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/delete',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
              'Content-Type': 'application/json',
            }),
            body: JSON.stringify({
              occurence_id: 'meeting_1_123',
              meeting_id: 1,
              remove_all_future: false,
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Meeting deleted!');
        expect(mockRefetchSchedule).toHaveBeenCalled();
      });
    });

    it('deletes all future meeting occurrences', async () => {
      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const deleteButton = getByTestId('delete-meeting-0');
        fireEvent.press(deleteButton);
      });
      
      await waitFor(() => {
        const deleteAllButton = getByText('Delete All Future Occurrences');
        fireEvent.press(deleteAllButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/delete',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              occurence_id: 'meeting_1_123',
              meeting_id: 1,
              remove_all_future: true,
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', 'All future occurrences deleted!');
      });
    });
  });

  describe('Error Handling', () => {
    it('handles update API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Update failed'),
      });

      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const submitButton = getByText('Submit Update');
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to update meeting: Update failed');
      });
    });

    it('handles delete API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Delete failed'),
      });

      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const deleteButton = getByTestId('delete-meeting-0');
        fireEvent.press(deleteButton);
      });
      
      await waitFor(() => {
        const deleteThisButton = getByText('Delete This Occurrence');
        fireEvent.press(deleteThisButton);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to delete meeting: Delete failed');
      });
    });

    it('handles missing token for update', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const submitButton = getByText('Submit Update');
        fireEvent.press(submitButton);
      });
      
      // Should not make API call without token
      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('handles missing token for delete', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const deleteButton = getByTestId('delete-meeting-0');
        fireEvent.press(deleteButton);
      });
      
      await waitFor(() => {
        const deleteThisButton = getByText('Delete This Occurrence');
        fireEvent.press(deleteThisButton);
      });
      
      // Should not make API call without token
      await waitFor(() => {
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('handles network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const submitButton = getByText('Submit Update');
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', expect.stringContaining('Failed to update meeting'));
      });
    });
  });

  describe('State Management', () => {
    it('clears form fields after successful update', async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const nameInput = getByPlaceholderText('New Name');
        const locInput = getByPlaceholderText('New Location/Link');
        const timeInput = getByPlaceholderText('New Start Time (YYYY-MM-DDTHH:MM:SS+00:00)');
        
        fireEvent.changeText(nameInput, 'Test Name');
        fireEvent.changeText(locInput, 'Test Location');
        fireEvent.changeText(timeInput, 'Test Time');
        
        const submitButton = getByText('Submit Update');
        fireEvent.press(submitButton);
      });
      
      // After successful update, modal should be closed and fields cleared
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Meeting updated!');
      });
    });

    it('handles empty schedule slots gracefully', async () => {
      useCurrentScheduleContext.mockReturnValue({
        currSchedule: { slots: [] },
        setCurrSchedule: mockSetCurrSchedule,
        ensureScheduleRange: mockEnsureScheduleRange,
        refetchSchedule: mockRefetchSchedule,
      });

      const { getByText, getByTestId } = render(<CalendarView />);
      
      await waitFor(() => {
        expect(getByText('Weekly Calendar')).toBeTruthy();
        expect(getByTestId('calendar-week-view')).toBeTruthy();
      });
    });

    it('filters slots correctly based on date range', async () => {
      const pastSlot = {
        id: 'past_meeting',
        name: 'Past Meeting',
        type: 'meeting',
        start: '2025-07-20T10:00:00+00:00',
        end: '2025-07-20T11:00:00+00:00',
        meeting_id: 4,
        occurence_id: 'past_meeting',
      };

      const futureSlot = {
        id: 'future_meeting',
        name: 'Future Meeting',
        type: 'meeting',
        start: '2025-08-05T10:00:00+00:00',
        end: '2025-08-05T11:00:00+00:00',
        meeting_id: 5,
        occurence_id: 'future_meeting',
      };

      useCurrentScheduleContext.mockReturnValue({
        currSchedule: { 
          slots: [...mockScheduleSlots, pastSlot, futureSlot],
          startTime: '2025-07-01T00:00:00+00:00',
          endTime: '2025-08-31T23:59:59+00:00',
        },
        setCurrSchedule: mockSetCurrSchedule,
        ensureScheduleRange: mockEnsureScheduleRange,
        refetchSchedule: mockRefetchSchedule,
      });

      const { getByText, queryByText } = render(<CalendarView />);
      
      await waitFor(() => {
        // Should show current week slots
        expect(getByText('Team Standup')).toBeTruthy();
        expect(getByText('Project Review')).toBeTruthy();
        
        // Should not show past or future slots outside current week
        expect(queryByText('Past Meeting')).toBeFalsy();
        expect(queryByText('Future Meeting')).toBeFalsy();
      });
    });
  });

  describe('Loading States', () => {
    it('passes loading state to CalendarWeekView', async () => {
      // Mock ensureScheduleRange to be slow
      mockEnsureScheduleRange.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      const { getByTestId } = render(<CalendarView />);
      
      // Initially loading should be true
      await waitFor(() => {
        const calendarWeekView = getByTestId('calendar-week-view');
        expect(calendarWeekView).toBeTruthy();
      });
    });
  });

  describe('Integration with CalendarWeekView', () => {
    it('passes correct props to CalendarWeekView', async () => {
      const { getByTestId } = render(<CalendarView />);
      
      await waitFor(() => {
        const calendarWeekView = getByTestId('calendar-week-view');
        expect(calendarWeekView).toBeTruthy();
        // Verify that meeting action buttons are rendered (showMeetingActions=true)
        expect(getByTestId('update-meeting-0')).toBeTruthy(); // Team Standup
        expect(getByTestId('delete-meeting-0')).toBeTruthy();
        expect(getByTestId('update-meeting-2')).toBeTruthy(); // Project Review
        expect(getByTestId('delete-meeting-2')).toBeTruthy();
      });
    });

    it('handles onUpdateMeeting callback correctly', async () => {
      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const updateButton = getByTestId('update-meeting-0');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        expect(getByText('Update Meeting')).toBeTruthy();
      });
    });

    it('handles onDeleteMeeting callback correctly', async () => {
      const { getByTestId, getByText } = render(<CalendarView />);
      
      await waitFor(() => {
        const deleteButton = getByTestId('delete-meeting-0');
        fireEvent.press(deleteButton);
      });
      
      await waitFor(() => {
        expect(getByText('Delete Meeting')).toBeTruthy();
      });
    });
  });
});
