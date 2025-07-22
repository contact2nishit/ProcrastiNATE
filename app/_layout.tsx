import React from 'react';
import {Stack} from 'expo-router';
import { MeetingProvider } from './MeetingContext';
import { AssignmentProvider } from './AssignmentContext';


export default function Layout(){
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: {backgroundColor: '#fff'},
            }}
        />
    )
}