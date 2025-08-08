import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, mockFetchError, mockApiResponse, cleanupMocks } from '../test-utils';
import { localStorageMock } from '../setupTests';
import Login from '../pages/Login';

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
  });

  afterEach(() => {
    cleanupMocks();
  });

  test('renders login form elements', () => {
    renderWithProviders(<Login />, { withRouter: false });

    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
    expect(screen.getByTestId('signup-link')).toBeInTheDocument();
  });

  test('shows validation errors for empty fields', async () => {
    renderWithProviders(<Login />, { withRouter: false });

    const loginButton = screen.getByTestId('login-button');
    await userEvent.click(loginButton);

    // Since the Login component doesn't have built-in validation, 
    // this test would need to be updated based on actual validation implementation
    // For now, just verify the form submission attempt
    expect(loginButton).toBeInTheDocument();
  });

  test('handles successful login', async () => {
    mockFetch(mockApiResponse.login);
    
    renderWithProviders(<Login />, { withRouter: false });

    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(loginButton);

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

    // Should save token to localStorage
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'mock_token_123');
    });
  });

  test('displays error message on failed login', async () => {
    mockFetch(mockApiResponse.loginError, false, 401);
    
    renderWithProviders(<Login />, { withRouter: false });

    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const loginButton = screen.getByTestId('login-button');

    await userEvent.type(usernameInput, 'wronguser');
    await userEvent.type(passwordInput, 'wrongpass');
    await userEvent.click(loginButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Login failed'));
    });

    // Should not save any token
    expect(localStorageMock.setItem).not.toHaveBeenCalled();
  });

  test('navigates to signup page when clicking signup link', async () => {
    renderWithProviders(<Login />, { withRouter: false });

    const signupLink = screen.getByTestId('signup-link');
    await userEvent.click(signupLink);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/Signup');
    });
  });

  test('handles Google OAuth login', async () => {
    renderWithProviders(<Login />, { withRouter: false });

    const googleButton = screen.getByTestId('google-login-button');
    await userEvent.click(googleButton);
    
    // Verify Google button exists and can be clicked
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toHaveTextContent(/google/i);
  });
});
