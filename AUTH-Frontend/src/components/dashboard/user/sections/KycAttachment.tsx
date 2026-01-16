import React, { useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import FinalReviewModal from "./FinalReviewModel";
import { useNavigate } from "react-router-dom";

 export interface KycAttachmentProps {
  sessionId: number | null;
  onBack: () => void;
  onComplete?: (mergedKycData:any) => void;
  onSuccess?: (kycData: any) => void;
  allKycFormData?: any;
}

const KycAttachment: React.FC<KycAttachmentProps> = ({
  sessionId,
  onBack,
  onSuccess,
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

  // review modal
  const [showReview, setShowReview] = useState(false);
  const [kycReviewData, setKycReviewData] = useState<any>(null);

  // thank you message
  const [showThankYou, setShowThankYou] = useState(false);

  const parseError = async (res: Response, fallback: string) => {
    try {
      const text = await res.text();
      if (!text) return fallback;
      return JSON.parse(text).message || fallback;
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
          `${apiBase}/api/KycData/get-session/${sessionId}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        const backendData = await res.json();
        reviewData = { ...reviewData, ...backendData };
      } catch {}

      setKycReviewData(reviewData);
      setShowReview(true);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleFinalSubmit = async () => {
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

      setShowReview(false);
      setShowThankYou(true);
      if (onSuccess) onSuccess(kycReviewData);
    } catch (err: any) {
      setError(err.message || "Final submission failed");
      setShowReview(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="border-b pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Section 9: Attachments & Finish
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
            className={`px-10 py-3 bg-green-600 text-white rounded font-bold ${
              uploading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {uploading ? "Uploading..." : "Final Submit"}
          </button>
        </div>
      </form>

      {/* Final Review Modal */}
      <FinalReviewModal
        open={showReview}
        onClose={() => setShowReview(false)}
        kycData={kycReviewData}
        pdfUrl="/terms.pdf"
        onFinalSubmit={handleFinalSubmit}
      />

      {/* Thank You Message */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              Thank You!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Your KYC form has been submitted successfully.
            </p>
            <button
              className="px-6 py-2 bg-indigo-600 text-white rounded font-semibold"
              onClick={() => {
                setShowThankYou(false);
                navigate("/login"); // or "/email-verification"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default KycAttachment;
