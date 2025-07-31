import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EventSelection from '../../../app/requiresCurrentSchedule/requiresPotentialSchedule/eventSelection';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
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

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => {
  return function MockDateTimePicker(props: any) {
    const React = require('react');
    const { View, Text } = require('react-native');
    
    return React.createElement(View, { testID: props.testID || 'date-time-picker' }, [
      React.createElement(Text, { key: 'label' }, `DateTimePicker`),
    ]);
  };
});

// Mock Picker
jest.mock('@react-native-picker/picker', () => {
  const React = require('react');
  const { View, Text } = require('react-native');
  
  const MockPickerItem = ({ label, value }: any) => {
    return React.createElement(Text, null, label);
  };
  
  const MockPicker = ({ children, selectedValue, testID }: any) => {
    return React.createElement(View, { testID: testID || 'picker' }, [
      React.createElement(Text, { key: 'selected' }, `Picker Value: ${selectedValue}`),
    ]);
  };
  
  MockPicker.Item = MockPickerItem;
  
  return {
    Picker: MockPicker,
  };
});

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    return date.toLocaleDateString();
  }),
}));

// Mock FontAwesome5
jest.mock('@expo/vector-icons', () => ({
  FontAwesome5: ({ name, testID }: any) => {
    const React = require('react');
    const { Text } = require('react-native');
    return React.createElement(Text, { testID: testID || `icon-${name}` }, name);
  },
}));

// Mock DropDownPicker
jest.mock('react-native-dropdown-picker', () => 'DropDownPicker');

// Mock Alert and global alert
const mockAlert = jest.fn();
Alert.alert = mockAlert;
global.alert = jest.fn();

// Mock global fetch
global.fetch = jest.fn();

