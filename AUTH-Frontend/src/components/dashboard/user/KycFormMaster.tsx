import { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import KycPersonalInfo from './sections/KycPersonalInfo';
import KycAddress from './sections/KycAddress';
import KycFamily from './sections/KycFamily';
import KycBank from './sections/KycBank';
import KycOccupation from './sections/KycOccupation';
import KycGuardian from './sections/KycGuardian';
import KycLegal from './sections/KycLegal';
import KycInvestment from './sections/KycInvestment';
import KycAttachment from './sections/KycAttachment';
import KycVerification from './sections/KycVerification';
import KycTransaction from './sections/KycTransaction';
import KycAml from './sections/KycAml';
import KycLocation from './sections/KycLocation';
import KycAgreement from './sections/KycAgreement';

interface KycFormMasterProps {
    initialSessionId?: number | null;
    initialEmailVerified?: boolean;
}

const KycFormMaster: React.FC<KycFormMasterProps> = ({ initialSessionId = null, initialEmailVerified = false }) => {
    const { token, apiBase, user } = useAuth();
    const [kycData, setKycData] = useState<any>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEmailVerified, setIsEmailVerified] = useState(initialEmailVerified);
    const [sessionId, setSessionId] = useState<number | null>(initialSessionId);

    // Fetch existing KYC data on load
    useEffect(() => {
        const fetchKyc = async () => {
            try {
                let currentSessionId = sessionId;
                let emailVerified = isEmailVerified;

                // Step 1: Get/Create Session Metadata
                if (token && !currentSessionId) {
                    const sessionResponse = await fetch(`${apiBase}/api/Kyc/my-session`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (sessionResponse.ok) {
                        const sessionRes = await sessionResponse.json();
                        if (sessionRes.success && sessionRes.data) {
                            const sess = sessionRes.data;
                            currentSessionId = sess.sessionId;
                            setSessionId(sess.sessionId);
                            setIsEmailVerified(sess.isEmailVerified);
                            emailVerified = sess.isEmailVerified;
                            setCurrentStep(sess.currentStep || 1);
                        }
                    }
                } else if (currentSessionId) {
                    // For Public sessions, fetch progress to get the current step
                    try {
                        const progressResponse = await fetch(`${apiBase}/api/KycSession/progress/${currentSessionId}`);
                        if (progressResponse.ok) {
                            const progressRes = await progressResponse.json();
                            const sessionData = progressRes.data?.session || progressRes.data?.Session;
                            if (sessionData) {
                                const step = sessionData.currentStep ?? sessionData.CurrentStep;
                                if (step) {
                                    console.log(`[KYC] Resuming session ${currentSessionId} at step ${step}`);
                                    setCurrentStep(step);
                                }
                            }
                        }
                    } catch (pErr) {
                        console.error("[KYC] Progress fetch failed:", pErr);
                    }
                }

                // Step 2: Fetch all consolidated details if session is active
                if (currentSessionId && emailVerified) {
                    const headers: any = { 'Content-Type': 'application/json' };
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const detailsResponse = await fetch(`${apiBase}/api/KycData/all-details/${currentSessionId}`, {
                        headers
                    });

                    if (detailsResponse.ok) {
                        const detailsRes = await detailsResponse.json();
                        if (detailsRes.success && detailsRes.data) {
                            setKycData(detailsRes.data);
                        }
                    }
                }
            } catch (err) {
                console.error("KYC Fetch error:", err);
                setError("Network error loading KYC");
            } finally {
                setLoading(false);
            }
        };

        // If logged in, fetch session. If not logged in but have sessionId, we can also proceed (Public mode)
        if (token || sessionId) {
            fetchKyc();
        } else {
            setLoading(false);
        }
    }, [token, apiBase, sessionId, isEmailVerified]);

    const handleNext = (nextStepData: any) => {
        setKycData((prev: any) => ({ ...prev, ...nextStepData }));
        setCurrentStep(prev => prev + 1);
    };

    const handlePrev = () => {
        setCurrentStep(prev => Math.max(1, prev - 1));
    };

    if (loading) return <div className="p-8 text-center text-blue-500 animate-pulse">Loading KYC Form...</div>;
    if (error) return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;

    const steps = [
        "Personal Info",
        "Address",
        "Family",
        "Bank",
        "Occupation",
        "Financial",
        "Transaction",
        "Guardian",
        "AML",
        "Location",
        "Declarations",
        "Agreement",
        "Attachments"
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            {/* Header / Progress Bar */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Know Your Customer (KYC)</h1>
                <p className="text-gray-500">Please complete all {steps.length} sections to verify your identity.</p>

                <div className="mt-6 flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>
                    <div
                        className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 -translate-y-1/2 transition-all duration-500 ease-in-out"
                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                    ></div>

                    {steps.map((label, index) => {
                        const stepNum = index + 1;
                        const isCompleted = stepNum < currentStep;
                        const isActive = stepNum === currentStep;

                        return (
                            <div key={label} className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${isCompleted ? 'bg-indigo-600 text-white' :
                                    isActive ? 'bg-white border-2 border-indigo-600 text-indigo-600 scale-110 shadow-md' :
                                        'bg-gray-200 text-gray-400'
                                    }`}>
                                    {isCompleted ? '✓' : stepNum}
                                </div>
                                <span className={`text-xs mt-2 font-medium hidden md:block ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}>
                                    {label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Section Content */}
            <div className="bg-gray-50 p-6 rounded-lg min-h-[400px]">
                {!isEmailVerified ? (
                    <KycVerification
                        initialEmail={user?.email}
                        sessionId={sessionId}
                        apiBase={apiBase}
                        onVerified={() => setIsEmailVerified(true)}
                    />
                ) : (
                    <>
                        {currentStep === 1 && <KycPersonalInfo sessionId={sessionId} initialData={kycData?.personalInfo} onNext={handleNext} />}
                        {currentStep === 2 && <KycAddress sessionId={sessionId} initialData={kycData} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 3 && <KycFamily sessionId={sessionId} initialData={kycData?.family} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 4 && <KycBank sessionId={sessionId} initialData={kycData?.bank} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 5 && <KycOccupation sessionId={sessionId} initialData={kycData?.occupation} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 6 && <KycInvestment sessionId={sessionId} initialData={kycData?.financialDetails} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 7 && <KycTransaction sessionId={sessionId} initialData={kycData?.transactionInfo} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 8 && <KycGuardian sessionId={sessionId} initialData={kycData?.guardian} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 9 && <KycAml sessionId={sessionId} initialData={kycData?.amlCompliance} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 10 && <KycLocation sessionId={sessionId} initialData={kycData?.locationMap} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 11 && <KycLegal sessionId={sessionId} initialData={kycData?.declarations} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 12 && <KycAgreement sessionId={sessionId} initialData={kycData?.agreement} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 13 && <KycAttachment sessionId={sessionId} onBack={handlePrev} onComplete={() => setCurrentStep(14)} />}

                        {currentStep === 14 && (
                            <div className="text-center py-16">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Application Submitted!</h2>
                                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                                    Thank you for completing your KYC. Our team is currently reviewing your documents.
                                    You will be notified once your account is verified.
                                </p>
                                <button
                                    onClick={() => window.location.reload()}
                                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all"
                                >
                                    Back to Dashboard
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Legend */}
            <div className="mt-8 flex items-center justify-between text-sm text-gray-500 border-t pt-6">
                <div>Section {currentStep} of {steps.length}</div>
                <div className="flex space-x-4">
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-indigo-600 mr-2"></span> Active</span>
                    <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-gray-200 mr-2"></span> Pending</span>
                </div>
            </div>
        </div>
    );
};

export default KycFormMaster;
