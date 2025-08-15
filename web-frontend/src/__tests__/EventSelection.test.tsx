import React from 'react';
import { screen, waitFor } from '@testing-library/react';
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
});
