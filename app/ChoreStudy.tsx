import React, {useState} from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from 'expo-router';
import {StyleSheet} from 'react-native';


export default function Meeting() 
{
    const navigation = useNavigation();

    const handleMeeting = () =>{
        navigation.replace("Home");
    }



    return (
        <SafeAreaView>
            <Text style = {styles.header}>
                Set Up a Chore/Study Session
            </Text>
            <TouchableOpacity onPress={handleMeeting} style = {styles.addButton}>
                <Text style = {styles.eventText}>Add Event</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    header: {
        fontSize: 30,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 50,
    },

    addButton:{
        backgroundColor: 'black',
        width: "60%",
        alignContent: 'center',
        alignSelf: 'center',
        marginTop:500,
        borderRadius:10,
    },

    eventText:{
        color:'white',
        fontSize:17,
        alignSelf:'center',
        paddingTop:10,
        paddingBottom:10,
    }

    
});
