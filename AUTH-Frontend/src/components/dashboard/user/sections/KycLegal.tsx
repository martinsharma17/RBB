import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycLegalProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
}

interface KycLegalData {
    declarationText: string;
    isAgreed: boolean;
    noOtherLiability: boolean;
    allTrue: boolean;
    consentDate: string;
    [key: string]: any;
}

const KycLegal: React.FC<KycLegalProps> = ({ sessionId, initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();

    const [formData, setFormData] = useState<KycLegalData>({
        declarationText: initialData?.declarationText || "I hereby declare that the information provided above is true and correct to the best of my knowledge.",
        isAgreed: initialData?.agreeToTerms || initialData?.isAgreed || false,
        noOtherLiability: initialData?.noOtherFinancialLiability || false,
        allTrue: initialData?.allInformationTrue || false,
        consentDate: initialData?.consentDate || new Date().toISOString()
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                declarationText: initialData?.declarationText || "I hereby declare that the information provided above is true and correct to the best of my knowledge.",
                isAgreed: initialData?.agreeToTerms || initialData?.isAgreed || false,
                noOtherLiability: initialData?.noOtherFinancialLiability || false,
                allTrue: initialData?.allInformationTrue || false,
                consentDate: initialData?.consentDate || new Date().toISOString()
            });
        }
    }, [initialData]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!formData.isAgreed) {
            setError("You must agree to the declaration.");
            return;
        }

        if (!sessionId) {
            setError("Session not initialized");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await fetch(`${apiBase}/api/KycData/save-declarations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 12, // Declarations is step 12 in backend
                    data: {
                        agreeToTerms: formData.isAgreed,
                        noOtherFinancialLiability: formData.noOtherLiability,
                        allInformationTrue: formData.allTrue
                    }
                })
            });

            if (response.ok) {
                onNext({ legal: formData });
            } else {
                setError("Failed to save legal section");
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
                <h2 className="text-xl font-bold text-gray-800">Section 7: Declarations</h2>
                <p className="text-sm text-gray-500">Legal confirmation of the provided information.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <p className="text-gray-700 italic mb-6 leading-relaxed">
                    "{formData.declarationText}"
                </p>

                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="isAgreed"
                        name="isAgreed"
                        checked={formData.isAgreed}
                        onChange={(e) => setFormData(prev => ({ ...prev, isAgreed: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="isAgreed" className="text-sm font-medium text-gray-700 cursor-pointer">
                        I confirm that the above declaration is true and I am responsible for any discrepancies found later. *
                    </label>
                </div>

                <div className="flex items-start space-x-3 mt-4">
                    <input
                        type="checkbox"
                        id="noOtherLiability"
                        name="noOtherLiability"
                        checked={formData.noOtherLiability}
                        onChange={(e) => setFormData(prev => ({ ...prev, noOtherLiability: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="noOtherLiability" className="text-sm font-medium text-gray-700 cursor-pointer">
                        I declare that I have no other financial liability. *
                    </label>
                </div>

                <div className="flex items-start space-x-3 mt-4">
                    <input
                        type="checkbox"
                        id="allTrue"
                        name="allTrue"
                        checked={formData.allTrue}
                        onChange={(e) => setFormData(prev => ({ ...prev, allTrue: e.target.checked }))}
                        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="allTrue" className="text-sm font-medium text-gray-700 cursor-pointer">
                        All information provided is true to my knowledge. *
                    </label>
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
                    className={`px-8 py-2 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 active:transform active:scale-95 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {saving ? 'Saving...' : 'Agree & Next'}
                </button>
            </div>
        </form>
    );
};

export default KycLegal;