describe('EventSelection Component - Basic Tests', () => {
  const { useRouter } = require('expo-router');
  const { usePotentialScheduleContext } = require('../../../app/requiresCurrentSchedule/requiresPotentialSchedule/PotentialScheduleContext');
  
  let mockPush: jest.Mock;
  let mockReplace: jest.Mock;
  let mockSetPotentialSchedules: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    mockReplace = jest.fn();
    mockSetPotentialSchedules = jest.fn();

    useRouter.mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });

    usePotentialScheduleContext.mockReturnValue({
      potentialSchedules: [],
      setPotentialSchedules: mockSetPotentialSchedules,
    });

    (AsyncStorage.getItem as jest.Mock).mockResolvedValue('mock-token');

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ schedules: ['schedule1', 'schedule2'] }),
      text: () => Promise.resolve('Success'),
    });

    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('renders without crashing', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        expect(getByText('Meeting')).toBeTruthy();
      });
    });

    it('shows all navigation tabs', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        expect(getByText('Meeting')).toBeTruthy();
        expect(getByText('Assignment')).toBeTruthy();
        expect(getByText('Chore/Study')).toBeTruthy();
        expect(getByText('Events')).toBeTruthy();
      });
    });

    it('defaults to Meeting tab', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        expect(getByText('Set up a Meeting')).toBeTruthy();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('switches to Assignment tab', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const assignmentTab = getByText('Assignment');
        fireEvent.press(assignmentTab);
        
        expect(getByText('Set up an Assignment')).toBeTruthy();
      });
    });

    it('switches to Chore/Study tab', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const choreTab = getByText('Chore/Study');
        fireEvent.press(choreTab);
        
        expect(getByText('Set up Chore/Study')).toBeTruthy();
      });
    });

    it('switches to Events tab', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const eventsTab = getByText('Events');
        fireEvent.press(eventsTab);
        
        expect(getByText('Submit Schedule')).toBeTruthy();
      });
    });
  });

  describe('Form Fields', () => {
    it('shows meeting form fields', async () => {
      const { getByText, getByPlaceholderText } = render(<EventSelection />);
      
      await waitFor(() => {
        expect(getByText('Name:')).toBeTruthy();
        expect(getByText('Link / Location:')).toBeTruthy();
        expect(getByPlaceholderText('Meeting')).toBeTruthy();
        expect(getByPlaceholderText('Link/location')).toBeTruthy();
      });
    });

    it('shows assignment form fields after tab switch', async () => {
      const { getByText, getByPlaceholderText } = render(<EventSelection />);
      
      await waitFor(() => {
        const assignmentTab = getByText('Assignment');
        fireEvent.press(assignmentTab);
      });
      
      await waitFor(() => {
        expect(getByText('Name:')).toBeTruthy();
        expect(getByText('Effort (minutes):')).toBeTruthy();
        expect(getByPlaceholderText('Assignment')).toBeTruthy();
        expect(getByPlaceholderText('Effort in minutes')).toBeTruthy();
      });
    });

    it('shows chore form fields after tab switch', async () => {
      const { getByText, getByPlaceholderText } = render(<EventSelection />);
      
      await waitFor(() => {
        const choreTab = getByText('Chore/Study');
        fireEvent.press(choreTab);
      });
      
      await waitFor(() => {
        expect(getByText('Name:')).toBeTruthy();
        expect(getByText('Effort (minutes):')).toBeTruthy();
        expect(getByPlaceholderText('Chore')).toBeTruthy();
        expect(getByPlaceholderText('Effort in minutes')).toBeTruthy();
      });
    });
  });

  describe('Form Input', () => {
    it('allows text input in meeting form', async () => {
      const { getByPlaceholderText } = render(<EventSelection />);
      
      await waitFor(() => {
        const nameInput = getByPlaceholderText('Meeting');
        fireEvent.changeText(nameInput, 'Team Meeting');
        expect(nameInput.props.value).toBe('Team Meeting');
      });
    });

    it('allows text input in assignment form', async () => {
      const { getByText, getByPlaceholderText } = render(<EventSelection />);
      
      await waitFor(() => {
        const assignmentTab = getByText('Assignment');
        fireEvent.press(assignmentTab);
      });
      
      await waitFor(() => {
        const nameInput = getByPlaceholderText('Assignment');
        fireEvent.changeText(nameInput, 'Math Homework');
        expect(nameInput.props.value).toBe('Math Homework');
      });
    });

    it('allows text input in chore form', async () => {
      const { getByText, getByPlaceholderText } = render(<EventSelection />);
      
      await waitFor(() => {
        const choreTab = getByText('Chore/Study');
        fireEvent.press(choreTab);
      });
      
      await waitFor(() => {
        const nameInput = getByPlaceholderText('Chore');
        fireEvent.changeText(nameInput, 'Clean Kitchen');
        expect(nameInput.props.value).toBe('Clean Kitchen');
      });
    });
  });

  describe('Form Validation', () => {
    it('validates empty meeting form', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const addButton = getByText('Add Event');
        fireEvent.press(addButton);
        
        expect(global.alert).toHaveBeenCalledWith('Please fill in all fields.');
      });
    });

    it('validates empty assignment form', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const assignmentTab = getByText('Assignment');
        fireEvent.press(assignmentTab);
      });
      
      await waitFor(() => {
        const addButton = getByText('Add Event');
        fireEvent.press(addButton);
        
        expect(global.alert).toHaveBeenCalledWith('Please fill in all fields.');
      });
    });

    it('validates invalid effort in assignment', async () => {
      // Mock Date to return a future date to bypass date validation
      const mockDate = new Date('2025-07-30T10:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation((() => mockDate) as any);
      
      const { getByText, getByPlaceholderText } = render(<EventSelection />);
      
      await waitFor(() => {
        const assignmentTab = getByText('Assignment');
        fireEvent.press(assignmentTab);
      });
      
      await waitFor(() => {
        const nameInput = getByPlaceholderText('Assignment');
        fireEvent.changeText(nameInput, 'Test Assignment');
        
        const effortInput = getByPlaceholderText('Effort in minutes');
        fireEvent.changeText(effortInput, '-10');
        
        const addButton = getByText('Add Event');
        fireEvent.press(addButton);
        
        expect(global.alert).toHaveBeenCalledWith('Effort must be a positive number.');
      });
      
      // Restore Date
      (global.Date as any).mockRestore();
    });
  });

  describe('Navigation Actions', () => {
    it('navigates to home from meeting tab', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const homeButton = getByText('Go to Home');
        fireEvent.press(homeButton);
        
        expect(mockReplace).toHaveBeenCalledWith('/requiresCurrentSchedule/Home');
      });
    });

    it('navigates to home from assignment tab', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const assignmentTab = getByText('Assignment');
        fireEvent.press(assignmentTab);
      });
      
      await waitFor(() => {
        const homeButton = getByText('Go to home');
        fireEvent.press(homeButton);
        
        expect(mockReplace).toHaveBeenCalledWith('/requiresCurrentSchedule/Home');
      });
    });
  });

  describe('Date/Time Components', () => {
    it('renders date pickers', async () => {
      const { getByTestId } = render(<EventSelection />);
      
      await waitFor(() => {
        expect(getByTestId('meetingStartTimePicker')).toBeTruthy();
        expect(getByTestId('meetingEndTimePicker')).toBeTruthy();
      });
    });

    it('renders picker component', async () => {
      const { getByTestId } = render(<EventSelection />);
      
      await waitFor(() => {
        const picker = getByTestId('picker');
        expect(picker).toBeTruthy();
      });
    });
  });

  describe('Schedule Submission', () => {
    // Helper function to add a test meeting
    const addTestMeeting = async (getByText: any, getByPlaceholderText: any) => {
      // Fill in meeting form
      const nameInput = getByPlaceholderText('Meeting');
      fireEvent.changeText(nameInput, 'Test Meeting');
      
      const locationInput = getByPlaceholderText('Link/location');
      fireEvent.changeText(locationInput, 'Test Location');
      
      // Set future dates to avoid validation issues
      const now = new Date();
      const start = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
      const end = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      // Mock the state setters to simulate proper date selection
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [start, jest.fn()]) // startDateTime
        .mockImplementationOnce(() => [end, jest.fn()]) // endDateTime
        .mockImplementationOnce(() => ['once', jest.fn()]); // recurrence
      
      const addButton = getByText('Add Event');
      fireEvent.press(addButton);
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Meeting added successfully!');
      });
    };

    it('submits schedule and makes API call', async () => {
      const { getByText, getByPlaceholderText } = render(<EventSelection />);
      
      // Add a test meeting first
      await waitFor(() => {
        const nameInput = getByPlaceholderText('Meeting');
        fireEvent.changeText(nameInput, 'Test Meeting');
        
        const locationInput = getByPlaceholderText('Link/location');
        fireEvent.changeText(locationInput, 'Test Location');
      });
      
      // Mock the component state to have some test data
      const mockSetPotentialSchedulesLocal = jest.fn();
      usePotentialScheduleContext.mockReturnValue({
        potentialSchedules: [],
        setPotentialSchedules: mockSetPotentialSchedulesLocal,
      });
      
      await waitFor(() => {
        const eventsTab = getByText('Events');
        fireEvent.press(eventsTab);
      });
      
      await waitFor(() => {
        const submitButton = getByText('Submit Schedule');
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          'http://mock-backend-url.com/schedule',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Content-Type': 'application/json',
              'Authorization': 'Bearer mock-token',
            }),
          })
        );
      });
    });

    it('handles successful submission', async () => {
      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const eventsTab = getByText('Events');
        fireEvent.press(eventsTab);
      });
      
      await waitFor(() => {
        const submitButton = getByText('Submit Schedule');
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(mockSetPotentialSchedules).toHaveBeenCalledWith({ schedules: ['schedule1', 'schedule2'] });
        expect(mockPush).toHaveBeenCalledWith('/requiresCurrentSchedule/requiresPotentialSchedule/schedulePicker');
      });
    });

    it('handles API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve('Server error'),
      });

      const { getByText } = render(<EventSelection />);
      
      await waitFor(() => {
        const eventsTab = getByText('Events');
        fireEvent.press(eventsTab);
      });
      
      await waitFor(() => {
        const submitButton = getByText('Submit Schedule');
        fireEvent.press(submitButton);
      });
      
      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Failed to submit schedule: Server error');
      });
    });
  });

  describe('Context Integration', () => {
    it('uses router context', async () => {
      render(<EventSelection />);
      expect(useRouter).toHaveBeenCalled();
    });

    it('uses potential schedule context', async () => {
      render(<EventSelection />);
      expect(usePotentialScheduleContext).toHaveBeenCalled();
    });
  });
});
