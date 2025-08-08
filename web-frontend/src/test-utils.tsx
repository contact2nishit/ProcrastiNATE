import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter, redirect } from 'react-router-dom';
import { CurrentScheduleProvider } from './context/CurrentScheduleContext';
import { PotentialScheduleProvider } from './context/PotentialScheduleContext';
import { localStorageMock } from './setupTests';

// Custom render function that includes providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  withRouter?: boolean;
  withCurrentSchedule?: boolean;
  withPotentialSchedule?: boolean;
  initialToken?: string | null;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    withRouter = true,
    withCurrentSchedule = false,
    withPotentialSchedule = false,
    initialToken,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  if (initialToken !== undefined) {
    if (initialToken) {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'token') return initialToken;
        return null;
      });
    } else {
      localStorageMock.getItem.mockReturnValue(null);
    }
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    let wrappedChildren = children;

    if (withPotentialSchedule) {
      wrappedChildren = (
        <PotentialScheduleProvider>
          {wrappedChildren}
        </PotentialScheduleProvider>
      );
    }

    if (withCurrentSchedule) {
      wrappedChildren = (
        <CurrentScheduleProvider>
          {wrappedChildren}
        </CurrentScheduleProvider>
      );
    }

    if (withRouter) {
      wrappedChildren = (
        <BrowserRouter>
          {wrappedChildren}
        </BrowserRouter>
      );
    }

    return <>{wrappedChildren}</>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

//Premade mock API responses to use with mock fetch
export const mockApiResponse = {
  schedule: {
    conflicting_meetings: [],
    meetings: [],
    schedules: [{
      assignments: [],
      chores: [],
      conflicting_assignments: [],
      conflicting_chores: [],
      not_enough_time_assignments: [],
      not_enough_time_chores: [],
      total_potential_xp: 100
    }]
  },
  login: {
    access_token: 'mock_token_123',
    token_type: 'bearer'
  },
  register: {
    message: 'Account created Successfully'
  },
  loginError: {
    detail: 'Invalid credentials'
  },
  level: {
    user_name: 'testuser',
    xp: 150,
    level: 2
  },
  googleLogin: {
    redirect_url: 'https://google.com/oauth/v2/stuff?state=9034fkjdfhsdf'
  }
};

export const mockPopup = {
  close: jest.fn(),
  closed: false
};
export const mockWindowOpen = jest.fn().mockReturnValue(mockPopup);
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true
});

export function mockFetch(response: any, ok = true, status = 200) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok,
    status,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
}

export function mockFetchError(errorMessage: string) {
  (global.fetch as jest.Mock).mockRejectedValue(new Error(errorMessage));
}

export function cleanupMocks() {
  jest.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
  (global.fetch as jest.Mock).mockClear();
  (window.alert as jest.Mock).mockClear();
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
