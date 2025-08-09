import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, cleanupMocks } from '../test-utils';
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

const mockUseMeetingContext = jest.fn();
jest.mock('../context/MeetingContext', () => ({
  useMeetingContext: () => mockUseMeetingContext()
}));

describe('SchedulePicker Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cleanupMocks();
    
    // Default potential schedule context
    mockUsePotentialScheduleContext.mockReturnValue({
      schedules: [
        {
          assignments: [
            {
              name: 'Math Homework',
              schedule: {
                status: 'scheduled',
                slots: [{ start: '2024-01-15T09:00:00', end: '2024-01-15T10:00:00' }]
              }
            }
          ],
          chores: [
            {
              name: 'Clean Kitchen',
              schedule: {
                status: 'scheduled',
                slots: [{ start: '2024-01-15T14:00:00', end: '2024-01-15T15:00:00' }]
              }
            }
          ],
          conflicting_assignments: [],
          conflicting_chores: [],
          not_enough_time_assignments: [],
          not_enough_time_chores: [],
          total_potential_xp: 100
        },
        {
          assignments: [],
          chores: [],
          conflicting_assignments: ['Math Test'],
          conflicting_chores: ['Laundry'],
          not_enough_time_assignments: ['Research Paper'],
          not_enough_time_chores: ['Deep Clean'],
          total_potential_xp: 50
        }
      ],
      setSchedules: mockSetPotentialSchedules
    });
    
    // Default meeting context
    mockUseMeetingContext.mockReturnValue({
      meetings: [
        {
          name: 'Team Standup',
          start_end_times: [['2024-01-15T11:00:00', '2024-01-15T11:30:00']]
        },
        {
          name: 'Project Review',
          start_end_times: [['2024-01-15T16:00:00', '2024-01-15T17:00:00']]
        }
      ]
    });
    
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  it('renders schedule picker title', () => {
    renderWithProviders(<SchedulePicker />);
    
    expect(screen.getByTestId('schedule-picker-title')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-picker-title')).toHaveTextContent('Choose a Schedule');
  });

  it('displays schedule buttons for each available schedule', () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton1 = screen.getByTestId('schedule-button-1');
    const scheduleButton2 = screen.getByTestId('schedule-button-2');
    
    expect(scheduleButton1).toBeInTheDocument();
    expect(scheduleButton2).toBeInTheDocument();
    expect(scheduleButton1).toHaveTextContent('Schedule #1 (XP: 100)');
    expect(scheduleButton2).toHaveTextContent('Schedule #2 (XP: 50)');
  });

  it('shows conflicting meetings warning when conflicts exist', () => {
    renderWithProviders(<SchedulePicker />);
    
    const warningElement = screen.getByTestId('conflicting-meetings-warning');
    expect(warningElement).toBeInTheDocument();
    expect(warningElement).toHaveTextContent('Conflicting Meetings:');
    
    expect(screen.getByTestId('conflicting-meeting-0')).toHaveTextContent('Team Standup');
    expect(screen.getByTestId('conflicting-meeting-1')).toHaveTextContent('Project Review');
  });

  it('opens modal when schedule button is clicked', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    });
  });

  it('displays schedule details in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('modal-schedule-title')).toHaveTextContent('Schedule #1');
      expect(screen.getByTestId('assignments-section')).toBeInTheDocument();
      expect(screen.getByTestId('chores-section')).toBeInTheDocument();
      expect(screen.getByTestId('conflicts-section')).toBeInTheDocument();
      expect(screen.getByTestId('meetings-section')).toBeInTheDocument();
      expect(screen.getByTestId('potential-xp-display')).toHaveTextContent('Potential XP: 100');
    });
  });

  it('displays assignment items in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('assignment-item-0')).toHaveTextContent('Math Homework');
    });
  });

  it('displays chore items in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('chore-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('chore-item-0')).toHaveTextContent('Clean Kitchen');
    });
  });

  it('displays "None" when no assignments exist', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-2');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('assignments-none')).toBeInTheDocument();
      expect(screen.getByTestId('assignments-none')).toHaveTextContent('None');
    });
  });

  it('displays "None" when no chores exist', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-2');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('chores-none')).toBeInTheDocument();
      expect(screen.getByTestId('chores-none')).toHaveTextContent('None');
    });
  });

  it('displays conflict information in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-2');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('conflict-assignment-0')).toHaveTextContent('Assignment conflict: Math Test');
      expect(screen.getByTestId('conflict-chore-0')).toHaveTextContent('Chore conflict: Laundry');
      expect(screen.getByTestId('not-enough-time-assignment-0')).toHaveTextContent('Not enough time for assignment: Research Paper');
      expect(screen.getByTestId('not-enough-time-chore-0')).toHaveTextContent('Not enough time for chore: Deep Clean');
    });
  });

  it('displays meeting items in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('meeting-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('meeting-item-0')).toHaveTextContent('Team Standup');
      expect(screen.getByTestId('meeting-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('meeting-item-1')).toHaveTextContent('Project Review');
    });
  });

  it('calls submitSchedule when Set This Schedule button is clicked', async () => {
    mockFetch(
      { success: true },
      true,
      200
    );
    
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      const setScheduleButton = screen.getByTestId('set-schedule-button');
      return userEvent.click(setScheduleButton);
    });
    
    expect(fetch).toHaveBeenCalledWith(
      'https://test-backend.com/schedule',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      })
    );
  });

  it('navigates to calendar view when View Potential Schedule is clicked', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      const viewPotentialButton = screen.getByTestId('view-potential-schedule-button');
      return userEvent.click(viewPotentialButton);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential?scheduleIdx=0');
  });

  it('closes modal when Close button is clicked', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByTestId('close-modal-button');
    await userEvent.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('schedule-modal')).not.toBeInTheDocument();
    });
  });

  it('navigates back when Go Back button is clicked', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const goBackButton = screen.getByTestId('go-back-button');
    await userEvent.click(goBackButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles API error when submitting schedule', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock fetch to reject
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'));
    
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await userEvent.click(scheduleButton);
    
    await waitFor(() => {
      const setScheduleButton = screen.getByTestId('set-schedule-button');
      return userEvent.click(setScheduleButton);
    });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error submitting schedule:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
});

