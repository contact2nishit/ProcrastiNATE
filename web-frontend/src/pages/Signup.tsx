/*import React, {useState} from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from './config';
import { useRouter } from 'expo-router';

const Signup = () => {

    const router = useRouter();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');


    const handleSubmit = async () => {
        try {
            const url = config.backendURL;
            if (!url) {
                alert('Backend URL not set.');
                return;
            }
            const response = await fetch(`${url}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    pwd: password,
                }),
            });
            if (!response.ok) {
                const err = await response.text();
                alert('Registration failed: ' + err);
                return;
            }
            alert('Registration successful!');
            router.push('/index');
        } catch (e) {
            alert('Registration error: ' + e);
        }
    }

    return (
        <SafeAreaView style = {styles.background}>
            <Text style = {styles.signup} testID="signupTitle">
                Sign Up
            </Text>

            <View style = {styles.signupBox}>

                <View style = {styles.inputContainer}>
                    <Text style={styles.label}>Email</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#aaa"
                        value={email}
                        onChangeText={setEmail}
                        />
                </View>

                <View style = {styles.inputContainer}>
                    <Text style={styles.label}>Username</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="#aaa"
                        value={username}
                        onChangeText={setUsername}
                        />
                </View>


                <View style = {styles.inputContainer}>
                    <Text style={styles.label}>Password</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        />
                </View>


                <TouchableOpacity style = {styles.signupButton} onPress = {handleSubmit} testID="signupButton">
                    <Text style = {styles.signupButtonText}>
                        Register
                    </Text>
                </TouchableOpacity>


            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    background:{
        flex:1,
        backgroundColor: 'black',
    },
    signup:{
        fontSize: 38,
        alignSelf: 'center',
        color: 'white',
        fontWeight: 300,
        marginTop: 30,
    },

    signupBox:{
        backgroundColor: 'white',
        alignSelf: 'center',
        alignItems: 'center',
        width: '90%',
        padding: 20,
        marginTop: 50,
        borderRadius: 20,
    },

    inputContainer:{
        width: '90%',
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
    marginLeft: -10,
  },
  signupButton: {
    backgroundColor: 'black',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 3,
  },
  signupButtonText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '300',
    color: 'white',
  },

})

export default Signup;*/