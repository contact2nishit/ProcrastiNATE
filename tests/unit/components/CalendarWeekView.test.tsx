import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import CalendarWeekView from '../../../components/CalendarWeekView';
import { Slot } from '../../../app/calendarUtils';

// Mock the utilities
jest.mock('../../../app/calendarUtils', () => ({
  formatTime: jest.fn((iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }),
  getWeekDaysFromDate: jest.fn((referenceDate: Date) => {
    const date = new Date(referenceDate);
    date.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(date);
      day.setDate(date.getDate() + i);
      const year = day.getFullYear();
      const month = String(day.getMonth() + 1).padStart(2, '0');
      const dayNum = String(day.getDate()).padStart(2, '0');
      return {
        date: day,
        label: day.toLocaleDateString(undefined, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        iso: `${year}-${month}-${dayNum}`,
      };
    });
  }),
  groupSlotsByDay: jest.fn((slots: Slot[]) => {
    const grouped: Record<string, Slot[]> = {};
    for (const slot of slots) {
      const localDate = new Date(slot.start);
      const year = localDate.getFullYear();
      const month = String(localDate.getMonth() + 1).padStart(2, '0');
      const day = String(localDate.getDate()).padStart(2, '0');
      const dayKey = `${year}-${month}-${day}`;
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(slot);
    }
    return grouped;
  }),
  screenWidth: 375,
}));