describe('SchedulePicker Component', () => {
  const user = userEvent.setup();
  
  beforeEach(() => {
    jest.clearAllMocks();
    cleanupMocks();
    
    // Default potential schedule context
    mockUsePotentialScheduleContext.mockReturnValue({
      schedules: [
        {
          assignments: [
            {
              name: 'Math Homework',
              schedule: {
                status: 'scheduled',
                slots: [{ start: '2024-01-15T09:00:00', end: '2024-01-15T10:00:00' }]
              }
            }
          ],
          chores: [
            {
              name: 'Clean Kitchen',
              schedule: {
                status: 'scheduled',
                slots: [{ start: '2024-01-15T14:00:00', end: '2024-01-15T15:00:00' }]
              }
            }
          ],
          conflicting_assignments: [],
          conflicting_chores: [],
          not_enough_time_assignments: [],
          not_enough_time_chores: [],
          total_potential_xp: 100
        },
        {
          assignments: [],
          chores: [],
          conflicting_assignments: ['Math Test'],
          conflicting_chores: ['Laundry'],
          not_enough_time_assignments: ['Research Paper'],
          not_enough_time_chores: ['Deep Clean'],
          total_potential_xp: 50
        }
      ],
      setSchedules: mockSetPotentialSchedules
    });
    
    // Default meeting context
    mockUseMeetingContext.mockReturnValue({
      meetings: [
        {
          name: 'Team Standup',
          start_end_times: [['2024-01-15T11:00:00', '2024-01-15T11:30:00']]
        },
        {
          name: 'Project Review',
          start_end_times: [['2024-01-15T16:00:00', '2024-01-15T17:00:00']]
        }
      ]
    });
    
    localStorageMock.getItem.mockReturnValue('test-token');
  });

  it('renders schedule picker title', () => {
    renderWithProviders(<SchedulePicker />);
    
    expect(screen.getByTestId('schedule-picker-title')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-picker-title')).toHaveTextContent('Choose a Schedule');
  });

  it('displays schedule buttons for each available schedule', () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton1 = screen.getByTestId('schedule-button-1');
    const scheduleButton2 = screen.getByTestId('schedule-button-2');
    
    expect(scheduleButton1).toBeInTheDocument();
    expect(scheduleButton2).toBeInTheDocument();
    expect(scheduleButton1).toHaveTextContent('Schedule #1 (XP: 100)');
    expect(scheduleButton2).toHaveTextContent('Schedule #2 (XP: 50)');
  });

  it('shows conflicting meetings warning when conflicts exist', () => {
    renderWithProviders(<SchedulePicker />);
    
    const warningElement = screen.getByTestId('conflicting-meetings-warning');
    expect(warningElement).toBeInTheDocument();
    expect(warningElement).toHaveTextContent('Conflicting Meetings:');
    
    expect(screen.getByTestId('conflicting-meeting-0')).toHaveTextContent('Team Standup');
    expect(screen.getByTestId('conflicting-meeting-1')).toHaveTextContent('Project Review');
  });

  it('opens modal when schedule button is clicked', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    });
  });

  it('displays schedule details in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('modal-schedule-title')).toHaveTextContent('Schedule #1');
      expect(screen.getByTestId('assignments-section')).toBeInTheDocument();
      expect(screen.getByTestId('chores-section')).toBeInTheDocument();
      expect(screen.getByTestId('conflicts-section')).toBeInTheDocument();
      expect(screen.getByTestId('meetings-section')).toBeInTheDocument();
      expect(screen.getByTestId('potential-xp-display')).toHaveTextContent('Potential XP: 100');
    });
  });

  it('displays assignment items in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('assignment-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('assignment-item-0')).toHaveTextContent('Math Homework');
    });
  });

  it('displays chore items in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('chore-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('chore-item-0')).toHaveTextContent('Clean Kitchen');
    });
  });

  it('displays "None" when no assignments exist', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-2');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('assignments-none')).toBeInTheDocument();
      expect(screen.getByTestId('assignments-none')).toHaveTextContent('None');
    });
  });

  it('displays "None" when no chores exist', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-2');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('chores-none')).toBeInTheDocument();
      expect(screen.getByTestId('chores-none')).toHaveTextContent('None');
    });
  });

  it('displays conflict information in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-2');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('conflict-assignment-0')).toHaveTextContent('Assignment conflict: Math Test');
      expect(screen.getByTestId('conflict-chore-0')).toHaveTextContent('Chore conflict: Laundry');
      expect(screen.getByTestId('not-enough-time-assignment-0')).toHaveTextContent('Not enough time for assignment: Research Paper');
      expect(screen.getByTestId('not-enough-time-chore-0')).toHaveTextContent('Not enough time for chore: Deep Clean');
    });
  });

  it('displays meeting items in modal', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('meeting-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('meeting-item-0')).toHaveTextContent('Team Standup');
      expect(screen.getByTestId('meeting-item-1')).toBeInTheDocument();
      expect(screen.getByTestId('meeting-item-1')).toHaveTextContent('Project Review');
    });
  });

  it('calls submitSchedule when Set This Schedule button is clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });
    
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      const setScheduleButton = screen.getByTestId('set-schedule-button');
      return user.click(setScheduleButton);
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      'https://test-backend.com/schedule',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      })
    );
  });

  it('navigates to calendar view when View Potential Schedule is clicked', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      const viewPotentialButton = screen.getByTestId('view-potential-schedule-button');
      return user.click(viewPotentialButton);
    });
    
    expect(mockNavigate).toHaveBeenCalledWith('/requiresCurrentSchedule/requiresPotentialSchedule/CalendarViewPotential?scheduleIdx=0');
  });

  it('closes modal when Close button is clicked', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      expect(screen.getByTestId('schedule-modal')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByTestId('close-modal-button');
    await user.click(closeButton);
    
    await waitFor(() => {
      expect(screen.queryByTestId('schedule-modal')).not.toBeInTheDocument();
    });
  });

  it('navigates back when Go Back button is clicked', async () => {
    renderWithProviders(<SchedulePicker />);
    
    const goBackButton = screen.getByTestId('go-back-button');
    await user.click(goBackButton);
    
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles API error when submitting schedule', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    mockFetch.mockRejectedValueOnce(new Error('API Error'));
    
    renderWithProviders(<SchedulePicker />);
    
    const scheduleButton = screen.getByTestId('schedule-button-1');
    await user.click(scheduleButton);
    
    await waitFor(() => {
      const setScheduleButton = screen.getByTestId('set-schedule-button');
      return user.click(setScheduleButton);
    });
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error submitting schedule:', expect.any(Error));
    });
    
    consoleSpy.mockRestore();
  });
});


