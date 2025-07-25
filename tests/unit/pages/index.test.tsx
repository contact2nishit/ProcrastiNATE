import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Index from '../../../app/index';
import config from '../../../app/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../app/config', () => ({
  backendURL: 'http://mock-backend-url.com',
}));

describe('Index Component', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({ push: mockPush });
    jest.clearAllMocks();
  });

  it('navigates to the signup page when the signup link is pressed', () => {
    const { getByTestId } = render(<Index />);

    const signupLink = getByTestId('signupLink');
    fireEvent.press(signupLink);

    expect(mockPush).toHaveBeenCalledWith('/Signup');
  });

  it('calls handleSubmit when the Sign In button is pressed and stores token in AsyncStorage', async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'mockToken' }),
        headers: new Headers(),
        redirected: false,
        status: 200,
        statusText: 'OK',
        type: 'default' as ResponseType,
        url: 'http://mock-backend-url.com/login',
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        text: jest.fn(),
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        bytes: jest.fn(),
      })
    );
    global.fetch = mockFetch;

    const { getByText } = render(<Index />);

    const signInButton = getByText('Sign In');
    fireEvent.press(signInButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://mock-backend-url.com/login',
        expect.any(Object)
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'mockToken');
      expect(mockPush).toHaveBeenCalledWith('/requiresCurrentSchedule/Home');
    });
  });

  it('calls handleGoogleLogin when the Sign In with Google button is pressed', async () => {
    const mockFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ redirect_url: 'http://mock-google-login-url.com' }),
        headers: new Headers(),
        redirected: false,
        status: 200,
        statusText: 'OK',
        type: 'default' as ResponseType,
        url: 'http://mock-backend-url.com/login/google',
        clone: jest.fn(),
        body: null,
        bodyUsed: false,
        text: jest.fn(),
        arrayBuffer: jest.fn(),
        blob: jest.fn(),
        formData: jest.fn(),
        bytes: jest.fn(),
      })
    );
    global.fetch = mockFetch;

    const { getByText } = render(<Index />);

    const googleButton = getByText('Sign In with Google');
    fireEvent.press(googleButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://mock-backend-url.com/login/google'
      );
    });
  });
});