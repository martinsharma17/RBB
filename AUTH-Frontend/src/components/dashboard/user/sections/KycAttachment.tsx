import React, { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import KycSummaryReview from "./KycSummaryReview";
import AgreementModal from "./AgreementModal";
import { CheckCircle2 } from "lucide-react";

export interface KycAttachmentProps {
  sessionId: number | null;
  onBack: () => void;
  onComplete?: (mergedKycData: any) => void;
  onSuccess?: (kycData: any) => void;
  allKycFormData?: any;
}

const KycAttachment: React.FC<KycAttachmentProps> = ({
  sessionId,
  onBack,
  onSuccess,
  onComplete,
  allKycFormData,
}) => {
  const { token, apiBase } = useAuth();
  const navigate = useNavigate();

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // files
  const [photo, setPhoto] = useState<File | null>(null);
  const [citFront, setCitFront] = useState<File | null>(null);
  const [citBack, setCitBack] = useState<File | null>(null);

  // Flow states
  const [currentStep, setCurrentStep] = useState<'upload' | 'summary' | 'agreement' | 'success'>('upload');
  const [kycReviewData, setKycReviewData] = useState<any>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(false);

  const parseError = async (res: Response, fallback: string) => {
    try {
      const text = await res.text();
      if (!text) return fallback;
      const data = JSON.parse(text);
      return data.message || data.Message || fallback;
    } catch {
      return fallback;
    }
  };

  const uploadFile = async (file: File, type: number) => {
    const formData = new FormData();
    formData.append("sessionId", sessionId!.toString());
    formData.append("documentType", type.toString());
    formData.append("file", file);

    const headers: any = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${apiBase}/api/KycData/upload-document`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      throw new Error(await parseError(res, "Upload failed"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!photo || !citFront || !citBack) {
      setError("Please upload all required documents.");
      return;
    }

    if (!sessionId) {
      setError("Session not initialized correctly.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      await uploadFile(photo, 1);
      await uploadFile(citFront, 2);
      await uploadFile(citBack, 3);

      // Merge allKycFormData with backend data
      let reviewData: any = allKycFormData
        ? {
          ...allKycFormData,
          sessionId,
          documents: {
            photo: photo.name,
            citizenship: {
              front: citFront.name,
              back: citBack.name,
            },
          },
        }
        : {
          sessionId,
          documents: {
            photo: photo.name,
            citizenship: {
              front: citFront.name,
              back: citBack.name,
            },
          },
        };

      try {
        const res = await fetch(
          `${apiBase}/api/KycData/all-details/${sessionId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const backendRes = await res.json();
        if (backendRes.success) {
          reviewData = { ...reviewData, ...backendRes.data };
        }
      } catch { }

      setKycReviewData(reviewData);
      setCurrentStep('summary'); // Move to summary view
    } catch (err: any) {
      setError(err.message || "Upload failed");
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
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${apiBase}/api/Kyc/submit/${sessionId}`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        throw new Error(await parseError(res, "Final submission failed"));
      }

      localStorage.removeItem("kyc_session_id");
      localStorage.removeItem("kyc_email_verified");

      setShowAgreementModal(false);
      setCurrentStep('success');
      if (onComplete) onComplete(kycReviewData);
      if (onSuccess) onSuccess(kycReviewData);
    } catch (err: any) {
      setError(err.message || "Final submission failed");
      setShowAgreementModal(false);
    }
  };

  // Render based on current step
  if (currentStep === 'summary') {
    return (
      <>
        <KycSummaryReview
          kycData={kycReviewData}
          onNext={handleNextFromSummary}
          onBack={() => setCurrentStep('upload')}
        />
        <AgreementModal
          open={showAgreementModal}
          onClose={() => setShowAgreementModal(false)}
          onAgree={handleAgree}
          kycData={kycReviewData}
          sessionId={sessionId}
        />
      </>
    );
  }

  if (currentStep === 'success') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl text-center animate-fade-in">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-200">
            <CheckCircle2 className="w-14 h-14 text-white" />
          </div>
          <h2 className="text-4xl font-black text-slate-800 mb-4">
            Successfully Submitted!
          </h2>
          <p className="text-xl text-slate-600 mb-8 leading-relaxed">
            Your KYC application has been submitted successfully.<br />
            Our team will review your application and contact you soon.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              Application ID: <span className="font-mono font-bold text-indigo-600">#{sessionId}</span>
            </p>
            <p className="text-sm text-slate-500">
              You will receive a confirmation email shortly.
            </p>
          </div>
          <button
            className="mt-8 px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
            onClick={() => {
              navigate("/login");
            }}
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // Default: Upload step
  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
            ["Passport Size Photo", setPhoto],
            ["Citizenship Front", setCitFront],
            ["Citizenship Back", setCitBack],
          ].map(([label, setter]: any, i) => (
            <div
              key={i}
              className="p-4 border border-dashed rounded hover:border-indigo-400"
            >
              <label className="block font-semibold mb-2">{label} *</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setter(e.target.files?.[0] || null)}
                className="w-full text-sm file:bg-indigo-50 file:text-indigo-700 file:rounded"
              />
            </div>
          ))}
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
            {uploading ? "Uploading..." : "Final Submit"}
          </button>
        </div>
      </form>
    </>
  );
};

export default KycAttachment;
