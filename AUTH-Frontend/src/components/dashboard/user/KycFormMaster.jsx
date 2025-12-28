import React, { useState, useEffect } from 'react';
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

/**
 * KycFormMaster - The central container for the multi-step KYC process.
 * It manages:
 * 1. Global KYC state (fetched from backend)
 * 2. Current step navigation
 * 3. Section rendering
 */
const KycFormMaster = () => {
    const { token, apiBase } = useAuth();
    const [kycData, setKycData] = useState(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [sessionId, setSessionId] = useState(null);

    // Fetch existing KYC data on load
    useEffect(() => {
        const fetchKyc = async () => {
            try {
                const response = await fetch(`${apiBase}/api/Kyc`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setKycData(data);
                    setSessionId(data.sessionId);
                    setIsEmailVerified(data.isEmailVerified);
                    // Start at the furthest completed step, but allow navigation
                    setCurrentStep(data.currentStep || 1);
                } else {
                    setError("Failed to load KYC data");
                }
            } catch (err) {
                setError("Network error loading KYC");
            } finally {
                setLoading(false);
            }
        };

        fetchKyc();
    }, [token, apiBase]);

    const handleNext = (nextStepData) => {
        setKycData(prev => ({ ...prev, ...nextStepData }));
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
        "Guardian",
        "Legal",
        "Investment",
        "Attachments"
    ];

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
            {/* Header / Progress Bar */}
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Know Your Customer (KYC)</h1>
                <p className="text-gray-500">Please complete all 9 sections to verify your identity.</p>

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
                        {currentStep === 1 && <KycPersonalInfo initialData={kycData?.personalInfo} onNext={handleNext} />}
                        {currentStep === 2 && <KycAddress initialData={kycData?.address} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 3 && <KycFamily initialData={kycData?.family} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 4 && <KycBank initialData={kycData?.bank} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 5 && <KycOccupation initialData={kycData?.occupation} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 6 && <KycGuardian initialData={kycData?.guardian} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 7 && <KycLegal initialData={kycData?.legal} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 8 && <KycInvestment initialData={kycData?.investment} onNext={handleNext} onBack={handlePrev} />}
                        {currentStep === 9 && <KycAttachment onBack={handlePrev} onComplete={() => setCurrentStep(10)} />}

                        {currentStep === 10 && (
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
