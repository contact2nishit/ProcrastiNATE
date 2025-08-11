import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, cleanupMocks } from '../test-utils';
import { localStorageMock } from '../setupTests';
import RescheduleScreen from '../pages/RescheduleScreen';

const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockUseSearchParams()]
}));

jest.mock('../config', () => ({
  backendURL: 'https://test-backend.com'
}));

const mockSetPotentialSchedules = jest.fn();
jest.mock('../context/PotentialScheduleContext', () => ({
  usePotentialScheduleContext: () => ({
    setPotentialSchedules: mockSetPotentialSchedules
  })
}));

describe('RescheduleScreen Component', () => {
  const mockToken = 'test_token_123';
  let testDate: Date;
  let mockSearchParams: any;

  beforeEach(() => {
    cleanupMocks();
    mockNavigate.mockClear();
    mockSetPotentialSchedules.mockClear();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken;
      return null;
    });

    testDate = new Date();
    jest.useFakeTimers();
    jest.setSystemTime(testDate);

    // Default search params for assignment
    mockSearchParams = {
      get: jest.fn().mockImplementation((key: string) => {
        switch (key) {
          case 'id': return '123';
          case 'type': return 'assignment';
          case 'effort': return '60';
          case 'start': return testDate.toISOString().slice(0, 16);
          case 'end': return new Date(testDate.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
          default: return null;
        }
      })
    };
    mockUseSearchParams.mockReturnValue(mockSearchParams);
  });

  afterEach(() => {
    cleanupMocks();
    jest.useRealTimers();
  });

  test('renders assignment reschedule form correctly', () => {
    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    expect(screen.getByText('Reschedule Assignment')).toBeInTheDocument();
    expect(screen.getByText('Remaining Effort (minutes):')).toBeInTheDocument();
    expect(screen.getByText('Due Date:')).toBeInTheDocument();
    expect(screen.getByText('Allow overlaps with current occurrences?')).toBeInTheDocument();
    expect(screen.getByText('Submit')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('renders chore reschedule form correctly', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'id': return '456';
        case 'type': return 'chore';
        case 'effort': return '30';
        case 'start': return testDate.toISOString().slice(0, 16);
        case 'end': return new Date(testDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
        default: return null;
      }
    });

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    expect(screen.getByText('Reschedule Chore')).toBeInTheDocument();
    expect(screen.getByText('Remaining Effort (minutes):')).toBeInTheDocument();
    expect(screen.getByText('Window Start:')).toBeInTheDocument();
    expect(screen.getByText('Window End:')).toBeInTheDocument();
    expect(screen.getByText('Allow overlaps with current occurrences?')).toBeInTheDocument();
  });

  test('initializes form fields with URL parameters', () => {
    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const effortInput = screen.getByDisplayValue('60');
    expect(effortInput).toBeInTheDocument();

    // Check that an end date input exists
    const endDateInputs = screen.getAllByDisplayValue(/^[\d]{4}-[\d]{2}-[\d]{2}T[\d]{2}:[\d]{2}$/);
    expect(endDateInputs.length).toBeGreaterThan(0);
  });

  test('updates effort value when input changes', async () => {
    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const effortInput = screen.getByDisplayValue('60');
    userEvent.clear(effortInput);
    userEvent.type(effortInput, '90');

    await waitFor(() => {
      expect(screen.getByDisplayValue('90')).toBeInTheDocument();
    });
  });

  test('updates window end date when input changes', async () => {
    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const newDate = new Date(testDate.getTime() + 4 * 60 * 60 * 1000);
    const newDateString = newDate.toISOString().slice(0, 16);
    
    // Find the datetime input for end date
    const endDateInput = screen.getByDisplayValue(/^[\d]{4}-[\d]{2}-[\d]{2}T[\d]{2}:[\d]{2}$/);
    userEvent.clear(endDateInput);
    userEvent.type(endDateInput, newDateString);

    await waitFor(() => {
      expect(screen.getByDisplayValue(newDateString)).toBeInTheDocument();
    });
  });

  test('toggles allow overlaps checkbox', async () => {
    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    userEvent.click(checkbox);

    await waitFor(() => {
      expect(checkbox).toBeChecked();
    });
  });

  test('submits assignment reschedule successfully', async () => {
    const mockRescheduleResponse = {
      schedules: [
        {
          assignments: [{
            name: 'Updated Assignment',
            schedule: { status: 'fully_scheduled', slots: [] }
          }],
          chores: [],
          conflicting_assignments: [],
          conflicting_chores: [],
          not_enough_time_assignments: [],
          not_enough_time_chores: [],
          total_potential_xp: 100
        }
      ],
      meetings: [],
      conflicting_meetings: []
    };
    mockFetch(mockRescheduleResponse);

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const submitButton = screen.getByText('Submit');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reschedule'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }),
          body: expect.stringContaining('"event_type":"assignment"')
        })
      );
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Rescheduled successfully!');
      expect(mockSetPotentialSchedules).toHaveBeenCalledWith(mockRescheduleResponse);
      expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/requiresPotentialSchedule/schedulePicker');
    });
  });

  test('submits chore reschedule with correct parameters', async () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'id': return '456';
        case 'type': return 'chore';
        case 'effort': return '30';
        case 'start': return testDate.toISOString().slice(0, 16);
        case 'end': return new Date(testDate.getTime() + 60 * 60 * 1000).toISOString().slice(0, 16);
        default: return null;
      }
    });

    const mockRescheduleResponse = {
      schedules: [{ assignments: [], chores: [], conflicting_assignments: [], conflicting_chores: [], not_enough_time_assignments: [], not_enough_time_chores: [], total_potential_xp: 50 }],
      meetings: [],
      conflicting_meetings: []
    };
    mockFetch(mockRescheduleResponse);

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const submitButton = screen.getByText('Submit');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reschedule'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }),
          body: expect.stringMatching(/"event_type":"chore".*"new_effort":30.*"new_window_start".*"new_window_end"/)
        })
      );
    });
  });

  test('handles API error during submission', async () => {
    mockFetch({ error: 'Server error' }, false, 500);

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const submitButton = screen.getByText('Submit');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to reschedule:'));
    });
  });

  test('handles missing backend URL or token', async () => {
    localStorageMock.getItem.mockImplementation(() => null);

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const submitButton = screen.getByText('Submit');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Missing backend URL or token.');
    });
  });

  test('shows loading state during submission', async () => {
    // Mock a slow response
    mockFetch(new Promise(() => {})); // Never resolves

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const submitButton = screen.getByText('Submit');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Submitting...')).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });
  });

  test('navigates back when cancel button is clicked', () => {
    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const cancelButton = screen.getByText('Cancel');
    userEvent.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  test('handles network error during submission', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const submitButton = screen.getByText('Submit');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Failed to reschedule: Error: Network error'));
    });
  });

  test('includes timezone offset in submission', async () => {
    const mockRescheduleResponse = { schedules: [], meetings: [], conflicting_meetings: [] };
    mockFetch(mockRescheduleResponse);

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    const submitButton = screen.getByText('Submit');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reschedule'),
        expect.objectContaining({
          body: expect.stringContaining('"tz_offset_minutes"')
        })
      );
    });
  });

  test('defaults to current time when no URL parameters', () => {
    mockSearchParams.get.mockReturnValue(null);

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    // Should show chore form when type is null (defaults to chore in this case)
    expect(screen.getByText('Reschedule Chore')).toBeInTheDocument();
    
    // Should have current time as default values
    const dateInputs = screen.getAllByDisplayValue(/^[\d]{4}-[\d]{2}-[\d]{2}T[\d]{2}:[\d]{2}$/);
    expect(dateInputs.length).toBeGreaterThan(0);
  });

  test('handles assignment without window start field', () => {
    mockSearchParams.get.mockImplementation((key: string) => {
      switch (key) {
        case 'id': return '123';
        case 'type': return 'assignment';
        case 'effort': return '60';
        case 'end': return new Date(testDate.getTime() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);
        default: return null;
      }
    });

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    // Assignment form should not show Window Start field
    expect(screen.queryByText('Window Start:')).not.toBeInTheDocument();
    expect(screen.getByText('Due Date:')).toBeInTheDocument();
  });

  test('submits with allow overlaps enabled', async () => {
    const mockRescheduleResponse = { schedules: [], meetings: [], conflicting_meetings: [] };
    mockFetch(mockRescheduleResponse);

    renderWithProviders(<RescheduleScreen />, { 
      withRouter: false 
    });

    // Enable allow overlaps
    const checkbox = screen.getByRole('checkbox');
    userEvent.click(checkbox);

    const submitButton = screen.getByText('Submit');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reschedule'),
        expect.objectContaining({
          body: expect.stringContaining('"allow_overlaps":true')
        })
      );
    });
  });
});
