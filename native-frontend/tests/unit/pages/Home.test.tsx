import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import Home from '../../../app/requiresCurrentSchedule/Home';
import { useCurrentScheduleContext } from '../../../app/requiresCurrentSchedule/CurrentScheduleContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../../../app/config';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: jest.fn(() => ({ params: {} })),
  useFocusEffect: jest.fn((callback) => {
    // Call the callback immediately to simulate focus
    callback();
  }),
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

// Mock Alert
const mockAlert = jest.fn();
Alert.alert = mockAlert;

// Mock global fetch
global.fetch = jest.fn();

describe('Home Component', () => {
  const { useRouter } = require('expo-router');
  const { useCurrentScheduleContext } = require('../../../app/requiresCurrentSchedule/CurrentScheduleContext');
  
  let mockPush: jest.Mock;
  let mockReplace: jest.Mock;
  let mockEnsureScheduleRange: jest.Mock;
  let mockRefetchSchedule: jest.Mock;
  let mockSetCurrSchedule: jest.Mock;

  const mockTodoList = [
    {
      id: 'meeting_1_123',
      name: 'Team Standup',
      type: 'meeting',
      start: '2025-07-26T10:00:00Z',
      end: '2025-07-26T11:00:00Z',
      meeting_id: 1,
      occurence_id: 123,
    },
    {
      id: 'assignment_2_456',
      name: 'Math Homework',
      type: 'assignment',
      start: '2025-07-26T08:00:00Z', // Past time
      end: '2025-07-26T09:00:00Z',
      assignment_id: 2,
      occurence_id: 456,
      completed: false,
    },
    {
      id: 'chore_3_789',
      name: 'Clean Kitchen',
      type: 'chore',
      start: '2025-07-26T07:00:00Z', // Past time
      end: '2025-07-26T08:00:00Z',
      chore_id: 3,
      occurence_id: 789,
      completed: true,
    },
    {
      id: 'assignment_4_101',
      name: 'Future Assignment',
      type: 'assignment',
      start: '2025-07-26T23:00:00Z', // Future time
      end: '2025-07-26T23:30:00Z',
      assignment_id: 4,
      occurence_id: 101,
      completed: false,
    },
  ];

  const mockLevelInfo = {
    xp: 150,
    level: 3,
    user_name: 'TestUser',
  };

  beforeEach(() => {
    mockPush = jest.fn();
    mockReplace = jest.fn();
    mockEnsureScheduleRange = jest.fn().mockResolvedValue(undefined);
    mockRefetchSchedule = jest.fn().mockResolvedValue(undefined);
    mockSetCurrSchedule = jest.fn();

    useRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    useCurrentScheduleContext.mockReturnValue({
      currSchedule: {
        slots: mockTodoList,
        startTime: '2025-07-26T00:00:00Z',
        endTime: '2025-07-26T23:59:59Z',
      },
      setCurrSchedule: mockSetCurrSchedule,
      ensureScheduleRange: mockEnsureScheduleRange,
      refetchSchedule: mockRefetchSchedule,
    });

    // Mock AsyncStorage
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');

    // Mock successful API responses by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockLevelInfo),
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
    it('renders welcome message with level info', async () => {
      const { getByText } = render(<Home />);
      
      await waitFor(() => {
        expect(getByText('Welcome, TestUser!')).toBeTruthy();
        expect(getByText('Level: 3')).toBeTruthy();
        expect(getByText('XP: 150 / 337')).toBeTruthy(); // 100 * 1.5^3 = 337
      });
    });

    it('renders todo list items correctly', async () => {
      const { getByText, getAllByText } = render(<Home />);
      
      await waitFor(() => {
        expect(getByText('Team Standup')).toBeTruthy();
        expect(getByText('Math Homework')).toBeTruthy();
        expect(getByText('Clean Kitchen')).toBeTruthy();
        expect(getByText('Meeting')).toBeTruthy();
        expect(getAllByText('Assignment').length).toBeGreaterThan(0);
        expect(getByText('Chore')).toBeTruthy();
      });
    });

    it('shows completed status for completed items', async () => {
      const { getByText } = render(<Home />);
      
      await waitFor(() => {
        expect(getByText('✓ Completed')).toBeTruthy();
      });
    });

    it('shows empty state when no todos', async () => {
      useCurrentScheduleContext.mockReturnValue({
        currSchedule: { slots: [], startTime: '', endTime: '' },
        setCurrSchedule: mockSetCurrSchedule,
        ensureScheduleRange: mockEnsureScheduleRange,
        refetchSchedule: mockRefetchSchedule,
      });

      const { getByText } = render(<Home />);
      
      await waitFor(() => {
        expect(getByText('No events for today.')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates to calendar view when calendar button is pressed', async () => {
      const { getByTestId } = render(<Home />);
      
      const calendarButton = getByTestId('calendar-button');
      fireEvent.press(calendarButton);
      
      expect(mockPush).toHaveBeenCalledWith('/requiresCurrentSchedule/CalendarView');
    });

    it('navigates to event selection when add event button is pressed', async () => {
      const { getByText } = render(<Home />);
      
      const addButton = getByText('+');
      fireEvent.press(addButton);
      
      expect(mockPush).toHaveBeenCalledWith('/requiresCurrentSchedule/requiresPotentialSchedule/eventSelection');
    });

    it('logs out and navigates to login when back button is pressed', async () => {
      const { getByText } = render(<Home />);
      
      const backButton = getByText('Back to Login');
      fireEvent.press(backButton);
      
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  describe('Google Calendar Sync', () => {
    it('syncs successfully with valid token', async () => {
      const { getByText } = render(<Home />);
      
      await waitFor(() => {
        const syncButton = getByText('Sync Google Calendar');
        fireEvent.press(syncButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/googleCalendar/sync',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', expect.any(String));
      });
    });

    it('shows error when token is missing', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const { getByText } = render(<Home />);
      
      await waitFor(() => {
        const syncButton = getByText('Sync Google Calendar');
        fireEvent.press(syncButton);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Backend URL or token not set.');
      });
    });

    it('handles sync API failure', async () => {
      // Mock failed response first
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLevelInfo),
        })
        .mockResolvedValueOnce({
          ok: false,
          text: () => Promise.resolve('Sync failed'),
        });

      const { getByText } = render(<Home />);
      
      await waitFor(() => {
        const syncButton = getByText('Sync Google Calendar');
        fireEvent.press(syncButton);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to sync Google Calendar: Sync failed');
      });
    });
  });

  describe('Session Completion', () => {
    it('opens mark session modal for incomplete assignment', async () => {
      const { getByText, getAllByText, getByTestId } = render(<Home />);
      
      await waitFor(() => {
        const markButtons = getAllByText('Mark Session Completed');
        fireEvent.press(markButtons[0]); // Math Homework
      });
      
      await waitFor(() => {
        expect(getByText('How locked in were you? Be honest.')).toBeTruthy();
      });
    });

    it('prevents early completion of future sessions', async () => {
      const { getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const markButtons = getAllByText('Mark Session Completed');
        fireEvent.press(markButtons[1]); // Future Assignment
        
        expect(mockAlert).toHaveBeenCalledWith(
          'Too Early!',
          expect.stringContaining('This session hasn\'t started yet'),
          expect.any(Array)
        );
      });
    });

    it('successfully marks session as completed', async () => {
      const { getAllByText } = render(<Home />);
      
      let markButtons: any[] = [];
      await waitFor(() => {
        markButtons = getAllByText('Mark Session Completed');
        fireEvent.press(markButtons[0]); // Math Homework
      });
      
      await waitFor(() => {
        // Get the submit button from the modal
        const modalButtons = getAllByText('Mark Session Completed');
        const submitButton = modalButtons[modalButtons.length - 1];
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/markSessionCompleted',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              occurence_id: 456,
              completed: true,
              is_assignment: true,
              locked_in: 5,
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Session marked as completed!');
      });
    });
  });

  describe('Meeting Management', () => {
    it('opens update modal for meetings', async () => {
      const { getByText } = render(<Home />);
      
      await waitFor(() => {
        const updateButton = getByText('Update');
        fireEvent.press(updateButton);
        
        expect(getByText('Update Meeting')).toBeTruthy();
        expect(getByText('Submit Update')).toBeTruthy();
      });
    });

    it('updates meeting successfully', async () => {
      const { getByText, getByPlaceholderText } = render(<Home />);
      
      await waitFor(() => {
        const updateButton = getByText('Update');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const nameInput = getByPlaceholderText('New Name');
        fireEvent.changeText(nameInput, 'Updated Meeting Name');
        
        const submitButton = getByText('Submit Update');
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/update',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              future_occurences: false,
              meeting_id: 1,
              ocurrence_id: 'meeting_1_123',
              new_name: 'Updated Meeting Name',
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Meeting updated!');
      });
    });

    it('opens delete modal for meetings', async () => {
      const { getByText, getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const deleteButtons = getAllByText('Delete');
        fireEvent.press(deleteButtons[0]); // Meeting delete button
        
        expect(getByText('Delete Meeting')).toBeTruthy();
        expect(getByText('Delete This Occurrence')).toBeTruthy();
        expect(getByText('Delete All Future Occurrences')).toBeTruthy();
      });
    });

    it('deletes single meeting occurrence', async () => {
      const { getByText, getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const deleteButtons = getAllByText('Delete');
        fireEvent.press(deleteButtons[0]); // Meeting delete button
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
            body: JSON.stringify({
              occurence_id: 'meeting_1_123',
              meeting_id: 1,
              remove_all_future: false,
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Meeting deleted!');
      });
    });
  });

  describe('Event Deletion', () => {
    it('deletes assignment successfully', async () => {
      const { getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const deleteButtons = getAllByText('Delete');
        fireEvent.press(deleteButtons[1]); // Assignment delete button
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/delete',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              occurence_id: 456,
              remove_all_future: false,
              event_type: 'assignment',
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Assignment deleted!');
      });
    });

    it('deletes chore successfully', async () => {
      const { getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const deleteButtons = getAllByText('Delete');
        fireEvent.press(deleteButtons[2]); // Chore delete button
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/delete',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              occurence_id: 789,
              remove_all_future: false,
              event_type: 'chore',
            }),
          })
        );
        expect(mockAlert).toHaveBeenCalledWith('Success', 'Chore deleted!');
      });
    });
  });

  describe('Rescheduling', () => {
    it('navigates to reschedule screen for assignment', async () => {
      const { getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const rescheduleButtons = getAllByText('Reschedule');
        fireEvent.press(rescheduleButtons[0]); // Assignment reschedule
      });
      
      expect(mockPush).toHaveBeenCalledWith(
        '/requiresCurrentSchedule/requiresPotentialSchedule/RescheduleScreen?id=2&type=assignment&effort=undefined&start=2025-07-26T08:00:00Z&end=2025-07-26T09:00:00Z&label=Reschedule Assignment'
      );
    });

    it('navigates to reschedule screen for chore', async () => {
      const { getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const rescheduleButtons = getAllByText('Reschedule');
        fireEvent.press(rescheduleButtons[1]); // Chore reschedule
      });
      
      expect(mockPush).toHaveBeenCalledWith(
        '/requiresCurrentSchedule/requiresPotentialSchedule/RescheduleScreen?id=3&type=chore&effort=undefined&start=2025-07-26T07:00:00Z&end=2025-07-26T08:00:00Z&label=Reschedule Chore'
      );
    });
  });

  describe('Modal Interactions', () => {
    it('closes modal when cancel is pressed', async () => {
      const { getByText, queryByText } = render(<Home />);
      
      await waitFor(() => {
        const updateButton = getByText('Update');
        fireEvent.press(updateButton);
      });
      
      await waitFor(() => {
        const cancelButton = getByText('Cancel');
        fireEvent.press(cancelButton);
        
        expect(queryByText('Update Meeting')).toBeFalsy();
      });
    });

    it('adjusts locked-in value in session completion modal', async () => {
      const { getByText, getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const markButtons = getAllByText('Mark Session Completed');
        fireEvent.press(markButtons[0]);
      });
      
      await waitFor(() => {
        expect(getByText('5/10')).toBeTruthy();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles API errors gracefully for level info', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<Home />);
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', expect.stringContaining('Failed to fetch level info'));
      });
    });

    it('handles missing token for operations', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const { getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const markButtons = getAllByText('Mark Session Completed');
        fireEvent.press(markButtons[0]);
      });
      
      await waitFor(() => {
        const modalButtons = getAllByText('Mark Session Completed');
        const submitButton = modalButtons[modalButtons.length - 1];
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Backend URL or token not set.');
      });
    });

    it('handles API failures for session completion', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockLevelInfo),
        })
        .mockResolvedValueOnce({
          ok: false,
          text: () => Promise.resolve('Completion failed'),
        });

      const { getAllByText } = render(<Home />);
      
      await waitFor(() => {
        const markButtons = getAllByText('Mark Session Completed');
        fireEvent.press(markButtons[0]);
      });
      
      await waitFor(() => {
        const modalButtons = getAllByText('Mark Session Completed');
        const submitButton = modalButtons[modalButtons.length - 1];
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Error', 'Failed to mark session as completed: Completion failed');
      });
    });
  });

  describe('State Management', () => {
    it('calls refetch functions when component gains focus', async () => {
      render(<Home />);
      
      await waitFor(() => {
        expect(mockRefetchSchedule).toHaveBeenCalled();
        expect(mockEnsureScheduleRange).toHaveBeenCalled();
      });
    });
  });
});