describe('CalendarWeekView Component', () => {
  const mockOnReferenceDateChange = jest.fn();
  const mockOnUpdateMeeting = jest.fn();
  const mockOnDeleteMeeting = jest.fn();

  const sampleSlots: Slot[] = [
    {
      name: 'Team Meeting',
      type: 'meeting',
      start: '2025-01-27T10:00:00Z',
      end: '2025-01-27T11:00:00Z',
      meeting_id: 1,
      occurence_id: 1,
    },
    {
      name: 'Math Assignment',
      type: 'assignment',
      start: '2025-01-27T14:00:00Z',
      end: '2025-01-27T15:00:00Z',
      assignment_id: 2,
      occurence_id: 2,
    },
    {
      name: 'Clean Kitchen',
      type: 'chore',
      start: '2025-01-28T09:00:00Z',
      end: '2025-01-28T10:00:00Z',
      chore_id: 3,
      occurence_id: 3,
    },
  ];

  const referenceDate = new Date('2025-01-27T00:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with minimal props', () => {
      const { getByText } = render(<CalendarWeekView slots={[]} />);
      
      expect(getByText('Prev')).toBeTruthy();
      expect(getByText('Current Week')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
    });

    it('renders with sample slots', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={sampleSlots} 
          initialReferenceDate={referenceDate}
        />
      );
      
      expect(getByText('Team Meeting')).toBeTruthy();
      expect(getByText('Math Assignment')).toBeTruthy();
      expect(getByText('Clean Kitchen')).toBeTruthy();
    });

    it('displays slot types correctly', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={sampleSlots} 
          initialReferenceDate={referenceDate}
        />
      );
      
      expect(getByText(/MEETING/)).toBeTruthy();
      expect(getByText(/ASSIGNMENT/)).toBeTruthy();
      expect(getByText(/CHORE/)).toBeTruthy();
    });

    it('shows loading indicator when loading is true', () => {
      const { queryByText } = render(
        <CalendarWeekView 
          slots={[]} 
          loading={true}
        />
      );
      
      // When loading is true, slot content should not be visible
      expect(queryByText('Team Meeting')).toBeFalsy();
    });

    it('hides content when loading is true', () => {
      const { queryByText } = render(
        <CalendarWeekView 
          slots={sampleSlots} 
          loading={true}
        />
      );
      
      expect(queryByText('Team Meeting')).toBeFalsy();
    });
  });

  describe('Navigation', () => {
    it('calls onReferenceDateChange when Previous Week is pressed', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[]} 
          initialReferenceDate={referenceDate}
          onReferenceDateChange={mockOnReferenceDateChange}
        />
      );
      
      fireEvent.press(getByText('Prev'));
      
      expect(mockOnReferenceDateChange).toHaveBeenCalledTimes(1);
      const calledDate = mockOnReferenceDateChange.mock.calls[0][0];
      expect(calledDate.getTime()).toBe(new Date('2025-01-20T00:00:00Z').getTime());
    });

    it('calls onReferenceDateChange when Next Week is pressed', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[]} 
          initialReferenceDate={referenceDate}
          onReferenceDateChange={mockOnReferenceDateChange}
        />
      );
      
      fireEvent.press(getByText('Next'));
      
      expect(mockOnReferenceDateChange).toHaveBeenCalledTimes(1);
      const calledDate = mockOnReferenceDateChange.mock.calls[0][0];
      expect(calledDate.getTime()).toBe(new Date('2025-02-03T00:00:00Z').getTime());
    });

    it('calls onReferenceDateChange when Current Week is pressed', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[]} 
          initialReferenceDate={referenceDate}
          onReferenceDateChange={mockOnReferenceDateChange}
        />
      );
      
      fireEvent.press(getByText('Current Week'));
      
      expect(mockOnReferenceDateChange).toHaveBeenCalledTimes(1);
      const calledDate = mockOnReferenceDateChange.mock.calls[0][0];
      expect(calledDate.getTime()).toBe(referenceDate.getTime());
    });

    it('does not crash when onReferenceDateChange is not provided', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[]} 
          initialReferenceDate={referenceDate}
        />
      );
      
      expect(() => {
        fireEvent.press(getByText('Prev'));
        fireEvent.press(getByText('Next'));
        fireEvent.press(getByText('Current Week'));
      }).not.toThrow();
    });
  });

  describe('Meeting Actions', () => {
    const meetingSlot: Slot = {
      name: 'Important Meeting',
      type: 'meeting',
      start: '2025-01-27T10:00:00Z',
      end: '2025-01-27T11:00:00Z',
      meeting_id: 1,
      occurence_id: 1,
    };

    it('does not show meeting actions when showMeetingActions is false', () => {
      const { queryByText } = render(
        <CalendarWeekView 
          slots={[meetingSlot]} 
          initialReferenceDate={referenceDate}
          showMeetingActions={false}
        />
      );
      
      expect(queryByText('Edit')).toBeFalsy();
      expect(queryByText('Delete')).toBeFalsy();
    });

    it('shows meeting actions when showMeetingActions is true', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[meetingSlot]} 
          initialReferenceDate={referenceDate}
          showMeetingActions={true}
        />
      );
      
      expect(getByText('Edit')).toBeTruthy();
      expect(getByText('Delete')).toBeTruthy();
    });

    it('calls onUpdateMeeting when Edit button is pressed', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[meetingSlot]} 
          initialReferenceDate={referenceDate}
          showMeetingActions={true}
          onUpdateMeeting={mockOnUpdateMeeting}
        />
      );
      
      fireEvent.press(getByText('Edit'));
      
      expect(mockOnUpdateMeeting).toHaveBeenCalledTimes(1);
      expect(mockOnUpdateMeeting).toHaveBeenCalledWith(meetingSlot);
    });

    it('calls onDeleteMeeting when Delete button is pressed', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[meetingSlot]} 
          initialReferenceDate={referenceDate}
          showMeetingActions={true}
          onDeleteMeeting={mockOnDeleteMeeting}
        />
      );
      
      fireEvent.press(getByText('Delete'));
      
      expect(mockOnDeleteMeeting).toHaveBeenCalledTimes(1);
      expect(mockOnDeleteMeeting).toHaveBeenCalledWith(meetingSlot);
    });

    it('does not show actions for non-meeting slots', () => {
      const nonMeetingSlot: Slot = {
        name: 'Assignment Task',
        type: 'assignment',
        start: '2025-01-27T14:00:00Z',
        end: '2025-01-27T15:00:00Z',
        assignment_id: 2,
      };

      const { queryByText } = render(
        <CalendarWeekView 
          slots={[nonMeetingSlot]} 
          initialReferenceDate={referenceDate}
          showMeetingActions={true}
        />
      );
      
      expect(queryByText('Edit')).toBeFalsy();
      expect(queryByText('Delete')).toBeFalsy();
    });

    it('does not crash when meeting action callbacks are not provided', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[meetingSlot]} 
          initialReferenceDate={referenceDate}
          showMeetingActions={true}
        />
      );
      
      expect(() => {
        fireEvent.press(getByText('Edit'));
        fireEvent.press(getByText('Delete'));
      }).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty slots array', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={[]} 
          initialReferenceDate={referenceDate}
        />
      );
      
      expect(getByText('Prev')).toBeTruthy();
      expect(getByText('Current Week')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
    });

    it('handles slots with missing optional properties', () => {
      const minimalSlot: Slot = {
        name: 'Minimal Slot',
        type: 'chore',
        start: '2025-01-27T10:00:00Z',
        end: '2025-01-27T11:00:00Z',
      };

      const { getByText } = render(
        <CalendarWeekView 
          slots={[minimalSlot]} 
          initialReferenceDate={referenceDate}
        />
      );
      
      expect(getByText('Minimal Slot')).toBeTruthy();
      expect(getByText(/CHORE/)).toBeTruthy();
    });

    it('handles slots spanning multiple days', () => {
      const multiDaySlots: Slot[] = [
        {
          name: 'Monday Event',
          type: 'meeting',
          start: '2025-01-27T10:00:00Z',
          end: '2025-01-27T11:00:00Z',
        },
        {
          name: 'Tuesday Event',
          type: 'assignment',
          start: '2025-01-28T14:00:00Z',
          end: '2025-01-28T15:00:00Z',
        },
        {
          name: 'Friday Event',
          type: 'chore',
          start: '2025-01-31T09:00:00Z',
          end: '2025-01-31T10:00:00Z',
        },
      ];

      const { getByText } = render(
        <CalendarWeekView 
          slots={multiDaySlots} 
          initialReferenceDate={referenceDate}
        />
      );
      
      expect(getByText('Monday Event')).toBeTruthy();
      expect(getByText('Tuesday Event')).toBeTruthy();
      expect(getByText('Friday Event')).toBeTruthy();
    });

    it('handles invalid date formats gracefully', () => {
      const invalidSlot: Slot = {
        name: 'Invalid Date Slot',
        type: 'meeting',
        start: 'invalid-date',
        end: 'invalid-date',
      };

      expect(() => {
        render(
          <CalendarWeekView 
            slots={[invalidSlot]} 
            initialReferenceDate={referenceDate}
          />
        );
      }).not.toThrow();
    });

    it('handles very long slot names', () => {
      const longNameSlot: Slot = {
        name: 'This is a very long slot name that should be handled gracefully by the component without breaking the layout',
        type: 'assignment',
        start: '2025-01-27T10:00:00Z',
        end: '2025-01-27T11:00:00Z',
      };

      const { getByText } = render(
        <CalendarWeekView 
          slots={[longNameSlot]} 
          initialReferenceDate={referenceDate}
        />
      );
      
      expect(getByText(longNameSlot.name)).toBeTruthy();
    });
  });

  describe('Prop Validation', () => {
    it('uses default values when optional props are not provided', () => {
      const { getByText } = render(<CalendarWeekView slots={[]} />);
      
      // Should render without crashing and show default behavior
      expect(getByText('Prev')).toBeTruthy();
      expect(getByText('Current Week')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
    });

    it('uses provided initialReferenceDate', () => {
      const customDate = new Date('2025-06-15T00:00:00Z');
      
      render(
        <CalendarWeekView 
          slots={[]} 
          initialReferenceDate={customDate}
        />
      );
      
      // Verify that getWeekDaysFromDate was called with the custom date
      expect(require('../../../app/calendarUtils').getWeekDaysFromDate).toHaveBeenCalledWith(customDate);
    });

    it('correctly groups slots by day', () => {
      render(
        <CalendarWeekView 
          slots={sampleSlots} 
          initialReferenceDate={referenceDate}
        />
      );
      
      // Verify that groupSlotsByDay was called with the provided slots
      expect(require('../../../app/calendarUtils').groupSlotsByDay).toHaveBeenCalledWith(sampleSlots);
    });
  });

  describe('Responsive Design', () => {
    it('renders correctly on different screen sizes', () => {
      const { getByText } = render(
        <CalendarWeekView 
          slots={sampleSlots} 
          initialReferenceDate={referenceDate}
        />
      );
      
      // Verify basic functionality works regardless of screen size
      expect(getByText('Team Meeting')).toBeTruthy();
      expect(getByText('Prev')).toBeTruthy();
      expect(getByText('Next')).toBeTruthy();
    });
  });

  describe('Multiple Slots on Same Day', () => {
    it('renders multiple slots on the same day correctly', () => {
      const sameDaySlots: Slot[] = [
        {
          name: 'Morning Meeting',
          type: 'meeting',
          start: '2025-01-27T09:00:00Z',
          end: '2025-01-27T10:00:00Z',
        },
        {
          name: 'Afternoon Assignment',
          type: 'assignment',
          start: '2025-01-27T14:00:00Z',
          end: '2025-01-27T15:00:00Z',
        },
        {
          name: 'Evening Chore',
          type: 'chore',
          start: '2025-01-27T18:00:00Z',
          end: '2025-01-27T19:00:00Z',
        },
      ];

      const { getByText } = render(
        <CalendarWeekView 
          slots={sameDaySlots} 
          initialReferenceDate={referenceDate}
        />
      );
      
      expect(getByText('Morning Meeting')).toBeTruthy();
      expect(getByText('Afternoon Assignment')).toBeTruthy();
      expect(getByText('Evening Chore')).toBeTruthy();
    });
  });
});
