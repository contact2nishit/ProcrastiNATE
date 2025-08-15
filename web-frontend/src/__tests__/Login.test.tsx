import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, mockFetchError, mockApiResponse, cleanupMocks, mockWindowOpen } from '../test-utils';
import { localStorageMock } from '../setupTests';
import Login from '../pages/Login';
import { wait } from '@testing-library/user-event/dist/utils';
import { Experimental_CssVarsProvider } from '@mui/material';

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to, ...props }: any) => <a href={to} {...props}>{children}</a>
}));

describe('Login Component', () => {
  beforeEach(() => {
    cleanupMocks();
    mockNavigate.mockClear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    cleanupMocks();
  });

  test('renders login form elements', () => {
  renderWithProviders(<Login />, { withRouter: false, withTheme: true });
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(screen.getByTestId('signup-link')).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    mockFetch(mockApiResponse.login);
  renderWithProviders(<Login />, { withRouter: false, withTheme: true });
    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    userEvent.type(usernameInput, 'testuser');
    userEvent.type(passwordInput, 'password123');
    userEvent.click(loginButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
          body: expect.stringContaining('username=testuser'),
        })
      );
    });
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock_token_123');
    });
  });

  test('displays error message on failed login', async () => {
    mockFetch(mockApiResponse.loginError, false, 401);
  renderWithProviders(<Login />, { withRouter: false, withTheme: true });
    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');
    userEvent.type(usernameInput, 'wronguser');
    userEvent.type(passwordInput, 'wrongpass');
    userEvent.click(loginButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Login failed'));
    });
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  test('navigates to signup page when clicking signup link', async () => {
    renderWithProviders(<Login />, { withRouter: false });
    const signupLink = screen.getByTestId('signup-link');
    userEvent.click(signupLink);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/signup');
    });
  });

  test('handles Google OAuth login', async () => {
    mockFetch(mockApiResponse.googleLogin);
  renderWithProviders(<Login />, { withRouter: false, withTheme: true });
    const googleButton = screen.getByTestId('google-login-button');
    userEvent.click(googleButton);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/login/google?platform=web'),
        expect.objectContaining({
          credentials: 'include'
        })
      );
    });
    await waitFor(() => {
      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://google.com/oauth/v2/stuff?state=9034fkjdfhsdf',
        'googleOAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );
    });
  });
});
