import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import KycFormMaster from '../components/dashboard/user/KycFormMaster';
import KycVerification from '../components/dashboard/user/sections/KycVerification';

const PublicKyc = () => {
    const { apiBase } = useAuth();
    const [email, setEmail] = useState('');
    const [mobileNo, setMobileNo] = useState('');
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1); // 1: Initialize, 2: Verify OTP, 3: Form

    // Check if there's an existing session in localStorage to resume
    useEffect(() => {
        const savedSessionId = localStorage.getItem('kyc_session_id');
        const savedEmailVerified = localStorage.getItem('kyc_email_verified') === 'true';

        if (savedSessionId) {
            setSessionId(parseInt(savedSessionId));
            setIsEmailVerified(savedEmailVerified);
            if (savedEmailVerified) {
                setStep(3);
            } else {
                setStep(2);
            }
        }
    }, []);

    const handleInitialize = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiBase}/api/KycSession/initialize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    mobileNo,
                    userAgent: navigator.userAgent,
                    deviceFingerprint: 'browser-public'
                })
            });

            if (response.ok) {
                const res = await response.json();
                if (res.success && res.data) {
                    setSessionId(res.data.sessionId);
                    localStorage.setItem('kyc_session_id', res.data.sessionId.toString());
                    setStep(2);
                } else {
                    setError(res.message || "Failed to initialize KYC session.");
                }
            } else {
                setError("Failed to connect to server.");
            }
        } catch (err) {
            setError("Network error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const handleVerified = () => {
        setIsEmailVerified(true);
        localStorage.setItem('kyc_email_verified', 'true');
        setStep(3);
    };

    if (step === 1) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900">Start Your KYC</h1>
                        <p className="text-gray-500 mt-2">Fill out your KYC form securely without logging in.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm flex items-start">
                            <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleInitialize} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number (Optional)</label>
                            <input
                                type="tel"
                                value={mobileNo}
                                onChange={(e) => setMobileNo(e.target.value)}
                                placeholder="98XXXXXXXX"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all shadow-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 active:transform active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Initialing...
                                </span>
                            ) : "Continue to Verify Email"}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-500">
                            Already have an account? <a href="/login" className="text-indigo-600 font-semibold hover:underline">Log in here</a>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="min-h-screen bg-gray-50 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-indigo-600 p-8 text-white text-center">
                            <h2 className="text-2xl font-bold">Verification Step</h2>
                            <p className="opacity-90 mt-1">We've sent a code to your email.</p>
                        </div>
                        <div className="p-8">
                            <KycVerification
                                initialEmail={email}
                                sessionId={sessionId}
                                apiBase={apiBase}
                                onVerified={handleVerified}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <KycFormMaster initialSessionId={sessionId} initialEmailVerified={isEmailVerified} />
        </div>
    );
};

export default PublicKyc;
