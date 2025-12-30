import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';

const KycAttachment = ({ onBack, onComplete }) => {
    const { token, apiBase } = useAuth();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleFileChange = (e) => {
        setFiles(Array.from(e.target.files));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (files.length === 0) {
            setError("Please select at least one file.");
            return;
        }

        setUploading(true);
        setError(null);

        // In a real app, you'd use FormData to upload files
        // For this demo, we'll simulate a successful upload to the kyc verify endpoint
        try {
            // First we'd upload files... (Omitted for brevity)

            // Then we submit for verification (Maker submission)
            const response = await fetch(`${apiBase}/api/Kyc/verify`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                onComplete();
            } else {
                const msg = await response.text();
                setError(msg || "Failed to submit KYC for verification.");
            }
        } catch (err) {
            setError("Network error while submitting.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Section 9: Attachments & Finish</h2>
                <p className="text-sm text-gray-500">Upload citizenship, photo, and other documents.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl p-12 bg-white hover:border-indigo-400 transition-colors cursor-pointer group">
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    id="fileInput"
                    className="hidden"
                />
                <label htmlFor="fileInput" className="cursor-pointer flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-400 group-hover:text-indigo-500 mb-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="text-gray-600 font-medium group-hover:text-indigo-600">Click to select files or drag and drop</span>
                    <span className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</span>
                </label>
            </div>

            {files.length > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 underline">Selected Files:</h4>
                    <ul className="space-y-2">
                        {files.map((file, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center">
                                <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <p className="text-xs text-yellow-700 leading-relaxed">
                    <strong>Note:</strong> By clicking "Submit for Verification", you are officially submitting your KYC form.
                    Our compliance team will review your application. You will not be able to edit the form until the review is complete.
                </p>
            </div>

            <div className="flex justify-between pt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-2 border border-gray-300 text-gray-600 font-semibold rounded hover:bg-gray-100 transition-all"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={uploading || files.length === 0}
                    className={`px-8 py-2 bg-green-600 text-white font-bold rounded shadow-md hover:bg-green-700 active:transform active:scale-95 transition-all ${uploading || files.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {uploading ? 'Processing...' : 'Submit for Verification'}
                </button>
            </div>
        </form>
    );
};

export default KycAttachment;
