import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import { cleanKycData } from '../../../../utils/kycUtils';

const KycFamily = ({ initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();
    const [formData, setFormData] = useState(initialData || {
        fatherName: '',
        motherName: '',
        grandfatherName: '',
        spouseName: '',
        childrenNames: '',
        inlawsNames: ''
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
            const response = await fetch(`${apiBase}/api/Kyc/section/family`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(cleanedData)
            });

            if (response.ok) {
                onNext({ family: formData });
            } else {
                setError("Failed to save family section");
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
                <h2 className="text-xl font-bold text-gray-800">Section 3: Family Information</h2>
                <p className="text-sm text-gray-500">Provide details of your immediate family members.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Father's Name</label>
                    <input
                        type="text"
                        name="fatherName"
                        value={formData.fatherName}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Mother's Name</label>
                    <input
                        type="text"
                        name="motherName"
                        value={formData.motherName}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Grandfather's Name</label>
                    <input
                        type="text"
                        name="grandfatherName"
                        value={formData.grandfatherName}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Spouse's Name (if married)</label>
                    <input
                        type="text"
                        name="spouseName"
                        value={formData.spouseName}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Children's Names (Separated by comma)</label>
                    <textarea
                        name="childrenNames"
                        value={formData.childrenNames}
                        onChange={handleChange}
                        rows="2"
                        placeholder="e.g. John Doe, Jane Doe"
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    ></textarea>
                </div>

                <div className="flex flex-col md:col-span-2">
                    <label className="text-sm font-semibold text-gray-700 mb-1">In-laws' Names (Separated by comma)</label>
                    <textarea
                        name="inlawsNames"
                        value={formData.inlawsNames}
                        onChange={handleChange}
                        rows="2"
                        placeholder="e.g. Father-in-law, Mother-in-law"
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    ></textarea>
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

export default KycFamily;
