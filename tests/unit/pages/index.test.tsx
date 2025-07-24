import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from '../app/index';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const pushMock = jest.fn();

// Mock useRouter
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ access_token: 'fake_token' }),
  })
) as jest.Mock;

describe('Login Screen', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits the form and navigates to Home on successful login', async () => {
    const { getByPlaceholderText, getByText } = render(<App />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'Sai');
    fireEvent.changeText(getByPlaceholderText('Password'), 'sai');

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/login'), expect.any(Object));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'fake_token');
      expect(pushMock).toHaveBeenCalledWith('/requiresCurrentSchedule/Home');
    });
  });

  it('alerts if backendURL is not set', async () => {
    const alertMock = jest.spyOn(global, 'alert').mockImplementation(() => {});
    const { getByText } = render(<App />);

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Backend URL not set.');
    });

    alertMock.mockRestore();
  });

  it('navigates to the Signup page when Sign Up is pressed', async () => {
    const { getByText } = render(<App />);

    fireEvent.press(getByText("Don't have an account? Sign Up"));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/Signup');
    });
  });

  it('alerts on login failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('Invalid credentials'),
    });

    const { getByPlaceholderText, getByText } = render(<App />);

    fireEvent.changeText(getByPlaceholderText('Username'), 'Sai');
    fireEvent.changeText(getByPlaceholderText('Password'), 'wrongpassword');

    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Login failed: Invalid credentials');
    });
  });
});