import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycBankProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
    onSaveAndExit?: () => void;
}

interface KycBankData {
    accountType: string;
    accountNumber: string;
    bankName: string;
    bankAddress: string;
    [key: string]: any;
}

const KycBank: React.FC<KycBankProps> = ({ sessionId, initialData, onNext, onBack, onSaveAndExit }) => {
    const { token, apiBase } = useAuth();

    const [formData, setFormData] = useState<KycBankData>({
        accountType: initialData?.accountType?.toString() || '',
        accountNumber: initialData?.bankAccountNo || initialData?.accountNumber || '',
        bankName: initialData?.bankName || '',
        bankAddress: initialData?.bankAddress || initialData?.bankBranch || ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                accountType: initialData?.accountType?.toString() || '',
                accountNumber: initialData?.bankAccountNo || initialData?.accountNumber || '',
                bankName: initialData?.bankName || '',
                bankAddress: initialData?.bankAddress || initialData?.bankBranch || ''
            });
        }
    }, [initialData]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const [isExiting, setIsExiting] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, shouldExit: boolean = false) => {
        if (e) e.preventDefault();
        if (!sessionId) {
            setError("Session not initialized");
            return;
        }
        setSaving(true);
        setError(null);
        if (shouldExit) setIsExiting(true);

        try {
            const response = await fetch(`${apiBase}/api/KycData/save-bank-account`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 5, // Bank is step 5 in backend
                    data: {
                        accountType: parseInt(formData.accountType) || null,
                        bankAccountNo: formData.accountNumber,
                        bankName: formData.bankName,
                        bankAddress: formData.bankAddress
                    }
                })
            });

            if (response.ok) {
                if (shouldExit && onSaveAndExit) {
                    onSaveAndExit();
                } else {
                    onNext({ bank: formData });
                }
            } else {
                setError("Failed to save bank section");
                setIsExiting(false);
            }
        } catch (err) {
            setError("Network error while saving");
            setIsExiting(false);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Section 4: Bank Account Details</h2>
                <p className="text-sm text-gray-500">Provide bank details where you want to receive payments.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Account Type</label>
                    <select
                        name="accountType"
                        value={formData.accountType}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    >
                        <option value="">Select Type</option>
                        <option value="1">Savings</option>
                        <option value="2">Current</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Bank Account Number *</label>
                    <input
                        type="text"
                        name="accountNumber"
                        value={formData.accountNumber}
                        onChange={handleChange}
                        required
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Bank Name *</label>
                    <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        required
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Bank Address/Branch</label>
                    <input
                        type="text"
                        name="bankAddress"
                        value={formData.bankAddress}
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
