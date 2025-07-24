import React from 'react';
import {Stack} from 'expo-router';
import { CurrentScheduleProvider } from './CurrentScheduleContext';

export default function Layout(){
    return (
        <CurrentScheduleProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {backgroundColor: '#fff'},
                }}
            />
        </CurrentScheduleProvider>
    )
}