import React, { useState, useEffect} from 'react';
import { Platform, Button, View, Text, StyleSheet, TouchableOpacity, TextInput, Touchable, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import config from './config';

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const backendURL = config.backendURL;
  const navigation = useNavigation();

  const handleSubmit = async () => {
    try {
      if (!backendURL) {
        alert('Backend URL not set.');
        return;
      }
      const formBody = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      const response = await fetch(`${backendURL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formBody,
      });
      if (!response.ok) {
        const err = await response.text();
        alert('Login failed: ' + err);
        return;
      }
      const data = await response.json();
      // Save token for later use
      if (data.access_token) {
        await AsyncStorage.setItem('token', data.access_token);
      }
      navigation.replace('Home');
    } catch (e) {
      alert('Login error: ' + e);
    }
  };

  const handleSignup = () => {
    navigation.navigate('Signup');
  }

  const handleBackendURLSave = async (url: string) => {
    try {
      await AsyncStorage.setItem('backendURL', url);
    } catch (e) {
      console.log('Failed to save backendURL:', e);
    }
  };

  // Google login handler
  const handleGoogleLogin = async () => {
    try {
      const url = config.backendURL;
      if (!url) {
        alert('Backend URL not set.');
        return;
      }

      // Request the Google OAuth login URL from your backend
      const resp = await fetch(`${url}/login/google`);
      if (!resp.ok) {
        alert('Failed to get Google login URL');
        return;
      }
      const data = await resp.json();
      const googleAuthUrl = data.redirect_url;

      // Use Linking.addEventListener is deprecated and may not work as expected.
      // Instead, use Linking.addEventListener for legacy, but prefer Linking.addListener (Expo SDK 49+).
      // Even better: use Linking.addEventListener for compatibility, but also handle the result from openAuthSessionAsync.

      // Handler for incoming URLs
      const handleUrl = (event) => {
        const url = event.url;
        console.log("Deep link received:", url);
        const tokenMatch = url.match(/[?&]token=([^&#]+)/);
        console.log("Token match result:", tokenMatch);
        if (tokenMatch && tokenMatch[1]) {
          const token = decodeURIComponent(tokenMatch[1]);
          console.log("Extracted token:", token);
          AsyncStorage.setItem('token', token);
          navigation.replace('Home');
        } else {
          console.log("No token found in URL.");
        }
        WebBrowser.dismissBrowser();
      };

      // Add the event listener for deep links
      const subscription = Linking.addEventListener('url', handleUrl);

      // Generate the correct redirect URI for Expo Go
      const redirectTo = Linking.createURL('auth');

      // Open the Google login URL in the browser; backend will redirect to exp:// after login
      // openAuthSessionAsync returns a result object with a url property if the redirect happens in-app
      const result = await WebBrowser.openAuthSessionAsync(googleAuthUrl, redirectTo);

      // If the redirect happened in-app, handle it directly (sometimes the event doesn't fire)
      if (result.type === 'success' && result.url) {
        console.log("WebBrowser result URL:", result.url);
        handleUrl({ url: result.url });
      }

      // Always remove the listener after
      subscription.remove();

    } catch (e) {
      alert('Google login error: ' + e);
    }
  };


  return (
    <KeyboardAvoidingView
       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
       keyboardVerticalOffset={20}
       style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.welcomeText}>Welcome to ProcrastiNATE!</Text>
        
        <View style={styles.loginBox}>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#aaa"
              value={username}
              onChangeText={setUsername}
            />
          </View>


          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={true}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleButton}>
            <Text style={styles.googleButtonText}>Sign In with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress ={handleSignup}>
            <Text style = {styles.noAccount}>
              Don't have an account? <Text style = {styles.signupButtonText}>Sign Up</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
    padding: 20,
  },
  welcomeText: {
    fontSize: 30,
    textAlign: 'center',
    fontWeight: '900',
    color: 'white',
    marginBottom: 40,
  },
  loginBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
    marginBottom: 10,
    boxShadow: '0 0px 16px white',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: 200,
    color: '#333',
    marginBottom: 5,
    marginLeft: -8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
    color: '#333',
    marginLeft: -6,
  },
  loginButton: {
    backgroundColor: '#353738',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
  },
  loginButtonText: {
    fontSize: 20,
    textAlign: 'center',
    fontWeight: '300',
    color: '#fff',
  },
  googleButton: {
    backgroundColor: '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
    marginTop: 10,
    marginBottom: 10,
  },
  googleButtonText: {
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '300',
    color: '#fff',
  },
  signupButton: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
  },
  signupButtonText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '300',
    color: 'black',
  },
  noAccount:{
    marginTop: 10,
    fontSize: 16,
    color: 'black',
    alignItems: 'center',
    textAlign: 'center',
    alignSelf: 'center',
    fontWeight: '300',
  }
});