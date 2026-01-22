import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface Province {
    id: number;
    name: string;
}

interface District {
    id: number;
    name: string;
    provinceId: number;
    provinceName?: string;
}

interface Municipality {
    id: number;
    name: string;
    districtId: number;
    districtName?: string;
    provinceId?: number;
    provinceName?: string;
}

const AddressManagementView: React.FC = () => {
    const { token, apiBase } = useAuth();
    const [activeTab, setActiveTab] = useState<'provinces' | 'districts' | 'municipalities'>('provinces');

    // Provinces
    const [provinces, setProvinces] = useState<Province[]>([]);
    const [showProvinceModal, setShowProvinceModal] = useState(false);
    const [editingProvince, setEditingProvince] = useState<Province | null>(null);
    const [provinceForm, setProvinceForm] = useState({ name: '' });

    // Districts
    const [districts, setDistricts] = useState<District[]>([]);
    const [showDistrictModal, setShowDistrictModal] = useState(false);
    const [editingDistrict, setEditingDistrict] = useState<District | null>(null);
    const [districtForm, setDistrictForm] = useState({ name: '', provinceId: 0 });

    // Municipalities
    const [municipalities, setMunicipalities] = useState<Municipality[]>([]);
    const [showMunicipalityModal, setShowMunicipalityModal] = useState(false);
    const [editingMunicipality, setEditingMunicipality] = useState<Municipality | null>(null);
    const [municipalityForm, setMunicipalityForm] = useState({ name: '', districtId: 0 });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProvinces();
    }, []);

    useEffect(() => {
        if (activeTab === 'districts') fetchDistricts();
        if (activeTab === 'municipalities') fetchMunicipalities();
    }, [activeTab]);

    const fetchProvinces = async () => {
        try {
            const response = await fetch(`${apiBase}/api/Address/provinces`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setProvinces(data);
        } catch (err) {
            setError('Failed to load provinces');
        } finally {
            setLoading(false);
        }
    };

    const fetchDistricts = async () => {
        try {
            const response = await fetch(`${apiBase}/api/Address/districts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setDistricts(data);
        } catch (err) {
            setError('Failed to load districts');
        }
    };

    const fetchMunicipalities = async () => {
        try {
            const response = await fetch(`${apiBase}/api/Address/municipalities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setMunicipalities(data);
        } catch (err) {
            setError('Failed to load municipalities');
        }
    };

    // Province CRUD
    const handleProvinceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const url = editingProvince
                ? `${apiBase}/api/Address/provinces/${editingProvince.id}`
                : `${apiBase}/api/Address/provinces`;

            const method = editingProvince ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(provinceForm)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to save province');
            }

            await fetchProvinces();
            setShowProvinceModal(false);
            setEditingProvince(null);
            setProvinceForm({ name: '' });
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleProvinceDelete = async (id: number) => {
        if (!confirm('Are you sure? This will fail if the province has districts.')) return;

        try {
            const response = await fetch(`${apiBase}/api/Address/provinces/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to delete province');
            }

            await fetchProvinces();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // District CRUD
    const handleDistrictSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate provinceId
        if (districtForm.provinceId <= 0) {
            setError('Please select a province');
            return;
        }

        try {
            const url = editingDistrict
                ? `${apiBase}/api/Address/districts/${editingDistrict.id}`
                : `${apiBase}/api/Address/districts`;

            const method = editingDistrict ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(districtForm)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to save district');
            }

            await fetchDistricts();
            setShowDistrictModal(false);
            setEditingDistrict(null);
            setDistrictForm({ name: '', provinceId: 0 });
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDistrictDelete = async (id: number) => {
        if (!confirm('Are you sure? This will fail if the district has municipalities.')) return;

        try {
            const response = await fetch(`${apiBase}/api/Address/districts/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to delete district');
            }

            await fetchDistricts();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Municipality CRUD
    const handleMunicipalitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validate districtId
        if (municipalityForm.districtId <= 0) {
            setError('Please select a district');
            return;
        }

        try {
            const url = editingMunicipality
                ? `${apiBase}/api/Address/municipalities/${editingMunicipality.id}`
                : `${apiBase}/api/Address/municipalities`;

            const method = editingMunicipality ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(municipalityForm)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Failed to save municipality');
            }

            await fetchMunicipalities();
            setShowMunicipalityModal(false);
            setEditingMunicipality(null);
            setMunicipalityForm({ name: '', districtId: 0 });
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleMunicipalityDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this municipality?')) return;

        try {
            const response = await fetch(`${apiBase}/api/Address/municipalities/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete municipality');

            await fetchMunicipalities();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Address Management</h1>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('provinces')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'provinces'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Provinces
                    </button>
                    <button
                        onClick={() => setActiveTab('districts')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'districts'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Districts
                    </button>
                    <button
                        onClick={() => setActiveTab('municipalities')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'municipalities'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        Municipalities
                    </button>
                </nav>
            </div>

            {/* Provinces Tab */}
            {activeTab === 'provinces' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Provinces</h2>
                        <button
                            onClick={() => setShowProvinceModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Add Province
                        </button>
                    </div>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {provinces.map((province) => (
                                    <tr key={province.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{province.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{province.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setEditingProvince(province);
                                                    setProvinceForm({ name: province.name });
                                                    setShowProvinceModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleProvinceDelete(province.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Districts Tab */}
            {activeTab === 'districts' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Districts</h2>
                        <button
                            onClick={() => setShowDistrictModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Add District
                        </button>
                    </div>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Province</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {districts.map((district) => (
                                    <tr key={district.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{district.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{district.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{district.provinceName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setEditingDistrict(district);
                                                    setDistrictForm({ name: district.name, provinceId: district.provinceId });
                                                    setShowDistrictModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDistrictDelete(district.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Municipalities Tab */}
            {activeTab === 'municipalities' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Municipalities</h2>
                        <button
                            onClick={() => setShowMunicipalityModal(true)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Add Municipality
                        </button>
                    </div>
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">District</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Province</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {municipalities.map((municipality) => (
                                    <tr key={municipality.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{municipality.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{municipality.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{municipality.districtName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{municipality.provinceName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => {
                                                    setEditingMunicipality(municipality);
                                                    setMunicipalityForm({ name: municipality.name, districtId: municipality.districtId });
                                                    setShowMunicipalityModal(true);
                                                }}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleMunicipalityDelete(municipality.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Province Modal */}
            {showProvinceModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingProvince ? 'Edit Province' : 'Add Province'}
                        </h2>
                        <form onSubmit={handleProvinceSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Province Name</label>
                                <input
                                    type="text"
                                    value={provinceForm.name}
                                    onChange={(e) => setProvinceForm({ name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProvinceModal(false);
                                        setEditingProvince(null);
                                        setProvinceForm({ name: '' });
                                    }}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                    {editingProvince ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* District Modal */}
            {showDistrictModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingDistrict ? 'Edit District' : 'Add District'}
                        </h2>
                        <form onSubmit={handleDistrictSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">District Name</label>
                                <input
                                    type="text"
                                    value={districtForm.name}
                                    onChange={(e) => setDistrictForm({ ...districtForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Province</label>
                                <select
                                    value={districtForm.provinceId}
                                    onChange={(e) => setDistrictForm({ ...districtForm, provinceId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value={0}>Select Province</option>
                                    {provinces.map((province) => (
                                        <option key={province.id} value={province.id}>
                                            {province.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowDistrictModal(false);
                                        setEditingDistrict(null);
                                        setDistrictForm({ name: '', provinceId: 0 });
                                    }}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                    {editingDistrict ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Municipality Modal */}
            {showMunicipalityModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingMunicipality ? 'Edit Municipality' : 'Add Municipality'}
                        </h2>
                        <form onSubmit={handleMunicipalitySubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Municipality Name</label>
                                <input
                                    type="text"
                                    value={municipalityForm.name}
                                    onChange={(e) => setMunicipalityForm({ ...municipalityForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                                <select
                                    value={municipalityForm.districtId}
                                    onChange={(e) => setMunicipalityForm({ ...municipalityForm, districtId: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-indigo-500"
                                    required
                                >
                                    <option value={0}>Select District</option>
                                    {districts.map((district) => (
                                        <option key={district.id} value={district.id}>
                                            {district.name} ({district.provinceName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowMunicipalityModal(false);
                                        setEditingMunicipality(null);
                                        setMunicipalityForm({ name: '', districtId: 0 });
                                    }}
                                    className="px-4 py-2 border rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                                    {editingMunicipality ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressManagementView;
