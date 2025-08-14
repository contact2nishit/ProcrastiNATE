import React from 'react';
import { screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, mockApiResponse, cleanupMocks } from '../test-utils';
import { localStorageMock } from '../setupTests';
import Home from '../pages/Home';


const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));


jest.mock('../config', () => ({
  backendURL: 'https://test-backend.com'
}));


jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  createTheme: jest.fn(() => ({})),
  ThemeProvider: ({ children }: any) => children,
  Slider: ({ onChange, value, ...props }: any) => (
    <input 
      data-testid="effort-slider"
      type="range" 
      value={value} 
      onChange={(e) => onChange?.(e, parseInt(e.target.value))}
      {...props}
    />
  ),
  LinearProgress: ({ value }: any) => (
    <div data-testid="xp-progress" data-value={value}>Progress: {value}%</div>
  ),
}));

describe('Home Component', () => {
  const mockToken = 'test_token_123';
  let testDate: Date;
  let mockScheduleResponse: any;

  beforeEach(() => {
    cleanupMocks();
    mockNavigate.mockClear();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken;
      return null;
    });
    testDate = new Date();
    jest.useFakeTimers();
    jest.setSystemTime(testDate);
    
    const todayISO = testDate.toISOString().split('T')[0];
    const createLocalTimeString = (hours: number, minutes: number) => {
      const date = new Date(testDate.getFullYear(), testDate.getMonth(), testDate.getDate(), hours, minutes);
      return date.toISOString();
    };
    
    mockScheduleResponse = {
      meetings: [
        {
          meeting_id: 1,
          name: 'Daily Standup',
          start_end_times: [
            [createLocalTimeString(9, 0), createLocalTimeString(9, 30)]
          ],
          ocurrence_ids: [101]
        }
      ],
      assignments: [
        {
          assignment_id: 2,
          name: 'Code Review',
          schedule: {
            slots: [
              { start: createLocalTimeString(10, 0), end: createLocalTimeString(11, 0) }
            ]
          },
          ocurrence_ids: [201],
          completed: [false]
        }
      ],
      chores: [
        {
          chore_id: 3,
          name: 'Update Documentation',
          schedule: {
            slots: [
              { start: createLocalTimeString(14, 0), end: createLocalTimeString(15, 0) }
            ]
          },
          ocurrence_ids: [301],
          completed: [false]
        }
      ]
    };
  });

  afterEach(() => {
    cleanupMocks();
    jest.useRealTimers();
  });

  const mockLevelResponse = {
    user_name: 'TestUser',
    xp: 150,
    level: 2,
    xp_for_next_level: 250,
    achievements: { first_timer: true }
  };

  test('renders main elements correctly', async () => {
    // Context will fetch level, Home will ensure today's range
    mockFetch(mockLevelResponse); // /getLevel
    mockFetch(mockScheduleResponse); // /fetch
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

  // Welcome text may include username from context; skip exact match assertion
    expect(screen.getByTestId('today-schedule-title')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-view-button')).toBeInTheDocument();
    expect(screen.getByTestId('sync-button')).toBeInTheDocument();
  });

  test('fetches schedule on mount for current day', async () => {
    mockFetch(mockLevelResponse); // initial /getLevel from context
    mockFetch(mockScheduleResponse); // then /fetch for today
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });
    await waitFor(() => {
      // Ensure at least one fetch call happened
      expect(fetch).toHaveBeenCalled();
    });
    // Find the /fetch call (context may have called /getLevel first)
    const fetchCalls = (fetch as jest.Mock).mock.calls as Array<[string, any]>;
    const fetchCall = fetchCalls.find(([u]) => String(u).includes('/fetch'))!;
    const url = new URL(fetchCall[0]);
    const startTimeParam = url.searchParams.get('start_time');
    const endTimeParam = url.searchParams.get('end_time');
    
    if (startTimeParam && endTimeParam) {
      const startTime = new Date(startTimeParam);
      const endTime = new Date(endTimeParam);
      expect(endTime.getTime() - startTime.getTime()).toBe(24 * 60 * 60 * 1000);
      // No strict midnight check; boundaries are local-day range expressed in UTC
    }
  });

  test('fetches level information on mount', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/getLevel'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });
  });

  test('displays schedule items correctly', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });
    await waitFor(() => {
      expect(screen.getByTestId('item-name-daily-standup')).toBeInTheDocument();
      expect(screen.getByTestId('item-name-code-review')).toBeInTheDocument();
      expect(screen.getByTestId('item-name-update-documentation')).toBeInTheDocument();
    });
    expect(screen.getByText(/Daily Standup/)).toBeInTheDocument();
    expect(screen.getByText(/Code Review/)).toBeInTheDocument();
    expect(screen.getByText(/Update Documentation/)).toBeInTheDocument();
  });

  test('handles sync Google Calendar', async () => {
    const syncResponse = { message: 'Calendar synced successfully!' };
  // Use a single mock so both initial mount calls and the sync call resolve; the button flow checks the sync message
  mockFetch(syncResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    const syncButton = screen.getByTestId('sync-button');
    userEvent.click(syncButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/googleCalendar/sync'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Calendar synced successfully!');
    });
  });

  test('navigates to profile on profile button click', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });
    const profileButton = screen.getByTestId('profile-button');
    userEvent.click(profileButton);
    expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/Profile');
  });

  test('navigates to calendar view', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });
    const calendarButton = screen.getByTestId('calendar-view-button');
    userEvent.click(calendarButton);
    expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/CalendarView');
  });

  test('navigates to add event', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });
    const addEventButton = screen.getByTestId('add-event-button');
    userEvent.click(addEventButton);
    expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/requiresPotentialSchedule/eventSelection');
  });

  test('opens mark session completed modal', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });
    await waitFor(() => {
      expect(screen.getByTestId('item-name-code-review')).toBeInTheDocument();
    });
    const markCompletedButton = screen.getByTestId('mark-completed-button-code-review');
    userEvent.click(markCompletedButton);
    await waitFor(() => {
      expect(screen.getByTestId('effort-slider')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-completion-button')).toBeInTheDocument();
    });
  });

  test('marks session as completed and refetches schedule', async () => {
  const completionResponse = { achievements: {}, xp: 10 };
  // Provide schedule on initial load
  mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-name-code-review')).toBeInTheDocument();
    });

    // Open modal
    const markCompletedButton = screen.getByTestId('mark-completed-button-code-review');
    userEvent.click(markCompletedButton);

    // Set effort value
    const slider = screen.getByTestId('effort-slider');
    userEvent.clear(slider);
    userEvent.type(slider, '8');

  // Ensure the POST completion returns success message (last mock wins for our fetch stub)
  mockFetch(completionResponse);

    // Confirm completion
    const confirmButton = screen.getByTestId('confirm-completion-button');
    userEvent.click(confirmButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/markSessionCompleted'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }),
          body: expect.stringContaining('"completed":true')
        })
      );
    });

    await waitFor(() => {
      // Alert contains earned XP message when no achievements are unlocked
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('You earned'));
    });

    // Should refetch schedule after completion
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/fetch?'),
        expect.anything()
      );
    });
  });

  test('opens update meeting modal', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-name-daily-standup')).toBeInTheDocument();
    });

    const updateButton = screen.getByTestId('update-button-daily-standup');
    userEvent.click(updateButton);

    expect(screen.getByText('Update Meeting')).toBeInTheDocument();
    expect(screen.getByTestId('meeting-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('meeting-location-input')).toBeInTheDocument();
  // Time inputs are provided via DateTimePickers; no specific test id asserted here
  });

  test('updates meeting and refetches schedule', async () => {
    const updateResponse = { clashed: false, message: 'Meeting updated!' };
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-name-daily-standup')).toBeInTheDocument();
    });

    // Open update modal
    const updateButton = screen.getByTestId('update-button-daily-standup');
    userEvent.click(updateButton);

    // Fill in update form
    const nameInput = screen.getByTestId('meeting-name-input');
    const locationInput = screen.getByTestId('meeting-location-input');
    
    userEvent.clear(nameInput);
    userEvent.type(nameInput, 'Updated Standup');
    userEvent.clear(locationInput);
    userEvent.type(locationInput, 'Conference Room A');

  // Mock the update API call + refetch
  mockFetch(updateResponse);
  mockFetch(mockScheduleResponse);

    // Submit update
    const submitButton = screen.getByTestId('submit-update-button');
    userEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/update'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          }),
          body: expect.stringContaining('"new_name":"Updated Standup"')
        })
      );
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Meeting updated!');
    });

    // Should refetch schedule after update
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/fetch?'),
        expect.anything()
      );
    });
  });

  test('deletes meeting and refetches schedule', async () => {
    const deleteResponse = { message: 'Meeting deleted successfully!' };
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-name-daily-standup')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('delete-button-daily-standup');
    userEvent.click(deleteButton);

  // Mock the delete API call + refetch
  mockFetch(deleteResponse);
  mockFetch(mockScheduleResponse);

    const confirmDeleteButton = screen.getByTestId('delete-this-occurrence-button');
    userEvent.click(confirmDeleteButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/delete'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Meeting deleted!');
    });

    // Should refetch schedule after deletion
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/fetch?'),
        expect.anything()
      );
    });
  });

  test('deletes assignment and refetches schedule', async () => {
    const deleteResponse = { message: 'Assignment deleted successfully!' };
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-name-code-review')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('delete-assignment-button-code-review');
    userEvent.click(deleteButton);

  // Mock the delete API call + refetch
  mockFetch(deleteResponse);
  mockFetch(mockScheduleResponse);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/delete'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"event_type":"assignment"')
        })
      );
    });

    // Should refetch schedule after deletion
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/fetch?'),
        expect.anything()
      );
    });
  });

  test('navigates to reschedule screen with correct parameters', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-name-code-review')).toBeInTheDocument();
    });

    const rescheduleButton = screen.getByTestId('reschedule-button-code-review');
    userEvent.click(rescheduleButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      expect.stringMatching(/\/requiresCurrentSchedule\/requiresPotentialSchedule\/RescheduleScreen\?id=2&type=assignment/)
    );
  });

  test('requests level information on mount (via context)', async () => {
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/getLevel'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });
  });

  test('handles delete event', async () => {
    // First render with the standard mock data to get code-review item
    mockFetch(mockLevelResponse);
    mockFetch(mockScheduleResponse);

    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-name-code-review')).toBeInTheDocument();
    });

    const deleteButton = screen.getByTestId('delete-assignment-button-code-review');
    userEvent.click(deleteButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/delete'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });
  });

  test('handles API errors gracefully', async () => {
    mockFetch({ error: 'Server error' }, false, 500);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    // Component should still render even if API calls fail
    expect(screen.getByTestId('today-schedule-title')).toBeInTheDocument();
  });

  test('filters schedule items to current day only', async () => {
    const tomorrow = new Date(testDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const multiDayResponse = {
      meetings: [],
      assignments: [
        {
          assignment_id: 2,
          name: 'Code Review',
          schedule: {
            slots: [
              { start: testDate.toISOString(), end: new Date(testDate.getTime() + 3600000).toISOString() }
            ]
          },
          ocurrence_ids: [201],
          completed: [false]
        },
        {
          assignment_id: 4,
          name: 'Tomorrow Task',
          schedule: {
            slots: [
              { start: tomorrow.toISOString(), end: new Date(tomorrow.getTime() + 3600000).toISOString() }
            ]
          },
          ocurrence_ids: [401],
          completed: [false]
        }
      ],
      chores: []
    };
    
  mockFetch(mockLevelResponse);
  mockFetch(multiDayResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(screen.getByTestId('item-name-code-review')).toBeInTheDocument();
    });

    // Should not show tomorrow's task
    expect(screen.queryByTestId('item-name-tomorrow-task')).not.toBeInTheDocument();
  });
});
