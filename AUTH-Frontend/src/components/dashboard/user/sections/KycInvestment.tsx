import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { cleanKycData } from '../../../../utils/kycUtils';

const KycInvestment = ({ initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();
    const [formData, setFormData] = useState(initialData || {
        details: '',
        isInvolved: false
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const cleanedData = cleanKycData(formData);

        try {
            const response = await fetch(`${apiBase}/api/Kyc/section/investment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cleanedData)
            });

            if (response.ok) {
                onNext({ investment: formData });
            } else {
                setError("Failed to save investment section");
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
                <h2 className="text-xl font-bold text-gray-800">Section 8: Other Investments</h2>
                <p className="text-sm text-gray-500">Provide details of your other investment involvesments.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="flex items-center space-x-3 p-4 bg-white border rounded-lg">
                <input
                    type="checkbox"
                    name="isInvolved"
                    id="isInvolved"
                    checked={formData.isInvolved}
                    onChange={handleChange}
                    className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isInvolved" className="font-medium text-gray-700">Are you involved in any other investments?</label>
            </div>

            {formData.isInvolved && (
                <div className="flex flex-col animate-fadeIn">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Investment Details</label>
                    <textarea
                        name="details"
                        value={formData.details}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Please specify your investment details..."
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    ></textarea>
                </div>
            )}

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
                    {saving ? 'Saving...' : 'Save & Next'}
                </button>
            </div>
        </form>
    );
};

export default KycInvestment;
