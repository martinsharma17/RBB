import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycAgreementProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
}

interface KycAgreementData {
    tradingLimit: string;
    marginTradingFacility: boolean;
    agreementDate: string;
    [key: string]: any;
}

const KycAgreement: React.FC<KycAgreementProps> = ({ sessionId, initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();

    const [formData, setFormData] = useState<KycAgreementData>({
        tradingLimit: initialData?.tradingLimit || '',
        marginTradingFacility: initialData?.marginTradingFacility || false,
        agreementDate: initialData?.agreementDate || new Date().toISOString()
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                tradingLimit: initialData?.tradingLimit || '',
                marginTradingFacility: initialData?.marginTradingFacility || false,
                agreementDate: initialData?.agreementDate || new Date().toISOString()
            });
        }
    }, [initialData]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            const response = await fetch(`${apiBase}/api/KycData/save-agreement`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 14,
                    data: {
                        tradingLimit: formData.tradingLimit,
                        marginTradingFacility: formData.marginTradingFacility,
                        agreementDate: formData.agreementDate
                    }
                })
            });

            if (response.ok) {
                onNext({ agreement: formData });
            } else {
                setError("Failed to save agreement");
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
                <h2 className="text-xl font-bold text-gray-800">Final Agreement</h2>
                <p className="text-sm text-gray-500">Terms regarding your trading account.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Requested Trading Limit</label>
                    <select
                        name="tradingLimit"
                        value={formData.tradingLimit}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                        <option value="">Select Limit</option>
                        <option value="Standard">Standard</option>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                    </select>
                </div>

                <div className="flex items-center space-x-3 col-span-full">
                    <input
                        type="checkbox"
                        id="marginTradingFacility"
                        name="marginTradingFacility"
                        checked={formData.marginTradingFacility}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="marginTradingFacility" className="text-sm font-medium text-gray-700">
                        I would like to apply for Margin Trading Facility.
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
                    className={`px-8 py-2 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 active:transform active:scale-95 transition-all ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {saving ? 'Saving...' : 'Save & Next'}
                </button>
            </div>
        </form>
    );
};

export default KycAgreement;
