import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import Signup from '../../../app/Signup';
import { useRouter } from 'expo-router';

const pushMock = jest.fn();

// Mock useRouter
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe('Signup Screen', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: pushMock,
    });
    global.alert = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('submits the form and navigates to Login on successful signup', async () => {
    const { getByPlaceholderText, getByText } = render(<Signup />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Username'), 'testuser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/register'), expect.any(Object));
      expect(global.alert).toHaveBeenCalledWith('Registration successful!');
      expect(pushMock).toHaveBeenCalledWith('index');
    });
  });

  it('alerts if backendURL is not set', async () => {
    (global.fetch as jest.Mock).mockImplementationOnce(() => Promise.reject('Backend URL not set.'));

    const { getByText } = render(<Signup />);

    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Backend URL not set.');
    });
  });

  it('alerts on signup failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      text: () => Promise.resolve('Username already exists'),
    });

    const { getByPlaceholderText, getByText } = render(<Signup />);

    fireEvent.changeText(getByPlaceholderText('Email'), 'test@example.com');
    fireEvent.changeText(getByPlaceholderText('Username'), 'existinguser');
    fireEvent.changeText(getByPlaceholderText('Password'), 'password123');

    fireEvent.press(getByText('Sign Up'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Registration failed: Username already exists');
    });
  });
});
