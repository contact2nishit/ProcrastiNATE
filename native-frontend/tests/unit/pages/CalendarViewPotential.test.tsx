import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CalendarViewPotential from '../../../app/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential';
import { usePotentialScheduleContext } from '../../../app/requiresCurrentSchedule/requiresPotentialSchedule/PotentialScheduleContext';

// Mock dependencies
jest.mock('expo-router', () => ({
  useNavigation: jest.fn(),
  useRouter: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

jest.mock('../../../app/requiresCurrentSchedule/requiresPotentialSchedule/PotentialScheduleContext', () => ({
  usePotentialScheduleContext: jest.fn(),
}));

jest.mock('../../../app/calendarUtils', () => ({
  formatTime: jest.fn((time) => time),
  screenWidth: 400,
  getStartOfWeek: jest.fn((date) => new Date('2025-07-21T00:00:00Z')), // Monday
  Slot: jest.fn(),
}));

jest.mock('../../../components/CalendarWeekView', () => {
  return jest.fn(({ slots, showMeetingActions, initialReferenceDate, onReferenceDateChange }) => {
    const { View, Text, TouchableOpacity } = require('react-native');
    return (
      <View testID="calendar-week-view">
        <Text>CalendarWeekView</Text>
        <Text testID="slots-count">{slots.length}</Text>
        <Text testID="show-meeting-actions">{showMeetingActions.toString()}</Text>
        <TouchableOpacity
          testID="change-reference-date"
          onPress={() => onReferenceDateChange && onReferenceDateChange(new Date('2025-07-28T00:00:00Z'))}
        >
          <Text>Change Date</Text>
        </TouchableOpacity>
      </View>
    );
  });
});

describe('CalendarViewPotential Component', () => {
  const { useNavigation, useRouter, useLocalSearchParams } = require('expo-router');
  const { usePotentialScheduleContext } = require('../../../app/requiresCurrentSchedule/requiresPotentialSchedule/PotentialScheduleContext');
  
  let mockGoBack: jest.Mock;
  let mockPush: jest.Mock;
  let mockSetPotentialSchedules: jest.Mock;

  const mockPotentialSchedules = {
    schedules: [
      {
        assignments: [
          {
            name: 'Math Homework',
            schedule: {
              status: 'fully_scheduled',
              slots: [
                { start: '2025-07-26T14:00:00Z', end: '2025-07-26T16:00:00Z' },
                { start: '2025-07-26T18:00:00Z', end: '2025-07-26T19:00:00Z' }
              ]
            }
          },
          {
            name: 'History Essay',
            schedule: {
              status: 'partially_scheduled',
              slots: [
                { start: '2025-07-27T10:00:00Z', end: '2025-07-27T12:00:00Z' }
              ]
            }
          }
        ],
        chores: [
          {
            name: 'Clean Kitchen',
            schedule: {
              status: 'fully_scheduled',
              slots: [
                { start: '2025-07-26T20:00:00Z', end: '2025-07-26T21:00:00Z' }
              ]
            }
          },
          {
            name: 'Organize Garage',
            schedule: {
              status: 'unschedulable',
              slots: []
            }
          }
        ]
      },
      {
        assignments: [
          {
            name: 'Physics Project',
            schedule: {
              status: 'fully_scheduled',
              slots: [
                { start: '2025-07-28T15:00:00Z', end: '2025-07-28T17:00:00Z' }
              ]
            }
          }
        ],
        chores: []
      },
      {
        assignments: [],
        chores: [
          {
            name: 'Study Session',
            schedule: {
              status: 'partially_scheduled',
              slots: [
                { start: '2025-07-29T09:00:00Z', end: '2025-07-29T11:00:00Z' }
              ]
            }
          }
        ]
      }
    ]
  };

  beforeEach(() => {
    mockGoBack = jest.fn();
    mockPush = jest.fn();
    mockSetPotentialSchedules = jest.fn();

    useNavigation.mockReturnValue({
      goBack: mockGoBack,
    });

    useRouter.mockReturnValue({
      push: mockPush,
    });

    useLocalSearchParams.mockReturnValue({
      scheduleIdx: '0',
    });

    usePotentialScheduleContext.mockReturnValue({
      potentialSchedules: mockPotentialSchedules,
      setPotentialSchedules: mockSetPotentialSchedules,
    });

    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', async () => {
      const { getByText } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByText('Schedule #0')).toBeTruthy();
        expect(getByText('CalendarWeekView')).toBeTruthy();
        expect(getByText('Back')).toBeTruthy();
      });
    });

    it('displays correct schedule index in header', async () => {
      useLocalSearchParams.mockReturnValue({
        scheduleIdx: '2',
      });

      const { getByText } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByText('Schedule #2')).toBeTruthy();
      });
    });

    it('renders back button', async () => {
      const { getByText } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByText('Back')).toBeTruthy();
      });
    });
  });

  describe('Slot Extraction Logic', () => {
    it('extracts slots from assignments correctly', async () => {
      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Should extract 4 slots: 2 from Math Homework, 1 from History Essay, 1 from Clean Kitchen
        expect(getByTestId('slots-count')).toHaveTextContent('4');
      });
    });

    it('extracts slots from chores correctly', async () => {
      useLocalSearchParams.mockReturnValue({
        scheduleIdx: '2', // Schedule with only chores
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Should extract 1 slot from Study Session
        expect(getByTestId('slots-count')).toHaveTextContent('1');
      });
    });

    it('handles schedule with both assignments and chores', async () => {
      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Schedule 0: 3 assignment slots + 1 chore slot = 4 total
        expect(getByTestId('slots-count')).toHaveTextContent('4');
      });
    });

    it('handles schedule with only assignments', async () => {
      useLocalSearchParams.mockReturnValue({
        scheduleIdx: '1', // Schedule with only assignments
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Should extract 1 slot from Physics Project
        expect(getByTestId('slots-count')).toHaveTextContent('1');
      });
    });

    it('handles empty schedule gracefully', async () => {
      const emptySchedules = {
        schedules: [
          {
            assignments: [],
            chores: []
          }
        ]
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: emptySchedules,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByTestId('slots-count')).toHaveTextContent('0');
      });
    });

    it('handles invalid schedule index gracefully', async () => {
      useLocalSearchParams.mockReturnValue({
        scheduleIdx: '999', // Invalid index
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByTestId('slots-count')).toHaveTextContent('0');
      });
    });

    it('handles missing schedule data gracefully', async () => {
      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: { schedules: null },
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByTestId('slots-count')).toHaveTextContent('0');
      });
    });

    it('handles assignments without schedule property', async () => {
      const malformedSchedules = {
        schedules: [
          {
            assignments: [
              { name: 'Broken Assignment' }, // No schedule property
              {
                name: 'Good Assignment',
                schedule: {
                  slots: [{ start: '2025-07-26T14:00:00Z', end: '2025-07-26T16:00:00Z' }]
                }
              }
            ],
            chores: []
          }
        ]
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: malformedSchedules,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Should only extract 1 slot from the good assignment
        expect(getByTestId('slots-count')).toHaveTextContent('1');
      });
    });

    it('handles chores without slots array', async () => {
      const malformedSchedules = {
        schedules: [
          {
            assignments: [],
            chores: [
              {
                name: 'Broken Chore',
                schedule: {
                  slots: null // Not an array
                }
              },
              {
                name: 'Good Chore',
                schedule: {
                  slots: [{ start: '2025-07-26T20:00:00Z', end: '2025-07-26T21:00:00Z' }]
                }
              }
            ]
          }
        ]
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: malformedSchedules,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Should only extract 1 slot from the good chore
        expect(getByTestId('slots-count')).toHaveTextContent('1');
      });
    });
  });

  describe('Slot Data Structure', () => {
    it('creates assignment slots with correct structure', async () => {
      const { getByTestId } = render(<CalendarViewPotential />);
      const CalendarWeekView = require('../../../components/CalendarWeekView');
      
      await waitFor(() => {
        expect(CalendarWeekView).toHaveBeenCalled();
        const call = CalendarWeekView.mock.calls[0];
        const slots = call[0].slots;
        
        // Find assignment slot in the array
        const assignmentSlot = slots.find((slot: any) => slot.type === 'assignment' && slot.name === 'Math Homework');
        expect(assignmentSlot).toEqual({
          name: 'Math Homework',
          type: 'assignment',
          start: '2025-07-26T14:00:00Z',
          end: '2025-07-26T16:00:00Z'
        });
      });
    });

    it('creates chore slots with correct structure', async () => {
      const CalendarWeekView = require('../../../components/CalendarWeekView');
      render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(CalendarWeekView).toHaveBeenCalled();
        const call = CalendarWeekView.mock.calls[0];
        const slots = call[0].slots;
        
        // Find chore slot in the array
        const choreSlot = slots.find((slot: any) => slot.type === 'chore');
        expect(choreSlot).toEqual({
          name: 'Clean Kitchen',
          type: 'chore',
          start: '2025-07-26T20:00:00Z',
          end: '2025-07-26T21:00:00Z'
        });
      });
    });

    it('handles multiple slots for same assignment', async () => {
      const CalendarWeekView = require('../../../components/CalendarWeekView');
      render(<CalendarViewPotential />);
      
      await waitFor(() => {
        const call = CalendarWeekView.mock.calls[0];
        const slots = call[0].slots;
        
        // Should have 2 slots for Math Homework
        const mathHomeworkSlots = slots.filter((slot: any) => slot.name === 'Math Homework');
        expect(mathHomeworkSlots).toHaveLength(2);
        expect(mathHomeworkSlots[0].start).toBe('2025-07-26T14:00:00Z');
        expect(mathHomeworkSlots[1].start).toBe('2025-07-26T18:00:00Z');
      });
    });
  });

  describe('CalendarWeekView Integration', () => {
    it('passes showMeetingActions as false', async () => {
      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByTestId('show-meeting-actions')).toHaveTextContent('false');
      });
    });

    it('passes initial reference date correctly', async () => {
      const { getStartOfWeek } = require('../../../app/calendarUtils');
      render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getStartOfWeek).toHaveBeenCalled();
      });
    });

    it('handles reference date changes', async () => {
      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        const changeDateButton = getByTestId('change-reference-date');
        fireEvent.press(changeDateButton);
        
        // Should not crash when reference date changes
        expect(getByTestId('calendar-week-view')).toBeTruthy();
      });
    });
  });

  describe('Navigation', () => {
    it('navigates back when back button is pressed', async () => {
      const { getByText } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        const backButton = getByText('Back');
        fireEvent.press(backButton);
        
        expect(mockGoBack).toHaveBeenCalled();
      });
    });
  });

  describe('URL Parameters', () => {
    it('handles string schedule index parameter', async () => {
      useLocalSearchParams.mockReturnValue({
        scheduleIdx: '1',
      });

      const { getByText, getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByText('Schedule #1')).toBeTruthy();
        // Should extract 1 slot from Physics Project in schedule 1
        expect(getByTestId('slots-count')).toHaveTextContent('1');
      });
    });

    it('handles missing schedule index parameter', async () => {
      useLocalSearchParams.mockReturnValue({});

      const { getByText, getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByText('Schedule #')).toBeTruthy(); // Empty scheduleIdx
        expect(getByTestId('slots-count')).toHaveTextContent('0');
      });
    });

    it('handles non-numeric schedule index parameter', async () => {
      useLocalSearchParams.mockReturnValue({
        scheduleIdx: 'invalid',
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Number('invalid') = NaN, should handle gracefully
        expect(getByTestId('slots-count')).toHaveTextContent('0');
      });
    });
  });

  describe('Context Integration', () => {
    it('uses potential schedule context correctly', async () => {
      render(<CalendarViewPotential />);
      expect(usePotentialScheduleContext).toHaveBeenCalled();
    });

    it('uses navigation context correctly', async () => {
      render(<CalendarViewPotential />);
      expect(useNavigation).toHaveBeenCalled();
    });

    it('uses router context correctly', async () => {
      render(<CalendarViewPotential />);
      expect(useRouter).toHaveBeenCalled();
    });

    it('uses local search params correctly', async () => {
      render(<CalendarViewPotential />);
      expect(useLocalSearchParams).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles null potentialSchedules', async () => {
      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: { schedules: null },
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByTestId('slots-count')).toHaveTextContent('0');
      });
    });

    it('handles undefined potentialSchedules', async () => {
      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: { schedules: undefined },
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getByTestId('slots-count')).toHaveTextContent('0');
      });
    });

    it('handles non-array assignments', async () => {
      const badSchedules = {
        schedules: [
          {
            assignments: null, // Not an array
            chores: [
              {
                name: 'Valid Chore',
                schedule: {
                  slots: [{ start: '2025-07-26T20:00:00Z', end: '2025-07-26T21:00:00Z' }]
                }
              }
            ]
          }
        ]
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: badSchedules,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Should still extract 1 slot from the valid chore
        expect(getByTestId('slots-count')).toHaveTextContent('1');
      });
    });

    it('handles non-array chores', async () => {
      const badSchedules = {
        schedules: [
          {
            assignments: [
              {
                name: 'Valid Assignment',
                schedule: {
                  slots: [{ start: '2025-07-26T14:00:00Z', end: '2025-07-26T16:00:00Z' }]
                }
              }
            ],
            chores: null // Not an array
          }
        ]
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: badSchedules,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Should still extract 1 slot from the valid assignment
        expect(getByTestId('slots-count')).toHaveTextContent('1');
      });
    });

    it('handles deeply nested null values', async () => {
      const problematicSchedules = {
        schedules: [
          {
            assignments: [
              {
                name: 'Assignment with null schedule',
                schedule: null
              },
              {
                name: 'Assignment with empty slots',
                schedule: {
                  slots: []
                }
              },
              {
                name: 'Valid Assignment',
                schedule: {
                  slots: [{ start: '2025-07-26T14:00:00Z', end: '2025-07-26T16:00:00Z' }]
                }
              }
            ],
            chores: [
              {
                name: 'Chore with no schedule'
              },
              {
                name: 'Valid Chore',
                schedule: {
                  slots: [{ start: '2025-07-26T20:00:00Z', end: '2025-07-26T21:00:00Z' }]
                }
              }
            ]
          }
        ]
      };

      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: problematicSchedules,
        setPotentialSchedules: mockSetPotentialSchedules,
      });

      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        // Should extract 2 slots: 1 from valid assignment, 1 from valid chore
        expect(getByTestId('slots-count')).toHaveTextContent('2');
      });
    });
  });

  describe('Date Handling', () => {
    it('initializes reference date correctly', async () => {
      const { getStartOfWeek } = require('../../../app/calendarUtils');
      render(<CalendarViewPotential />);
      
      await waitFor(() => {
        expect(getStartOfWeek).toHaveBeenCalledWith(expect.any(Date));
      });
    });

    it('updates reference date when calendar view changes', async () => {
      const { getByTestId } = render(<CalendarViewPotential />);
      
      await waitFor(() => {
        const changeDateButton = getByTestId('change-reference-date');
        fireEvent.press(changeDateButton);
        
        // Component should handle the date change without crashing
        expect(getByTestId('calendar-week-view')).toBeTruthy();
      });
    });
  });
});
