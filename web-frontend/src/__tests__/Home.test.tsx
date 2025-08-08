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
  
  beforeEach(() => {
    cleanupMocks();
    mockNavigate.mockClear();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken;
      return null;
    });
    
    // Mock current date to ensure consistent tests
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-08-08T12:00:00Z'));
  });

  afterEach(() => {
    cleanupMocks();
    jest.useRealTimers();
  });

  const mockScheduleResponse = {
    meetings: [
      {
        meeting_id: 1,
        name: 'Daily Standup',
        start_end_times: [
          ['2025-08-08T09:00:00+00:00', '2025-08-08T09:30:00+00:00']
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
            { start: '2025-08-08T10:00:00+00:00', end: '2025-08-08T11:00:00+00:00' }
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
            { start: '2025-08-08T14:00:00+00:00', end: '2025-08-08T15:00:00+00:00' }
          ]
        },
        ocurrence_ids: [301],
        completed: [false]
      }
    ]
  };

  const mockLevelResponse = {
    user_name: 'TestUser',
    xp: 150,
    level: 2
  };

  test('renders main elements correctly', async () => {
    mockFetch(mockLevelResponse);
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    expect(screen.getByText('Welcome!')).toBeInTheDocument();
    expect(screen.getByTestId('today-schedule-title')).toBeInTheDocument();
    expect(screen.getByTestId('calendar-view-button')).toBeInTheDocument();
    expect(screen.getByTestId('sync-button')).toBeInTheDocument();
  });

  test('fetches schedule on mount for current day', async () => {
    mockFetch(mockScheduleResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/fetch?'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    // Check that the API call includes today's date range
    const fetchCall = (fetch as jest.Mock).mock.calls[0];
    expect(fetchCall[0]).toContain('start_time=2025-08-08T00%3A00%3A00%2B00%3A00');
    expect(fetchCall[0]).toContain('end_time=2025-08-09T00%3A00%3A00%2B00%3A00');
  });

  test('fetches level information on mount', async () => {
    mockFetch(mockLevelResponse);
    
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

    // Check time formatting
    expect(screen.getByText('9:00 AM - 9:30 AM')).toBeInTheDocument();
    expect(screen.getByText('10:00 AM - 11:00 AM')).toBeInTheDocument();
    expect(screen.getByText('2:00 PM - 3:00 PM')).toBeInTheDocument();
  });

  test('handles sync Google Calendar', async () => {
    const syncResponse = { message: 'Calendar synced successfully!' };
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

  test('handles logout correctly', async () => {
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    const logoutButton = screen.getByTestId('logout-button');
    userEvent.click(logoutButton);

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('navigates to calendar view', async () => {
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    const calendarButton = screen.getByTestId('calendar-view-button');
    userEvent.click(calendarButton);

    expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/CalendarView');
  });

  test('navigates to add event', async () => {
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    const addEventButton = screen.getByTestId('add-event-button');
    userEvent.click(addEventButton);

    expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/requiresPotentialSchedule/eventSelection');
  });

  test('opens mark session completed modal', async () => {
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

    expect(screen.getByText('Mark Session Completed')).toBeInTheDocument();
    expect(screen.getByTestId('effort-slider')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-completion-button')).toBeInTheDocument();
  });

  test('marks session as completed and refetches schedule', async () => {
    const completionResponse = { message: 'Session marked as completed!' };
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

    // Mock the completion API call
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
      expect(window.alert).toHaveBeenCalledWith('Session marked as completed!');
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
    expect(screen.getByTestId('meeting-time-input')).toBeInTheDocument();
  });

  test('updates meeting and refetches schedule', async () => {
    const updateResponse = { clashed: false, message: 'Meeting updated!' };
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

    // Mock the update API call
    mockFetch(updateResponse);

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

    // Mock the delete API call
    mockFetch(deleteResponse);

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

    // Mock the delete API call
    mockFetch(deleteResponse);

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

  test('displays level information correctly', async () => {
    mockFetch(mockLevelResponse);
    
    renderWithProviders(<Home />, { 
      withRouter: false, 
      withCurrentSchedule: true 
    });

    await waitFor(() => {
      // Matches: Welcome, TestUser!
      expect(screen.getByText(/Welcome,\s*TestUser!$/)).toBeInTheDocument();
      expect(screen.getByText(/Level:\s*2/)).toBeInTheDocument();
      expect(screen.getByText(/XP:\s*150\s*\/\s*\d+/)).toBeInTheDocument();
    });

    // Check XP progress calculation
    const progressBar = screen.getByTestId('xp-progress');
    expect(progressBar).toHaveAttribute('data-value', expect.any(String));
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
    const multiDayResponse = {
      ...mockScheduleResponse,
      assignments: [
        ...mockScheduleResponse.assignments,
        {
          assignment_id: 4,
          name: 'Tomorrow Task',
          schedule: {
            slots: [
              { start: '2025-08-09T10:00:00+00:00', end: '2025-08-09T11:00:00+00:00' }
            ]
          },
          ocurrence_ids: [401],
          completed: [false]
        }
      ]
    };
    
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
