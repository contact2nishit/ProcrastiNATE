import React, { useMemo, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LinearProgress, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentScheduleContext } from '../context/CurrentScheduleContext';
import { useTimeOfDayTheme, TimeOfDayPhase } from '../context/TimeOfDayThemeContext';

const theme = createTheme({
    palette: { primary: { main: '#2563eb' }, secondary: { main: '#16a34a' } },
    components: {
        MuiLinearProgress: {
            styleOverrides: {
                root: { height: 12, borderRadius: 6, backgroundColor: '#e5e7eb' },
                bar: { borderRadius: 6, backgroundColor: '#2563eb' },
            },
        },
    },
});

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { levelInfo, achievementKeys, getBadgeComponent } = useCurrentScheduleContext();
    const { phase, mode, setMode, setManualPhase } = useTimeOfDayTheme();
    const earnedMap = levelInfo?.achievements || {};
    const handleBack = () => {
        localStorage.removeItem("token");
        navigate('/');
    };
    const earnedKeys = useMemo(() => new Set(Object.keys(earnedMap).filter(k => earnedMap[k])), [earnedMap]);

    // Slide-from-top mount animation state
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        // Use rAF to ensure class application happens after first paint to trigger transition
        requestAnimationFrame(() => setMounted(true));
    }, []);

    const handleThemeSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'auto') {
            setMode('auto');
        } else {
            setMode('manual');
            setManualPhase(val as TimeOfDayPhase);
        }
    };

    return (
        <ThemeProvider theme={theme}>
            <div
                className={`min-h-screen flex flex-col relative transform transition-transform duration-500 ease-out ${mounted ? 'translate-y-0' : '-translate-y-full'}`}
                style={{
                    fontFamily: 'Pixelify Sans, monospace',
                    willChange: 'transform'
                }}
            >
                {/* Top bar with back button */}
                <div className="flex justify-start items-center mt-5 mx-4">
                    <button
                        onClick={() => navigate('/requiresCurrentSchedule/Home')}
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200"
                        data-testid="back-home-button"
                        style={{ fontFamily: 'Pixelify Sans, monospace' }}
                    >
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 3.172l5.657 5.657a1 1 0 01-1.414 1.414L11 7.414V17a1 1 0 11-2 0V7.414L5.757 10.243A1 1 0 014.343 8.83L10 3.172z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
                {/* Theme selector (top-right) */}
                <div className="absolute top-5 right-4 flex flex-col items-center gap-1">
                    <label className="text-xl font-extrabold text-white tracking-wide text-center">
                        Choose Theme
                    </label>
                    <select
                        value={mode === 'auto' ? 'auto' : phase}
                        onChange={handleThemeSelect}
                        className="border-2 border-orange-400 rounded-xl px-4 py-2 text-base bg-white focus:outline-none focus:ring-2 focus:ring-orange-300 shadow-md"
                    >
                        <option value="auto">Auto (Time-Based)</option>
                        <option value="day">Day</option>
                        <option value="transition">Transition</option>
                        <option value="night">Night</option>
                    </select>
                </div>
                <div className="text-center mt-5">
                    <h1 className="text-2xl font-bold text-teal-800" data-testid="profile-title">Your Profile</h1>
                    <p className="text-lg text-teal-800 mt-1">{levelInfo ? `Welcome, ${levelInfo.username}!` : 'Welcome!'}</p>
                </div>
                {levelInfo && (
                    <div className="text-center mt-2">
                        <p className="text-lg font-bold text-teal-800">Level: {levelInfo.level}</p>
                        <p className="text-base mt-1 text-teal-700">XP: {levelInfo.xp} / {levelInfo.xpForNextLevel}</p>
                        <Box sx={{ width: '250px', margin: '8px auto' }}>
                            <LinearProgress variant="determinate" value={Math.min((levelInfo.xp / levelInfo.xpForNextLevel) * 100, 100)} />
                        </Box>
                        <p className="text-sm mt-1 text-teal-700">{levelInfo.xpForNextLevel - levelInfo.xp} XP to next level</p>
                    </div>
                )}
                <h2 className="text-2xl font-bold text-center mt-6 text-teal-800" data-testid="badges-title">Badges</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4">
                    {achievementKeys.map((key) => {
                        const earned = earnedKeys.has(key);
                        return (
                            <div key={key} className="bg-white border-4 border-orange-400 rounded-3xl shadow-lg p-3 flex flex-col items-center">
                                <div className="w-28 h-28 flex items-center justify-center mb-2">
                                    {earned ? (
                                        <div className="scale-[0.6] origin-center">{getBadgeComponent(key)}</div>
                                    ) : (
                                        <div className="w-24 h-24 rounded-full bg-gray-300" />
                                    )}
                                </div>
                                <div className="text-center text-teal-800 font-bold text-sm capitalize">
                                    {key.replace(/_/g, ' ')}
                                </div>
                            </div>
                        )
                    })}
                </div>
                {/* Fixed bottom-right logout button */}
                <button
                    onClick={handleBack}
                    className="fixed bottom-4 right-4 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-2xl px-5 py-3 whitespace-nowrap shadow-lg hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200"
                >
                    Log out
                </button>
            </div>
        </ThemeProvider>
    );
};

export default Profile;
