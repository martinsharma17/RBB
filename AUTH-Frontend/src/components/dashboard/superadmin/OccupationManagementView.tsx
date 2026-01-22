import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface Occupation {
    id: number;
    name: string;
}

const OccupationManagementView: React.FC = () => {
    const { token, apiBase } = useAuth();
    const [occupations, setOccupations] = useState<Occupation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingOccupation, setEditingOccupation] = useState<Occupation | null>(null);
    const [formData, setFormData] = useState({ name: '' });
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchOccupations();
    }, []);

    const fetchOccupations = async () => {
        try {
            const response = await fetch(`${apiBase}/api/Occupation`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            setOccupations(data);
        } catch (err) {
            setError('Failed to load occupations');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        try {
            const url = editingOccupation
                ? `${apiBase}/api/Occupation/${editingOccupation.id}`
                : `${apiBase}/api/Occupation`;

            const method = editingOccupation ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Failed to save occupation');

            await fetchOccupations();
            handleCloseModal();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this occupation?')) return;

        try {
            const response = await fetch(`${apiBase}/api/Occupation/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Failed to delete occupation');

            await fetchOccupations();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleEdit = (occupation: Occupation) => {
        setEditingOccupation(occupation);
        setFormData({ name: occupation.name });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingOccupation(null);
        setFormData({ name: '' });
        setError(null);
    };

    if (loading) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Occupation Management</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                >
                    Add Occupation
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                    {error}
                </div>
            )}

            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Name
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {occupations.map((occupation) => (
                            <tr key={occupation.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {occupation.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {occupation.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleEdit(occupation)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(occupation.id)}
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            {editingOccupation ? 'Edit Occupation' : 'Add Occupation'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Occupation Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                >
                                    {editingOccupation ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OccupationManagementView;
