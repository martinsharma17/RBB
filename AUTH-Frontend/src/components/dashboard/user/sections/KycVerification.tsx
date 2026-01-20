import React, { useState } from 'react';

/**
 * KycVerification - Handles the initial Email/OTP verification 
 * that must be completed before the KYC form is visible.
 */
interface KycSessionBrief {
    sessionId: number;
    createdDate: string;
    currentStep: number;
    lastSavedStep: number;
    formStatus: number;
}

interface KycVerificationProps {
    initialEmail?: string;
    sessionId: string | number | null;
    onVerified: (sessionId: number | null) => void;
    apiBase: string;
}

const KycVerification: React.FC<KycVerificationProps> = ({ initialEmail, sessionId, onVerified, apiBase }) => {
    const [email, setEmail] = useState(initialEmail || '');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1); // 1: Enter Email, 2: Enter OTP, 3: Select Session
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [availableSessions, setAvailableSessions] = useState<KycSessionBrief[]>([]);

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
                const sessions = data.data.availableSessions || [];
                if (sessions.length > 0) {
                    setAvailableSessions(sessions);
                    setStep(3);
                } else {
                    // No sessions found, start a new one automatically
                    handleStartNew();
                }
            } else {
                setError('Invalid or expired OTP. Please try again.');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartNew = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${apiBase}/api/KycSession/initialize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    forceNew: true
                })
            });

            if (response.ok) {
                const res = await response.json();
                if (res.success) {
                    onVerified(res.data.sessionId);
                }
            } else {
                setError('Failed to start new KYC session.');
            }
        } catch (err) {
            setError('Error starting new session.');
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status: number) => {
        switch (status) {
            case 0: return 'Not Started';
            case 1: return 'In Progress';
            case 2: return 'Reference Check'; // Changed from 'Ready for Submission' to avoid confusion if waiting
            case 3: return 'Application Submitted';
            case 4: return 'Approved';
            case 5: return 'Rejected';
            default: return 'Completed';
        }
    };

    const getStepLabel = (step: number) => {
        // ... (keep same)
        const masterLabels: { [key: number]: string } = {
            1: "Personal Information",
            2: "Address Details",
            3: "Family Details",
            4: "Bank Details",
            5: "Occupation",
            6: "Financial Info",
            7: "Transaction Info",
            8: "Guardian Info",
            9: "AML Compliance",
            10: "Location Map",
            11: "Declarations",
            12: "Agreements",
            13: "Attachments",
            14: "Final Review"
        };
        return masterLabels[step] || `Step ${step}`;
    };

    return (
        <div className="max-w-md mx-auto py-12 px-4">
            {/* ... (Header same) ... */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                    {step === 3 ? 'Previous KYC Records' : 'Email Verification Required'}
                </h2>
                <p className="text-gray-500 mt-2">
                    {step === 3
                        ? 'We found some previous KYC records linked to your email.'
                        : 'To ensure the security of your account, please verify your email address before proceeding.'}
                </p>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded border border-red-100 text-sm">{error}</div>}
            {message && <div className="mb-4 p-3 bg-green-50 text-green-600 rounded border border-green-100 text-sm">{message}</div>}

            {step === 1 && (
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
            )}

            {step === 2 && (
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

            {step === 3 && (
                <div className="space-y-4">
                    <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
                        {availableSessions.map((s) => {
                            const isSubmitted = s.formStatus >= 3;
                            return (
                                <div
                                    key={s.sessionId}
                                    onClick={() => !isSubmitted && onVerified(s.sessionId)}
                                    className={`p-5 border rounded-2xl transition-all flex justify-between items-center group relative overflow-hidden ${isSubmitted
                                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-80'
                                        : 'bg-white border-slate-200 hover:border-indigo-500 cursor-pointer shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    {isSubmitted && (
                                        <div className="absolute inset-0 z-10 bg-white/10" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-black ${isSubmitted ? 'text-gray-500' : 'text-slate-900'}`}>Session #{s.sessionId}</span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isSubmitted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {getStatusText(isSubmitted ? 3 : s.formStatus)}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-xs text-slate-500 font-medium">
                                                Created: {new Date(s.createdDate).toLocaleDateString()}
                                            </div>
                                            {!isSubmitted && (
                                                <div className="text-xs font-bold text-indigo-600 flex items-center gap-1 mt-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></div>
                                                    Last Step: {getStepLabel(s.currentStep || s.lastSavedStep + 1)}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!isSubmitted && (
                                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </div>
                                    )}

                                    {isSubmitted && (
                                        <div className="text-gray-400">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9v-2h2v2zm0-4H9V7h2v5z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            onClick={handleStartNew}
                            disabled={loading}
                            className="w-full py-3 bg-white border-2 border-indigo-600 text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>Start Brand New KYC</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KycVerification;

