import React from 'react';
import { useTimeOfDayTheme } from '../context/TimeOfDayThemeContext';

interface LoadingScreenProps {
    message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message }) => {
    const { phase } = useTimeOfDayTheme();

    // List of hints/trivia messages
    const hints = [
        "You can import your meetings from google calendar! ",
        "Have you checked out the calendar view? It's pretty awesome",
        "The Earlier you finish an assignment before its due date, the more XP you get!",
        "Checkout your profile to see the badges you have earnt so far!",
        "Nate loves to study! You could tell? No way!"
    ];

    // Get random hint or use provided message
    const displayMessage = message || hints[Math.floor(Math.random() * hints.length)];

    const getTextStyle = () => {
        if (phase === 'day') return 'text-white';
        if (phase === 'transition') return 'text-blue-100';
        if (phase === 'night') return 'text-yellow-100';
        return 'text-white';
    };

    const getDotStyle = () => {
        if (phase === 'day') return 'bg-white';
        if (phase === 'transition') return 'bg-blue-100';
        if (phase === 'night') return 'bg-yellow-100';
        return 'bg-white';
    };

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center relative overflow-hidden">
            <div className="flex flex-col items-center justify-center z-10">
                <img 
                    src={require('../assets/Nate_walking.gif')} 
                    alt="Nate walking" 
                    className="w-32 h-32 md:w-48 md:h-48 mb-6"
                    style={{ 
                        mixBlendMode: 'screen',
                        filter: 'contrast(1.3) saturate(1.2)',
                        opacity: 0.9
                    }}
                />
                <h2 
                    className={`text-lg md:text-xl font-bold ${getTextStyle()} text-center max-w-md px-4`}
                    style={{ 
                        fontFamily: 'Pixelify Sans, monospace',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
                    }}
                >
                    {displayMessage}
                </h2>
                <div className="mt-4 flex space-x-1">
                    <div className={`w-2 h-2 ${getDotStyle()} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                    <div className={`w-2 h-2 ${getDotStyle()} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                    <div className={`w-2 h-2 ${getDotStyle()} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );
};

export default LoadingScreen;
