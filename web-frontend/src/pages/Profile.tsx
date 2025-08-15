import React, { useMemo } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { LinearProgress, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useCurrentScheduleContext } from '../context/CurrentScheduleContext';

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
    const earnedMap = levelInfo?.achievements || {};
    const handleBack = () => {
        localStorage.removeItem("token");
        navigate('/');
    };
    const earnedKeys = useMemo(() => new Set(Object.keys(earnedMap).filter(k => earnedMap[k])), [earnedMap]);
    return (
        <ThemeProvider theme={theme}>
            <div className="min-h-screen flex flex-col" style={{
                fontFamily: 'Pixelify Sans, monospace'
            }}>
                {/* Top bar with back button */}
                <div className="flex justify-between items-center mt-5 mx-4">
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
                    <button onClick={handleBack}  className="bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-2xl w-12 h-12 flex items-center justify-center shadow-lg hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200">
                            Log out
                    </button>
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
            </div>
        </ThemeProvider>
    );
};

export default Profile;
