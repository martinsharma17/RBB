import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import api from '../../../../services/api';

/**
 * KycVerification - Handles the initial Email/OTP verification 
 * that must be completed before the KYC form is visible.
 */
interface KycSessionBrief {
    sessionId: number;
    sessionToken: string;
    createdDate: string;
    currentStep: number;
    lastSavedStep: number;
    formStatus: number;
}

interface KycVerificationProps {
    initialEmail?: string;
    sessionId: string | number | null;
    sessionToken?: string | null;
    onVerified: (sessionId: number | null, sessionToken?: string | null) => void;
    apiBase: string;
}

const KycVerification: React.FC<KycVerificationProps> = ({ initialEmail, sessionId, sessionToken, onVerified, apiBase }) => {
    const { token, user } = useAuth();
    const isStaff = !!token && !!user;

    const [email, setEmail] = useState(initialEmail || '');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState(1);
    const [tempSessionId, setTempSessionId] = useState<number | null>(null);
    const [tempSessionToken, setTempSessionToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState('');
    const [availableSessions, setAvailableSessions] = useState<KycSessionBrief[]>([]);

    const handleSendOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            if (isStaff) {
                const response = await api.get(`/api/KycSession/list-by-email?email=${encodeURIComponent(email)}`);
                if (response.data.success) {
                    setAvailableSessions(response.data.data || []);
                    setStep(3);
                } else {
                    setError(response.data.message || 'Failed to search for customer sessions.');
                }
            } else {
                let activeSessionId = Number(sessionId || 0);
                let activeSessionToken = sessionToken || tempSessionToken;

                if (!activeSessionId) {
                    const initRes = await api.post(`/api/KycSession/initialize`, {
                        email: email,
                        forceNew: false
                    });

                    if (initRes.data.success && initRes.data.data?.sessionId) {
                        activeSessionId = initRes.data.data.sessionId;
                        activeSessionToken = initRes.data.data.sessionToken;
                    } else {
                        throw new Error(initRes.data.message || 'Failed to initialize session');
                    }
                }

                const response = await api.post(`/api/KycSession/send-otp`, {
                    sessionToken: activeSessionToken,
                    email: email,
                    otpType: 1
                });

                if (response.data.success) {
                    setTempSessionId(activeSessionId);
                    setTempSessionToken(activeSessionToken);
                    setStep(2);
                    setMessage('OTP has been sent to your email.');
                } else {
                    setError(response.data.message || 'Failed to send OTP. Please try again.');
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Network error.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post(`/api/KycSession/verify-otp`, {
                sessionToken: tempSessionToken,
                otpCode: otp,
                otpType: 1
            });

            if (response.data.success) {
                // ==========================================
                // DUAL-TOKEN SECURITY: Store Verification Token
                // ==========================================
                // After successful OTP verification, backend returns TWO tokens:
                // 1. SessionToken - already in URL
                // 2. VerificationToken - NEW, must be stored and sent in headers

                const { verificationToken, tokenExpiry } = response.data.data;

                if (verificationToken) {
                    // Store verification token in localStorage (never in URL!)
                    localStorage.setItem('kyc_verification_token', verificationToken);
                    localStorage.setItem('kyc_token_expiry', tokenExpiry || '');

                    // Set in axios default headers for all future requests
                    // This header is required by the backend's RequireKycSessionOrAuth attribute
                    api.defaults.headers.common['X-KYC-Verification'] = verificationToken;

                    console.log('✅ Verification token stored and set in headers');
                } else {
                    console.warn('⚠️ No verification token received (user may be logged in)');
                }

                // If we are verifying a specific pre-initialized session, skip the selection list
                if (sessionId) {
                    // Pass back the token we have (either from new generation or existing prop)
                    const validToken = tempSessionToken || sessionToken;
                    onVerified(Number(sessionId), validToken);
                    return;
                }

                const sessions = response.data.data.availableSessions || [];
                setAvailableSessions(sessions);
                setStep(3);
            } else {
                setError(response.data.message || 'Invalid or expired OTP. Please try again.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartNew = async () => {
        setLoading(true);
        try {
            const response = await api.post(`/api/KycSession/initialize`, {
                email: email,
                forceNew: true
            });

            if (response.data.success) {
                onVerified(response.data.data.sessionId, response.data.data.sessionToken);
            } else {
                setError(response.data.message || 'Failed to start new KYC session.');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error starting new session.');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (e: React.MouseEvent, sToken: string) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this incomplete application? This action cannot be undone.")) return;

        setLoading(true);
        try {
            const response = await api.delete(`/api/KycSession/${sToken}`);
            if (response.data.success) {
                setAvailableSessions(prev => prev.filter(s => s.sessionToken !== sToken));
                setMessage("Application deleted successfully.");
            } else {
                setError(response.data.message || "Failed to delete application.");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Error deleting application.");
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
                    {step === 3 ? 'Customer KYC Records' : isStaff ? 'Customer Email Entry' : 'Email Verification Required'}
                </h2>
                <p className="text-gray-500 mt-2">
                    {step === 3
                        ? isStaff
                            ? 'Select a KYC session to view or edit, or start a new one.'
                            : 'We found some previous KYC records linked to your email.'
                        : isStaff
                            ? 'Enter the customer\'s email address to view or edit their KYC form.'
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
                        // disabled={!!initialEmail} // Removed to allow role to enter different customer emails
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
                            const isSubmitted = s.formStatus >= 2;
                            const isFinalized = s.formStatus >= 3;
                            return (
                                <div
                                    key={s.sessionId || (s as any).SessionId}
                                    onClick={() => !isSubmitted && onVerified(s.sessionId || (s as any).SessionId, s.sessionToken || (s as any).SessionToken)}
                                    className={`p-5 border rounded-2xl transition-all flex justify-between items-center group relative overflow-hidden ${isSubmitted
                                        ? 'bg-gray-50 border-gray-200 cursor-not-allowed'
                                        : 'bg-white border-slate-200 hover:border-indigo-500 cursor-pointer shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    {isSubmitted && (
                                        <div className="absolute inset-0 z-10 bg-white/10" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`font-black ${isSubmitted ? 'text-gray-500' : 'text-slate-900'}`}>Session #{s.sessionId}</span>
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${isFinalized ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {getStatusText(s.formStatus)}
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

                                    <div className="flex items-center gap-2 relative z-20">
                                        {!isSubmitted && (
                                            <button
                                                onClick={(e) => handleDelete(e, s.sessionToken)}
                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                                title="Delete Application"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        )}

                                        {!isSubmitted && (
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center transition-all transform group-hover:bg-indigo-600 group-hover:text-white">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </div>
                                        )}

                                        {isSubmitted && (
                                            <div className="text-indigo-400 pr-2">
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                            </div>
                                        )}
                                    </div>
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

