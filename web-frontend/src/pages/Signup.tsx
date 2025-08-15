import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../config';
import { usePopup } from '../context/PopupContext';

const Signup = () => {
    const navigate = useNavigate();
    const { showPopup } = usePopup();

    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);

    const passwordTooShort = password.length > 0 && password.length < 8;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setAttemptedSubmit(true);
        const trimmedEmail = email.trim();
        const trimmedUsername = username.trim();
        const pwd = password; // keep original case

        if (!trimmedEmail || !trimmedUsername || !pwd || !confirmPassword) {
            showPopup('Please fill in all fields.');
            return;
        }
        if (pwd.length < 8) {
            showPopup('Password should be at least 8 characters.');
            return;
        }
        if (pwd !== confirmPassword) {
            showPopup('Passwords do not match.');
            return;
        }
        try {
            const url = config.backendURL;
            if (!url) { showPopup('Backend URL not set.'); return; }
            const response = await fetch(`${url}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: trimmedUsername,
                    email: trimmedEmail,
                    pwd,
                }),
            });
            if (!response.ok) {
                const err = await response.text();
                showPopup('Registration failed: ' + err);
                return;
            }
            showPopup('Registration successful!');
            navigate('/');
        } catch (e) {
            showPopup('Registration error: ' + e);
        }
    };

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
            <h1 
                className="text-4xl text-teal-800 font-bold text-center mb-8 relative z-10" 
                data-testid="signupTitle"
                style={{ fontFamily: 'Pixelify Sans, monospace' }}
            >
                Join ProcrastiNATE!
            </h1>

            <div className="bg-white w-full max-w-lg p-8 rounded-3xl border-4 border-orange-400 shadow-2xl relative z-10">
                <form onSubmit={handleSubmit} className="w-full" noValidate>
                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-teal-700 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            Email
                        </label>
                        <input
                            data-testid="email-input"
                            type="email"
                            className="w-full border-3 border-orange-300 rounded-xl p-3 text-lg text-teal-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-teal-700 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            Username
                        </label>
                        <input
                            data-testid="username-input"
                            type="text"
                            className="w-full border-3 border-orange-300 rounded-xl p-3 text-lg text-teal-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            placeholder="Choose a username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    {/* Password Field */}
                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-teal-700 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                data-testid="password-input"
                                type={showPassword ? 'text' : 'password'}
                                className={`w-full border-3 rounded-xl p-3 text-lg text-teal-800 focus:outline-none pr-16 ${passwordTooShort && attemptedSubmit ? 'border-red-500 focus:border-red-500 focus:ring-red-300' : 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'}`}
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                                required
                                autoComplete="new-password"
                            />
                            <button
                                data-testid="toggle-password-visibility"
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 text-sm font-bold hover:text-orange-700"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {passwordTooShort && (
                            <p className="text-red-500 text-sm mt-1" data-testid="password-error">Password must be at least 8 characters.</p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-teal-700 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                data-testid="confirm-password-input"
                                type={showConfirmPassword ? 'text' : 'password'}
                                className={`w-full border-3 rounded-xl p-3 text-lg text-teal-800 focus:outline-none pr-16 ${attemptedSubmit && confirmPassword !== password ? 'border-red-500 focus:border-red-500 focus:ring-red-300' : 'border-orange-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200'}`}
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                autoComplete="new-password"
                                minLength={8}
                            />
                            <button
                                data-testid="toggle-confirm-password-visibility"
                                type="button"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-600 text-sm font-bold hover:text-orange-700"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                        {attemptedSubmit && confirmPassword && confirmPassword !== password && (
                            <p className="text-red-500 text-sm mt-1" data-testid="confirm-password-error">Passwords do not match.</p>
                        )}
                    </div>

                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={password.length > 0 && password.length < 8}
                            className="bg-gradient-to-r from-teal-500 to-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-3 px-8 rounded-2xl text-xl font-bold hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            data-testid="signupButton"
                        >
                            Register!
                        </button>
                    </div>
                    <div className="mt-6 text-center text-teal-700 text-sm" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="text-blue-600 hover:text-blue-800 underline font-bold"
                            data-testid="login-link"
                        >
                            Login
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;