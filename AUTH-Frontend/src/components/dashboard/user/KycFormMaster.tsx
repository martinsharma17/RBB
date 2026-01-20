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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [showSuccess, setShowSuccess] = useState(false);
  const [hasManualReset, setHasManualReset] = useState(false);

  // Sync state with props when they change (e.g. starting a new session)
  useEffect(() => {
    setSessionId(initialSessionId);
    if (initialEmailVerified !== undefined) setIsEmailVerified(initialEmailVerified);
  }, [initialSessionId, initialEmailVerified]);

  // Fetch existing KYC data on load
  useEffect(() => {
    const fetchKyc = async () => {
      setLoading(true);
      try {
        let currentSessionId = sessionId;
        let emailVerified = isEmailVerified;

        // Step 1: Get/Create Session Metadata if not already provided (e.g. for logged in users)
        // Skip if we manually reset the session (prevent auto-loading the just-submitted session)
        // ALSO SKIP if user is a Maker/Checker/Admin, because they should NOT have a session for themselves.
        // They must search/verify client emails explicitly.
        const isStaff = user?.roles?.some((r: string) =>
          ['Checker', 'Maker', 'Superadmin', 'Admin'].includes(r)
        );

        if (token && !currentSessionId && !hasManualReset && !isStaff) {
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
  }, [token, apiBase, sessionId, isEmailVerified, hasManualReset]);

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

  const handleDownloadKycPdf = (data: any = null) => {
    const d = data || kycData;
    if (!d) return;
    const doc = new jsPDF();

    // Brand Header
    doc.setFillColor(79, 70, 229); // Indigo-600
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("KYC Application Details", 14, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 33);
    doc.text(`Session ID: ${sessionId}`, 150, 25, { align: "right" });
    if (d.email) doc.text(`Email: ${d.email}`, 150, 33, { align: "right" });

    let currentY = 50;

    const addSection = (title: string, data: any[][]) => {
      autoTable(doc, {
        startY: currentY,
        head: [[{ content: title, colSpan: 2, styles: { halign: 'left', fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' } }]],
        body: data,
        theme: 'grid',
        headStyles: { fillColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: 'bold', textColor: [107, 114, 128] }, // Label column
          1: { textColor: [31, 41, 55] } // Value column
        },
        styles: { fontSize: 9, cellPadding: 4 },
        margin: { left: 14, right: 14 },
        didDrawPage: (data) => {
          // Optional: Header/Footer on new pages
        }
      });
      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 15;
    };

    // 1. Personal Information
    const personalInfo = [
      ['Full Name', `${d.firstName || d.personalInfo?.firstName || ''} ${d.middleName || d.personalInfo?.middleName || ''} ${d.lastName || d.personalInfo?.lastName || ''}`],
      ['Date of Birth', new Date(d.dateOfBirth || d.personalInfo?.dateOfBirthAd).toLocaleDateString()],
      ['Gender', d.gender || d.personalInfo?.gender || '-'],
      ['Marital Status', d.maritalStatus || d.personalInfo?.maritalStatus || '-'],
      ['Nationality', d.nationality || d.personalInfo?.nationality || '-'],
      ['Citizenship No', d.citizenshipNumber || d.personalInfo?.citizenshipNo || '-'],
      ['PAN Number', d.panNumber || d.personalInfo?.panNo || '-'],
      ['Mobile Number', d.mobileNumber || '-']
    ];
    addSection("Personal Information", personalInfo);

    // 2. Addresses
    const addressInfo = [
      ['Permanent Address', `${d.permanentAddress?.tole || ''}, ${d.permanentAddress?.municipalityName || ''}-${d.permanentAddress?.wardNo || ''}, ${d.permanentAddress?.district || ''}, ${d.permanentAddress?.province || ''}`],
      ['Current Address', `${d.currentAddress?.tole || ''}, ${d.currentAddress?.municipalityName || ''}-${d.currentAddress?.wardNo || ''}, ${d.currentAddress?.district || ''}, ${d.currentAddress?.province || ''}`]
    ];
    addSection("Address Details", addressInfo);

    // 3. Family
    const familyInfo = [
      ['Grandfather', d.family?.grandFatherName || '-'],
      ['Father', d.family?.fatherName || '-'],
      ['Mother', d.family?.motherName || '-'],
      ['Spouse', d.family?.spouseName || '-']
    ];
    addSection("Family Information", familyInfo);

    // 4. Work & Financials
    const financialInfo = [
      ['Occupation', d.occupation?.occupationType || '-'],
      ['Organization', d.occupation?.organizationName || '-'],
      ['Annual Income', d.occupation?.annualIncomeRange || '-'],
      ['Bank', d.bank?.bankName || '-'],
      ['Account No', d.bank?.bankAccountNo || '-'],
      ['Source of Funds', d.sourceOfFunds || '-'],
      ['Major Income Source', d.majorSourceOfIncome || '-']
    ];
    addSection("Work & Financial Details", financialInfo);

    // 5. Declarations
    const declarations = [
      ['Politically Exposed (PEP)', d.isPep ? 'Yes' : 'No'],
      ['Beneficial Owner', d.hasBeneficialOwner ? 'Yes' : 'No'],
      ['Criminal Record', d.hasCriminalRecord ? 'Yes' : 'No'],
      ['Terms Agreed', 'Yes']
    ];
    addSection("Declarations & Compliance", declarations);

    // 6. Documents
    let docRows: any[] = [];
    if (d.attachments && Array.isArray(d.attachments) && d.attachments.length > 0) {
      const getDocName = (type: number) => {
        const map: any = { 1: 'Passport Photo', 2: 'Citizenship Front', 3: 'Citizenship Back', 4: 'Signature', 5: 'Left Thumb', 6: 'Right Thumb', 10: 'Location Map' };
        return map[type] || `Document ${type}`;
      };
      docRows = d.attachments.map((a: any) => [
        getDocName(a.documentType),
        a.documentName || '-'
      ]);
    } else if (d.documents) {
      // Fallback for local state structure
      if (d.documents.photo) docRows.push(['Passport Photo', d.documents.photo]);
      if (d.documents.citizenship?.front) docRows.push(['Citizenship Front', d.documents.citizenship.front]);
      if (d.documents.citizenship?.back) docRows.push(['Citizenship Back', d.documents.citizenship.back]);
      if (d.documents.signature) docRows.push(['Signature', d.documents.signature]);
      if (d.documents.thumbs?.left) docRows.push(['Left Thumb', d.documents.thumbs.left]);
      if (d.documents.thumbs?.right) docRows.push(['Right Thumb', d.documents.thumbs.right]);
    }

    if (docRows.length > 0) {
      addSection("Attached Documents", docRows);
    }

    doc.save(`KYC_Submission_${sessionId}.pdf`);
  };

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
            onVerified={(newSessionId) => {
              if (newSessionId) {
                // Ensure complete state reset for new session
                setLoading(true);
                setKycData(null);
                setCurrentStep(1);
                setSessionId(newSessionId);
                setHasManualReset(false); // Allow normal loading for the new session
              }
              setIsEmailVerified(true);
            }}
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
                existingImageUrl={kycData?.attachments?.find((a: any) => a.documentType === 10)?.filePath}
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
                  handleDownloadKycPdf(mergedKycData);
                  setShowSuccess(true);
                  setCurrentStep(99);
                }}
                allKycFormData={kycData}
              />
            )}
          </>
        )}
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center border border-gray-100 transform transition-all scale-100">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Submission Successful
            </h2>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Your KYC application has been successfully submitted for review.
            </p>
            <button
              className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-200 active:scale-95"
              onClick={() => {
                // Return to initial state (Verification Screen)
                localStorage.removeItem("kyc_session_id");
                localStorage.removeItem("kyc_email_verified");

                setHasManualReset(true);
                setSessionId(null);
                setIsEmailVerified(false);
                setKycData(null);
                setCurrentStep(1);
                setShowSuccess(false);
              }}
            >
              Start New Application
            </button>
          </div>
        </div>
      )}

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
