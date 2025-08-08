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
        navigate('/Signup');
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
        <div className="min-h-screen bg-black flex flex-col justify-center items-center p-5">
            <h1 className="text-3xl text-center font-extrabold text-white mb-10">Welcome to ProcrastiNATE!</h1>
            <form className="bg-white p-6 rounded-lg w-full max-w-md flex flex-col items-center mb-4 shadow-lg" onSubmit={handleSubmit}>
                <div className="w-full mb-6 flex flex-col">
                    <label className="text-base font-medium text-gray-700 mb-2">Username</label>
                    <input
                        data-testid="username-input"
                        className="border border-gray-300 rounded px-3 py-2 text-base text-gray-800 focus:outline-none"
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                    />
                </div>
                <div className="w-full mb-6 flex flex-col">
                    <label className="text-base font-medium text-gray-700 mb-2">Password</label>
                    <input
                        data-testid="password-input"
                        className="border border-gray-300 rounded px-3 py-2 text-base text-gray-800 focus:outline-none"
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
                <button data-testid="login-button" type="submit" className="bg-gray-800 text-white py-3 px-8 rounded-lg text-lg font-medium mb-3 hover:bg-gray-900 transition">Sign In</button>
                <button data-testid="google-login-button" type="button" onClick={handleGoogleLogin} className="bg-blue-600 text-white py-3 px-8 rounded-lg text-base font-medium mb-3 hover:bg-blue-700 transition">
                    Sign In with Google
                </button>
                <div className="mt-2 text-base text-black text-center font-medium">
                    Don't have an account?{' '}
                    <span data-testid="signup-link" className="text-black font-medium underline cursor-pointer" onClick={handleSignup}>Sign Up</span>
                </div>
            </form>
        </div>
    );
};

export default Login;