import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { usePopup } from '../context/PopupContext';
import LoadingScreen from '../components/LoadingScreen';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const backendURL = config.backendURL;
    const { showPopup } = usePopup();
    const navigate = useNavigate();

    const showLoadingAndNavigate = () => {
        setIsLoading(true);
        setTimeout(() => {
            navigate('/requiresCurrentSchedule/Home');
        }, 4000); // 4 seconds
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if (!backendURL) {
                showPopup('Backend URL not set.');
                return;
            }
            const formBody = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            const response = await fetch(`${backendURL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formBody,
            });
            if (!response.ok) {
                const err = await response.text();
                showPopup('Login failed: ' + err);
                return;
            }
            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
            }
            showLoadingAndNavigate();
        } catch (e) {
            showPopup('Login error: ' + e);
        }
    };

    const handleSignup = () => {
        navigate('/signup');
    };

    const handleGoogleLogin = async () => {
        try {
            if (!backendURL) {
                showPopup('Backend URL not set.');
                return;
            }
            const url = new URL(`${backendURL}/login/google`);
            url.searchParams.set("platform", "web");
            const resp = await fetch(url.toString(), { credentials: 'include' });
            if (!resp.ok) {
                showPopup('Failed to get Google login URL');
                return;
            }
            const data = await resp.json();
            const googleAuthUrl = data.redirect_url;
            const popup = window.open(googleAuthUrl, 'googleOAuth', 'width=500,height=600,scrollbars=yes,resizable=yes');
            const messageHandler = (event: MessageEvent) => {
                if (event.origin !== new URL(backendURL).origin) return;
                if (event.data.type === 'OAUTH_SUCCESS' && event.data.token) {
                    localStorage.setItem('token', event.data.token);
                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                    showLoadingAndNavigate();
                } else if (event.data.type === 'OAUTH_ERROR') {
                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                    showPopup('Google login failed: ' + (event.data.message || 'Unknown error'));
                }
            };
            window.addEventListener('message', messageHandler);
            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    showPopup('Google login was cancelled');
                }
            }, 1000);
            setTimeout(() => {
                if (popup && !popup.closed) {
                    popup.close();
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    showPopup('Google login timed out');
                }
            }, 5 * 60 * 1000);
        } catch (e) {
            showPopup('Google login error: ' + e);
        }
    };

    // Show loading screen when logging in
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-5 relative overflow-hidden" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
            <h1 className="text-4xl text-center font-bold text-teal-800 mb-10 relative z-10" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Welcome to ProcrastiNATE!</h1>
            <div className="bg-white p-8 rounded-3xl w-full max-w-md border-4 border-orange-400 shadow-2xl relative z-10">
                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                    <div className="w-full mb-6 flex flex-col">
                        <label className="text-lg font-bold text-teal-700 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Username</label>
                        <input
                            data-testid="username-input"
                            className="border-3 border-orange-300 rounded-xl px-4 py-3 text-lg text-teal-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="w-full mb-6 flex flex-col">
                        <label className="text-lg font-bold text-teal-700 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>Password</label>
                        <input
                            data-testid="password-input"
                            className="border-3 border-orange-300 rounded-xl px-4 py-3 text-lg text-teal-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        data-testid="login-button" 
                        type="submit" 
                        className="bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 px-8 rounded-2xl text-xl font-bold mb-4 hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        style={{ fontFamily: 'Pixelify Sans, monospace' }}
                    >
                        Sign In!
                    </button>
                    <button 
                        data-testid="google-login-button" 
                        type="button" 
                        onClick={handleGoogleLogin} 
                        className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-8 rounded-2xl text-xl font-bold mb-4 hover:from-orange-600 hover:to-red-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        style={{ fontFamily: 'Pixelify Sans, monospace' }}
                    >
                        Sign In with Google
                    </button>
                    <div className="mt-2 text-lg text-teal-700 text-center font-bold" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                        Don't have an account?{' '}
                        <span data-testid="signup-link" className="text-orange-600 font-bold underline cursor-pointer hover:text-orange-700" onClick={handleSignup}>Sign Up!</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;