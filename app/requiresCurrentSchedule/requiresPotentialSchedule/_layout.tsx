import React from 'react';
import {Stack} from 'expo-router';
import { PotentialScheduleProvider } from './PotentialScheduleContext';

export default function Layout(){
    return (
        <PotentialScheduleProvider>
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: {backgroundColor: '#fff'},
                }}
            />
        </PotentialScheduleProvider>
        
    )
}