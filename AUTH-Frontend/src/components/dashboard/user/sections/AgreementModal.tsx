import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Download, FileText, AlertCircle } from 'lucide-react';

interface AgreementModalProps {
    open: boolean;
    onClose: () => void;
    onAgree: () => void;
    kycData: any;
    sessionId: number | null;
}

const AgreementModal: React.FC<AgreementModalProps> = ({ open, onClose, onAgree, kycData, sessionId }) => {
    const [scrolledToEnd, setScrolledToEnd] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (open) {
            setScrolledToEnd(false);
            setAgreed(false);
        }
    }, [open]);

    const handleScroll = () => {
        const el = scrollRef.current;
        if (!el) return;
        // Check if scrolled to bottom (with 10px tolerance)
        if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10) {
            setScrolledToEnd(true);
        }
    };

    const downloadCSV = () => {
        setDownloading(true);
        try {
            // Flatten the KYC data for CSV
            const flattenObject = (obj: any, prefix = ''): any => {
                return Object.keys(obj).reduce((acc: any, key) => {
                    const value = obj[key];
                    const newKey = prefix ? `${prefix}_${key}` : key;

                    if (value && typeof value === 'object' && !Array.isArray(value)) {
                        Object.assign(acc, flattenObject(value, newKey));
                    } else {
                        acc[newKey] = value;
                    }
                    return acc;
                }, {});
            };

            const flatData = flattenObject(kycData);

            // Create CSV content
            const headers = Object.keys(flatData);
            const values = Object.values(flatData);

            const csvContent = [
                headers.join(','),
                values.map(v => `"${v || ''}"`).join(',')
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `KYC_Application_${sessionId}_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error downloading CSV:', error);
            alert('Failed to download CSV file');
        } finally {
            setDownloading(false);
        }
    };

    if (!open) return null;

    const canAgree = scrolledToEnd;
    const canSubmit = agreed && canAgree;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                                <FileText className="w-7 h-7" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black">Terms & Conditions</h2>
                                <p className="text-indigo-100 text-sm mt-1">Please read carefully before proceeding</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white text-3xl font-light leading-none"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {/* Download CSV Button */}
                <div className="px-8 py-4 bg-indigo-50 border-b border-indigo-100">
                    <button
                        onClick={downloadCSV}
                        disabled={downloading}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-indigo-200 text-indigo-700 rounded-xl font-bold hover:bg-indigo-50 transition-all shadow-sm disabled:opacity-50"
                    >
                        <Download className="w-5 h-5" />
                        {downloading ? 'Downloading...' : 'Download Your KYC Data (CSV)'}
                    </button>
                    <p className="text-xs text-indigo-600 text-center mt-2">Download a copy of your submitted information for your records</p>
                </div>

                {/* Terms Content */}
                <div
                    ref={scrollRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto p-8 bg-slate-50"
                >
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 prose prose-sm max-w-none">
                        <h3 className="text-xl font-black text-slate-800 mb-4">User Agreement & Terms of Service</h3>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">1. Acceptance of Terms</h4>
                        <p className="text-slate-600 leading-relaxed">
                            By submitting this KYC (Know Your Customer) application, you acknowledge that you have read, understood, and agree to be bound by these terms and conditions. This agreement constitutes a legally binding contract between you and Rastriya Banijya Bank.
                        </p>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">2. Information Accuracy</h4>
                        <p className="text-slate-600 leading-relaxed">
                            You hereby declare and confirm that all information provided in this KYC application is true, accurate, complete, and up-to-date. You understand that providing false or misleading information may result in the rejection of your application and may constitute a criminal offense under applicable laws.
                        </p>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">3. Data Privacy & Protection</h4>
                        <p className="text-slate-600 leading-relaxed">
                            We are committed to protecting your personal information. Your data will be processed in accordance with applicable data protection laws and regulations. We will use your information solely for the purposes of:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                            <li>Verifying your identity and eligibility</li>
                            <li>Complying with legal and regulatory requirements</li>
                            <li>Preventing fraud and money laundering</li>
                            <li>Providing you with our services</li>
                            <li>Communicating with you regarding your application</li>
                        </ul>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">4. Consent for Information Sharing</h4>
                        <p className="text-slate-600 leading-relaxed">
                            You consent to the sharing of your information with:
                        </p>
                        <ul className="list-disc pl-6 text-slate-600 space-y-1">
                            <li>Regulatory authorities and government agencies as required by law</li>
                            <li>Credit bureaus and financial institutions for verification purposes</li>
                            <li>Third-party service providers who assist in processing your application</li>
                            <li>Law enforcement agencies in case of suspected illegal activities</li>
                        </ul>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">5. Anti-Money Laundering (AML) Compliance</h4>
                        <p className="text-slate-600 leading-relaxed">
                            You acknowledge that we are required to comply with anti-money laundering and counter-terrorism financing regulations. You agree to provide additional information or documentation if requested for AML compliance purposes.
                        </p>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">6. Document Verification</h4>
                        <p className="text-slate-600 leading-relaxed">
                            All documents submitted as part of this application may be verified with issuing authorities. You authorize us to conduct such verification checks and to retain copies of your documents for our records.
                        </p>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">7. Right to Reject</h4>
                        <p className="text-slate-600 leading-relaxed">
                            We reserve the right to reject any application at our sole discretion, without providing reasons for such rejection. In case of rejection, you will be notified, and your information will be retained as per our data retention policy.
                        </p>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">8. Updates and Modifications</h4>
                        <p className="text-slate-600 leading-relaxed">
                            You agree to promptly notify us of any changes to the information provided in this application. Failure to update your information may result in service interruption or account closure.
                        </p>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">9. Liability and Indemnification</h4>
                        <p className="text-slate-600 leading-relaxed">
                            You agree to indemnify and hold harmless Rastriya Banijya Bank, its officers, employees, and agents from any claims, damages, or losses arising from your provision of false information or breach of these terms.
                        </p>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">10. Governing Law</h4>
                        <p className="text-slate-600 leading-relaxed">
                            This agreement shall be governed by and construed in accordance with the laws of Nepal. Any disputes arising from this agreement shall be subject to the exclusive jurisdiction of the courts of Nepal.
                        </p>

                        <h4 className="font-bold text-slate-700 mt-6 mb-2">11. Electronic Signature</h4>
                        <p className="text-slate-600 leading-relaxed">
                            By clicking "I Agree and Submit" below, you acknowledge that your electronic acceptance constitutes your legal signature and has the same legal effect as a handwritten signature.
                        </p>

                        <div className="mt-8 p-6 bg-amber-50 border-2 border-amber-200 rounded-xl">
                            <p className="text-sm font-bold text-amber-800">
                                ⚠️ IMPORTANT: Please scroll to the bottom of this document to enable the agreement checkbox.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Agreement Checkbox & Submit */}
                <div className="p-6 bg-white border-t border-slate-200">
                    {!scrolledToEnd && (
                        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                            <p className="text-sm text-yellow-800 font-medium">
                                Please scroll to the bottom of the terms and conditions to continue
                            </p>
                        </div>
                    )}

                    {scrolledToEnd && (
                        <div className="flex items-start gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                            <input
                                type="checkbox"
                                id="agree-checkbox"
                                checked={agreed}
                                onChange={(e) => setAgreed(e.target.checked)}
                                className="mt-1 h-5 w-5 accent-indigo-600 cursor-pointer"
                            />
                            <label
                                htmlFor="agree-checkbox"
                                className="text-sm font-medium cursor-pointer text-slate-800"
                            >
                                I have read, understood, and agree to all the terms and conditions stated above. I confirm that all information provided is accurate and complete.
                            </label>
                        </div>
                    )}

                    <div className="flex justify-between items-center gap-4">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onAgree}
                            disabled={!canSubmit}
                            className={`px-10 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${canSubmit
                                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-200 hover:shadow-xl'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                }`}
                        >
                            <CheckCircle2 className="w-5 h-5" />
                            I Agree and Submit
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgreementModal;
