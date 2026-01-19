import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import KycPersonalInfo from "./sections/KycPersonalInfo";
import KycAddress from "./sections/KycAddress";
import KycFamily from "./sections/KycFamily";
import KycBank from "./sections/KycBank";
import KycOccupation from "./sections/KycOccupation";
import KycGuardian from "./sections/KycGuardian";
import KycLegal from "./sections/KycLegal";
import KycInvestment from "./sections/KycInvestment";
import KycAttachment from "./sections/KycAttachment";
import KycVerification from "./sections/KycVerification";
import KycTransaction from "./sections/KycTransaction";
import KycAml from "./sections/KycAml";
import KycLocation from "./sections/KycLocation";
import KycAgreement from "./sections/KycAgreement";
import FinalReviewModal from "./sections/FinalReviewModel";

interface KycFormMasterProps {
  initialSessionId?: number | null;
  initialEmailVerified?: boolean;
}

const KycFormMaster: React.FC<KycFormMasterProps> = ({
  initialSessionId = null,
  initialEmailVerified = false,
}) => {
  const { token, apiBase, user } = useAuth();
  const [kycData, setKycData] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEmailVerified, setIsEmailVerified] = useState(initialEmailVerified);
  const [sessionId, setSessionId] = useState<number | null>(initialSessionId);
  const [showFinalModal, setShowFinalModal] = useState(false);

  // Fetch existing KYC data on load
  useEffect(() => {
    const fetchKyc = async () => {
      try {
        let currentSessionId = sessionId;
        let emailVerified = isEmailVerified;

        // Step 1: Get/Create Session Metadata if not already provided (e.g. for logged in users)
        if (token && !currentSessionId) {
          const sessionResponse = await fetch(`${apiBase}/api/Kyc/my-session`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (sessionResponse.ok) {
            const sessionRes = await sessionResponse.json();
            if (sessionRes.success && sessionRes.data) {
              const sess = sessionRes.data;
              currentSessionId = sess.sessionId;
              setSessionId(sess.sessionId);
              setIsEmailVerified(sess.isEmailVerified);
              emailVerified = sess.isEmailVerified;
              const stepNum = Number(sess.currentStep);
              setCurrentStep(stepNum > 0 ? stepNum : 1);
            }
          }
        }

        // Step 2: Fetch all consolidated details if session is active
        if (currentSessionId && emailVerified) {
          const headers: any = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const detailsResponse = await fetch(
            `${apiBase}/api/KycData/all-details/${currentSessionId}`,
            {
              headers,
            }
          );

          if (detailsResponse.ok) {
            const detailsRes = await detailsResponse.json();
            if (detailsRes.success && detailsRes.data) {
              setKycData(detailsRes.data);
              // Handle both PascalCase and camelCase for currentStep
              const stepFromApi =
                detailsRes.data.CurrentStep || detailsRes.data.currentStep;
              if (stepFromApi !== undefined && stepFromApi !== null) {
                const sNum = Number(stepFromApi);
                setCurrentStep(sNum > 0 ? sNum : 1);
              }
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

  // Calculate age helper
  const calculateAge = (dobAd: string) => {
    if (!dobAd) return 18; // Default to adult if not set
    const birthDate = new Date(dobAd);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();
    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const isMinorAge = calculateAge(kycData?.personalInfo?.dobAd);

  const allStepsConfig = [
    { id: 1, label: "Personal Info" },
    { id: 2, label: "Address" },
    { id: 3, label: "Family" },
    { id: 4, label: "Bank" },
    { id: 5, label: "Occupation" },
    { id: 6, label: "Financial" },
    { id: 7, label: "Transaction" },
    { id: 8, label: "Guardian" },
    { id: 9, label: "AML" },
    { id: 10, label: "Location" },
    { id: 11, label: "Declarations" },
    { id: 12, label: "Agreement" },
    { id: 13, label: "Attachments" },
  ];

  // Filter steps for display based on age
  const visibleSteps = allStepsConfig.filter(s => {
    if (s.id === 8 && isMinorAge >= 18) return false;
    return true;
  });

  const totalVisibleSteps = visibleSteps.length;
  const currentStepIndex = visibleSteps.findIndex(s => s.id === Number(currentStep));

  // Auto-sync currentStep if it points to a hidden section (e.g., Step 8 for adults)
  useEffect(() => {
    if (!loading && visibleSteps.length > 0) {
      const stepId = Number(currentStep);
      const isVisible = visibleSteps.some(s => s.id === stepId);

      if (!isVisible && stepId !== 14) {
        // If we are on a hidden step, find the next available visible step
        const nextAvailable = visibleSteps.find(s => s.id > stepId) || visibleSteps[visibleSteps.length - 1];
        if (nextAvailable) {
          setCurrentStep(nextAvailable.id);
        }
      }
    }
  }, [currentStep, visibleSteps, loading]);

  if (loading)
    return (
      <div className="p-8 text-center text-blue-500 animate-pulse">
        Loading KYC Form...
      </div>
    );
  if (error)
    return (
      <div className="p-8 text-center text-red-500 font-bold">{error}</div>
    );

  const handleNext = (nextStepData: any) => {
    setKycData((prev: any) => ({ ...prev, ...nextStepData }));

    // Logic to skip Guardian (Step 8) if user is not a minor
    if (currentStep === 7 && isMinorAge >= 18) {
      setCurrentStep(9); // Skip to AML
    } else {
      const idx = visibleSteps.findIndex(s => s.id === currentStep);
      if (idx !== -1 && idx < totalVisibleSteps - 1) {
        const nextStep = visibleSteps[idx + 1];
        if (nextStep) setCurrentStep(nextStep.id);
      } else {
        setCurrentStep(14); // Summary view
      }
    }
  };

  const handlePrev = () => {
    // Logic to skip Guardian (Step 8) when going back if user is not a minor
    if (currentStep === 9 && isMinorAge >= 18) {
      setCurrentStep(7); // Skip back to Transaction
    } else {
      const idx = visibleSteps.findIndex(s => s.id === currentStep);
      if (idx > 0) {
        const prevVisible = visibleSteps[idx - 1];
        if (prevVisible) setCurrentStep(prevVisible.id);
      } else if (currentStep === 14 && totalVisibleSteps > 0) {
        const lastVisible = visibleSteps[totalVisibleSteps - 1];
        if (lastVisible) setCurrentStep(lastVisible.id);
      } else {
        setCurrentStep((prev) => Math.max(1, prev - 1));
      }
    }
  };

  const personalInfo = kycData?.personalInfo || {};
  const familyInitialData = kycData?.family || {};

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header / Progress Bar */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
          Know Your Customer (KYC)
        </h1>
        <p className="text-gray-500">
          Please complete all {totalVisibleSteps} sections to verify your identity.
        </p>

        <div className="mt-6 flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 -translate-y-1/2"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-indigo-600 -z-10 -translate-y-1/2 transition-all duration-500 ease-in-out"
            style={{
              width: totalVisibleSteps > 1 ? `${(Math.max(0, currentStepIndex) / (totalVisibleSteps - 1)) * 100}%` : "0%",
            }}
          ></div>

          {visibleSteps.map((step, index) => {
            const isCompleted = index < currentStepIndex;
            const isActive = step.id === Number(currentStep);
            const isClickable = isCompleted || isActive;

            return (
              <div key={step.label} className="flex flex-col items-center">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && setCurrentStep(step.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 focus:outline-none
                        ${isCompleted
                      ? "bg-indigo-600 text-white cursor-pointer hover:scale-110"
                      : isActive
                        ? "bg-white border-2 border-indigo-600 text-indigo-600 scale-110 shadow-md cursor-pointer"
                        : "bg-gray-200 text-gray-400 cursor-default"
                    }
                    `}
                  style={{ pointerEvents: isClickable ? "auto" : "none" }}
                  aria-label={`Go to ${step.label}`}
                >
                  {isCompleted ? "✓" : index + 1}
                </button>
                <span
                  className={`text-xs mt-2 font-medium hidden md:block ${isActive ? "text-indigo-600" : "text-gray-400"
                    }`}
                >
                  {step.label}
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
            {Number(currentStep) === 1 && (
              <KycPersonalInfo
                sessionId={sessionId}
                initialData={kycData?.personalInfo}
                onNext={handleNext}
              />
            )}
            {Number(currentStep) === 2 && (
              <KycAddress
                sessionId={sessionId}
                initialData={kycData}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 3 && (
              <KycFamily
                sessionId={sessionId}
                initialData={familyInitialData}
                onNext={handleNext}
                onBack={handlePrev}
                gender={personalInfo.gender}
                maritalStatus={personalInfo.maritalStatus}
              />
            )}
            {Number(currentStep) === 4 && (
              <KycBank
                sessionId={sessionId}
                initialData={kycData?.bank}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 5 && (
              <KycOccupation
                sessionId={sessionId}
                initialData={kycData?.occupation}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 6 && (
              <KycInvestment
                sessionId={sessionId}
                initialData={kycData?.financialDetails}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 7 && (
              <KycTransaction
                sessionId={sessionId}
                initialData={kycData?.transactionInfo}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 8 && (
              <KycGuardian
                sessionId={sessionId}
                initialData={kycData?.guardian}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 9 && (
              <KycAml
                sessionId={sessionId}
                initialData={kycData?.amlCompliance}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 10 && (
              <KycLocation
                sessionId={sessionId}
                initialData={kycData?.locationMap}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 11 && (
              <KycLegal
                sessionId={sessionId}
                initialData={kycData?.declarations}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 12 && (
              <KycAgreement
                sessionId={sessionId}
                initialData={kycData?.agreement}
                onNext={handleNext}
                onBack={handlePrev}
              />
            )}
            {Number(currentStep) === 13 && (
              <KycAttachment
                sessionId={sessionId}
                onBack={handlePrev}
                onComplete={(mergedKycData) => {
                  setKycData(mergedKycData); // update the main kycData state
                  setCurrentStep(14);
                }}
                allKycFormData={kycData}
              />
            )}

            {Number(currentStep) === 14 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-12 h-12"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-4">
                  Application Submitted!
                </h2>
                <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                  Thank you for completing your KYC. Please review your details
                  and agree to the terms before final submission.
                </p>
                <button
                  onClick={() => setShowFinalModal(true)}
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg shadow-lg hover:bg-indigo-700 transition-all"
                >
                  Final Submit
                </button>
                <FinalReviewModal
                  open={showFinalModal}
                  onClose={() => setShowFinalModal(false)}
                  kycData={kycData}
                  pdfUrl="/terms.pdf"
                  onFinalSubmit={() => {
                    setShowFinalModal(false);
                    // Add your final submit logic here (e.g., API call, show success message, etc.)
                    window.location.reload();
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Legend */}
      <div className="mt-8 flex items-center justify-between text-sm text-gray-500 border-t pt-6">
        <div>
          Section {currentStepIndex + 1} of {totalVisibleSteps}
        </div>
        <div className="flex space-x-4">
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-indigo-600 mr-2"></span>{" "}
            Active
          </span>
          <span className="flex items-center">
            <span className="w-3 h-3 rounded-full bg-gray-200 mr-2"></span>{" "}
            Pending
          </span>
        </div>
      </div>
    </div>
  );
};

export default KycFormMaster;
