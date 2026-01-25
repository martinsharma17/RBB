import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import KycSummaryReview from "./KycSummaryReview";
import AgreementModal from "./AgreementModal";
import api from "../../../../services/api";

export interface KycAttachmentProps {
  sessionToken: string | null;
  onBack: () => void;
  onComplete?: (mergedKycData: any) => void;
  onSuccess?: (kycData: any) => void;
  allKycFormData?: any;
  onSaveAndExit?: () => void;
}

const KycAttachment: React.FC<KycAttachmentProps> = ({
  sessionToken,
  onBack,
  onSuccess,
  onComplete,
  allKycFormData,
  onSaveAndExit,
}) => {
  const { apiBase } = useAuth();
  const navigate = useNavigate();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // files
  const [photo, setPhoto] = useState<File | null>(null);
  const [citFront, setCitFront] = useState<File | null>(null);
  const [citBack, setCitBack] = useState<File | null>(null);
  const [leftThumb, setLeftThumb] = useState<File | null>(null);
  const [rightThumb, setRightThumb] = useState<File | null>(null);
  const [signature, setSignature] = useState<File | null>(null);

  // Flow states
  const [currentStep, setCurrentStep] = useState<'upload' | 'summary' | 'agreement' | 'success'>('upload');
  const [kycReviewData, setKycReviewData] = useState<any>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);
  const [backendData, setBackendData] = useState<any>(null);

  // Fetch existing data on mount to ensure we have latest attachments
  useEffect(() => {
    const fetchLatest = async () => {
      if (!sessionToken) return;
      try {
        const res = await api.get(`/api/KycData/all-details-by-token/${sessionToken}`);
        if (res.data.success) {
          setBackendData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      }
    };
    fetchLatest();
  }, [sessionToken]);

  // Helper to check if a document type already exists in backend data
  const getExistingDoc = (type: number) => {
    const source = backendData || allKycFormData;
    return source?.attachments?.find((a: any) => a.documentType === type);
  };

  const uploadFile = async (file: File, type: number) => {
    const formData = new FormData();
    formData.append("sessionToken", sessionToken!);
    formData.append("documentType", type.toString());
    formData.append("file", file);

    const res = await api.post(`/api/KycData/upload-document`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!res.data.success) {
      throw new Error(res.data.message || "Upload failed");
    }
  };


  const handleSubmit = async (e: React.FormEvent | null, shouldExit: boolean = false) => {
    if (e) e.preventDefault();

    // Check if we have either a NEW file or an EXISTING record for all required fields
    const hasPhoto = photo || getExistingDoc(1);
    const hasCitFront = citFront || getExistingDoc(2);
    const hasCitBack = citBack || getExistingDoc(3);
    const hasSignature = signature || getExistingDoc(4);
    const hasLeftThumb = leftThumb || getExistingDoc(5);
    const hasRightThumb = rightThumb || getExistingDoc(6);

    if (!hasPhoto || !hasCitFront || !hasCitBack || !hasLeftThumb || !hasRightThumb || !hasSignature) {
      setError("Please upload all required documents: Photo, Citizenship Front/Back, Thumbs, and Signature.");
      return;
    }

    if (!sessionToken) {
      setError("Session token not found");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Only upload if a NEW file was selected
      if (photo) await uploadFile(photo, 1);
      if (citFront) await uploadFile(citFront, 2);
      if (citBack) await uploadFile(citBack, 3);
      if (signature) await uploadFile(signature, 4);
      if (leftThumb) await uploadFile(leftThumb, 5);
      if (rightThumb) await uploadFile(rightThumb, 6);

      // Fetch latest data from backend after uploads to get updated attachment list
      let reviewData: any = { ...allKycFormData };
      try {
        const res = await api.get(`/api/KycData/all-details-by-token/${sessionToken}`);
        if (res.data.success) {
          reviewData = { ...res.data.data };
          setBackendData(res.data.data); // Update local cache to sync UI if user goes back
        }
      } catch (err) {
        console.error("Failed to fetch updated kyc details:", err);
      }

      if (shouldExit && onSaveAndExit) {
        onSaveAndExit();
      } else {
        setKycReviewData(reviewData);
        setCurrentStep('summary');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleNextFromSummary = () => {
    // Show agreement modal
    setShowAgreementModal(true);
  };

  const handleAgree = async () => {
    try {
      const res = await api.post(`/api/Kyc/submit-by-token`, { sessionToken });

      if (!res.data.success) {
        throw new Error(res.data.message || "Final submission failed");
      }

      localStorage.removeItem("kyc_session_id");
      localStorage.removeItem("kyc_session_token");
      localStorage.removeItem("kyc_email_verified");

      setShowAgreementModal(false);
      setCurrentStep('success');
      if (onComplete) onComplete(kycReviewData);
      if (onSuccess) onSuccess(kycReviewData);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Final submission failed");
      setShowAgreementModal(false);
    }
  };

  // Render based on current step
  if (currentStep === 'summary') {
    return (
      <>
        <KycSummaryReview
          kycData={kycReviewData}
          apiBase={apiBase}
          onNext={handleNextFromSummary}
          onBack={() => setCurrentStep('upload')}
        />
        <AgreementModal
          open={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          onAgree={handleAgree}
          kycData={kycReviewData}
          sessionToken={sessionToken}
        />
      </>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-xl p-8 max-w-sm w-full text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Successful
          </h2>
          <p className="text-gray-600 mb-6">
            Your KYC details have been submitted.
          </p>
          <button
            className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            onClick={() => {
              navigate("/login");
            }}
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Default: Upload step
  return (
    <>
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6" noValidate>
        <div className="border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Section 13: Attachments & Finish
          </h2>
          <p className="text-sm text-gray-500">
            Upload your documents to complete the process.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded border">
            {error}
          </div>
        )}

        {/* Upload fields */}
        <div className="grid gap-6">
          {[
            ["Passport Size Photo", setPhoto, 1],
            ["Citizenship Front", setCitFront, 2],
            ["Citizenship Back", setCitBack, 3],
            ["Signature", setSignature, 4],
            ["Left Thumbprint", setLeftThumb, 5],
            ["Right Thumbprint", setRightThumb, 6],
          ].map(([label, setter, type]: any, i) => {
            const existing = getExistingDoc(type);
            return (
              <div
                key={i}
                className={`p-4 border rounded-xl transition-all ${existing ? "bg-green-50/30 border-green-200" : "border-slate-200 border-dashed hover:border-indigo-400"}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <label className="block font-bold text-slate-700">{label} *</label>
                  {existing && (
                    <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Previously Uploaded
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setter(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-all cursor-pointer"
                    />
                    {existing && !setter.value && (
                      <p className="mt-2 text-xs text-slate-400 italic flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Current: {existing.documentName || existing.originalFileName || "document.jpg"}
                      </p>
                    )}
                  </div>

                  {existing && (
                    <div className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden bg-white flex-shrink-0">
                      <img
                        src={`${apiBase}${existing.filePath}`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as any).src = "https://via.placeholder.com/50?text=Doc";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 border rounded"
          >
            Back
          </button>

          <button
            type="submit"
            disabled={uploading}
            className={`px-10 py-3 bg-green-600 text-white rounded font-bold ${uploading ? "opacity-50 cursor-not-allowed" : ""
              }`}
          >
            {uploading ? "Uploading..." : "Save & Preview"}
          </button>

        </div>
      </form>
    </>
  );
};

export default KycAttachment;
