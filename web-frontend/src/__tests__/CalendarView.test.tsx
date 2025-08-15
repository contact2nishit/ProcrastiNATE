import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent, cleanupMocks } from '../test-utils';

// Mock navigation globally so all tests can assert redirects when actions occur
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock CurrentScheduleContext hook so we can intercept calls and provide slots
const mockEnsureScheduleRange = jest.fn();
const mockRefetchSchedule = jest.fn();
let mockCurrSchedule: any = { slots: [] };

jest.mock('../context/CurrentScheduleContext', () => {
  const actual = jest.requireActual('../context/CurrentScheduleContext');
  return {
    ...actual,
    useCurrentScheduleContext: () => ({
      currSchedule: mockCurrSchedule,
      setCurrSchedule: jest.fn(),
      ensureScheduleRange: mockEnsureScheduleRange,
      refetchSchedule: mockRefetchSchedule,
    }),
  };
});

import CalendarView from '../pages/CalendarView';

// Helpers to compute expected week range using the same logic as the app
const computeWeekIsoRange = (anchor: Date) => {
  const d = new Date(anchor);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  const start = new Date(d);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const startISO = start.toISOString().replace('Z', '+00:00');
  const endISO = end.toISOString().replace('Z', '+00:00');
  return { startISO, endISO };
};

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

describe('CalendarView', () => {
  beforeEach(() => {
    cleanupMocks();
  mockNavigate.mockReset();
    // Freeze time to Mon, Jan 6, 2025
    jest.setSystemTime(new Date('2025-01-06T00:00:00Z'));

    mockEnsureScheduleRange.mockReset();
    mockRefetchSchedule.mockReset();
    mockCurrSchedule = {
      slots: [
        {
          type: 'meeting',
          name: 'Standup',
          start: '2025-01-06T10:00:00+00:00',
          end: '2025-01-06T11:00:00+00:00',
          meeting_id: 1,
          occurence_id: 101,
        },
        {
          type: 'assignment',
          name: 'HW1',
          start: '2025-01-07T10:00:00+00:00',
          end: '2025-01-07T11:00:00+00:00',
          id: 'assignment_2_777',
        },
      ],
    };
  });

  test('fetches schedule for current week on mount', async () => {
    renderWithProviders(<CalendarView />, { withRouter: true });

    await waitFor(() => expect(mockEnsureScheduleRange).toHaveBeenCalled());
    const [startArg, endArg] = mockEnsureScheduleRange.mock.calls[0];

    const { startISO, endISO } = computeWeekIsoRange(new Date('2025-01-06T00:00:00Z'));
    expect(startArg).toBe(startISO);
    expect(endArg).toBe(endISO);

    expect(screen.getByText(/weekly calendar/i)).toBeInTheDocument();
  });

  test('navigating to next week triggers new fetch with updated range', async () => {
    renderWithProviders(<CalendarView />, { withRouter: true });

    await waitFor(() => expect(mockEnsureScheduleRange).toHaveBeenCalled());
    const [firstStart] = mockEnsureScheduleRange.mock.calls[0];
    mockEnsureScheduleRange.mockClear();

    const nextBtn = screen.getByRole('button', { name: /next/i });
    await userEvent.click(nextBtn);

    await waitFor(() => expect(mockEnsureScheduleRange).toHaveBeenCalled());
    const [startArg, endArg] = mockEnsureScheduleRange.mock.calls[0];

    const { startISO } = computeWeekIsoRange(new Date('2025-01-06T00:00:00Z'));
    const nextWeekStart = new Date(new Date(startISO.replace('+00:00', 'Z')).getTime() + 7 * 24 * 60 * 60 * 1000);
    const { startISO: nextStartISO, endISO: nextEndISO } = computeWeekIsoRange(nextWeekStart);

    expect(firstStart).toBe(startISO);
    expect(startArg).toBe(nextStartISO);
    expect(endArg).toBe(nextEndISO);
  });

  test('clicking a meeting slot then Update opens the Update modal', async () => {
    renderWithProviders(<CalendarView />, { withRouter: true });

    await waitFor(() => expect(mockEnsureScheduleRange).toHaveBeenCalled());

    const eventTile = await screen.findByText('Standup');
    await userEvent.click(eventTile);
    const updateBtn = await screen.findByRole('button', { name: /update/i });
    await userEvent.click(updateBtn);

    expect(await screen.findByText(/update meeting/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit update/i })).toBeInTheDocument();
  });

  test('clicking a meeting slot then Delete opens the Delete modal (Cancel only)', async () => {
    renderWithProviders(<CalendarView />, { withRouter: true });

    await waitFor(() => expect(mockEnsureScheduleRange).toHaveBeenCalled());

    const eventTile = await screen.findByText('Standup');
    await userEvent.click(eventTile);
    const deleteBtn = await screen.findByRole('button', { name: /^delete$/i });
    await userEvent.click(deleteBtn);

    expect(await screen.findByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  test('rescheduling an assignment from the popup navigates to reschedule screen', async () => {
    renderWithProviders(<CalendarView />, { withRouter: true });

    await waitFor(() => expect(mockEnsureScheduleRange).toHaveBeenCalled());

    const assignmentTile = await screen.findByText('HW1');
    await userEvent.click(assignmentTile);
    const rescheduleBtn = await screen.findByRole('button', { name: /reschedule/i });
    await userEvent.click(rescheduleBtn);

  expect(mockNavigate).toHaveBeenCalledWith(expect.stringMatching(/\/requiresCurrentSchedule\/requiresPotentialSchedule\/RescheduleScreen\?id=.+&type=assignment/));
  });
});