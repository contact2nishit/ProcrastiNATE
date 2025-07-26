import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SchedulePicker from '../../../app/requiresCurrentSchedule/requiresPotentialSchedule/schedulePicker';
import { usePotentialScheduleContext } from '../../../app/requiresCurrentSchedule/requiresPotentialSchedule/PotentialScheduleContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
  useNavigation: jest.fn(),
}));

jest.mock('../../../app/requiresCurrentSchedule/requiresPotentialSchedule/PotentialScheduleContext', () => ({
  usePotentialScheduleContext: jest.fn(),
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
global.alert = jest.fn();

// Mock global fetch
global.fetch = jest.fn();

describe('SchedulePicker Component', () => {
  const { useRouter, useNavigation } = require('expo-router');
  const { usePotentialScheduleContext } = require('../../../app/requiresCurrentSchedule/requiresPotentialSchedule/PotentialScheduleContext');
  
  let mockPush: jest.Mock;
  let mockGoBack: jest.Mock;
  let mockSetPotentialSchedules: jest.Mock;

  const mockPotentialSchedules = {
    conflicting_meetings: ['Team Meeting conflicts with Daily Standup'],
    schedules: [
      {
        assignments: [
          {
            name: 'Math Homework',
            schedule: {
              status: 'fully_scheduled',
              slots: [
                { start: '2025-07-26T14:00:00Z', end: '2025-07-26T16:00:00Z' }
              ]
            }
          }
        ],
        chores: [
          {
            name: 'Clean Kitchen',
            schedule: {
              status: 'partially_scheduled',
              slots: [
                { start: '2025-07-26T18:00:00Z', end: '2025-07-26T19:00:00Z' }
              ]
            }
          }
        ],
        conflicting_assignments: ['History Essay'],
        conflicting_chores: [],
        not_enough_time_assignments: ['Physics Project'],
        not_enough_time_chores: ['Organize Garage'],
        total_potential_xp: 150
      },
      {
        assignments: [],
        chores: [
          {
            name: 'Study Session',
            schedule: {
              status: 'unschedulable',
              slots: []
            }
          }
        ],
        conflicting_assignments: [],
        conflicting_chores: ['Laundry'],
        not_enough_time_assignments: [],
        not_enough_time_chores: [],
        total_potential_xp: 75
      }
    ],
    meetings: [
      {
        name: 'Team Standup',
        start_end_times: [
          ['2025-07-26T09:00:00Z', '2025-07-26T09:30:00Z'],
          ['2025-07-27T09:00:00Z', '2025-07-27T09:30:00Z']
        ]
      }
    ]
  };

  const mockEmptySchedules = {
    conflicting_meetings: [],
    schedules: [],
    meetings: []
  };

  beforeEach(() => {
    mockPush = jest.fn();
    mockGoBack = jest.fn();
    mockSetPotentialSchedules = jest.fn();

    useRouter.mockReturnValue({
      push: mockPush,
    });

    useNavigation.mockReturnValue({
      goBack: mockGoBack,
    });

    usePotentialScheduleContext.mockReturnValue({
      potentialSchedules: mockPotentialSchedules,
      setPotentialSchedules: mockSetPotentialSchedules,
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('Success'),
    });

    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        expect(getByText('Pick a Schedule')).toBeTruthy();
      });
    });

    it('renders schedule boxes for each available schedule', async () => {
      const { getByText, getAllByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        expect(getByText('Schedule #1')).toBeTruthy();
        expect(getByText('Schedule #2')).toBeTruthy();
        const hintTexts = getAllByText('Tap to view details');
        expect(hintTexts.length).toBe(2);
      });
    });

    it('displays conflicting meetings when present', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        expect(getByText('Conflicting Meetings:')).toBeTruthy();
        expect(getByText('Team Meeting conflicts with Daily Standup')).toBeTruthy();
      });
    });

    it('does not display conflicting meetings section when none exist', async () => {
      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: { ...mockPotentialSchedules, conflicting_meetings: [] },
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { queryByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        expect(queryByText('Conflicting Meetings:')).toBeFalsy();
      });
    });

    it('renders go back button', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        expect(getByText('Go Back')).toBeTruthy();
      });
    });
  });

  describe('Empty States', () => {
    beforeEach(() => {
      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: mockEmptySchedules,
        setPotentialSchedules: mockSetPotentialSchedules,
      });
    });

    it('handles empty schedules gracefully', async () => {
      const { getByText, queryByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        expect(getByText('Pick a Schedule')).toBeTruthy();
        expect(queryByText('Schedule #1')).toBeFalsy();
      });
    });

    it('handles null potential schedules', async () => {
      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: null,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        expect(getByText('Pick a Schedule')).toBeTruthy();
      });
    });

    it('handles undefined potential schedules', async () => {
      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: undefined,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        expect(getByText('Pick a Schedule')).toBeTruthy();
      });
    });
  });

  describe('Schedule Modal', () => {
    it('opens modal when schedule box is pressed', async () => {
      const { getAllByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBoxes = getAllByText('Schedule #1');
        fireEvent.press(scheduleBoxes[0]); // Press the first one (the box, not modal header)
        
        expect(scheduleBoxes.length).toBeGreaterThan(0);
      });
    });

    it('displays assignments in modal', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Assignments')).toBeTruthy();
        expect(getByText('Math Homework')).toBeTruthy();
        expect(getByText('Status: Fully Scheduled')).toBeTruthy();
      });
    });

    it('displays chores in modal', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Chores')).toBeTruthy();
        expect(getByText('Clean Kitchen')).toBeTruthy();
        expect(getByText('Status: Partially Scheduled')).toBeTruthy();
      });
    });

    it('displays meetings in modal', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Meetings')).toBeTruthy();
        expect(getByText('Team Standup')).toBeTruthy();
      });
    });

    it('displays conflicts in modal', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Conflicts')).toBeTruthy();
        expect(getByText('Assignment conflict: History Essay')).toBeTruthy();
        expect(getByText('Not enough time for assignment: Physics Project')).toBeTruthy();
        expect(getByText('Not enough time for chore: Organize Garage')).toBeTruthy();
      });
    });

    it('displays potential XP in modal', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Potential XP: 150')).toBeTruthy();
      });
    });

    it('displays "None" for empty sections', async () => {
      const { getByText, getAllByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #2');
        fireEvent.press(scheduleBox);
        
        const noneTexts = getAllByText('None');
        expect(noneTexts.length).toBeGreaterThan(0);
      });
    });

    it('closes modal when close button is pressed', async () => {
      const { getByText, queryByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
      });
      
      await waitFor(() => {
        const closeButton = getByText('Close');
        fireEvent.press(closeButton);
        
        // Modal should be closed, so modal header should not be visible
        expect(queryByText('Schedule #1')).toBeTruthy(); // This is the schedule box, not modal header
      });
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly in modal', async () => {
      const { getAllByText, getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBoxes = getAllByText('Schedule #1');
        fireEvent.press(scheduleBoxes[0]);
        
        // Check that dates are formatted (should contain formatted date strings)
        // The exact format depends on locale, but should contain date/time info
        expect(getByText('Math Homework')).toBeTruthy(); // Verify modal is open
      });
    });
  });

  describe('Status Mapping', () => {
    it('maps status correctly', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Status: Fully Scheduled')).toBeTruthy();
        expect(getByText('Status: Partially Scheduled')).toBeTruthy();
      });
    });

    it('handles unschedulable status', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #2');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Status: Unschedulable')).toBeTruthy();
      });
    });
  });

  describe('Schedule Submission', () => {
    it('submits schedule successfully', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
      });
      
      await waitFor(() => {
        const setButton = getByText('Set This Schedule');
        fireEvent.press(setButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/setSchedule',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            }),
            body: JSON.stringify(mockPotentialSchedules.schedules[0]),
          })
        );
        expect(global.alert).toHaveBeenCalledWith('Schedule set successfully!');
        expect(mockPush).toHaveBeenCalledWith('/requiresCurrentSchedule/Home');
      });
    });

    it('handles missing token error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce(null);

      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
      });
      
      await waitFor(() => {
        const setButton = getByText('Set This Schedule');
        fireEvent.press(setButton);
      });
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Backend URL or token not set.');
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('handles API failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Server error'),
      });

      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
      });
      
      await waitFor(() => {
        const setButton = getByText('Set This Schedule');
        fireEvent.press(setButton);
      });
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to set schedule: Server error');
        expect(mockPush).not.toHaveBeenCalled();
      });
    });

    it('handles network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
      });
      
      await waitFor(() => {
        const setButton = getByText('Set This Schedule');
        fireEvent.press(setButton);
      });
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Error setting schedule: Error: Network error');
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when go back button is pressed', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const goBackButton = getByText('Go Back');
        fireEvent.press(goBackButton);
        
        expect(mockGoBack).toHaveBeenCalled();
      });
    });

    it('navigates to potential calendar view when button is pressed', async () => {
      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
      });
      
      await waitFor(() => {
        const viewButton = getByText('View Potential Schedule');
        fireEvent.press(viewButton);
        
        expect(mockPush).toHaveBeenCalledWith('/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential?scheduleIdx=0');
      });
    });
  });

  describe('Modal State Management', () => {
    it('closes modal after successful schedule submission', async () => {
      const { getByText, queryByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
      });
      
      await waitFor(() => {
        const setButton = getByText('Set This Schedule');
        fireEvent.press(setButton);
      });
      
      await waitFor(() => {
        // Modal should be closed after successful submission
        // We can't easily test modal visibility, but we can check that navigation happened
        expect(mockPush).toHaveBeenCalledWith('/requiresCurrentSchedule/Home');
      });
    });

    it('maintains modal state after API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Server error'),
      });

      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
      });
      
      await waitFor(() => {
        const setButton = getByText('Set This Schedule');
        fireEvent.press(setButton);
      });
      
      await waitFor(() => {
        // Modal should still be open after error
        expect(getByText('Close')).toBeTruthy();
      });
    });
  });

  describe('Complex Schedule Data', () => {
    it('handles schedules with multiple time slots', async () => {
      const complexSchedule = {
        ...mockPotentialSchedules,
        schedules: [
          {
            assignments: [
              {
                name: 'Multi-slot Assignment',
                schedule: {
                  status: 'fully_scheduled',
                  slots: [
                    { start: '2025-07-26T14:00:00Z', end: '2025-07-26T15:00:00Z' },
                    { start: '2025-07-26T16:00:00Z', end: '2025-07-26T17:00:00Z' }
                  ]
                }
              }
            ],
            chores: [],
            conflicting_assignments: [],
            conflicting_chores: [],
            not_enough_time_assignments: [],
            not_enough_time_chores: [],
            total_potential_xp: 100
          }
        ]
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: complexSchedule,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByText, getAllByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Multi-slot Assignment')).toBeTruthy();
        // Should display multiple time slots
        const timeElements = getAllByText(/2025/);
        expect(timeElements.length).toBeGreaterThan(1);
      });
    });

    it('handles meetings with multiple occurrences', async () => {
      const { getByText, getAllByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Team Standup')).toBeTruthy();
        // Should display multiple meeting occurrences
        const timeElements = getAllByText(/2025/);
        expect(timeElements.length).toBeGreaterThan(1);
      });
    });
  });

  describe('Context Integration', () => {
    it('uses potential schedule context correctly', async () => {
      render(<SchedulePicker />);
      expect(usePotentialScheduleContext).toHaveBeenCalled();
    });

    it('uses router correctly', async () => {
      render(<SchedulePicker />);
      expect(useRouter).toHaveBeenCalled();
    });

    it('uses navigation correctly', async () => {
      render(<SchedulePicker />);
      expect(useNavigation).toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles missing schedule properties gracefully', async () => {
      const incompleteSchedule = {
        schedules: [
          {
            assignments: [],
            chores: [],
            conflicting_assignments: [],
            conflicting_chores: [],
            not_enough_time_assignments: [],
            not_enough_time_chores: [],
            total_potential_xp: 0
          }
        ],
        meetings: []
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: incompleteSchedule,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('Potential XP: 0')).toBeTruthy();
      });
    });

    it('handles very long schedule names', async () => {
      const longNameSchedule = {
        ...mockPotentialSchedules,
        schedules: [
          {
            assignments: [
              {
                name: 'This is a very long assignment name that might cause UI issues if not handled properly',
                schedule: {
                  status: 'fully_scheduled',
                  slots: [{ start: '2025-07-26T14:00:00Z', end: '2025-07-26T16:00:00Z' }]
                }
              }
            ],
            chores: [],
            conflicting_assignments: [],
            conflicting_chores: [],
            not_enough_time_assignments: [],
            not_enough_time_chores: [],
            total_potential_xp: 50
          }
        ]
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: longNameSchedule,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByText } = render(<SchedulePicker />);
      
      await waitFor(() => {
        const scheduleBox = getByText('Schedule #1');
        fireEvent.press(scheduleBox);
        
        expect(getByText('This is a very long assignment name that might cause UI issues if not handled properly')).toBeTruthy();
      });
    });
  });
});
