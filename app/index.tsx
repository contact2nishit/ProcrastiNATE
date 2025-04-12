import React, { useState } from 'react';
import { Button, View, Text, StyleSheet, TouchableOpacity, TextInput, Touchable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    // Handle form submission here
    console.log('Username:', username);
    console.log('Password:', password);
    // You can send the data to a server or perform other actions
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.welcomeText}>Welcome to ProcrastiNATE!</Text>

      <View style={styles.loginBox}>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
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

        <TouchableOpacity onPress ={() => console.log('Forgot Password Pressed')}>
          <Text style = {styles.noAccount}>
            Don't have an account? <Text style = {styles.signupButtonText}>Sign Up</Text>
          </Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
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