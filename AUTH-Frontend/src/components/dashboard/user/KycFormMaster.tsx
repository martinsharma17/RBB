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
  const [pdfGenerating, setPdfGenerating] = useState(false);

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
        // 
        // IMPORTANT: Staff users should NOT auto-load their own session
        // Staff members need to enter a CUSTOMER's email to access that customer's KYC
        // Only non-staff (customers) should have their own session auto-loaded
        const isStaff = !!token && !!user; // Any authenticated user is staff

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
              // Map Backend Step -> Frontend Step
              // Backend: 1=PersonalInfo, 2=CurrAddr, 3=PermAddr, 4=Family, 5=Bank, 6=Occupation...
              // Frontend: 1=Personal, 2=Address(2&3), 3=Family(4), 4=Bank(5), 5=Occupation(6)...
              const stepFromApi = detailsRes.data.CurrentStep || detailsRes.data.currentStep;
              if (stepFromApi !== undefined && stepFromApi !== null) {
                const bStep = Number(stepFromApi);
                let fStep = 1;
                if (bStep <= 1) fStep = 1;
                else if (bStep <= 3) fStep = 2; // Both addresses in section 2
                else fStep = bStep - 1; // Offset of 1 for subsequent steps

                setCurrentStep(fStep);
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

  const handleDownloadKycPdf = async (data: any = null) => {
    const d = data || kycData;
    if (!d) return;
    setPdfGenerating(true);
    const doc = new jsPDF();

    // Helper: Fetch image as Base64 for PDF embedding
    const getImageBase64 = async (path: string): Promise<string | null> => {
      try {
        const url = path.startsWith('http') ? path : `${apiBase}${path}`;
        const response = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!response.ok) return null;
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      } catch (err) {
        console.error("Failed to fetch image for PDF:", err);
        return null;
      }
    };

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
          0: { cellWidth: 70, fontStyle: 'bold', textColor: [107, 114, 128] }, // Label column
          1: { textColor: [31, 41, 55] } // Value column
        },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 14, right: 14 },
      });
      // @ts-ignore
      currentY = doc.lastAutoTable.finalY + 10;
    };

    // 1. Personal Information
    const p = d.personalInfo || d;
    const personalInfo = [
      ['Full Name', `${p.firstName || ''} ${p.middleName || ''} ${p.lastName || ''}`.trim() || p.fullName || '-'],
      ['Date of Birth (AD)', p.dateOfBirthAd ? new Date(p.dateOfBirthAd).toLocaleDateString() : (p.dateOfBirth ? new Date(p.dateOfBirth).toLocaleDateString() : '-')],
      ['Gender', p.gender === 1 ? 'Male' : (p.gender === 2 ? 'Female' : (p.gender === 3 ? 'Other' : (p.gender || '-')))],
      ['Marital Status', p.maritalStatus || '-'],
      ['Nationality', p.nationality || (p.isNepali ? 'Nepali' : (p.otherNationality || '-'))],
      ['Citizenship No', p.citizenshipNo || p.citizenshipNumber || '-'],
      ['National ID (NID)', p.nidNo || p.nidNumber || '-'],
      ['PAN Number', p.panNo || p.panNumber || '-'],
      ['Mobile Number', d.mobileNumber || p.mobileNumber || '-']
    ];
    addSection("1. Personal Information", personalInfo);

    // 2. Addresses
    const ca = d.currentAddress || {};
    const pa = d.permanentAddress || {};
    const addressInfo = [
      ['Current Address', `${ca.country || 'Nepal'}: ${ca.province || ''}, ${ca.district || ''}, ${ca.municipalityName || ''}, Ward ${ca.wardNo || ''}, ${ca.tole || ''}`],
      ['Permanent Address', pa.fullAddress || `${pa.country || 'Nepal'}: ${pa.province || ''}, ${pa.district || ''}, ${pa.municipalityName || ''}, Ward ${pa.wardNo || ''}, ${pa.tole || ''}`]
    ];
    addSection("2. Address Details", addressInfo);

    // 3. Family
    const f = d.family || {};
    const familyInfo = [
      ['Grandfather', f.grandFatherName || '-'],
      ['Father', f.fatherName || '-'],
      ['Mother', f.motherName || '-'],
      ['Spouse', f.spouseName || '-'],
      ['Father-in-law', f.fatherInLawName || '-'],
      ['Mother-in-law', f.motherInLawName || '-'],
      ['Children', f.childrenNames || '-']
    ];
    addSection("3. Family Information", familyInfo);

    // 4. Occupations & Financials
    const occ = d.occupation || {};
    const fin = d.financialDetails || {};
    const financialInfo = [
      ['Occupation', occ.occupationType || '-'],
      ['Organization', occ.organizationName || '-'],
      ['Designation', occ.designation || '-'],
      ['Annual Income Range', occ.annualIncomeRange || fin.annualIncomeRange || '-'],
      ['Bank Name', d.bank?.bankName || '-'],
      ['Bank Account No', d.bank?.bankAccountNo || d.bank?.bankAccountNumber || '-'],
      ['Bank Address', d.bank?.bankAddress || d.bank?.bankBranch || '-']
    ];
    addSection("4. Work & Financial Details", financialInfo);

    // 5. AML & Compliance
    const aml = d.amlCompliance || {};
    const amlInfo = [
      ['Politically Exposed (PEP)', aml.isPoliticallyExposedPerson ? `Yes (${aml.pepRelationName || '-'})` : 'No'],
      ['Beneficial Owner', aml.hasBeneficialOwner ? `Yes (${aml.beneficialOwnerDetails || '-'})` : 'No'],
      ['Criminal Record', aml.hasCriminalRecord ? `Yes (${aml.criminalRecordDetails || '-'})` : 'No']
    ];
    addSection("5. AML & Compliance", amlInfo);

    // 6. Location & Landmark
    const loc = d.locationMap || {};
    const locationInfo = [
      ['Landmark', loc.landmark || '-'],
      ['Distance from Road', loc.distanceFromMainRoad || '-'],
      ['Latitude', loc.latitude || '-'],
      ['Longitude', loc.longitude || '-']
    ];
    addSection("6. Location Details", locationInfo);

    // 7. Documents Page(s)
    let attachments = d.attachments || [];

    // Filter out duplicates (only keep the latest for each documentType)
    const uniqueAttachments = new Map();
    attachments.forEach((att: any) => {
      // If multiple exist, the later ones in the array (usually newer) will overwrite
      uniqueAttachments.set(att.documentType, att);
    });
    attachments = Array.from(uniqueAttachments.values());

    if (attachments.length > 0) {
      doc.addPage();
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("KYC Supporting Documents", 14, 20);
      doc.setDrawColor(79, 70, 229);
      doc.line(14, 24, 60, 24);

      let imgY = 35;
      const getDocName = (type: number) => {
        const map: any = { 1: 'Passport Photo', 2: 'Citizenship Front', 3: 'Citizenship Back', 4: 'Signature', 5: 'Left Thumb', 6: 'Right Thumb', 10: 'Location Map' };
        return map[type] || `Document ${type}`;
      };

      for (const att of attachments) {
        const base64 = await getImageBase64(att.filePath);
        if (base64) {
          // Add label
          doc.setTextColor(31, 41, 55);
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.text(getDocName(att.documentType), 14, imgY);

          // Check if space remains on page
          if (imgY + 80 > 280) {
            doc.addPage();
            imgY = 20;
          }

          try {
            // Embed image
            doc.addImage(base64, 'JPEG', 14, imgY + 5, 80, 60);
            imgY += 80;
          } catch (e) {
            console.error("Error adding image to PDF:", e);
            imgY += 20;
          }
        }
      }
    }

    doc.save(`KYC_Full_Details_${sessionId}_${new Date().getTime()}.pdf`);
    setPdfGenerating(false);
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

  const handleSaveAndExit = () => {
    // Return to initial state (Verification Screen)
    localStorage.removeItem("kyc_session_id");
    localStorage.removeItem("kyc_email_verified");

    setHasManualReset(true);
    setSessionId(null);
    setIsEmailVerified(false);
    setKycData(null);
    setCurrentStep(1);
    setShowSuccess(false);
  };

  const personalInfo = kycData?.personalInfo || {};
  const familyInitialData = kycData?.family || {};

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      {/* Header / Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Know Your Customer (KYC)
            </h1>

            <p className="text-gray-500">
              Please complete all {totalVisibleSteps} sections to verify your identity.
            </p>
          </div>
          {isEmailVerified && (
            <button
              onClick={handleSaveAndExit}
              className="px-4 py-2 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-sm font-bold hover:bg-amber-100 transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Save & Exit
            </button>
          )}
        </div>

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
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 2 && (
              <KycAddress
                sessionId={sessionId}
                initialData={kycData}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 3 && (
              <KycFamily
                sessionId={sessionId}
                initialData={familyInitialData}
                onNext={handleNext}
                onBack={handlePrev}
                maritalStatus={personalInfo.maritalStatus}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 4 && (
              <KycBank
                sessionId={sessionId}
                initialData={kycData?.bank}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 5 && (
              <KycOccupation
                sessionId={sessionId}
                initialData={kycData?.occupation}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 6 && (
              <KycInvestment
                sessionId={sessionId}
                initialData={kycData?.financialDetails}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 7 && (
              <KycTransaction
                sessionId={sessionId}
                initialData={kycData?.transactionInfo}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 8 && (
              <KycGuardian
                sessionId={sessionId}
                initialData={kycData?.guardian}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 9 && (
              <KycAml
                sessionId={sessionId}
                initialData={kycData?.amlCompliance}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 10 && (
              <KycLocation
                sessionId={sessionId}
                initialData={kycData?.locationMap}
                existingImageUrl={kycData?.attachments?.find((a: any) => a.documentType === 10)?.filePath}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 11 && (
              <KycLegal
                sessionId={sessionId}
                initialData={kycData?.declarations}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
              />
            )}
            {Number(currentStep) === 12 && (
              <KycAgreement
                sessionId={sessionId}
                initialData={kycData?.agreement}
                onNext={handleNext}
                onBack={handlePrev}
                onSaveAndExit={handleSaveAndExit}
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
                onSaveAndExit={handleSaveAndExit}
              />
            )}
          </>
        )}
      </div>

      {pdfGenerating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-indigo-900/20 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-2xl shadow-2xl flex flex-col items-center border border-indigo-100">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-indigo-900 font-bold">Preparing KYC PDF with Documents...</p>
            <p className="text-gray-500 text-xs mt-1">Fetching images, please wait.</p>
          </div>
        </div>
      )}

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
