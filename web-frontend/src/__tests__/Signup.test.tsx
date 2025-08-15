import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, mockFetch, mockFetchError, mockApiResponse, cleanupMocks } from '../test-utils';
import Signup from '../pages/Signup';

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Signup Component', () => {
  beforeEach(() => {
    cleanupMocks();
    mockNavigate.mockClear();
  });

  afterEach(() => {
    cleanupMocks();
  });

  test('renders signup form elements', () => {
  renderWithProviders(<Signup />, { withRouter: false, withTheme: true });
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signupButton')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-password-visibility')).toBeInTheDocument();
    expect(screen.getByTestId('toggle-confirm-password-visibility')).toBeInTheDocument();
  });

  test('shows validation error for empty fields', async () => {
  renderWithProviders(<Signup />, { withRouter: false, withTheme: true });
    const signupButton = screen.getByTestId('signupButton');
    userEvent.click(signupButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Please fill in all fields.');
    });
  });

  test('shows validation error for password length', async () => {
  renderWithProviders(<Signup />, { withRouter: false, withTheme: true });
    const emailInput = screen.getByTestId('email-input');
    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const signupButton = screen.getByTestId('signupButton');
    userEvent.type(emailInput, 'test@example.com');
    userEvent.type(usernameInput, 'testuser');
    userEvent.type(passwordInput, '123');
    userEvent.type(confirmPasswordInput, '123');
    // Button is disabled for short passwords; expect inline error message
    expect(signupButton).toBeDisabled();
    // Trigger attempted submit to show error state visually (no alert expected)
    userEvent.click(signupButton);
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent('Password must be at least 8 characters.');
    });
    expect(window.alert).not.toHaveBeenCalled();
  });

  test('shows validation error for password mismatch', async () => {
  renderWithProviders(<Signup />, { withRouter: false, withTheme: true });
    const emailInput = screen.getByTestId('email-input');
    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const signupButton = screen.getByTestId('signupButton');
    userEvent.type(emailInput, 'test@example.com');
    userEvent.type(usernameInput, 'testuser');
    userEvent.type(passwordInput, 'password123');
    userEvent.type(confirmPasswordInput, 'differentpassword');
    userEvent.click(signupButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Passwords do not match.');
    });
  });

  test('handles successful signup', async () => {
    mockFetch(mockApiResponse.register);
  renderWithProviders(<Signup />, { withRouter: false, withTheme: true });
    const emailInput = screen.getByTestId('email-input');
    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const signupButton = screen.getByTestId('signupButton');
    userEvent.type(emailInput, 'test@example.com');
    userEvent.type(usernameInput, 'testuser');
    userEvent.type(passwordInput, 'password123');
    userEvent.type(confirmPasswordInput, 'password123');
    userEvent.click(signupButton);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            username: 'testuser',
            email: 'test@example.com',
            pwd: 'password123',
          }),
        })
      );
    });
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Registration successful!');
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('handles signup error', async () => {
    mockFetch({ error: 'Username already exists' }, false, 400);
  renderWithProviders(<Signup />, { withRouter: false, withTheme: true });
    const emailInput = screen.getByTestId('email-input');
    const usernameInput = screen.getByTestId('username-input');
    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirm-password-input');
    const signupButton = screen.getByTestId('signupButton');
    userEvent.type(emailInput, 'test@example.com');
    userEvent.type(usernameInput, 'existinguser');
    userEvent.type(passwordInput, 'password123');
    userEvent.type(confirmPasswordInput, 'password123');
    userEvent.click(signupButton);
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Registration failed'));
    });
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('toggles password visibility', async () => {
  renderWithProviders(<Signup />, { withRouter: false, withTheme: true });
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    const toggleButton = screen.getByTestId('toggle-password-visibility');
    expect(passwordInput.type).toBe('password');
    userEvent.click(toggleButton);
    expect(passwordInput.type).toBe('text');
    userEvent.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  test('toggles confirm password visibility', async () => {
    renderWithProviders(<Signup />, { withRouter: false });
    const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement;
    const toggleButton = screen.getByTestId('toggle-confirm-password-visibility');
    expect(confirmPasswordInput.type).toBe('password');
    userEvent.click(toggleButton);
    expect(confirmPasswordInput.type).toBe('text');
    userEvent.click(toggleButton);
    expect(confirmPasswordInput.type).toBe('password');
  });

  test('updates input values correctly', async () => {
    renderWithProviders(<Signup />, { withRouter: false });
    const emailInput = screen.getByTestId('email-input') as HTMLInputElement;
    const usernameInput = screen.getByTestId('username-input') as HTMLInputElement;
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId('confirm-password-input') as HTMLInputElement;
    userEvent.type(emailInput, 'test@example.com');
    userEvent.type(usernameInput, 'testuser');
    userEvent.type(passwordInput, 'password123');
    userEvent.type(confirmPasswordInput, 'password123');
    expect(emailInput.value).toBe('test@example.com');
    expect(usernameInput.value).toBe('testuser');
    expect(passwordInput.value).toBe('password123');
    expect(confirmPasswordInput.value).toBe('password123');
  });
});
