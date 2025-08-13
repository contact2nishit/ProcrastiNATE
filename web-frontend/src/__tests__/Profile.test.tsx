import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, mockFetch, cleanupMocks } from '../test-utils';
import { localStorageMock } from '../setupTests';
import Profile from '../pages/Profile';

jest.mock('../config', () => ({ backendURL: 'https://test-backend.com' }));

describe('Profile Page', () => {
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

  test('renders title and level info from context', async () => {
    mockFetch({
      user_name: 'TestUser',
      xp: 80,
      level: 1,
      xp_for_next_level: 100,
      achievements: { first_timer: true }
    });

  renderWithProviders(<Profile />, { withRouter: true, withCurrentSchedule: true });

    expect(screen.getByTestId('profile-title')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Level: 1/)).toBeInTheDocument();
      expect(screen.getByText(/XP: 80 \/ 100/)).toBeInTheDocument();
    });
  });

  test('renders earned and unearned badges', async () => {
    mockFetch({
      user_name: 'TestUser',
      xp: 80,
      level: 1,
      xp_for_next_level: 100,
      achievements: { first_timer: true, weekend_warrior: false }
    });

  renderWithProviders(<Profile />, { withRouter: true, withCurrentSchedule: true });

    await waitFor(() => {
      expect(screen.getByTestId('badges-title')).toBeInTheDocument();
    });

    // Earned badge should render a badge wrapper (coming from component tree); we can't assert svg, but grid item exists
    expect(screen.getByText(/first timer/i)).toBeInTheDocument();
    // Unearned badge placeholder exists as a gray circle div
    const placeholders = document.querySelectorAll('div.bg-gray-300.rounded-full');
    expect(placeholders.length).toBeGreaterThan(0);
  });
});
