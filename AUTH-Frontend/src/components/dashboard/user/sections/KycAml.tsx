import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycAmlProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
}

interface KycAmlData {
    isPoliticallyExposedPerson: boolean;
    pepRelationName: string;
    hasBeneficialOwner: boolean;
    hasCriminalRecord: boolean;
    criminalRecordDetails: string;
    [key: string]: any;
}

const KycAml: React.FC<KycAmlProps> = ({ sessionId, initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();

    const [formData, setFormData] = useState<KycAmlData>({
        isPoliticallyExposedPerson: initialData?.isPoliticallyExposedPerson || false,
        pepRelationName: initialData?.pepRelationName || '',
        hasBeneficialOwner: initialData?.hasBeneficialOwner || false,
        hasCriminalRecord: initialData?.hasCriminalRecord || false,
        criminalRecordDetails: initialData?.criminalRecordDetails || ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                isPoliticallyExposedPerson: initialData?.isPoliticallyExposedPerson || false,
                pepRelationName: initialData?.pepRelationName || '',
                hasBeneficialOwner: initialData?.hasBeneficialOwner || false,
                hasCriminalRecord: initialData?.hasCriminalRecord || false,
                criminalRecordDetails: initialData?.criminalRecordDetails || ''
            });
        }
    }, [initialData]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.target as any;
        const { name, value, type, checked } = target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!sessionId) {
            setError("Session not initialized");
            return;
        }
        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`${apiBase}/api/KycData/save-aml-compliance`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 10,
                    data: {
                        isPoliticallyExposedPerson: formData.isPoliticallyExposedPerson,
                        pepRelationName: formData.pepRelationName,
                        hasBeneficialOwner: formData.hasBeneficialOwner,
                        hasCriminalRecord: formData.hasCriminalRecord,
                        criminalRecordDetails: formData.criminalRecordDetails
                    }
                })
            });

            if (response.ok) {
                onNext({ amlCompliance: formData });
            } else {
                setError("Failed to save AML compliance");
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
                <h2 className="text-xl font-bold text-gray-800">AML Compliance</h2>
                <p className="text-sm text-gray-500">Anti-Money Laundering related information.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="space-y-4">
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="isPoliticallyExposedPerson"
                        name="isPoliticallyExposedPerson"
                        checked={formData.isPoliticallyExposedPerson}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="isPoliticallyExposedPerson" className="text-sm font-medium text-gray-700">
                        Are you a Politically Exposed Person (PEP) or related to one?
                    </label>
                </div>

                {formData.isPoliticallyExposedPerson && (
                    <div className="flex flex-col ml-7">
                        <label className="text-sm font-semibold text-gray-700 mb-1">PEP Relation Name / Details</label>
                        <input
                            type="text"
                            name="pepRelationName"
                            value={formData.pepRelationName}
                            onChange={handleChange}
                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                )}

                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="hasBeneficialOwner"
                        name="hasBeneficialOwner"
                        checked={formData.hasBeneficialOwner}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="hasBeneficialOwner" className="text-sm font-medium text-gray-700">
                        Is there a different Beneficial Owner for this account?
                    </label>
                </div>

                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="hasCriminalRecord"
                        name="hasCriminalRecord"
                        checked={formData.hasCriminalRecord}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="hasCriminalRecord" className="text-sm font-medium text-gray-700">
                        Do you have any criminal record?
                    </label>
                </div>

                {formData.hasCriminalRecord && (
                    <div className="flex flex-col ml-7">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Criminal Record Details</label>
                        <textarea
                            name="criminalRecordDetails"
                            value={formData.criminalRecordDetails}
                            onChange={handleChange}
                            rows={3}
                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                )}
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
                    disabled={saving}
                    className={`px-8 py-2 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 active:transform active:scale-95 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {saving ? 'Saving...' : 'Save & Next'}
                </button>
            </div>
        </form>
    );
};

export default KycAml;
