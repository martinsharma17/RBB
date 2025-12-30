import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { cleanKycData } from '../../../../utils/kycUtils';

const KycBank = ({ initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();
    const [formData, setFormData] = useState(initialData || {
        accountType: '',
        accountNumber: '',
        bankName: '',
        bankAddress: ''
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const cleanedData = cleanKycData(formData);

        try {
            const response = await fetch(`${apiBase}/api/Kyc/section/bank`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cleanedData)
            });

            if (response.ok) {
                onNext({ bank: formData });
            } else {
                setError("Failed to save bank section");
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
                <h2 className="text-xl font-bold text-gray-800">Section 4: Bank Information</h2>
                <p className="text-sm text-gray-500">Details for financial transactions.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Bank Name</label>
                    <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Account Number</label>
                    <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Account Type</label>
                    <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option value="">Select Type</option>
                        <option value="Savings">Savings</option>
                        <option value="Current">Current</option>
                        <option value="Fixed">Fixed</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Bank Address</label>
                    <input
                        type="text"
                        name="bankAddress"
                        value={formData.bankAddress}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
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

export default KycBank;
