

// src/components/RegisterForm.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface IconProps {
    className?: string;
}

const UserIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const EnvelopeIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const LockClosedIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
    </svg>
);

const ExclamationCircleIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CheckCircleIcon: React.FC<IconProps> = ({ className = "h-5 w-5" }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const RegisterForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({
        name: false,
        email: false,
        password: false,
        confirmPassword: false
    });

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        const trimmedEmail = email.trim();
        const trimmedName = name.trim();
        if (!trimmedName || !trimmedEmail || !password || !confirmPassword) {
            setError('All fields are required.');
            setLoading(false);
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            setLoading(false);
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setError('Please enter a valid email.');
            setLoading(false);
            return;
        }

        try {
            const registerResponse = await fetch('http://localhost:3001/api/UserAuth/Register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password }),
            });
            const registerData = await registerResponse.json();

            if (registerData.success) {
                const loginResult = await login(trimmedEmail, password);
                if (loginResult.success) {
                    navigate('/dashboard', { replace: true });
                } else {
                    setError('Registration successful, but login failed. Please login manually.');
                }
            } else {
                setError(registerData.message || 'Registration failed.');
            }
        } catch (err) {
            console.error('Register error:', err);
            setError('Server error. Ensure backend is running on port 3001.');
        }
        setLoading(false);
    };

    const handleBlur = (field: keyof typeof touched) => () => {
        setTouched({ ...touched, [field]: true });
    };

    const isValidEmail = (emailStr: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
    };

    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const passwordStrength = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

    const isFormValid = name.trim() && email.trim() && password && confirmPassword &&
        isValidEmail(email) && password.length >= 6 && passwordsMatch;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-blue/5 via-white to-primary-gold/10 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                {/* Animated Background Orbs */}
                <div className="relative">
                    <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary-gold rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-secondary-gold rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-20 left-20 w-40 h-40 bg-primary-blue rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                {/* Card Container */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-8 sm:p-10 transition-all duration-500 hover:shadow-3xl border border-white/20">

                    {/* Header */}
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-primary-blue rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <UserIcon className="h-8 w-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 text-primary-blue">
                            Join Our Community
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Create your account in seconds
                        </p>
                    </div>

                    {/* Form */}
                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        <div className="space-y-5">
                            {/* Name Field */}
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <UserIcon className={`h-5 w-5 ${touched.name && name.trim() ? 'text-green-500' : 'text-gray-400'}`} />
                                    </div>
                                    <input
                                        type="text"
                                        id="name"
                                        value={name}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                        onBlur={handleBlur('name')}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all duration-200 ${touched.name && name.trim()
                                            ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                            : 'border-gray-300 focus:ring-primary-blue focus:border-primary-blue'
                                            } ${loading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                        placeholder="John Doe"
                                        required
                                        disabled={loading}
                                    />
                                    {touched.name && name.trim() && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                            </div>

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
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                        onBlur={handleBlur('email')}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all duration-200 ${touched.email && email
                                            ? isValidEmail(email)
                                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                                : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-primary-blue focus:border-primary-blue'
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
                            </div>

                            {/* Password Field */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                        onBlur={handleBlur('password')}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all duration-200 ${touched.password && password
                                            ? password.length >= 6
                                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                                : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-primary-blue focus:border-primary-blue'
                                            } ${loading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                        placeholder="At least 6 characters"
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

                                {/* Password Strength Indicator */}
                                {touched.password && password && (
                                    <div className="mt-2">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-gray-500">Password strength:</span>
                                            <span className={`text-xs font-medium ${passwordStrength ? 'text-green-600' :
                                                password.length >= 6 ? 'text-yellow-600' : 'text-red-600'
                                                }`}>
                                                {passwordStrength ? 'Strong' : password.length >= 6 ? 'Medium' : 'Weak'}
                                            </span>
                                        </div>
                                        <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-300 ${passwordStrength ? 'w-full bg-green-500' :
                                                password.length >= 6 ? 'w-2/3 bg-yellow-500' : 'w-1/3 bg-red-500'
                                                }`}></div>
                                        </div>
                                        <div className="mt-1 text-xs text-gray-500">
                                            {password.length < 6 && 'At least 6 characters'}
                                            {password.length >= 6 && !/[A-Z]/.test(password) && 'Add uppercase letter'}
                                            {password.length >= 6 && !/[0-9]/.test(password) && 'Add a number'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password Field */}
                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <LockClosedIcon className={`h-5 w-5 ${touched.confirmPassword && confirmPassword
                                            ? passwordsMatch ? 'text-green-500' : 'text-red-500'
                                            : 'text-gray-400'
                                            }`} />
                                    </div>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                        onBlur={handleBlur('confirmPassword')}
                                        className={`block w-full pl-10 pr-3 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-offset-1 focus:outline-none transition-all duration-200 ${touched.confirmPassword && confirmPassword
                                            ? passwordsMatch
                                                ? 'border-green-300 focus:ring-green-500 focus:border-green-500'
                                                : 'border-red-300 focus:ring-red-500 focus:border-red-500'
                                            : 'border-gray-300 focus:ring-primary-blue focus:border-primary-blue'
                                            } ${loading ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
                                        placeholder="Repeat password"
                                        required
                                        disabled={loading}
                                    />
                                    {touched.confirmPassword && confirmPassword && passwordsMatch && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                        </div>
                                    )}
                                </div>
                                {touched.confirmPassword && confirmPassword && !passwordsMatch && password && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <ExclamationCircleIcon className="h-4 w-4" />
                                        Passwords do not match
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start">
                            <div className="flex items-center h-5">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    className="h-4 w-4 text-primary-gold focus:ring-primary-gold border-gray-300 rounded"
                                    required
                                />
                            </div>
                            <div className="ml-3 text-sm">
                                <label htmlFor="terms" className="text-gray-700">
                                    I agree to the{' '}
                                    <Link to="/terms" className="font-medium text-primary-blue hover:text-primary-blue/80">
                                        Terms of Service
                                    </Link>{' '}
                                    and{' '}
                                    <Link to="/privacy" className="font-medium text-primary-blue hover:text-primary-blue/80">
                                        Privacy Policy
                                    </Link>
                                </label>
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
                            className={`group relative w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-xl ${loading || !isFormValid
                                ? 'bg-gradient-to-r from-gray-400 to-gray-500 cursor-not-allowed opacity-80'
                                : 'bg-primary-blue hover:bg-primary-blue/90 focus:ring-primary-blue'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                    Creating Account...
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <UserIcon className="h-5 w-5 mr-2 transition-transform duration-300 group-hover:scale-110" />
                                    Create Account
                                </div>
                            )}
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white/80 text-gray-500">Already have an account?</span>
                            </div>
                        </div>

                        {/* Login Link */}
                        <div className="text-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center w-full py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-blue transition-all duration-300 transform hover:-translate-y-0.5"
                            >
                                Sign in to your account
                            </Link>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center">
                    <p className="text-xs text-gray-500">
                        Your data is protected with industry-standard encryption
                    </p>
                </div>
            </div>

            {/* Add custom animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes blob {
                    0% { transform: translate(0px, 0px) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                    100% { transform: translate(0px, 0px) scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
                .animate-blob {
                    animation: blob 7s infinite;
                }
                .animation-delay-2000 {
                    animation-delay: 2s;
                }
                .animation-delay-4000 {
                    animation-delay: 4s;
                }
            `}</style>
        </div>
    );
};

export default RegisterForm;