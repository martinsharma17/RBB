import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';

interface KycPersonalInfoProps {
    sessionId: number | null;
    initialData?: any;
    onNext: (data: any) => void;
}

interface KycPersonalInfoData {
    fullName: string;
    dobAd: string;
    dobBs: string;
    gender: string;
    nationality: string;
    citizenshipNo: string;
    citizenshipIssueDate: string;
    citizenshipIssueDistrict: string;
    panNo: string;
    [key: string]: any;
}

const KycPersonalInfo: React.FC<KycPersonalInfoProps> = ({ sessionId, initialData, onNext }) => {
    const { token, apiBase } = useAuth();

    // Normalize data from either backend format (Pascal/Camel) or previous frontend format
    const [formData, setFormData] = useState<KycPersonalInfoData>({
        fullName: initialData?.fullName || initialData?.FullName || '',
        dobAd: initialData?.dateOfBirthAd || initialData?.DateOfBirthAd || '',
        dobBs: initialData?.dateOfBirthBs || initialData?.DateOfBirthBs || '',
        gender: initialData?.gender === 1 ? "Male" : (initialData?.gender === 2 ? "Female" : (initialData?.gender === 3 ? "Other" : (typeof initialData?.gender === 'string' ? initialData.gender : ""))),
        nationality: initialData?.isNepali || initialData?.IsNepali ? 'Nepali' : (initialData?.otherNationality || initialData?.OtherNationality || initialData?.nationality || 'Nepali'),
        citizenshipNo: initialData?.citizenshipNo || initialData?.CitizenshipNo || '',
        citizenshipIssueDate: initialData?.citizenshipIssueDate || initialData?.CitizenshipIssueDate || '',
        citizenshipIssueDistrict: initialData?.citizenshipIssueDistrict || initialData?.CitizenshipIssueDistrict || '',
        panNo: initialData?.panNo || initialData?.PanNo || ''
    });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync if initialData changes (e.g. after a fetch)
    React.useEffect(() => {
        if (initialData) {
            setFormData({
                fullName: initialData?.fullName || initialData?.FullName || '',
                dobAd: initialData?.dateOfBirthAd || initialData?.DateOfBirthAd || '',
                dobBs: initialData?.dateOfBirthBs || initialData?.DateOfBirthBs || '',
                gender: initialData?.gender === 1 ? "Male" : (initialData?.gender === 2 ? "Female" : (initialData?.gender === 3 ? "Other" : (typeof initialData?.gender === 'string' ? initialData.gender : ""))),
                nationality: initialData?.isNepali || initialData?.IsNepali ? 'Nepali' : (initialData?.otherNationality || initialData?.OtherNationality || initialData?.nationality || 'Nepali'),
                citizenshipNo: initialData?.citizenshipNo || initialData?.CitizenshipNo || '',
                citizenshipIssueDate: initialData?.citizenshipIssueDate || initialData?.CitizenshipIssueDate || '',
                citizenshipIssueDistrict: initialData?.citizenshipIssueDistrict || initialData?.CitizenshipIssueDistrict || '',
                panNo: initialData?.panNo || initialData?.PanNo || ''
            });
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!sessionId) {
            setError("KYC Session not initialized correctly.");
            return;
        }
        setSaving(true);
        setError(null);

        // Map frontend data to backend PersonalInfoDto
        const mappedData = {
            fullName: formData.fullName,
            dateOfBirthBs: formData.dobBs || null,
            dateOfBirthAd: formData.dobAd || null,
            gender: formData.gender === "Male" ? 1 : (formData.gender === "Female" ? 2 : (formData.gender === "Other" ? 3 : null)),
            isNepali: formData.nationality?.toLowerCase() === "nepali",
            otherNationality: formData.nationality?.toLowerCase() === "nepali" ? null : formData.nationality,
            citizenshipNo: formData.citizenshipNo || null,
            citizenshipIssueDistrict: formData.citizenshipIssueDistrict || null,
            citizenshipIssueDate: formData.citizenshipIssueDate || null,
            panNo: formData.panNo || null
        };

        const headers: any = {
            'Content-Type': 'application/json'
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        try {
            const response = await fetch(`${apiBase}/api/KycData/save-personal-info`, {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    sessionId: sessionId,
                    stepNumber: 1,
                    data: mappedData
                })
            });

            if (response.ok) {
                onNext({ personalInfo: formData });
            } else {
                const data = await response.json();
                if (data.errors) {
                    const firstErr = Object.values(data.errors)[0];
                    setError(Array.isArray(firstErr) ? (firstErr[0] as string) : "Validation error");
                } else {
                    setError(data.message || data.title || "Failed to save section");
                }
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
                <h2 className="text-xl font-bold text-gray-800">Section 1: Personal Information</h2>
                <p className="text-sm text-gray-500">Provide your basic identity details.</p>
            </div>

            {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200 animate-shake">{error}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                    <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                        placeholder="As per citizenship"
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Date of Birth (AD) *</label>
                    <input
                        type="date"
                        name="dobAd"
                        value={formData.dobAd ? (formData.dobAd.includes('T') ? formData.dobAd.split('T')[0] : formData.dobAd) : ''}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Gender</label>
                    <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Nationality</label>
                    <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Citizenship Number</label>
                    <input
                        type="text"
                        name="citizenshipNo"
                        value={formData.citizenshipNo}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Citizenship Issue Date</label>
                    <input
                        type="date"
                        name="citizenshipIssueDate"
                        value={formData.citizenshipIssueDate ? (formData.citizenshipIssueDate.includes('T') ? formData.citizenshipIssueDate.split('T')[0] : formData.citizenshipIssueDate) : ''}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">Issue District</label>
                    <input
                        type="text"
                        name="citizenshipIssueDistrict"
                        value={formData.citizenshipIssueDistrict}
                        onChange={handleChange}
                        placeholder="e.g. Kathmandu"
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-700 mb-1">PAN Number</label>
                    <input
                        type="text"
                        name="panNo"
                        value={formData.panNo}
                        onChange={handleChange}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-6">
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

export default KycPersonalInfo;
