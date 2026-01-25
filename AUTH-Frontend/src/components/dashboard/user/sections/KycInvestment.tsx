import React, { useState, useEffect } from "react";
import api from "../../../../services/api";

interface KycInvestmentProps {
    sessionToken: string | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
    onSaveAndExit?: () => void;
}

interface KycInvestmentData {
    details: string;
    isInvolved: boolean;
    [key: string]: any;
}

const KycInvestment: React.FC<KycInvestmentProps> = ({ sessionToken, initialData, onNext, onBack, onSaveAndExit }) => {

    const [formData, setFormData] = useState<KycInvestmentData>({
        details: initialData?.annualIncomeRange || initialData?.details || '',
        isInvolved: initialData?.isInvolved || false
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                details: initialData?.annualIncomeRange || initialData?.details || '',
                isInvolved: initialData?.isInvolved || false
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
            const response = await api.post(`/api/KycData/save-financial-details/${sessionToken}`, {
                stepNumber: 7, // Financial details is step 7 in backend
                data: {
                    annualIncomeRange: formData.details
                }
            });

            if (response.data.success) {
                if (shouldExit && onSaveAndExit) {
                    onSaveAndExit();
                } else {
                    onNext({ investment: formData });
                }
            } else {
                setError(response.data.message || "Failed to save investment section");
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Network error while saving");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Section 8: Financial Details</h2>
                <p className="text-sm text-gray-500">Information about your source of funds and income level.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="space-y-4">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Source of Income / Wealth Details</label>
                    <textarea
                        name="details"
                        value={formData.details}
                        onChange={handleChange}
                        rows={4}
                        placeholder="e.g. Salary from employment, Business profits, etc."
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="isInvolved"
                        name="isInvolved"
                        checked={formData.isInvolved}
                        onChange={handleChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                    />
                    <label htmlFor="isInvolved" className="text-sm font-medium text-gray-700 cursor-pointer">
                        I confirm that my source of funds is legal and not involved in money laundering. *
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
                    {saving ? 'Saving...' : 'Save & Next'}
                </button>

            </div>
        </form>
    );
};

export default KycInvestment;
