import React, { useState } from 'react';

/**
 * KycVerification - Handles the initial Email/OTP verification 
 * that must be completed before the KYC form is visible.
 */
interface KycVerificationProps {
    initialEmail?: string;
    sessionId: string | number | null;
    onVerified: (data: any) => void;
    apiBase: string;
}

const KycVerification: React.FC<KycVerificationProps> = ({ initialEmail, sessionId, onVerified, apiBase }) => {
    const [email, setEmail] = useState(initialEmail || '');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');

    const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${apiBase}/api/KycSession/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: Number(sessionId || 0),
                    email: email,
                    otpType: 1 // Email OTP
                })
            });

            if (response.ok) {
                setStep(2);
                setMessage('OTP has been sent to your email.');
            } else {
                const data = await response.json();
                setError(data || 'Failed to send OTP. Please try again.');
            }
        } catch (err) {
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${apiBase}/api/KycSession/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: Number(sessionId || 0),
                    otpCode: otp,
                    otpType: 1
                })
            });

            if (response.ok) {
                const data = await response.json();
                onVerified(data.data); // Notify parent to unlock the form and pass available sessions
            } else {
                setError('Invalid or expired OTP. Please try again.');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Email Verification Required</h2>
                <p className="text-gray-500 mt-2">To ensure the security of your account, please verify your email address before proceeding.</p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded border border-red-100 text-sm">{error}</div>}
            {message && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded border border-green-100 text-sm">{message}</div>}

            {step === 1 ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                            required
                            placeholder="your@email.com"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            disabled={!!initialEmail} // Disable if already provided by Auth
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Sending...' : 'Send Verification Code'}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Enter 6-Digit OTP</label>
                        <input
                            type="text"
                            maxLength={6}
                            value={otp}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOtp(e.target.value)}
                            required
                            placeholder="123456"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-center text-2xl tracking-widest font-mono"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Verifying...' : 'Verify Email & Continue'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full text-indigo-600 text-sm font-medium hover:underline"
                    >
                        Change Email Address
                    </button>
                </form>
            )}
        </div>
    );
};

export default KycVerification;
