import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycAmlProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
    onSaveAndExit?: () => void;
}

interface KycAmlData {
    isPoliticallyExposedPerson: boolean;
    pepRelationName: string;
    hasBeneficialOwner: boolean;
    beneficialOwnerDetails: string;
    hasCriminalRecord: boolean;
    criminalRecordDetails: string;
    [key: string]: any;
}

const KycAml: React.FC<KycAmlProps> = ({ sessionId, initialData, onNext, onBack, onSaveAndExit }) => {
    const { token, apiBase } = useAuth();

    const [formData, setFormData] = useState<KycAmlData>({
        isPoliticallyExposedPerson: initialData?.isPoliticallyExposedPerson || false,
        pepRelationName: initialData?.pepRelationName || '',
        hasBeneficialOwner: initialData?.hasBeneficialOwner || false,
        beneficialOwnerDetails: initialData?.beneficialOwnerDetails || '',
        hasCriminalRecord: initialData?.hasCriminalRecord || false,
        criminalRecordDetails: initialData?.criminalRecordDetails || ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                isPoliticallyExposedPerson: initialData?.isPoliticallyExposedPerson || false,
                pepRelationName: initialData?.pepRelationName || '',
                hasBeneficialOwner: initialData?.hasBeneficialOwner || false,
                beneficialOwnerDetails: initialData?.beneficialOwnerDetails || '',
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


    const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, shouldExit: boolean = false) => {
        if (e) e.preventDefault();
        if (!sessionId) {
            setError("Session not initialized");
            return;
        }
        setSaving(true);
        setError(null);
        if (shouldExit) { /* Logic for exit if needed */ }

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
                        beneficialOwnerDetails: formData.beneficialOwnerDetails,
                        hasCriminalRecord: formData.hasCriminalRecord,
                        criminalRecordDetails: formData.criminalRecordDetails
                    }
                })
            });

            if (response.ok) {
                if (shouldExit && onSaveAndExit) {
                    onSaveAndExit();
                } else {
                    onNext({ amlCompliance: formData });
                }
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
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">AML Compliance</h2>
                <p className="text-sm text-gray-500">Anti-Money Laundering related information.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="space-y-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                {/* PEP Section */}
                <div className="space-y-4">
                    <label className="block text-sm font-bold text-gray-700">
                        1. Are you a Politically Exposed Person (PEP) or related to one?
                    </label>
                    <div className="flex gap-6">
                        {[
                            { label: "Yes", value: true },
                            { label: "No", value: false }
                        ].map((opt) => (
                            <label key={opt.label} className="flex items-center space-x-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.isPoliticallyExposedPerson === opt.value ? 'border-indigo-600 bg-white' : 'border-gray-300 group-hover:border-indigo-300'}`}>
                                    {formData.isPoliticallyExposedPerson === opt.value && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                                </div>
                                <input
                                    type="radio"
                                    name="isPoliticallyExposedPerson"
                                    checked={formData.isPoliticallyExposedPerson === opt.value}
                                    onChange={() => setFormData(prev => ({ ...prev, isPoliticallyExposedPerson: opt.value }))}
                                    className="hidden"
                                />
                                <span className={`text-sm font-medium ${formData.isPoliticallyExposedPerson === opt.value ? 'text-indigo-700' : 'text-gray-600'}`}>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    {formData.isPoliticallyExposedPerson && (
                        <div className="animate-in fade-in slide-in-from-top-2 ml-2 border-l-2 border-indigo-100 pl-4">
                            <label className="text-xs font-bold text-indigo-700 mb-1 block">Specify Relation Name / Details *</label>
                            <textarea
                                name="pepRelationName"
                                value={formData.pepRelationName}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Enter details..."
                                className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-sm"
                                required
                            />
                        </div>
                    )}
                </div>

                {/* Beneficial Owner Section */}
                <div className="space-y-4 border-t border-gray-200 pt-6">
                    <label className="block text-sm font-bold text-gray-700">
                        2. Is there a different Beneficial Owner for this account?
                    </label>
                    <div className="flex gap-6">
                        {[
                            { label: "Yes", value: true },
                            { label: "No", value: false }
                        ].map((opt) => (
                            <label key={opt.label} className="flex items-center space-x-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.hasBeneficialOwner === opt.value ? 'border-indigo-600 bg-white' : 'border-gray-300 group-hover:border-indigo-300'}`}>
                                    {formData.hasBeneficialOwner === opt.value && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                                </div>
                                <input
                                    type="radio"
                                    name="hasBeneficialOwner"
                                    checked={formData.hasBeneficialOwner === opt.value}
                                    onChange={() => setFormData(prev => ({ ...prev, hasBeneficialOwner: opt.value }))}
                                    className="hidden"
                                />
                                <span className={`text-sm font-medium ${formData.hasBeneficialOwner === opt.value ? 'text-indigo-700' : 'text-gray-600'}`}>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    {formData.hasBeneficialOwner && (
                        <div className="animate-in fade-in slide-in-from-top-2 ml-2 border-l-2 border-indigo-100 pl-4">
                            <label className="text-xs font-bold text-indigo-700 mb-1 block">Specify Beneficial Owner Details *</label>
                            <textarea
                                name="beneficialOwnerDetails"
                                value={formData.beneficialOwnerDetails}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Enter details..."
                                className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-sm"
                                required
                            />
                        </div>
                    )}
                </div>

                {/* Criminal Record Section */}
                <div className="space-y-4 border-t border-gray-200 pt-6">
                    <label className="block text-sm font-bold text-gray-700">
                        3. Do you have any criminal record?
                    </label>
                    <div className="flex gap-6">
                        {[
                            { label: "Yes", value: true },
                            { label: "No", value: false }
                        ].map((opt) => (
                            <label key={opt.label} className="flex items-center space-x-2 cursor-pointer group">
                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.hasCriminalRecord === opt.value ? 'border-indigo-600 bg-white' : 'border-gray-300 group-hover:border-indigo-300'}`}>
                                    {formData.hasCriminalRecord === opt.value && <div className="w-2 h-2 rounded-full bg-indigo-600"></div>}
                                </div>
                                <input
                                    type="radio"
                                    name="hasCriminalRecord"
                                    checked={formData.hasCriminalRecord === opt.value}
                                    onChange={() => setFormData(prev => ({ ...prev, hasCriminalRecord: opt.value }))}
                                    className="hidden"
                                />
                                <span className={`text-sm font-medium ${formData.hasCriminalRecord === opt.value ? 'text-indigo-700' : 'text-gray-600'}`}>{opt.label}</span>
                            </label>
                        ))}
                    </div>
                    {formData.hasCriminalRecord && (
                        <div className="animate-in fade-in slide-in-from-top-2 ml-2 border-l-2 border-indigo-100 pl-4">
                            <label className="text-xs font-bold text-indigo-700 mb-1 block">Specify Criminal Record Details *</label>
                            <textarea
                                name="criminalRecordDetails"
                                value={formData.criminalRecordDetails}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Provide further information..."
                                className="w-full p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium text-sm"
                                required
                            />
                        </div>
                    )}
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
