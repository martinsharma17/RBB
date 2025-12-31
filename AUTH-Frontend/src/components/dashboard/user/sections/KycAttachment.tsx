import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycAttachmentProps {
    sessionId: number | null;
    onBack: () => void;
    onComplete: () => void;
}

const KycAttachment: React.FC<KycAttachmentProps> = ({ sessionId, onBack, onComplete }) => {
    const { token, apiBase } = useAuth();
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Track specific files
    const [photo, setPhoto] = useState<File | null>(null);
    const [citFront, setCitFront] = useState<File | null>(null);
    const [citBack, setCitBack] = useState<File | null>(null);

    const uploadFile = async (file: File, type: number) => {
        const formData = new FormData();
        formData.append('sessionId', sessionId?.toString() || '');
        formData.append('documentType', type.toString());
        formData.append('file', file);

        const response = await fetch(`${apiBase}/api/KycData/upload-document`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || `Failed to upload ${file.name}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!photo || !citFront || !citBack) {
            setError("Please upload all required documents: Photo, Citizenship Front, and Back.");
            return;
        }

        if (!sessionId) {
            setError("Session not initialized correctly.");
            return;
        }

        setUploading(true);
        setError(null);
        setSuccess(null);

        try {
            // 1. Upload all files
            await uploadFile(photo, 1); // Photo
            await uploadFile(citFront, 2); // Cit Front
            await uploadFile(citBack, 3); // Cit Back

            // 2. Finally submit the whole KYC
            const submitResponse = await fetch(`${apiBase}/api/Kyc/submit/${sessionId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (submitResponse.ok) {
                setSuccess("KYC submitted successfully!");
                setTimeout(() => onComplete(), 1500);
            } else {
                const data = await submitResponse.json();
                setError(data.message || "Failed to submit KYC for verification.");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during upload.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Section 9: Attachments & Finish</h2>
                <p className="text-sm text-gray-500">Upload your documents to complete the process.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}
            {success && <div className="p-3 bg-green-100 text-green-700 rounded-lg text-sm font-medium border border-green-200">{success}</div>}

            <div className="grid grid-cols-1 gap-6">
                <div className="p-4 border border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Passport Size Photo *</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {photo && <p className="mt-2 text-xs text-green-600 font-medium">Selected: {photo.name}</p>}
                </div>

                <div className="p-4 border border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Citizenship Front *</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCitFront(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {citFront && <p className="mt-2 text-xs text-green-600 font-medium">Selected: {citFront.name}</p>}
                </div>

                <div className="p-4 border border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-colors">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Citizenship Back *</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCitBack(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {citBack && <p className="mt-2 text-xs text-green-600 font-medium">Selected: {citBack.name}</p>}
                </div>
            </div>

            <div className="flex justify-between pt-6 border-t border-gray-100">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-2 border border-gray-300 text-gray-600 font-semibold rounded hover:bg-gray-100 transition-all"
                >
                    Back
                </button>
                <button
                    type="submit"
                    disabled={uploading}
                    className={`px-10 py-3 bg-green-600 text-white font-bold rounded shadow-lg hover:bg-green-700 active:transform active:scale-95 transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {uploading ? 'Uploading...' : 'Final Submit'}
                </button>
            </div>
        </form>
    );
};

export default KycAttachment;
