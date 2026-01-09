import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import KycFormMaster from '../components/dashboard/user/KycFormMaster';
import DeveloperForm from '../components/dashboard/user/DeveloperForm';
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

    const [isRedirecting, setIsRedirecting] = useState(false);

    // Check if there's an existing session in URL or localStorage to resume
    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const urlSessionId = queryParams.get('sessionId');
        const isTargetPort = window.location.port === '3000';

        const syncSession = async (sid: number) => {
            try {
                // Call backend to get real-time status of this session
                const response = await fetch(`${apiBase}/api/KycSession/progress/${sid}`);
                if (response.ok) {
                    const res = await response.json();
                    if (res.success && res.data.session) {
                        const verified = res.data.session.emailVerified;
                        setIsEmailVerified(verified);
                        setSessionId(sid);

                        if (verified) {
                            if (!isTargetPort) {
                                // On 5173: Move to 3000 - Trigger logic handled in effect or button?
                                // For session resume, we might want to check again or just stay local if strictly separate
                                // For now, if verify is true and we're not on port 3000, we stick to logic or offer redirect
                                // The original code auto-redirected. Let's make it safer.
                                // We'll just let them stay on step 3 (Local) if they arrived here manually, 
                                // but technically we should have redirected. 
                                // Let's just setStep(3) to avoid loops, or user can click verify again.
                                setStep(3);
                            } else {
                                // On 3000: Open the form
                                setStep(3);
                            }
                        } else {
                            setStep(2); // Still need to verify
                        }
                    }
                }
            } catch (err) {
                console.error("Session sync failed:", err);
            }
        };

        if (urlSessionId) {
            syncSession(parseInt(urlSessionId));
        } else {
            const savedSessionId = localStorage.getItem('kyc_session_id');
            const savedEmailVerified = localStorage.getItem('kyc_email_verified') === 'true';

            if (savedSessionId) {
                const sid = parseInt(savedSessionId);
                setSessionId(sid);
                setIsEmailVerified(savedEmailVerified);

                // If resuming, just show local form to avoid infinite redirect loops or network blocks
                // The user can always "Handoff" explicitly if we added a button, but for now Auto-Resume = Local
                if (savedEmailVerified) {
                    setStep(3);
                } else {
                    setStep(2);
                }
            }
        }
    }, [apiBase]);

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

    const handleVerified = async () => {
        setIsEmailVerified(true);
        localStorage.setItem('kyc_email_verified', 'true');
        setIsRedirecting(true);

        // External URL to redirect to
        const externalUrl = `http://192.168.100.67:3000/form?sessionId=${sessionId}`;

        try {
            // Try to ping the external server first (simple fetch with short timeout)
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

            // Note: This fetch might fail with CORS if not configured on port 3000, 
            // but for "Connection Refused" it will definitely throw.
            await fetch(`http://192.168.100.67:3000`, {
                method: 'HEAD',
                signal: controller.signal,
                mode: 'no-cors' // We just care if it's reachable, not the content
            });
            clearTimeout(timeoutId);

            // If reachable, redirect
            window.location.href = externalUrl;
        } catch (err) {
            console.warn("External form unreachable, falling back to local form.", err);
            // Fallback: Just open the form locally on this laptop
            setIsRedirecting(false);
            setStep(3);
        }
    };

    if (isRedirecting) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center space-y-6">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto"></div>
                    <h2 className="text-2xl font-bold text-gray-900">Connecting to Form...</h2>
                    <p className="text-gray-500">Attempting to open the form on your secure device (Port 3000).</p>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            onClick={() => { setIsRedirecting(false); setStep(3); }}
                            className="text-indigo-600 font-semibold hover:text-indigo-800 hover:underline transition-colors"
                        >
                            Taking too long? Click here to fill form on this device.
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
            {window.location.port === '3000' ? (
                <DeveloperForm sessionId={sessionId} />
            ) : (
                <KycFormMaster initialSessionId={sessionId} initialEmailVerified={isEmailVerified} />
            )}
        </div>
    );
};

export default PublicKyc;
