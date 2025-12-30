import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    EnvelopeIcon,
    LockClosedIcon,
    ExclamationCircleIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({ email: false, password: false });

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        const trimmedEmail = email.trim();
        if (!trimmedEmail || !password) {
            setError('Email and password are required.');
            setLoading(false);
            return;
        }

        const result = await login(trimmedEmail, password);
        if (result.success) {
            navigate('/dashboard', { replace: true });
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleBlur = (field) => () => {
        setTouched({ ...touched, [field]: true });
    };

    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    };

    const isFormValid = email.trim() && password && isValidEmail(email);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-xl p-8 sm:p-10 transition-all duration-300 hover:shadow-2xl">

                    {/* Header */}
                    <div className="text-center">
                        <div className="mx-auto h-12 w-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mb-4">
                            <LockClosedIcon className="h-6 w-6 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Welcome Back
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Sign in to your account to continue
                        </p>
                    </div>

                    {/* Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            {/* Email Field */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <EnvelopeIcon className={`h-5 w-5 ${touched.email && email ?
                                            (isValidEmail(email) ? 'text-green-500' : 'text-red-500') :
                                            'text-gray-400'
                                            }`} />
                                    </div>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={handleBlur('email')}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all duration-200 ${touched.email && email
                                            ? isValidEmail(email)
                                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                                : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            } ${loading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                        placeholder="you@example.com"
                                        required
                                        disabled={loading}
                                    />
                                    {touched.email && email && isValidEmail(email) && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {touched.email && email && !isValidEmail(email) && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <ExclamationCircleIcon className="h-4 w-4" />
                                        Please enter a valid email address
                                    </p>
                                )}
                            </div>

                            {/* Password Field */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <Link
                                        to="/forgot-password"
                                        className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onBlur={handleBlur('password')}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all duration-200 ${touched.password && password
                                            ? password.length >= 6
                                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                                : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                                            } ${loading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                        placeholder="Enter your password"
                                        minLength={6}
                                        required
                                        disabled={loading}
                                    />
                                    {touched.password && password && password.length >= 6 && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {touched.password && password && password.length < 6 && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <ExclamationCircleIcon className="h-4 w-4" />
                                        Password must be at least 6 characters
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div
                                className="rounded-xl bg-red-50 border border-red-200 p-4 animate-fade-in"
                                role="alert"
                            >
                                <div className="flex items-center">
                                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !isFormValid}
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 ${loading || !isFormValid
                                ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-80'
                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Signing in...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <LockClosedIcon className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                    Sign in to your account
                                </div>
                            )}


                        </button>


                        {/* Google OAuth Button */}
                        <button
                            type="button"
                            onClick={() => window.location.href = "http://localhost:3001/api/auth/google-login"}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 hover:border-gray-400 transition-colors text-gray-700 font-medium"
                        >
                            {/* Google G icon SVG */}
                            <svg className="w-5 h-5" viewBox="0 0 488 512" fill="none">
                                <g>
                                    <path fill="#4285F4" d="M488 261.8c0-17.8-1.5-35-4.3-51.8H249v98h136.5c-5.6 30-22.2 55.5-47.5 72.5v60h76.8c45-41.4 71-102.7 71-178.7z" />
                                    <path fill="#34A853" d="M249 492c64.8 0 119.3-21.5 159.1-58.4l-76.8-60.1c-21.3 14.3-48.3 22.7-82.3 22.7-63.2 0-116.7-42.7-135.8-100.4h-80.3v63.5C72.5 441.8 154.3 492 249 492z" />
                                    <path fill="#FBBC05" d="M113.2 295.8c-8.4-24.6-8.4-51 0-75.6v-63.5h-80.3C7.6 196.6 0 222.6 0 249s7.6 52.4 32.9 92.4l80.3-63.6z" />
                                    <path fill="#EA4335" d="M249 97.8c35.1 0 66.5 12.1 91.2 35.9l68.7-68.7C368.3 30.5 313.8 8 249 8 154.3 8 72.5 58.2 32.9 155.6l80.3 63.5C132.3 140.5 185.8 97.8 249 97.8z" />
                                </g>
                            </svg>
                            <span>Sign in with Google</span>
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">New to our platform?</span>
                            </div>
                        </div>

                        {/* Register Link */}
                        <div className="text-center">
                            <Link
                                to="/register"
                                className="inline-flex items-center justify-center w-full py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                Create a new account
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        By signing in, you agree to our{' '}
                        <Link to="/terms" className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                            Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link to="/privacy" className="text-blue-600 hover:text-blue-500 transition-colors duration-200">
                            Privacy Policy
                        </Link>
                    </p>
                </div>
            </div>

            {/* Add custom animation */}
            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}</style>
        </div>
    );
};

export default LoginForm;