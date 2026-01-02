import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycAddressProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
    onBack: () => void;
}

interface KycAddressData {
    currentMunicipality: string;
    currentDistrict: string;
    currentProvince: string;
    currentCountry: string;
    permanentMunicipality: string;
    permanentDistrict: string;
    permanentProvince: string;
    permanentCountry: string;
    wardNo: string;
    contactNumber: string;
    email: string;
    [key: string]: any;
}

const KycAddress: React.FC<KycAddressProps> = ({ sessionId, initialData, onNext, onBack }) => {
    const { token, apiBase } = useAuth();

    // Normalize data from backend (which split current/permanent into different objects)
    const [formData, setFormData] = useState<KycAddressData>({
        currentMunicipality: initialData?.currentAddress?.municipalityName || '',
        currentDistrict: initialData?.currentAddress?.district || '',
        currentProvince: initialData?.currentAddress?.province || '',
        currentCountry: initialData?.currentAddress?.country || 'Nepal',
        permanentMunicipality: initialData?.permanentAddress?.municipalityName || '',
        permanentDistrict: initialData?.permanentAddress?.district || '',
        permanentProvince: initialData?.permanentAddress?.province || '',
        permanentCountry: initialData?.permanentAddress?.country || 'Nepal',
        wardNo: initialData?.currentAddress?.wardNo?.toString() || '',
        contactNumber: initialData?.currentAddress?.mobileNo || '',
        email: initialData?.currentAddress?.emailId || ''
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                currentMunicipality: initialData?.currentAddress?.municipalityName || initialData?.currentMunicipality || '',
                currentDistrict: initialData?.currentAddress?.district || initialData?.currentDistrict || '',
                currentProvince: initialData?.currentAddress?.province || initialData?.currentProvince || '',
                currentCountry: initialData?.currentAddress?.country || initialData?.currentCountry || 'Nepal',
                permanentMunicipality: initialData?.permanentAddress?.municipalityName || initialData?.permanentMunicipality || '',
                permanentDistrict: initialData?.permanentAddress?.district || initialData?.permanentDistrict || '',
                permanentProvince: initialData?.permanentAddress?.province || initialData?.permanentProvince || '',
                permanentCountry: initialData?.permanentAddress?.country || initialData?.permanentCountry || 'Nepal',
                wardNo: initialData?.currentAddress?.wardNo?.toString() || initialData?.wardNo?.toString() || '',
                contactNumber: initialData?.currentAddress?.mobileNo || initialData?.contactNumber || '',
                email: initialData?.currentAddress?.emailId || initialData?.email || ''
            });
        }
    }, [initialData]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!sessionId) {
            setError("KYC session not initialized.");
            return;
        }
        setSaving(true);
        setError(null);

        try {
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            // Step 2: Save Current Address
            const currentRes = await fetch(`${apiBase}/api/KycData/save-current-address`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 2,
                    data: {
                        country: formData.currentCountry,
                        province: formData.currentProvince,
                        district: formData.currentDistrict,
                        municipalityName: formData.currentMunicipality,
                        wardNo: parseInt(formData.wardNo) || null,
                        mobileNo: formData.contactNumber,
                        emailId: formData.email
                    }
                })
            });

            if (!currentRes.ok) throw new Error("Failed to save current address");

            // Step 3: Save Permanent Address
            const permanentRes = await fetch(`${apiBase}/api/KycData/save-permanent-address`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 3,
                    data: {
                        country: formData.permanentCountry,
                        province: formData.permanentProvince,
                        district: formData.permanentDistrict,
                        municipalityName: formData.permanentMunicipality,
                        wardNo: parseInt(formData.wardNo) || null,
                        mobileNo: formData.contactNumber,
                        emailId: formData.email
                    }
                })
            });

            if (!permanentRes.ok) throw new Error("Failed to save permanent address");

            onNext({ address: formData });
        } catch (err: any) {
            setError(err.message || "Error saving address information");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-800">Section 2: Address Information</h2>
                <p className="text-sm text-gray-500">Current and Permanent residence details.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <h3 className="col-span-full text-md font-semibold text-indigo-700 border-l-4 border-indigo-600 pl-2 mt-2">Current Address</h3>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Municipality/VDC</label>
                    <input
                        type="text"
                        name="currentMunicipality"
                        value={formData.currentMunicipality}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">District</label>
                    <input
                        type="text"
                        name="currentDistrict"
                        value={formData.currentDistrict}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Province</label>
                    <input
                        type="text"
                        name="currentProvince"
                        value={formData.currentProvince}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Ward No</label>
                    <input
                        type="text"
                        name="wardNo"
                        value={formData.wardNo}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="col-span-full border-t border-gray-100 my-4"></div>

                <div className="col-span-full flex items-center justify-between">
                    <h3 className="text-md font-semibold text-indigo-700 border-l-4 border-indigo-600 pl-2">Permanent Address</h3>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                            ...prev,
                            permanentMunicipality: prev.currentMunicipality,
                            permanentDistrict: prev.currentDistrict,
                            permanentProvince: prev.currentProvince,
                            permanentCountry: prev.currentCountry
                        }))}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition-colors"
                    >
                        Same as current
                    </button>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Municipality/VDC</label>
                    <input
                        type="text"
                        name="permanentMunicipality"
                        value={formData.permanentMunicipality}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">District</label>
                    <input
                        type="text"
                        name="permanentDistrict"
                        value={formData.permanentDistrict}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Province</label>
                    <input
                        type="text"
                        name="permanentProvince"
                        value={formData.permanentProvince}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Country</label>
                    <input
                        type="text"
                        name="permanentCountry"
                        value={formData.permanentCountry}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <h3 className="col-span-full text-md font-semibold text-indigo-700 border-l-4 border-indigo-600 pl-2 mt-4">Contact Info</h3>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Contact Number</label>
                    <input
                        type="text"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
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

export default KycAddress;
