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
        <div className="min-h-screen bg-black flex flex-col">
            <h1 
                className="text-4xl text-white font-light text-center mt-8" 
                data-testid="signupTitle"
            >
                Sign Up
            </h1>

            <div className="bg-white mx-auto w-[90%] max-w-md p-5 mt-12 rounded-3xl flex flex-col items-center">
                <form onSubmit={handleSubmit} className="w-full">
                    <div className="w-[90%] mx-auto mb-6">
                        <label className="block text-base font-extralight text-gray-800 mb-1 -ml-2">
                            Email
                        </label>
                        <input
                            data-testid="email-input"
                            type="email"
                            className="w-full border border-gray-300 rounded-md p-2.5 text-base text-gray-800 -ml-2.5 placeholder-gray-400"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="w-[90%] mx-auto mb-6">
                        <label className="block text-base font-extralight text-gray-800 mb-1 -ml-2">
                            Username
                        </label>
                        <input
                            data-testid="username-input"
                            type="text"
                            className="w-full border border-gray-300 rounded-md p-2.5 text-base text-gray-800 -ml-2.5 placeholder-gray-400"
                            placeholder="Username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="w-[90%] mx-auto mb-6">
                        <label className="block text-base font-extralight text-gray-800 mb-1 -ml-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                data-testid="password-input"
                                type={showPassword ? "text" : "password"}
                                className="w-full border border-gray-300 rounded-md p-2.5 text-base text-gray-800 -ml-2.5 placeholder-gray-400 pr-16"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                data-testid="toggle-password-visibility"
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="w-[90%] mx-auto mb-6">
                        <label className="block text-base font-extralight text-gray-800 mb-1 -ml-2">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                data-testid="confirm-password-input"
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full border border-gray-300 rounded-md p-2.5 text-base text-gray-800 -ml-2.5 placeholder-gray-400 pr-16"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                data-testid="toggle-confirm-password-visibility"
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="bg-black text-white py-3 px-8 rounded-lg shadow-lg text-base font-light"
                        data-testid="signupButton"
                    >
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Signup;