import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import App from './index';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


const navigateMock = jest.fn();
const replaceMock = jest.fn();

// Mock useNavigation
jest.mock('expo-router', () => ({
  useNavigation: jest.fn(),
}));

// Mock AsyncStorage (used for asyncStorage tests)
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
}));

// Mock global fetch (will be used for fetch tests)
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ access_token: 'fake_token' }),
  })
) as jest.Mock;

describe('Login Screen', () => {

  beforeEach(() => {
    // Provide the return value for useNavigation mock
    (useNavigation as jest.Mock).mockReturnValue({
      navigate: navigateMock,
      replace: replaceMock,
    });

    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits the form and navigates to Home on successful login', async () => {
    const { getByPlaceholderText, getByText } = render(<App />);

    // Filling out the form
    fireEvent.changeText(getByPlaceholderText('Username'), 'Sai');
    fireEvent.changeText(getByPlaceholderText('Password'), 'sai');
    fireEvent.changeText(getByPlaceholderText('http://localhost:8000'), 'http://mockapi.com');

    // Press sign-in button next
    fireEvent.press(getByText('Sign In'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://mockapi.com/login', expect.any(Object));
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'fake_token');
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

  it('navigation to sign up screen is done', async () => {
    const { getByText } = render(<App />);

    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('Signup');
    });
  });

});