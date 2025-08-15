import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { renderWithProviders, userEvent, mockFetch, cleanupMocks, mockApiResponse } from '../test-utils';

// Local spy to verify calls from the component under test
const mockSetPotentialSchedulesLocal = jest.fn();
// Provide a local mock for PotentialScheduleContext so tests can assert setPotentialSchedules.
// This must be declared before importing the component under test so the mock is used.
jest.mock('../context/PotentialScheduleContext', () => {
  const actual = jest.requireActual('../context/PotentialScheduleContext');
  return {
    ...actual,
    usePotentialScheduleContext: () => ({
      potentialSchedules: { schedules: [], meetings: [], conflicting_meetings: [] },
  setPotentialSchedules: mockSetPotentialSchedulesLocal,
    }),
  };
});
import EventSelection from '../pages/EventSelection';

// Helper: find the submit schedule button via test id
async function findSubmitButton() {
  // Ensure we're on the Events tab; if a nav button exists, click it
  const navBtn = screen.queryByTestId('nav-events');
  if (navBtn) {
    await userEvent.click(navBtn);
  }
  return screen.getByTestId('submit-schedule');
}

describe('EventSelection submit flow', () => {
  beforeEach(() => {
    cleanupMocks();
  mockSetPotentialSchedulesLocal.mockClear();
  });

  test('submits schedule and updates PotentialScheduleContext on success', async () => {
    // Arrange: mock successful backend response
    mockFetch(mockApiResponse.schedule, true, 201);

    // Render with router (navigate is used) and a token present
    renderWithProviders(<EventSelection />, {
      withRouter: true,
      initialToken: 'test_token_abc',
    });

    const submitBtn = await findSubmitButton();

    // Act
    await userEvent.click(submitBtn);

    // Assert (wait for async side-effects)
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const lastCall = (global.fetch as jest.Mock).mock.calls.at(-1);
    expect(lastCall?.[0]).toMatch(/\/schedule$/);
    const reqInit = lastCall?.[1] as any;
    expect(reqInit?.method).toBe('POST');
    expect((reqInit?.headers as any)['Content-Type']).toBe('application/json');
    const parsed = JSON.parse(reqInit?.body as string);
    expect(parsed).toHaveProperty('meetings');
    expect(parsed).toHaveProperty('assignments');
    expect(parsed).toHaveProperty('chores');
    expect(parsed).toHaveProperty('tz_offset_minutes');

  await waitFor(() => expect(mockSetPotentialSchedulesLocal).toHaveBeenCalledTimes(1));
  expect(mockSetPotentialSchedulesLocal).toHaveBeenCalledWith(mockApiResponse.schedule);
  });

  test('shows an alert when backend responds with error', async () => {
    // Arrange: mock error response
    mockFetch({ detail: 'Bad Request' }, false, 400);

    renderWithProviders(<EventSelection />, {
      withRouter: true,
      initialToken: 'test_token_abc',
    });

    const submitBtn = await findSubmitButton();

    // Act
    await userEvent.click(submitBtn);

    // Assert
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await waitFor(() => expect(window.alert).toHaveBeenCalled());
  expect(mockSetPotentialSchedulesLocal).not.toHaveBeenCalled();
  });

  test('builds request body from local state (empty arrays OK)', async () => {
    mockFetch(mockApiResponse.schedule, true, 201);

    renderWithProviders(<EventSelection />, {
      withRouter: true,
      initialToken: 'test_token_abc',
    });

    const submitBtn = await findSubmitButton();
    await userEvent.click(submitBtn);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const lastCall = (global.fetch as jest.Mock).mock.calls.at(-1);
    const reqInit = lastCall?.[1];
    const parsed = JSON.parse((reqInit as any)?.body as string);
    expect(Array.isArray(parsed.meetings)).toBe(true);
    expect(Array.isArray(parsed.assignments)).toBe(true);
    expect(Array.isArray(parsed.chores)).toBe(true);
  });

  test('chore recurrence input accepts 0..6 and includes end_recur_date when > 0', async () => {
    mockFetch(mockApiResponse.schedule, true, 201);

    renderWithProviders(<EventSelection />, {
      withRouter: true,
      initialToken: 'test_token_abc',
    });

    // Go to Chore tab
    await userEvent.click(screen.getByRole('button', { name: /chore\/study/i }));

    // Fill chore fields
    await userEvent.type(screen.getByPlaceholderText(/chore\/study name/i), 'Laundry');
    await userEvent.type(screen.getByPlaceholderText(/effort in minutes/i), '45');

  // Window start/end: set both to known valid values in order to avoid transient invalid state
  const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
  const startInput = dateInputs[0] as HTMLInputElement;
  const endInput = dateInputs[1] as HTMLInputElement;
  const startISO = '2030-01-02T10:00';
  const endISO = '2030-01-02T12:00';
  fireEvent.change(startInput, { target: { value: startISO } });
  fireEvent.change(endInput, { target: { value: endISO } });

    // Set recurrence to 3 days
    const recurInput = screen.getByPlaceholderText('0 - 6');
    await userEvent.type(recurInput, '3');

    // Add chore
    await userEvent.click(screen.getByRole('button', { name: /add chore/i }));

    // Submit from Events tab
    const submitBtn = await findSubmitButton();
    await userEvent.click(submitBtn);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const lastCall = (global.fetch as jest.Mock).mock.calls.at(-1);
    const reqInit = lastCall?.[1] as any;
    const parsed = JSON.parse(reqInit?.body as string);
    expect(parsed.chores.length).toBeGreaterThan(0);
    const sentChore = parsed.chores[0];
    expect(sentChore).toHaveProperty('end_recur_date');

  // end_recur_date should be windowStart + 3 days (in ISO)
  const winStart = new Date(sentChore.window[0]);
  const expected = new Date(winStart.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  expect(sentChore.end_recur_date).toBe(expected);
  });

  test('chore recurrence input clamps to max 6 and not negative', async () => {
    mockFetch(mockApiResponse.schedule, true, 201);

    renderWithProviders(<EventSelection />, {
      withRouter: true,
      initialToken: 'test_token_abc',
    });

    await userEvent.click(screen.getByRole('button', { name: /chore\/study/i }));

    await userEvent.type(screen.getByPlaceholderText(/chore\/study name/i), 'Dishes');
    await userEvent.type(screen.getByPlaceholderText(/effort in minutes/i), '15');

  // Set valid start/end
  const dateInputs = document.querySelectorAll('input[type="datetime-local"]');
  const startInput = dateInputs[0] as HTMLInputElement;
  const endInput = dateInputs[1] as HTMLInputElement;
    const startISO = '2031-02-03T08:00';
    const endISO = '2031-02-03T09:00';
  fireEvent.change(startInput, { target: { value: startISO } });
  fireEvent.change(endInput, { target: { value: endISO } });

    const recurInput = screen.getByPlaceholderText('0 - 6');
    await userEvent.type(recurInput, '9'); // should clamp to 6 in UI

    await userEvent.click(screen.getByRole('button', { name: /add chore/i }));

    const submitBtn = await findSubmitButton();
    await userEvent.click(submitBtn);

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const lastCall = (global.fetch as jest.Mock).mock.calls.at(-1);
    const parsed = JSON.parse((lastCall?.[1] as any).body as string);
    const sentChore = parsed.chores[0];
    // With clamped 6, there should be an end_recur_date present
    expect(sentChore).toHaveProperty('end_recur_date');
  });
});
