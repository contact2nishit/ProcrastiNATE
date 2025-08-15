import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, mockFetchError, cleanupMocks } from '../test-utils';
import { localStorageMock } from '../setupTests';
import SchedulePicker from '../pages/SchedulePicker';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../config', () => ({
  backendURL: 'https://test-backend.com'
}));

const mockSetPotentialSchedules = jest.fn();
const mockUsePotentialScheduleContext = jest.fn();
jest.mock('../context/PotentialScheduleContext', () => ({
  usePotentialScheduleContext: () => mockUsePotentialScheduleContext()
}));

const mockRefetchSchedule = jest.fn();
jest.mock('../context/CurrentScheduleContext', () => ({
  useCurrentScheduleContext: () => ({
    currSchedule: null,
    setCurrSchedule: jest.fn(),
    ensureScheduleRange: jest.fn(),
    refetchSchedule: mockRefetchSchedule
  })
}));

describe('SchedulePicker Component', () => {
  const mockToken = 'test_token_123';

  beforeEach(() => {
    cleanupMocks();
    mockNavigate.mockClear();
    mockRefetchSchedule.mockClear();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken;
      return null;
    });

    // Set up mock to return our test data
    mockUsePotentialScheduleContext.mockReturnValue({
      potentialSchedules: {
        conflicting_meetings: ['Team Meeting conflicts with Study Session'],
        schedules: [
          {
            assignments: [
              {
                name: 'Math Homework',
                schedule: {
                  status: 'fully_scheduled',
                  slots: [{ start: '2024-01-15T09:00:00Z', end: '2024-01-15T10:00:00Z' }]
                }
              }
            ],
            chores: [
              {
                name: 'Clean Kitchen',
                schedule: {
                  status: 'partially_scheduled',
                  slots: [{ start: '2024-01-15T14:00:00Z', end: '2024-01-15T14:30:00Z' }]
                }
              }
            ],
            conflicting_assignments: ['Physics Assignment'],
            conflicting_chores: [],
            not_enough_time_assignments: ['Biology Lab Report'],
            not_enough_time_chores: ['Grocery Shopping'],
            total_potential_xp: 150
          },
          {
            assignments: [
              {
                name: 'History Essay',
                schedule: {
                  status: 'unschedulable',
                  slots: []
                }
              }
            ],
            chores: [],
            conflicting_assignments: [],
            conflicting_chores: ['Laundry'],
            not_enough_time_assignments: [],
            not_enough_time_chores: [],
            total_potential_xp: 75
          }
        ],
        meetings: [
          {
            name: 'Daily Standup',
            start_end_times: [['2024-01-15T11:00:00Z', '2024-01-15T11:30:00Z']]
          }
        ]
      },
      setPotentialSchedules: mockSetPotentialSchedules
    });
  });

  const renderComponent = () => {
    return renderWithProviders(<SchedulePicker />);
  };

  it('renders schedule picker title', () => {
    renderComponent();
    
    expect(screen.getByTestId('schedule-picker-title')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-picker-title')).toHaveTextContent('Pick a Schedule');
  });

  it('displays schedule buttons for each available schedule', () => {
    renderComponent();
    
    const scheduleButton1 = screen.getByTestId('schedule-button-1');
    const scheduleButton2 = screen.getByTestId('schedule-button-2');
    
    expect(scheduleButton1).toBeInTheDocument();
    expect(scheduleButton2).toBeInTheDocument();
  });

  it('shows conflicting meetings warning when conflicts exist', () => {
    renderComponent();
    
    const warningElement = screen.getByTestId('conflicting-meetings-warning');
    expect(warningElement).toBeInTheDocument();
    expect(warningElement).toHaveTextContent('Conflicting Meetings:');
    
    expect(screen.getByTestId('conflicting-meeting-0')).toHaveTextContent('Team Meeting conflicts with Study Session');
  });

  it('opens modal when schedule button is clicked', async () => {
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    });
  });

  it('displays schedule details in modal', async () => {
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('modal-schedule-title')).toHaveTextContent('Schedule #1');
      expect(screen.getByTestId('assignments-section')).toBeInTheDocument();
      expect(screen.getByTestId('chores-section')).toBeInTheDocument();
      expect(screen.getByTestId('conflicts-section')).toBeInTheDocument();
      expect(screen.getByTestId('meetings-section')).toBeInTheDocument();
      expect(screen.getByTestId('potential-xp-display')).toHaveTextContent('Potential XP: 150');
    });
  });

  it('displays assignment items in modal', async () => {
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('assignment-item-0')).toHaveTextContent('Math Homework');
    });
  });

  it('displays chore items in modal', async () => {
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('chore-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('chore-item-0')).toHaveTextContent('Clean Kitchen');
    });
  });

  it('displays "None" when no chores exist', async () => {
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-2');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('chores-none')).toBeInTheDocument();
      expect(screen.getByTestId('chores-none')).toHaveTextContent('None');
    });
  });

  it('displays conflict information in modal', async () => {
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('conflict-assignment-0')).toHaveTextContent('Physics Assignment');
      expect(screen.getByTestId('not-enough-time-assignment-0')).toHaveTextContent('Biology Lab Report');
      expect(screen.getByTestId('not-enough-time-chore-0')).toHaveTextContent('Grocery Shopping');
    });
  });

  it('displays meeting items in modal', async () => {
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('meeting-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('meeting-item-0')).toHaveTextContent('Daily Standup');
    });
  });

  it('calls submitSchedule when Set This Schedule button is clicked', async () => {
    mockFetch({ success: true });
    
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(scheduleButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    });

    const setScheduleButton = screen.getByTestId('set-schedule-button');
    fireEvent.click(setScheduleButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test-backend.com/setSchedule',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }
        })
      );
    });

    expect(mockRefetchSchedule).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/Home');
  });

  it('handles modal close', async () => {
    renderComponent();
    
    const firstScheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(firstScheduleButton);
    
    // Modal should be open
    await waitFor(() => {
      expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    });
    
    // Find and click close button 
    const closeButton = screen.getByTestId('close-modal-button');
    fireEvent.click(closeButton);
    
    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByTestId('schedule-modal')).not.toBeInTheDocument();
    });
  });

  it('navigates back when Go Back button is clicked', async () => {
    renderComponent();
    
    const goBackButton = screen.getByTestId('go-back-button');
    fireEvent.click(goBackButton);
    
    expect(mockNavigate).toHaveBeenCalledWith("/requiresCurrentSchedule/Home");
  });

  it('handles API error when submitting schedule', async () => {
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    
    mockFetchError('API Error');
    
    renderComponent();
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    fireEvent.click(scheduleButton);
    
    // Wait for modal to appear
    await waitFor(() => {
      expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    });

    const setScheduleButton = screen.getByTestId('set-schedule-button');
    fireEvent.click(setScheduleButton);
    
    // Wait for the error alert to be called
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Error setting schedule:'));
    });

    alertSpy.mockRestore();
  });
});