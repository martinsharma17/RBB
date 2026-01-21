import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycTransactionProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
    onSaveAndExit?: () => void;
}

interface KycTransactionData {
    sourceOfNetWorth: string;
    majorSourceOfIncome: string;
    hasOtherBrokerAccount: boolean;
    otherBrokerNames: string;
    isCibBlacklisted: boolean;
    cibBlacklistDetails: string;
    [key: string]: any;
}

const KycTransaction: React.FC<KycTransactionProps> = ({ sessionId, initialData, onNext, onBack, onSaveAndExit }) => {
    const { token, apiBase } = useAuth();

    const [formData, setFormData] = useState<KycTransactionData>({
        sourceOfNetWorth: initialData?.sourceOfNetWorth || '',
        majorSourceOfIncome: initialData?.majorSourceOfIncome || '',
        hasOtherBrokerAccount: initialData?.hasOtherBrokerAccount || false,
        otherBrokerNames: initialData?.otherBrokerNames || '',
        isCibBlacklisted: initialData?.isCibBlacklisted || false,
        cibBlacklistDetails: initialData?.cibBlacklistDetails || ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                sourceOfNetWorth: initialData?.sourceOfNetWorth || '',
                majorSourceOfIncome: initialData?.majorSourceOfIncome || '',
                hasOtherBrokerAccount: initialData?.hasOtherBrokerAccount || false,
                otherBrokerNames: initialData?.otherBrokerNames || '',
                isCibBlacklisted: initialData?.isCibBlacklisted || false,
                cibBlacklistDetails: initialData?.cibBlacklistDetails || ''
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
            const response = await fetch(`${apiBase}/api/KycData/save-transaction-info`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 8,
                    data: {
                        sourceOfNetWorth: formData.sourceOfNetWorth,
                        majorSourceOfIncome: formData.majorSourceOfIncome,
                        hasOtherBrokerAccount: formData.hasOtherBrokerAccount,
                        otherBrokerNames: formData.otherBrokerNames,
                        isCibBlacklisted: formData.isCibBlacklisted,
                        cibBlacklistDetails: formData.cibBlacklistDetails
                    }
                })
            });

            if (response.ok) {
                if (shouldExit && onSaveAndExit) {
                    onSaveAndExit();
                } else {
                    onNext({ transactionInfo: formData });
                }
            } else {
                setError("Failed to save transaction info");
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
                <h2 className="text-xl font-bold text-gray-800">Transaction Information</h2>
                <p className="text-sm text-gray-500">Details about your financial background and broker accounts.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Source of Net Worth</label>
                    <input
                        type="text"
                        name="sourceOfNetWorth"
                        value={formData.sourceOfNetWorth}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Major Source of Income</label>
                    <input
                        type="text"
                        name="majorSourceOfIncome"
                        value={formData.majorSourceOfIncome}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex items-center space-x-3 col-span-full">
                    <input
                        type="checkbox"
                        id="hasOtherBrokerAccount"
                        name="hasOtherBrokerAccount"
                        checked={formData.hasOtherBrokerAccount}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="hasOtherBrokerAccount" className="text-sm font-medium text-gray-700">
                        Do you have accounts with other brokers?
                    </label>
                </div>

                {formData.hasOtherBrokerAccount && (
                    <div className="flex flex-col col-span-full">
                        <label className="text-sm font-semibold text-gray-700 mb-1">Other Broker Names</label>
                        <textarea
                            name="otherBrokerNames"
                            value={formData.otherBrokerNames}
                            onChange={handleChange}
                            rows={2}
                            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        />
                    </div>
                )}

                <div className="flex items-center space-x-3 col-span-full">
                    <input
                        type="checkbox"
                        id="isCibBlacklisted"
                        name="isCibBlacklisted"
                        checked={formData.isCibBlacklisted}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="isCibBlacklisted" className="text-sm font-medium text-gray-700">
                        Are you CIB Blacklisted?
                    </label>
                </div>

                {formData.isCibBlacklisted && (
                    <div className="flex flex-col col-span-full">
                        <label className="text-sm font-semibold text-gray-700 mb-1">CIB Blacklist Details</label>
                        <textarea
                            name="cibBlacklistDetails"
                            value={formData.cibBlacklistDetails}
                            onChange={handleChange}
                            rows={2}
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

export default KycTransaction;
