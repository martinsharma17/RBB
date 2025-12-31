import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycGuardianProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
}

interface KycGuardianData {
    name: string;
    relationship: string;
    address: string;
    contactNo: string;
    email: string;
    panNo: string;
    dob: string;
    issueDistrict: string;
    [key: string]: any;
}

const KycGuardian: React.FC<KycGuardianProps> = ({ sessionId, initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();

    const [formData, setFormData] = useState<KycGuardianData>({
        name: initialData?.fullName || initialData?.name || '',
        relationship: initialData?.relationship || '',
        address: initialData?.address || '',
        contactNo: initialData?.contactNo || '',
        email: initialData?.email || '',
        panNo: initialData?.panNo || '',
        dob: initialData?.dob || '',
        issueDistrict: initialData?.issueDistrict || ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData?.fullName || initialData?.name || '',
                relationship: initialData?.relationship || '',
                address: initialData?.address || '',
                contactNo: initialData?.contactNo || '',
                email: initialData?.email || '',
                panNo: initialData?.panNo || '',
                dob: initialData?.dob || '',
                issueDistrict: initialData?.issueDistrict || ''
            });
        }
    }, [initialData]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Guardians are often optional for adults. Check if info is provided.
        if (!formData.name && !formData.relationship) {
            onNext({ guardian: null });
            return;
        }

        if (!sessionId) {
            setError("Session not initialized");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`${apiBase}/api/KycData/save-guardian`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 9, // Guardian is step 9 in backend
                    data: {
                        fullName: formData.name,
                        relationship: formData.relationship,
                        address: formData.address,
                        contactNo: formData.contactNo
                    }
                })
            });

            if (response.ok) {
                onNext({ guardian: formData });
            } else {
                setError("Failed to save guardian section");
            }
        } catch (err) {
            setError("Network error while saving");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Section 6: Guardian Details (For Minors)</h2>
                <p className="text-sm text-gray-500">Provide details if the applicant is a minor or requires a guardian.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Guardian's Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Relationship</label>
                    <input
                        type="text"
                        name="relationship"
                        value={formData.relationship}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Address</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                    <input
                        type="text"
                        name="contactNo"
                        value={formData.contactNo}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex justify-between pt-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-2 border border-gray-300 text-gray-600 font-semibold rounded hover:bg-gray-100 transition-all"
                >
                    Back
                </button>
                <div className="space-x-4">
                    <button
                        type="button"
                        onClick={() => onNext({ guardian: null })}
                        className="px-6 py-2 text-indigo-600 font-semibold hover:underline"
                    >
                        Skip
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className={`px-8 py-2 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 active:transform active:scale-95 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {saving ? 'Saving...' : 'Save & Next'}
                    </button>
                </div>
            </div>
        </form>
    );
};

export default KycGuardian;
