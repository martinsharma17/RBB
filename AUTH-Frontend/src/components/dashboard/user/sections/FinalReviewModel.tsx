import React, { useRef, useState, useCallback, useEffect, JSX } from "react";
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import { DocumentLoadEvent } from "@react-pdf-viewer/core";

interface FinalReviewModalProps {
  open: boolean;
  onClose: () => void;
  kycData: Record<string, any>;
  pdfUrl: string;
  onFinalSubmit: () => void;
}

const renderFields = (data: any, level = 0): JSX.Element[] | null => {
  if (!data) return null;
  return Object.entries(data).map(([key, value]) => {
    const paddingLeft = Math.min(level * 16, 48);
    if (typeof value === "object" && value !== null) {
      return (
        <React.Fragment key={key}>
          <tr>
            <td
              style={{ paddingLeft }}
              className="font-semibold py-2 text-indigo-700"
            >
              {key}
            </td>
            <td />
          </tr>
          {renderFields(value, level + 1)}
        </React.Fragment>
      );
    }
    return (
      <tr key={key} className="border-b last:border-none">
        <td style={{ paddingLeft }} className="font-medium py-2 text-gray-700">
          {key}
        </td>
        <td className="py-2 text-gray-900">{value?.toString() || "-"}</td>
      </tr>
    );
  });
};

const FinalReviewModal: React.FC<FinalReviewModalProps> = ({
  open,
  onClose,
  kycData,
  pdfUrl,
  onFinalSubmit,
}) => {
  const pdfRef = useRef<HTMLDivElement>(null);

  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [pdfError, setPdfError] = useState(false);

  const handleScroll = useCallback(() => {
    const el = pdfRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 5) {
      setScrolledToEnd(true);
    }
  }, []);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setScrolledToEnd(false);
      setAgreed(false);
      setPdfError(false);
    }
  }, [open, pdfUrl]);

  // Poll for PDF error message in the DOM
  useEffect(() => {
    if (!open || !pdfRef.current) return;
    setPdfError(false);
    const interval = setInterval(() => {
      const el = pdfRef.current;
      if (!el) return;
      // Look for error message in the PDF viewer
      if (
        el.textContent?.includes("Invalid PDF structure") ||
        el.querySelector(
          ".rpv-core__viewer-error, .rpv-default-layout__message--error"
        )
      ) {
        setPdfError(true);
        clearInterval(interval);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [open, pdfUrl]);

  if (!open) return null;

  const canAgree = scrolledToEnd || pdfError;
  const canSubmit = agreed && canAgree;
  const handlePdfLoaded = (e: DocumentLoadEvent) => {
    // Enable agreement as soon as PDF loads
    setScrolledToEnd(true);
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-indigo-700">Final Review</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KYC Details */}
          <section className="bg-gray-50 rounded-lg p-4 border">
            <h3 className="text-lg font-semibold text-indigo-600 mb-3">
              Your KYC Details
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>{renderFields(kycData)}</tbody>
              </table>
            </div>
          </section>

          {/* Terms & Conditions */}
          <section className="space-y-3">
            <h3 className="text-lg font-semibold text-indigo-600">
              Terms & Conditions
            </h3>

            <div
              ref={pdfRef}
              onScroll={handleScroll}
              className="relative h-[300px] border rounded-lg overflow-y-auto bg-white shadow-inner"
            >
              {!pdfError && (
                <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
                  <Viewer
                    fileUrl={pdfUrl}
                    onDocumentLoad={handlePdfLoaded}
                    defaultScale={SpecialZoomLevel.PageFit}
                  />
                </Worker>
              )}
              {pdfError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                  <p className="text-sm text-red-600 font-medium">
                    Unable to load PDF. Agreement enabled manually.
                  </p>
                </div>
              )}
            </div>

            {/* Agreement */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="agree"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                disabled={!canAgree}
                className="h-4 w-4 accent-indigo-600"
              />
              <label
                htmlFor="agree"
                className={`text-sm ${
                  canAgree ? "text-gray-800" : "text-gray-400"
                }`}
              >
                I have read and agree to the Terms & Conditions
              </label>
            </div>

            {!canAgree && (
              <p className="text-xs text-gray-500">
                Please scroll to the bottom to enable agreement.
              </p>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <button
            disabled={!canSubmit}
            onClick={onFinalSubmit}
            className={`px-6 py-2 rounded-lg font-semibold transition
              ${
                canSubmit
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
          >
            Final Submit
          </button>
        </div>
      </div>
    </div>
  );
};

export default FinalReviewModal;
