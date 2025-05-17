import React, {useState} from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Signup() {

    const [first, setFirst] = useState('');
    const [second, setSecond] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    return (
        <SafeAreaView style = {styles.background}>
            <Text style = {styles.signup}>
                Sign Up
            </Text>

            <View style = {styles.sigupBox}>

                <View style = {styles.firstNameContainer}>
                    <Text style={styles.label}>First Name</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="First Name"
                        placeholderTextColor="#aaa"
                        value={first}
                        onChangeText={setFirst}
                        />
                </View>

                <View style = {styles.secondNameContainer}>
                    <Text style={styles.label}>Last Name</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Last Name"
                        placeholderTextColor="#aaa"
                        value={second}
                        onChangeText={setSecond}
                        />
                </View>


                <View style = {styles.usernameContainer}>
                    <Text style={styles.label}>Username</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Username"
                        placeholderTextColor="#aaa"
                        value={username}
                        onChangeText={setUsername}
                        />
                </View>


                <View style = {styles.passwordContainer}>
                    <Text style={styles.label}>Password</Text>
                        <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#aaa"
                        value={password}
                        onChangeText={setPassword}
                        />
                </View>


                <TouchableOpacity onPress = {handleSubmit}>
                    <Text style = {styles.signupButton}>
                        Sign Up
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
    }

})