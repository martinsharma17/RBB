import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { cleanKycData } from '../../../../utils/kycUtils';

const KycLegal = ({ initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();
    const [formData, setFormData] = useState(initialData || {
        declarationText: "I hereby declare that the information provided above is true and correct to the best of my knowledge.",
        isAgreed: false,
        consentDate: new Date().toISOString()
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.isAgreed) {
            setError("You must agree to the declaration.");
            return;
        }

        setSaving(true);
        setError(null);
        const cleanedData = cleanKycData(formData);

        try {
            const response = await fetch(`${apiBase}/api/Kyc/section/legal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cleanedData)
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
                <h2 className="text-xl font-bold text-gray-800">Section 7: Legal Declaration</h2>
                <p className="text-sm text-gray-500">Please review and provide your consent.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-100 italic text-gray-700">
                "{formData.declarationText}"
            </div>

            <div className="flex items-start space-x-3 p-4 bg-white border rounded-lg shadow-sm">
                <input
                    type="checkbox"
                    id="isAgreed"
                    checked={formData.isAgreed}
                    onChange={(e) => setFormData(prev => ({ ...prev, isAgreed: e.target.checked }))}
                    className="mt-1 w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isAgreed" className="text-sm font-medium text-gray-700 cursor-pointer">
                    I confirm that I have read the declaration and all information provided is accurate.
                    I understand that providing false information is a punishable offense.
                </label>
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
                    disabled={saving || !formData.isAgreed}
                    className={`px-8 py-2 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 active:transform active:scale-95 transition-all ${saving || !formData.isAgreed ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                >
                    {saving ? 'Saving...' : 'Accept & Proceed'}
                </button>
            </div>
        </form>
    );
};

export default KycLegal;
