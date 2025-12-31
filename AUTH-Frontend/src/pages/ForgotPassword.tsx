// src/pages/ForgotPassword.jsx
// Page where users request a password reset link

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Forgot Password Page
 * 
 * User Flow:
 * 1. User enters their email address
 * 2. System sends a password reset link to that email
 * 3. User receives confirmation message (regardless of whether email exists - security!)
 * 
 * Security Notes:
 * - Never reveals whether an email exists in the system
 * - This prevents attackers from discovering registered emails
 */
const ForgotPassword = () => {
    // ============================================================================
    // STATE MANAGEMENT
    // ============================================================================
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // ============================================================================
    // API BASE URL (should match your backend)
    // ============================================================================
    const apiBase = 'http://localhost:3001';

    // ============================================================================
    // FORM SUBMISSION HANDLER
    // ============================================================================
    /**
     * Handles the forgot password form submission
     * Sends email to backend which will generate and send reset link
     */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Clear previous messages
        setLoading(true);
        setError('');
        setMessage('');

        try {
            // Call backend forgot password API
            const response = await fetch(`${apiBase}/api/UserAuth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (response.ok) {
                // Success! Show confirmation message
                setMessage(data.message || 'If an account exists for that email, we have sent a reset link.');
                setEmailSent(true);

                // For DEVELOPMENT: Check console for the reset link (since we're not sending real emails yet)
                console.log('📧 Check your backend console for the password reset link!');
            } else {
                // Error occurred
                setError(data.message || 'Failed to send reset email. Please try again.');
            }
        } catch (err) {
            // Network error
            setError('Network error. Please check your connection and try again.');
            console.error('Forgot password error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================================
    // UI RENDERING
    // ============================================================================
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                    <p className="text-gray-600 text-sm">
                        No worries! Enter your email and we'll send you reset instructions.
                    </p>
                </div>

                {/* Success Message */}
                {message && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-2xl mr-3">✅</span>
                            <div>
                                <p className="text-green-800 font-medium">{message}</p>
                                <p className="text-green-700 text-sm mt-1">
                                    Check your email inbox (and spam folder just in case!)
                                </p>
                                {/* DEV NOTE */}
                                <p className="text-xs text-green-600 mt-2 font-mono border-t border-green-200 pt-2">
                                    🔧 DEV MODE: Check your backend console for the reset link
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-2xl mr-3">❌</span>
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {/* Show form only if email hasn't been sent yet */}
                {!emailSent ? (
                    <>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Input */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email Address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="Enter your email"
                                    required
                                    autoFocus
                                />
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>

                        {/* Back to Login Link */}
                        <div className="mt-6 text-center">
                            <Link
                                to="/login"
                                className="text-blue-600 hover:text-blue-800 hover:underline font-medium inline-flex items-center"
                            >
                                <span className="mr-1">←</span> Back to Login
                            </Link>
                        </div>
                    </>
                ) : (
                    // Show retry option if email was sent
                    <div className="text-center space-y-4">
                        <button
                            onClick={() => {
                                setEmailSent(false);
                                setMessage('');
                                setEmail('');
                            }}
                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                            Try a different email
                        </button>
                        <div>
                            <Link
                                to="/login"
                                className="text-gray-600 hover:text-gray-800 hover:underline"
                            >
                                Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
