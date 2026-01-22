import React, { useState, useEffect } from 'react';

import api from "../../../../services/api";

interface KycTransactionProps {
    sessionToken: string | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
    onSaveAndExit?: () => void;
}

interface KycTransactionData {
    sourceOfFunds: string; // Combined field for Source of Net Worth and Major Source of Income
    hasOtherBrokerAccount: boolean;
    otherBrokerNames: string;
    isCibBlacklisted: boolean;
    cibBlacklistDetails: string;
    [key: string]: any;
}

const KycTransaction: React.FC<KycTransactionProps> = ({ sessionToken, initialData, onNext, onBack, onSaveAndExit }) => {

    const [formData, setFormData] = useState<KycTransactionData>({
        sourceOfFunds: initialData?.sourceOfNetWorth || initialData?.majorSourceOfIncome || '',
        hasOtherBrokerAccount: initialData?.hasOtherBrokerAccount || false,
        otherBrokerNames: initialData?.otherBrokerNames || '',
        isCibBlacklisted: initialData?.isCibBlacklisted || false,
        cibBlacklistDetails: initialData?.cibBlacklistDetails || ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                sourceOfFunds: initialData?.sourceOfNetWorth || initialData?.majorSourceOfIncome || '',
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, shouldExit: boolean = false) => {
        if (e) e.preventDefault();
        if (!sessionToken) {
            setError("Session token not found");
            return;
        }
        setSaving(true);
        setError(null);

        try {
            const response = await api.post(`/api/KycData/save-transaction-info`, {
                sessionToken: sessionToken,
                stepNumber: 8,
                data: {
                    sourceOfNetWorth: formData.sourceOfFunds,
                    majorSourceOfIncome: formData.sourceOfFunds,
                    hasOtherBrokerAccount: formData.hasOtherBrokerAccount,
                    otherBrokerNames: formData.otherBrokerNames,
                    isCibBlacklisted: formData.isCibBlacklisted,
                    cibBlacklistDetails: formData.cibBlacklistDetails
                }
            });

            if (response.data.success) {
                if (shouldExit && onSaveAndExit) {
                    onSaveAndExit();
                } else {
                    onNext({ transactionInfo: formData });
                }
            } else {
                setError(response.data.message || "Failed to save transaction information");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Network error while saving");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-8 animate-fadeIn">
            <header className="border-b border-indigo-100 pb-5">
                <h2 className="text-2xl font-extrabold text-indigo-900 flex items-center gap-2">
                    <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">7</span>
                    Transaction Information
                </h2>
                <p className="text-gray-500 mt-1 ml-10">
                    Details about your financial status and relationship with other brokers.
                </p>
            </header>

            {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    {error}
                </div>
            )}

            <div className="space-y-6">
                <section className="flex flex-col space-y-1.5">
                    <label htmlFor="sourceOfFunds" className="text-sm font-semibold text-gray-700">
                        Primary Source of Funds (Net Worth & Income) *
                    </label>
                    <input
                        id="sourceOfFunds"
                        type="text"
                        name="sourceOfFunds"
                        value={formData.sourceOfFunds}
                        onChange={handleChange}
                        required
                        placeholder="e.g. Salary, Business Profit, Inheritance"
                        className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                </section>

                <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 space-y-6">
                    <div className="flex items-start space-x-3">
                        <div className="flex items-center h-5">
                            <input
                                id="hasOtherBrokerAccount"
                                type="checkbox"
                                name="hasOtherBrokerAccount"
                                checked={formData.hasOtherBrokerAccount}
                                onChange={handleChange}
                                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                        </div>
                        <label htmlFor="hasOtherBrokerAccount" className="text-sm font-bold text-indigo-900 cursor-pointer">
                            I have existing accounts with other stock brokers
                        </label>
                    </div>

                    {formData.hasOtherBrokerAccount && (
                        <div className="flex flex-col space-y-1.5 animate-slideDown ml-8">
                            <label htmlFor="otherBrokerNames" className="text-sm font-semibold text-gray-700">
                                Specify Other Broker Names *
                            </label>
                            <textarea
                                id="otherBrokerNames"
                                name="otherBrokerNames"
                                value={formData.otherBrokerNames}
                                onChange={handleChange}
                                required
                                rows={2}
                                placeholder="Enter names of the brokerage firms"
                                className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                            />
                        </div>
                    )}

                    <div className="flex items-start space-x-3">
                        <div className="flex items-center h-5">
                            <input
                                id="isCibBlacklisted"
                                type="checkbox"
                                name="isCibBlacklisted"
                                checked={formData.isCibBlacklisted}
                                onChange={handleChange}
                                className="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                        </div>
                        <label htmlFor="isCibBlacklisted" className="text-sm font-bold text-indigo-900 cursor-pointer">
                            I am currently listed in the CIB Blacklist
                        </label>
                    </div>

                    {formData.isCibBlacklisted && (
                        <div className="flex flex-col space-y-1.5 animate-slideDown ml-8">
                            <label htmlFor="cibBlacklistDetails" className="text-sm font-semibold text-gray-700">
                                Blacklist Details *
                            </label>
                            <textarea
                                id="cibBlacklistDetails"
                                name="cibBlacklistDetails"
                                value={formData.cibBlacklistDetails}
                                onChange={handleChange}
                                required
                                rows={2}
                                placeholder="Provide reason and details for blacklist"
                                className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-white"
                            />
                        </div>
                    )}
                </div>
            </div>

            <footer className="flex justify-between items-center pt-8 border-t border-gray-100 mt-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="group px-7 py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-xl hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center gap-2"
                >
                    <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Back
                </button>
                <button
                    type="submit"
                    disabled={saving}
                    className={`group px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2 ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {saving ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Saving...
                        </>
                    ) : (
                        <>
                            Save & Continue
                            <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                        </>
                    )}
                </button>
            </footer>
        </form>
    );
};

export default KycTransaction;
