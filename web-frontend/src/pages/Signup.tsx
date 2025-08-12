import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';

const Signup = () => {
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all fields are filled
        if (!email || !username || !password || !confirmPassword) {
            alert('Please fill in all fields.');
            return;
        }

        if(password.length < 8) {
            alert('Password should be at least 8 characters');
        }
        // Validate passwords match
        if (password !== confirmPassword) {
            alert('Passwords do not match.');
            return;
        }

        try {
            const url = config.backendURL;
            if (!url) {
                alert('Backend URL not set.');
                return;
            }
            const response = await fetch(`${url}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    pwd: password,
                }),
            });
            if (!response.ok) {
                const err = await response.text();
                alert('Registration failed: ' + err);
                return;
            }
            alert('Registration successful!');
            navigate('/');
        } catch (e) {
            alert('Registration error: ' + e);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-purple-100 flex flex-col justify-center items-center p-5" style={{ fontFamily: 'Comic Neue, cursive' }}>
            <h1 
                className="text-4xl text-purple-800 font-bold text-center mb-8" 
                data-testid="signupTitle"
                style={{ fontFamily: 'Comic Neue, cursive' }}
            >
                Join ProcrastiNATE! 🎉
            </h1>

            <div className="bg-white w-full max-w-lg p-8 rounded-3xl border-4 border-green-400 shadow-2xl">
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-green-700 mb-2" style={{ fontFamily: 'Comic Neue, cursive' }}>
                            Email
                        </label>
                        <input
                            data-testid="email-input"
                            type="email"
                            className="w-full border-3 border-green-300 rounded-xl p-3 text-lg text-green-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            style={{ fontFamily: 'Comic Neue, cursive' }}
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-green-700 mb-2" style={{ fontFamily: 'Comic Neue, cursive' }}>
                            Username
                        </label>
                        <input
                            data-testid="username-input"
                            type="text"
                            className="w-full border-3 border-green-300 rounded-xl p-3 text-lg text-green-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            style={{ fontFamily: 'Comic Neue, cursive' }}
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-green-700 mb-2" style={{ fontFamily: 'Comic Neue, cursive' }}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                data-testid="password-input"
                                type={showPassword ? "text" : "password"}
                                className="w-full border-3 border-green-300 rounded-xl p-3 text-lg text-green-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 pr-16"
                                style={{ fontFamily: 'Comic Neue, cursive' }}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                data-testid="toggle-password-visibility"
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 text-sm font-bold hover:text-green-700"
                                style={{ fontFamily: 'Comic Neue, cursive' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-green-700 mb-2" style={{ fontFamily: 'Comic Neue, cursive' }}>
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                data-testid="confirm-password-input"
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full border-3 border-green-300 rounded-xl p-3 text-lg text-green-800 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 pr-16"
                                style={{ fontFamily: 'Comic Neue, cursive' }}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                data-testid="toggle-confirm-password-visibility"
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600 text-sm font-bold hover:text-green-700"
                                style={{ fontFamily: 'Comic Neue, cursive' }}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-8 rounded-2xl text-xl font-bold hover:from-green-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                            style={{ fontFamily: 'Comic Neue, cursive' }}
                            data-testid="signupButton"
                        >
                            Register! 🌟
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;