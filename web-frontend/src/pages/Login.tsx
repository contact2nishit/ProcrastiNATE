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
        <div className="min-h-screen bg-gradient-to-b from-sky-200 via-blue-100 to-emerald-200 flex flex-col justify-center items-center p-5 relative overflow-hidden" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
            {/* Floating Clouds - Top Half Only with Pixelated Style */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Large Pixelated Clouds - Top Half Only */}
                <div className="absolute top-16 left-10 w-24 h-16 bg-white opacity-80 animate-pulse" style={{ animationDelay: '0s', animationDuration: '4s', clipPath: 'polygon(0 0, 8% 0, 8% 25%, 25% 25%, 25% 0, 67% 0, 67% 17%, 83% 17%, 83% 42%, 92% 42%, 92% 67%, 75% 67%, 75% 83%, 42% 83%, 42% 100%, 17% 100%, 17% 75%, 0 75%)' }}>
                    <div className="absolute top-2 left-6 w-16 h-12 bg-white" style={{ clipPath: 'polygon(0 0, 13% 0, 13% 33%, 38% 33%, 38% 0, 75% 0, 75% 25%, 88% 25%, 88% 67%, 63% 67%, 63% 100%, 25% 100%, 25% 75%, 0 75%)' }}></div>
                    <div className="absolute top-4 left-2 w-12 h-8 bg-white" style={{ clipPath: 'polygon(0 0, 17% 0, 17% 38%, 33% 38%, 33% 0, 83% 0, 83% 25%, 100% 25%, 100% 75%, 67% 75%, 67% 100%, 17% 100%, 17% 63%, 0 63%)' }}></div>
                </div>
                
                <div className="absolute top-32 right-16 w-20 h-12 bg-white opacity-70 animate-pulse" style={{ animationDelay: '2s', animationDuration: '5s', clipPath: 'polygon(0 0, 15% 0, 15% 33%, 30% 33%, 30% 0, 70% 0, 70% 25%, 85% 25%, 85% 58%, 100% 58%, 100% 83%, 70% 83%, 70% 100%, 30% 100%, 30% 67%, 0 67%)' }}>
                    <div className="absolute top-1 left-4 w-12 h-8 bg-white" style={{ clipPath: 'polygon(0 0, 17% 0, 17% 38%, 42% 38%, 42% 0, 83% 0, 83% 25%, 100% 25%, 100% 75%, 58% 75%, 58% 100%, 17% 100%, 17% 63%, 0 63%)' }}></div>
                </div>
                
                {/* Medium Pixelated Clouds - Top Half Only */}
                <div className="absolute top-48 left-1/3 w-14 h-8 bg-white opacity-60 animate-pulse" style={{ animationDelay: '1.5s', animationDuration: '5.5s', clipPath: 'polygon(0 0, 14% 0, 14% 38%, 29% 38%, 29% 0, 71% 0, 71% 25%, 86% 25%, 86% 63%, 100% 63%, 100% 88%, 71% 88%, 71% 100%, 29% 100%, 29% 75%, 0 75%)' }}>
                    <div className="absolute top-1 left-2 w-8 h-5 bg-white" style={{ clipPath: 'polygon(0 0, 25% 0, 25% 40%, 50% 40%, 50% 0, 100% 0, 100% 60%, 75% 60%, 75% 100%, 25% 100%, 25% 80%, 0 80%)' }}></div>
                </div>
                
                <div className="absolute top-20 right-1/3 w-12 h-6 bg-white opacity-55 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '4.8s', clipPath: 'polygon(0 0, 17% 0, 17% 50%, 33% 50%, 33% 0, 67% 0, 67% 33%, 83% 33%, 83% 67%, 100% 67%, 100% 100%, 67% 100%, 67% 83%, 0 83%)' }}>
                    <div className="absolute top-1 left-1 w-6 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 33% 0, 33% 67%, 67% 67%, 67% 0, 100% 0, 100% 100%, 33% 100%, 33% 67%, 0 67%)' }}></div>
                </div>
                
                {/* Small Pixelated Clouds - Top Half Only */}
                <div className="absolute top-28 left-2/3 w-8 h-4 bg-white opacity-45 animate-pulse" style={{ animationDelay: '1.8s', animationDuration: '6.2s', clipPath: 'polygon(0 0, 25% 0, 25% 50%, 50% 50%, 50% 0, 75% 0, 75% 25%, 100% 25%, 100% 75%, 75% 75%, 75% 100%, 25% 100%, 25% 75%, 0 75%)' }}>
                    <div className="absolute top-0 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>
                
                <div className="absolute top-12 left-1/4 w-10 h-5 bg-white opacity-50 animate-pulse" style={{ animationDelay: '3s', animationDuration: '5.8s', clipPath: 'polygon(0 0, 20% 0, 20% 40%, 40% 40%, 40% 0, 80% 0, 80% 20%, 100% 20%, 100% 80%, 60% 80%, 60% 100%, 20% 100%, 20% 60%, 0 60%)' }}>
                    <div className="absolute top-0 left-1 w-5 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 40% 0, 40% 67%, 60% 67%, 60% 0, 100% 0, 100% 100%, 40% 100%, 40% 67%, 0 67%)' }}></div>
                </div>
                
                <div className="absolute top-40 right-8 w-6 h-3 bg-white opacity-42 animate-pulse" style={{ animationDelay: '0.8s', animationDuration: '4.5s', clipPath: 'polygon(0 0, 33% 0, 33% 67%, 67% 67%, 67% 0, 100% 0, 100% 100%, 67% 100%, 67% 67%, 0 67%)' }}>
                    <div className="absolute top-0 left-1 w-3 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 67% 0, 67% 100%, 100% 100%, 100% 50%, 33% 50%, 33% 0, 0 0)' }}></div>
                </div>
                
                {/* Additional Small Clouds - More Coverage */}
                <div className="absolute top-18 left-1/2 w-7 h-4 bg-white opacity-38 animate-pulse" style={{ animationDelay: '3.2s', animationDuration: '5.3s', clipPath: 'polygon(0 0, 29% 0, 29% 50%, 43% 50%, 43% 0, 86% 0, 86% 25%, 100% 25%, 100% 75%, 71% 75%, 71% 100%, 29% 100%, 29% 75%, 0 75%)' }}>
                    <div className="absolute top-0 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>
                
                <div className="absolute top-56 right-20 w-9 h-5 bg-white opacity-35 animate-pulse" style={{ animationDelay: '4.1s', animationDuration: '6.8s', clipPath: 'polygon(0 0, 22% 0, 22% 40%, 33% 40%, 33% 0, 78% 0, 78% 20%, 89% 20%, 89% 60%, 100% 60%, 100% 80%, 67% 80%, 67% 100%, 22% 100%, 22% 60%, 0 60%)' }}>
                    <div className="absolute top-1 left-1 w-5 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 40% 0, 40% 100%, 80% 100%, 80% 50%, 100% 50%, 100% 0, 60% 0, 60% 50%, 0 50%)' }}></div>
                </div>
                
                <div className="absolute top-8 right-12 w-5 h-3 bg-white opacity-40 animate-pulse" style={{ animationDelay: '2.3s', animationDuration: '4.9s', clipPath: 'polygon(0 0, 40% 0, 40% 67%, 60% 67%, 60% 0, 100% 0, 100% 100%, 60% 100%, 60% 67%, 0 67%)' }}>
                    <div className="absolute top-0 left-1 w-2 h-2 bg-white"></div>
                </div>
                
                <div className="absolute top-22 left-6 w-8 h-4 bg-white opacity-37 animate-pulse" style={{ animationDelay: '1.7s', animationDuration: '5.7s', clipPath: 'polygon(0 0, 25% 0, 25% 50%, 38% 50%, 38% 0, 75% 0, 75% 25%, 88% 25%, 88% 75%, 100% 75%, 100% 100%, 63% 100%, 63% 75%, 0 75%)' }}>
                    <div className="absolute top-1 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>
                
                <div className="absolute top-36 left-3/4 w-6 h-3 bg-white opacity-33 animate-pulse" style={{ animationDelay: '3.8s', animationDuration: '4.4s', clipPath: 'polygon(0 0, 33% 0, 33% 67%, 67% 67%, 67% 0, 100% 0, 100% 100%, 67% 100%, 67% 67%, 0 67%)' }}>
                    <div className="absolute top-0 left-1 w-3 h-2 bg-white"></div>
                </div>
                
                <div className="absolute top-44 left-1/4 w-11 h-6 bg-white opacity-45 animate-pulse" style={{ animationDelay: '0.3s', animationDuration: '6.1s', clipPath: 'polygon(0 0, 18% 0, 18% 33%, 27% 33%, 27% 0, 73% 0, 73% 17%, 82% 17%, 82% 50%, 91% 50%, 91% 67%, 100% 67%, 100% 83%, 73% 83%, 73% 100%, 27% 100%, 27% 67%, 0 67%)' }}>
                    <div className="absolute top-1 left-2 w-6 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 33% 0, 33% 67%, 50% 67%, 50% 0, 83% 0, 83% 33%, 100% 33%, 100% 100%, 67% 100%, 67% 67%, 0 67%)' }}></div>
                </div>
                
                <div className="absolute top-14 left-8 w-4 h-2 bg-white opacity-30 animate-pulse" style={{ animationDelay: '4.5s', animationDuration: '3.8s', clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}>
                    <div className="absolute top-0 left-0 w-2 h-1 bg-white"></div>
                </div>

                {/* Even More Clouds - Dense Coverage */}
                <div className="absolute top-6 left-32 w-12 h-7 bg-white opacity-42 animate-pulse" style={{ animationDelay: '5.2s', animationDuration: '4.1s', clipPath: 'polygon(0 0, 17% 0, 17% 29%, 25% 29%, 25% 0, 75% 0, 75% 14%, 83% 14%, 83% 43%, 92% 43%, 92% 71%, 75% 71%, 75% 86%, 42% 86%, 42% 100%, 17% 100%, 17% 71%, 0 71%)' }}>
                    <div className="absolute top-1 left-3 w-6 h-4 bg-white" style={{ clipPath: 'polygon(0 0, 33% 0, 33% 50%, 50% 50%, 50% 0, 83% 0, 83% 25%, 100% 25%, 100% 75%, 67% 75%, 67% 100%, 17% 100%, 17% 75%, 0 75%)' }}></div>
                </div>

                <div className="absolute top-26 right-4 w-9 h-5 bg-white opacity-39 animate-pulse" style={{ animationDelay: '6.1s', animationDuration: '5.4s', clipPath: 'polygon(0 0, 22% 0, 22% 40%, 33% 40%, 33% 0, 78% 0, 78% 20%, 89% 20%, 89% 60%, 100% 60%, 100% 80%, 67% 80%, 67% 100%, 22% 100%, 22% 60%, 0 60%)' }}>
                    <div className="absolute top-1 left-1 w-5 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 40% 0, 40% 100%, 80% 100%, 80% 50%, 100% 50%, 100% 0, 60% 0, 60% 50%, 0 50%)' }}></div>
                </div>

                <div className="absolute top-52 right-6 w-7 h-4 bg-white opacity-36 animate-pulse" style={{ animationDelay: '2.9s', animationDuration: '6.3s', clipPath: 'polygon(0 0, 29% 0, 29% 50%, 43% 50%, 43% 0, 86% 0, 86% 25%, 100% 25%, 100% 75%, 71% 75%, 71% 100%, 29% 100%, 29% 75%, 0 75%)' }}>
                    <div className="absolute top-0 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>

                <div className="absolute top-16 left-48 w-6 h-3 bg-white opacity-44 animate-pulse" style={{ animationDelay: '1.4s', animationDuration: '5.9s', clipPath: 'polygon(0 0, 33% 0, 33% 67%, 67% 67%, 67% 0, 100% 0, 100% 100%, 67% 100%, 67% 67%, 0 67%)' }}>
                    <div className="absolute top-0 left-1 w-3 h-2 bg-white"></div>
                </div>

                <div className="absolute top-38 left-2 w-10 h-6 bg-white opacity-41 animate-pulse" style={{ animationDelay: '3.7s', animationDuration: '4.6s', clipPath: 'polygon(0 0, 20% 0, 20% 33%, 30% 33%, 30% 0, 70% 0, 70% 17%, 80% 17%, 80% 50%, 90% 50%, 90% 67%, 100% 67%, 100% 83%, 70% 83%, 70% 100%, 30% 100%, 30% 67%, 0 67%)' }}>
                    <div className="absolute top-1 left-2 w-5 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 40% 0, 40% 67%, 60% 67%, 60% 0, 100% 0, 100% 100%, 40% 100%, 40% 67%, 0 67%)' }}></div>
                </div>

                <div className="absolute top-4 right-28 w-8 h-4 bg-white opacity-37 animate-pulse" style={{ animationDelay: '4.8s', animationDuration: '5.2s', clipPath: 'polygon(0 0, 25% 0, 25% 50%, 38% 50%, 38% 0, 75% 0, 75% 25%, 88% 25%, 88% 75%, 100% 75%, 100% 100%, 63% 100%, 63% 75%, 0 75%)' }}>
                    <div className="absolute top-1 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>

                <div className="absolute top-30 left-64 w-5 h-3 bg-white opacity-33 animate-pulse" style={{ animationDelay: '0.7s', animationDuration: '4.3s', clipPath: 'polygon(0 0, 40% 0, 40% 67%, 60% 67%, 60% 0, 100% 0, 100% 100%, 60% 100%, 60% 67%, 0 67%)' }}>
                    <div className="absolute top-0 left-1 w-2 h-2 bg-white"></div>
                </div>

                <div className="absolute top-50 left-12 w-13 h-7 bg-white opacity-46 animate-pulse" style={{ animationDelay: '1.1s', animationDuration: '6.7s', clipPath: 'polygon(0 0, 15% 0, 15% 29%, 23% 29%, 23% 0, 77% 0, 77% 14%, 85% 14%, 85% 43%, 92% 43%, 92% 57%, 100% 57%, 100% 86%, 77% 86%, 77% 100%, 23% 100%, 23% 71%, 0 71%)' }}>
                    <div className="absolute top-1 left-2 w-8 h-4 bg-white" style={{ clipPath: 'polygon(0 0, 25% 0, 25% 50%, 38% 50%, 38% 0, 88% 0, 88% 25%, 100% 25%, 100% 75%, 63% 75%, 63% 100%, 13% 100%, 13% 75%, 0 75%)' }}></div>
                </div>

                <div className="absolute top-10 left-72 w-4 h-2 bg-white opacity-31 animate-pulse" style={{ animationDelay: '5.5s', animationDuration: '3.9s', clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}>
                    <div className="absolute top-0 left-0 w-2 h-1 bg-white"></div>
                </div>

                <div className="absolute top-46 right-32 w-11 h-6 bg-white opacity-48 animate-pulse" style={{ animationDelay: '2.4s', animationDuration: '5.8s', clipPath: 'polygon(0 0, 18% 0, 18% 33%, 27% 33%, 27% 0, 73% 0, 73% 17%, 82% 17%, 82% 50%, 91% 50%, 91% 67%, 100% 67%, 100% 83%, 73% 83%, 73% 100%, 27% 100%, 27% 67%, 0 67%)' }}>
                    <div className="absolute top-1 left-2 w-6 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 33% 0, 33% 67%, 50% 67%, 50% 0, 83% 0, 83% 33%, 100% 33%, 100% 100%, 67% 100%, 67% 67%, 0 67%)' }}></div>
                </div>

                <div className="absolute top-24 left-20 w-6 h-4 bg-white opacity-34 animate-pulse" style={{ animationDelay: '6.8s', animationDuration: '4.4s', clipPath: 'polygon(0 0, 33% 0, 33% 50%, 50% 50%, 50% 0, 83% 0, 83% 25%, 100% 25%, 100% 75%, 67% 75%, 67% 100%, 17% 100%, 17% 75%, 0 75%)' }}>
                    <div className="absolute top-1 left-1 w-3 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 67% 0, 67% 100%, 100% 100%, 100% 50%, 33% 50%, 33% 0, 0 0)' }}></div>
                </div>
            </div>
            
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