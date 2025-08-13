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
        <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ 
            background: 'linear-gradient(135deg, #87CEEB 0%, #E0F6FF 30%, #B8E6FF 60%, #87CEEB 100%)',
            fontFamily: 'Pixelify Sans, monospace'
        }}>
            {/* Floating Clouds - Top Half Only with Pixelated Style */}
            <div className="absolute inset-0 pointer-events-none">
                {/* Large Pixelated Clouds - Top Half Only */}
                <div className="absolute top-20 right-12 w-26 h-18 bg-white opacity-80 animate-pulse" style={{ animationDelay: '0.5s', animationDuration: '5s', clipPath: 'polygon(0 0, 8% 0, 8% 22%, 23% 22%, 23% 0, 69% 0, 69% 17%, 85% 17%, 85% 44%, 92% 44%, 92% 67%, 77% 67%, 77% 83%, 46% 83%, 46% 100%, 15% 100%, 15% 78%, 0 78%)' }}>
                    <div className="absolute top-2 left-6 w-18 h-14 bg-white" style={{ clipPath: 'polygon(0 0, 11% 0, 11% 29%, 33% 29%, 33% 0, 72% 0, 72% 21%, 89% 21%, 89% 64%, 67% 64%, 67% 100%, 22% 100%, 22% 71%, 0 71%)' }}></div>
                    <div className="absolute top-4 left-2 w-14 h-10 bg-white" style={{ clipPath: 'polygon(0 0, 14% 0, 14% 30%, 29% 30%, 29% 0, 79% 0, 79% 20%, 93% 20%, 93% 70%, 64% 70%, 64% 100%, 21% 100%, 21% 60%, 0 60%)' }}></div>
                </div>
                
                <div className="absolute top-36 left-16 w-22 h-14 bg-white opacity-75 animate-pulse" style={{ animationDelay: '2.5s', animationDuration: '4.5s', clipPath: 'polygon(0 0, 14% 0, 14% 29%, 27% 29%, 27% 0, 73% 0, 73% 21%, 86% 21%, 86% 57%, 100% 57%, 100% 79%, 73% 79%, 73% 100%, 27% 100%, 27% 71%, 0 71%)' }}>
                    <div className="absolute top-1 left-4 w-14 h-10 bg-white" style={{ clipPath: 'polygon(0 0, 14% 0, 14% 30%, 36% 30%, 36% 0, 79% 0, 79% 20%, 100% 20%, 100% 70%, 57% 70%, 57% 100%, 21% 100%, 21% 60%, 0 60%)' }}></div>
                </div>
                
                {/* Medium Pixelated Clouds - Top Half Only */}
                <div className="absolute top-52 left-28 w-16 h-10 bg-white opacity-60 animate-pulse" style={{ animationDelay: '1.8s', animationDuration: '5.8s', clipPath: 'polygon(0 0, 13% 0, 13% 30%, 31% 30%, 31% 0, 69% 0, 69% 20%, 88% 20%, 88% 60%, 100% 60%, 100% 80%, 69% 80%, 69% 100%, 31% 100%, 31% 70%, 0 70%)' }}>
                    <div className="absolute top-1 left-2 w-10 h-6 bg-white" style={{ clipPath: 'polygon(0 0, 20% 0, 20% 33%, 40% 33%, 40% 0, 80% 0, 80% 17%, 100% 17%, 100% 67%, 60% 67%, 60% 100%, 20% 100%, 20% 67%, 0 67%)' }}></div>
                </div>
                
                <div className="absolute top-24 right-24 w-14 h-8 bg-white opacity-55 animate-pulse" style={{ animationDelay: '2.8s', animationDuration: '4.3s', clipPath: 'polygon(0 0, 14% 0, 14% 38%, 29% 38%, 29% 0, 71% 0, 71% 25%, 86% 25%, 86% 63%, 100% 63%, 100% 88%, 71% 88%, 71% 100%, 29% 100%, 29% 75%, 0 75%)' }}>
                    <div className="absolute top-1 left-1 w-8 h-4 bg-white" style={{ clipPath: 'polygon(0 0, 25% 0, 25% 50%, 50% 50%, 50% 0, 100% 0, 100% 75%, 50% 75%, 50% 100%, 0 100%)' }}></div>
                </div>
                
                {/* Small Pixelated Clouds - Top Half Only */}
                <div className="absolute top-32 left-2/3 w-10 h-5 bg-white opacity-45 animate-pulse" style={{ animationDelay: '2.1s', animationDuration: '6.8s', clipPath: 'polygon(0 0, 20% 0, 20% 40%, 40% 40%, 40% 0, 80% 0, 80% 20%, 100% 20%, 100% 80%, 60% 80%, 60% 100%, 20% 100%, 20% 60%, 0 60%)' }}>
                    <div className="absolute top-0 left-1 w-5 h-3 bg-white" style={{ clipPath: 'polygon(0 0, 40% 0, 40% 67%, 60% 67%, 60% 0, 100% 0, 100% 100%, 40% 100%, 40% 67%, 0 67%)' }}></div>
                </div>
                
                <div className="absolute top-12 right-1/3 w-8 h-4 bg-white opacity-48 animate-pulse" style={{ animationDelay: '1.2s', animationDuration: '5.1s', clipPath: 'polygon(0 0, 25% 0, 25% 50%, 50% 50%, 50% 0, 75% 0, 75% 25%, 100% 25%, 100% 75%, 75% 75%, 75% 100%, 25% 100%, 25% 75%, 0 75%)' }}>
                    <div className="absolute top-0 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>
                
                <div className="absolute top-8 left-1/4 w-6 h-3 bg-white opacity-40 animate-pulse" style={{ animationDelay: '3.3s', animationDuration: '4.7s', clipPath: 'polygon(0 0, 33% 0, 33% 67%, 67% 67%, 67% 0, 100% 0, 100% 100%, 67% 100%, 67% 67%, 0 67%)' }}>
                    <div className="absolute top-0 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
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

                <div className="absolute top-2 left-56 w-8 h-5 bg-white opacity-40 animate-pulse" style={{ animationDelay: '7.3s', animationDuration: '4.7s', clipPath: 'polygon(0 0, 25% 0, 25% 40%, 38% 40%, 38% 0, 75% 0, 75% 20%, 88% 20%, 88% 60%, 100% 60%, 100% 80%, 63% 80%, 63% 100%, 25% 100%, 25% 60%, 0 60%)' }}>
                    <div className="absolute top-1 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>

                <div className="absolute top-42 left-40 w-5 h-3 bg-white opacity-35 animate-pulse" style={{ animationDelay: '8.1s', animationDuration: '5.1s', clipPath: 'polygon(0 0, 40% 0, 40% 67%, 60% 67%, 60% 0, 100% 0, 100% 100%, 60% 100%, 60% 67%, 0 67%)' }}>
                    <div className="absolute top-0 left-1 w-2 h-2 bg-white"></div>
                </div>

                <div className="absolute top-34 right-14 w-7 h-4 bg-white opacity-43 animate-pulse" style={{ animationDelay: '3.5s', animationDuration: '6.2s', clipPath: 'polygon(0 0, 29% 0, 29% 50%, 43% 50%, 43% 0, 86% 0, 86% 25%, 100% 25%, 100% 75%, 71% 75%, 71% 100%, 29% 100%, 29% 75%, 0 75%)' }}>
                    <div className="absolute top-0 left-1 w-4 h-2 bg-white" style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 100% 100%, 100% 50%, 50% 50%, 50% 0, 0 0)' }}></div>
                </div>
            </div>
            
            {/* Subtle Sunlight Rays */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-1 h-32 bg-gradient-to-b from-yellow-200 to-transparent opacity-20 rotate-12 animate-pulse" style={{ animationDuration: '4s' }}></div>
                <div className="absolute top-0 left-1/3 w-1 h-40 bg-gradient-to-b from-yellow-300 to-transparent opacity-15 rotate-6 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
                <div className="absolute top-0 left-2/5 w-1 h-36 bg-gradient-to-b from-yellow-200 to-transparent opacity-25 -rotate-3 animate-pulse" style={{ animationDuration: '4.5s', animationDelay: '2s' }}></div>
                <div className="absolute top-0 right-1/3 w-1 h-44 bg-gradient-to-b from-yellow-200 to-transparent opacity-18 -rotate-12 animate-pulse" style={{ animationDuration: '6s', animationDelay: '0.5s' }}></div>
                <div className="absolute top-0 right-1/4 w-1 h-38 bg-gradient-to-b from-yellow-300 to-transparent opacity-22 -rotate-8 animate-pulse" style={{ animationDuration: '5.5s', animationDelay: '1.5s' }}></div>
            </div>
            
            <h1 
                className="text-4xl text-teal-800 font-bold text-center mb-8 relative z-10" 
                data-testid="signupTitle"
                style={{ fontFamily: 'Pixelify Sans, monospace' }}
            >
                Join ProcrastiNATE!
            </h1>

            <div className="bg-white w-full max-w-lg p-8 rounded-3xl border-4 border-orange-400 shadow-2xl relative z-10">
                <form onSubmit={handleSubmit} className="w-full">
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

                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-teal-700 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            Password
                        </label>
                        <div className="relative">
                            <input
                                data-testid="password-input"
                                type={showPassword ? "text" : "password"}
                                className="w-full border-3 border-orange-300 rounded-xl p-3 text-lg text-teal-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 pr-16"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                data-testid="toggle-password-visibility"
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-600 text-sm font-bold hover:text-orange-700"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full mb-6">
                        <label className="block text-lg font-bold text-teal-700 mb-2" style={{ fontFamily: 'Pixelify Sans, monospace' }}>
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                data-testid="confirm-password-input"
                                type={showConfirmPassword ? "text" : "password"}
                                className="w-full border-3 border-orange-300 rounded-xl p-3 text-lg text-teal-800 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 pr-16"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                data-testid="toggle-confirm-password-visibility"
                                type="button"
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-600 text-sm font-bold hover:text-orange-700"
                                style={{ fontFamily: 'Pixelify Sans, monospace' }}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-teal-500 to-blue-500 text-white py-3 px-8 rounded-2xl text-xl font-bold hover:from-teal-600 hover:to-blue-600 transform hover:scale-105 transition-all duration-200 shadow-lg"
                            style={{ fontFamily: 'Pixelify Sans, monospace' }}
                            data-testid="signupButton"
                        >
                            Register!
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Signup;