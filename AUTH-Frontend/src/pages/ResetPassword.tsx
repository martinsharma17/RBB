// src/pages/ResetPassword.jsx
// Page where users reset their password using the token from email

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

/**
 * Reset Password Page
 * 
 * User Flow:
 * 1. User clicks link in email (contains token and email in URL)
 * 2. Page validates the token is still valid
 * 3. User enters new password
 * 4. Password is reset
 * 5. User is redirected to login
 * 
 * Security Features:
 * - Token validation before showing form
 * - Token expires after 24 hours
 * - Token can only be used once
 * - Password confirmation required
 */
const ResetPassword = () => {
    // ============================================================================
    // HOOKS & STATE
    // ============================================================================
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Form state
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validating, setValidating] = useState(true);
    const [tokenValid, setTokenValid] = useState(false);

    // Extract token and email from URL query parameters
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    // API base URL
    const apiBase = 'http://localhost:3001';

    // ============================================================================
    // TOKEN VALIDATION (runs on page load)
    // ============================================================================
    /**
     * Validates the reset token when the page loads
     * This ensures we show appropriate UI before user enters password
     */
    useEffect(() => {
        const verifyToken = async () => {
            // Check if we have both token and email in URL
            if (!token || !email) {
                setError('Invalid reset link. Please request a new password reset.');
                setValidating(false);
                return;
            }

            try {
                // Call backend to verify the token is valid
                const response = await fetch(
                    `${apiBase}/api/UserAuth/verify-token?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`
                );
                const data = await response.json();

                if (data.success && data.data?.valid) {
                    // Token is valid! User can proceed
                    setTokenValid(true);
                } else {
                    // Token is invalid or expired
                    setError(data.message || 'Invalid or expired reset link. Please request a new one.');
                }
            } catch (err) {
                setError('Failed to verify reset link. Please try again.');
                console.error('Token verification error:', err);
            } finally {
                setValidating(false);
            }
        };

        verifyToken();
    }, [token, email]); // Run when token or email changes

    // ============================================================================
    // PASSWORD RESET HANDLER
    // ============================================================================
    /**
     * Handles the password reset form submission
     * Validates passwords match and calls backend to reset
     */
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Client-side validation: passwords must match
        if (password !== confirmPassword) {
            setError('Passwords do not match. Please try again.');
            return;
        }

        // Client-side validation: minimum length
        if (password.length < 4) {
            setError('Password must be at least 4 characters long.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // Call backend to reset the password
            const response = await fetch(
                `${apiBase}/api/UserAuth/reset-password?email=${encodeURIComponent(email)}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: token,
                        newPassword: password
                    })
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                // Success! Password has been reset
                setMessage('Password reset successfully! Redirecting to login...');

                // Redirect to login after 2 seconds
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            } else {
                // Error from backend
                if (data.errors) {
                    if (Array.isArray(data.errors)) {
                        setError(data.errors.join('. '));
                    } else {
                        setError(typeof data.errors === 'string' ? data.errors : 'Password reset failed');
                    }
                } else {
                    setError(data.message || 'Password reset failed');
                }
            }
        } catch (err) {
            setError('Network error. Please check your connection and try again.');
            console.error('Reset password error:', err);
        } finally {
            setLoading(false);
        }
    };

    // ============================================================================
    // UI RENDERING
    // ============================================================================

    // Loading state while validating token
    if (validating) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Validating reset link...</p>
                </div>
            </div>
        );
    }

    // Main page UI
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h2>
                    <p className="text-gray-600 text-sm">
                        Enter your new password below
                    </p>
                </div>

                {/* Success Message */}
                {message && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-2xl mr-3">✅</span>
                            <div>
                                <p className="text-green-800 font-medium">{message}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start">
                            <span className="text-2xl mr-3">❌</span>
                            <div>
                                <p className="text-red-700">{error}</p>
                                {!tokenValid && (
                                    <a
                                        href="/forgot-password"
                                        className="text-red-600 hover:text-red-800 underline text-sm mt-2 inline-block"
                                    >
                                        Request a new reset link
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Show form only if token is valid */}
                {tokenValid && !message ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* New Password Input */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Enter new password"
                                required
                                minLength={4}
                                autoFocus
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Minimum 4 characters
                            </p>
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="Confirm new password"
                                required
                            />
                            {password && confirmPassword && password !== confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">
                                    Passwords don't match
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || !tokenValid}
                            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Resetting Password...
                                </span>
                            ) : (
                                'Reset Password'
                            )}
                        </button>
                    </form>
                ) : null}

                {/* Back to Login Link (always show) */}
                {!message && (
                    <div className="mt-6 text-center">
                        <a
                            href="/login"
                            className="text-gray-600 hover:text-gray-800 hover:underline inline-flex items-center"
                        >
                            <span className="mr-1">←</span> Back to Login
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
