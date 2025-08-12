import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const backendURL = config.backendURL;
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            if (!backendURL) {
                alert('Backend URL not set.');
                return;
            }
            const formBody = `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
            const response = await fetch(`${backendURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formBody,
            });
            if (!response.ok) {
                const err = await response.text();
                alert('Login failed: ' + err);
                return;
            }
            const data = await response.json();
            if (data.access_token) {
                localStorage.setItem('token', data.access_token);
            }
            navigate('/requiresCurrentSchedule/Home');
        } catch (e) {
            alert('Login error: ' + e);
        }
    };

    const handleSignup = () => {
        navigate('/signup');
    };

    const handleGoogleLogin = async () => {
        try {
            if (!backendURL) {
                alert('Backend URL not set.');
                return;
            }
            const url = new URL(`${backendURL}/login/google`);
            url.searchParams.set("platform", "web");
            const resp = await fetch(url.toString(), {
                credentials: 'include' // Include cookies in the request
            });
            if (!resp.ok) {
                alert('Failed to get Google login URL');
                return;
            }
            const data = await resp.json();
            const googleAuthUrl = data.redirect_url;
            
            // Open popup window for OAuth
            const popup = window.open(
                googleAuthUrl,
                'googleOAuth',
                'width=500,height=600,scrollbars=yes,resizable=yes'
            );
            
            // Listen for postMessage from popup
            const messageHandler = (event: MessageEvent) => {
                // Only accept messages from our backend domain
                if (event.origin !== new URL(backendURL).origin) return;
                
                if (event.data.type === 'OAUTH_SUCCESS' && event.data.token) {
                    localStorage.setItem('token', event.data.token);
                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                    navigate('/requiresCurrentSchedule/Home');
                } else if (event.data.type === 'OAUTH_ERROR') {
                    popup?.close();
                    window.removeEventListener('message', messageHandler);
                    alert('Google login failed: ' + (event.data.message || 'Unknown error'));
                }
            };
            
            window.addEventListener('message', messageHandler);
            
            // Check if popup closed without success
            const checkClosed = setInterval(() => {
                if (popup?.closed) {
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    alert('Google login was cancelled');
                }
            }, 1000);
            
            // Timeout after 5 minutes
            setTimeout(() => {
                if (popup && !popup.closed) {
                    popup.close();
                    clearInterval(checkClosed);
                    window.removeEventListener('message', messageHandler);
                    alert('Google login timed out');
                }
            }, 5 * 60 * 1000);
            
        } catch (e) {
            alert('Google login error: ' + e);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-50 to-pink-100 flex flex-col justify-center items-center p-5" style={{ fontFamily: 'Comic Neue, cursive' }}>
            <h1 className="text-4xl text-center font-bold text-purple-800 mb-10" style={{ fontFamily: 'Comic Neue, cursive' }}>Welcome to ProcrastiNATE! 🚀</h1>
            <div className="bg-white p-8 rounded-3xl w-full max-w-md border-4 border-purple-400 shadow-2xl">
                <form onSubmit={handleSubmit} className="flex flex-col items-center">
                    <div className="w-full mb-6 flex flex-col">
                        <label className="text-lg font-bold text-purple-700 mb-2" style={{ fontFamily: 'Comic Neue, cursive' }}>Username</label>
                        <input
                            data-testid="username-input"
                            className="border-3 border-purple-300 rounded-xl px-4 py-3 text-lg text-purple-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            style={{ fontFamily: 'Comic Neue, cursive' }}
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                        />
                    </div>
                    <div className="w-full mb-6 flex flex-col">
                        <label className="text-lg font-bold text-purple-700 mb-2" style={{ fontFamily: 'Comic Neue, cursive' }}>Password</label>
                        <input
                            data-testid="password-input"
                            className="border-3 border-purple-300 rounded-xl px-4 py-3 text-lg text-purple-800 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                            style={{ fontFamily: 'Comic Neue, cursive' }}
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                    </div>
                    <button 
                        data-testid="login-button" 
                        type="submit" 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-8 rounded-2xl text-xl font-bold mb-4 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        style={{ fontFamily: 'Comic Neue, cursive' }}
                    >
                        Sign In! 🎯
                    </button>
                    <button 
                        data-testid="google-login-button" 
                        type="button" 
                        onClick={handleGoogleLogin} 
                        className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 px-8 rounded-2xl text-xl font-bold mb-4 hover:from-blue-600 hover:to-cyan-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        style={{ fontFamily: 'Comic Neue, cursive' }}
                    >
                        Sign In with Google 🌟
                    </button>
                    <div className="mt-2 text-lg text-purple-700 text-center font-bold" style={{ fontFamily: 'Comic Neue, cursive' }}>
                        Don't have an account?{' '}
                        <span data-testid="signup-link" className="text-pink-600 font-bold underline cursor-pointer hover:text-pink-700" onClick={handleSignup}>Sign Up! ✨</span>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;