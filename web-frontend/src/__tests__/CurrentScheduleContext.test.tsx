import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { CurrentScheduleProvider, useCurrentScheduleContext } from '../context/CurrentScheduleContext';
import { mockFetch, mockApiResponse, cleanupMocks } from '../test-utils';
import { localStorageMock } from '../setupTests';

// Mock config
jest.mock('../config', () => ({
  backendURL: 'https://test-backend.com'
}));

describe('CurrentScheduleContext', () => {
  const mockToken = 'test_token_123';
  
  beforeEach(() => {
    cleanupMocks();
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'token') return mockToken;
      return null;
    });
  });

  afterEach(() => {
    cleanupMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CurrentScheduleProvider>{children}</CurrentScheduleProvider>
  );

  const mockScheduleApiResponse = {
    meetings: [
      {
        meeting_id: 1,
        name: 'Team Meeting',
        start_end_times: [
          ['2025-08-08T09:00:00+00:00', '2025-08-08T10:00:00+00:00'],
          ['2025-08-08T14:00:00+00:00', '2025-08-08T15:00:00+00:00']
        ],
        ocurrence_ids: [101, 102]
      }
    ],
    assignments: [
      {
        assignment_id: 2,
        name: 'Complete Project',
        schedule: {
          slots: [
            { start: '2025-08-08T11:00:00+00:00', end: '2025-08-08T12:00:00+00:00' }
          ]
        },
        ocurrence_ids: [201],
        completed: [false]
      }
    ],
    chores: [
      {
        chore_id: 3,
        name: 'Clean Kitchen',
        schedule: {
          slots: [
            { start: '2025-08-08T16:00:00+00:00', end: '2025-08-08T17:00:00+00:00' }
          ]
        },
        ocurrence_ids: [301],
        completed: [false]
      }
    ]
  };

  test('initializes with empty schedule', () => {
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    expect(result.current.currSchedule).toEqual({
      slots: [],
      startTime: '',
      endTime: ''
    });
  });

  test('ensureScheduleRange fetches schedule for empty context', async () => {
    mockFetch(mockScheduleApiResponse);
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    const startTime = '2025-08-08T00:00:00+00:00';
    const endTime = '2025-08-08T23:59:59+00:00';
    await act(async () => {
      await result.current.ensureScheduleRange(startTime, endTime);
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/fetch?start_time=2025-08-08T00%3A00%3A00%2B00%3A00&end_time=2025-08-08T23%3A59%3A59%2B00%3A00&meetings=true&assignments=true&chores=true'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          'Authorization': `Bearer ${mockToken}`,
          'Content-Type': 'application/json'
        })
      })
    );
    expect(result.current.currSchedule.startTime).toBe(startTime);
    expect(result.current.currSchedule.endTime).toBe(endTime);
    expect(result.current.currSchedule.slots).toHaveLength(4); // 2 meetings + 1 assignment + 1 chore
    const slots = result.current.currSchedule.slots;
    expect(slots[0]).toMatchObject({
      type: 'meeting',
      name: 'Team Meeting',
      start: '2025-08-08T09:00:00+00:00',
      end: '2025-08-08T10:00:00+00:00',
      meeting_id: 1,
      occurence_id: 101
    });
    const assignmentSlot = slots.find(slot => slot.type === 'assignment');
    expect(assignmentSlot).toMatchObject({
      type: 'assignment',
      name: 'Complete Project',
      assignment_id: 2,
      occurence_id: 201,
      completed: false
    });
  });
  test('ensureScheduleRange does not fetch when range is already covered', async () => {
    mockFetch(mockScheduleApiResponse);
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    const startTime = '2025-08-08T00:00:00+00:00';
    const endTime = '2025-08-08T23:59:59+00:00';
    await act(async () => {
      await result.current.ensureScheduleRange(startTime, endTime);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.ensureScheduleRange('2025-08-08T10:00:00+00:00', '2025-08-08T20:00:00+00:00');
    });
    // Should not make another API call
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('ensureScheduleRange expands range when needed', async () => {
    mockFetch(mockScheduleApiResponse);
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    await act(async () => {
      await result.current.ensureScheduleRange('2025-08-08T10:00:00+00:00', '2025-08-08T20:00:00+00:00');
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    // second call that extends the range
    await act(async () => {
      await result.current.ensureScheduleRange('2025-08-08T00:00:00+00:00', '2025-08-09T23:59:59+00:00');
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    // should use expanded range
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('start_time=2025-08-08T00%3A00%3A00%2B00%3A00'),
      expect.anything()
    );
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('end_time=2025-08-09T23%3A59%3A59%2B00%3A00'),
      expect.anything()
    );
    // context state should have expanded range
    expect(result.current.currSchedule.startTime).toBe('2025-08-08T00:00:00+00:00');
    expect(result.current.currSchedule.endTime).toBe('2025-08-09T23:59:59+00:00');
  });

  test('refetchSchedule refetches current range', async () => {
    mockFetch(mockScheduleApiResponse);
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    const startTime = '2025-08-08T00:00:00+00:00';
    const endTime = '2025-08-08T23:59:59+00:00';
    await act(async () => {
      await result.current.ensureScheduleRange(startTime, endTime);
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
      await result.current.refetchSchedule();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining(`start_time=${encodeURIComponent(startTime)}`),
      expect.anything()
    );
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining(`end_time=${encodeURIComponent(endTime)}`),
      expect.anything()
    );
  });

  test('refetchSchedule does nothing when no range is set', async () => {
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    await act(async () => {
      await result.current.refetchSchedule();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  test('handles API errors gracefully', async () => {
    mockFetch({ error: 'Server error' }, false, 500);
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    const startTime = '2025-08-08T00:00:00+00:00';
    const endTime = '2025-08-08T23:59:59+00:00';
    await act(async () => {
      await result.current.ensureScheduleRange(startTime, endTime);
    });
    expect(result.current.currSchedule).toEqual({
      slots: [],
      startTime: '',
      endTime: ''
    });
  });

  test('handles missing token gracefully', async () => {
    localStorageMock.getItem.mockReturnValue(null);
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    await act(async () => {
      await result.current.ensureScheduleRange('2025-08-08T00:00:00+00:00', '2025-08-08T23:59:59+00:00');
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.currSchedule.slots).toHaveLength(0);
  });

  test('sorts slots by start time', async () => {
    const unsortedResponse = {
      meetings: [
        {
          meeting_id: 1,
          name: 'Late Meeting',
          start_end_times: [['2025-08-08T15:00:00+00:00', '2025-08-08T16:00:00+00:00']],
          ocurrence_ids: [101]
        }
      ],
      assignments: [
        {
          assignment_id: 2,
          name: 'Early Assignment',
          schedule: {
            slots: [{ start: '2025-08-08T09:00:00+00:00', end: '2025-08-08T10:00:00+00:00' }]
          },
          ocurrence_ids: [201],
          completed: [false]
        }
      ],
      chores: []
    };
    mockFetch(unsortedResponse);
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    await act(async () => {
      await result.current.ensureScheduleRange('2025-08-08T00:00:00+00:00', '2025-08-08T23:59:59+00:00');
    });
    const slots = result.current.currSchedule.slots;
    expect(slots[0].start).toBe('2025-08-08T09:00:00+00:00'); // Assignment should be first
    expect(slots[1].start).toBe('2025-08-08T15:00:00+00:00'); // Meeting should be second
  });

  test('handles API response with missing schedule data', async () => {
    const partialResponse = {
      meetings: [],
      assignments: [
        {
          assignment_id: 2,
          name: 'Assignment without schedule',
          // Missing schedule property
          ocurrence_ids: [201],
          completed: [false]
        }
      ],
      chores: [
        {
          chore_id: 3,
          name: 'Chore with empty schedule',
          schedule: null, // Null schedule
          ocurrence_ids: [301],
          completed: [false]
        }
      ]
    };
    mockFetch(partialResponse);    
    const { result } = renderHook(() => useCurrentScheduleContext(), { wrapper });
    await act(async () => {
      await result.current.ensureScheduleRange('2025-08-08T00:00:00+00:00', '2025-08-08T23:59:59+00:00');
    });
    expect(result.current.currSchedule.slots).toHaveLength(0);
  });
});
