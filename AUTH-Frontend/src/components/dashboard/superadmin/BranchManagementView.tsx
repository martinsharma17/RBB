import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, MapPin, Building, Search, X } from 'lucide-react';
import { branchService, Branch } from '../../../services/branchService';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-hot-toast';

const BranchManagementView: React.FC = () => {
    const { apiBase, token } = useAuth();
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        location: ''
    });

    const loadBranches = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const data = await branchService.getAll(apiBase, token);
            setBranches(data || []);
        } catch (error) {
            console.error('Failed to load branches:', error);
            toast.error('Failed to load branches');
        } finally {
            setLoading(false);
        }
    }, [apiBase, token]);

    useEffect(() => {
        loadBranches();
    }, [loadBranches]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            if (editingBranch) {
                await branchService.update(editingBranch.id, { ...formData, id: editingBranch.id }, apiBase, token);
                toast.success('Branch updated successfully');
            } else {
                await branchService.create(formData, apiBase, token);
                toast.success('Branch created successfully');
            }
            setIsModalOpen(false);
            resetForm();
            loadBranches();
        } catch (error) {
            toast.error('Failed to save branch');
        }
    };

    const handleDelete = async (id: number) => {
        if (!token) return;
        if (window.confirm('Are you sure you want to delete this branch?')) {
            try {
                await branchService.delete(id, apiBase, token);
                toast.success('Branch deleted');
                loadBranches();
            } catch (error) {
                toast.error('Failed to delete branch');
            }
        }
    };

    const openEdit = (branch: Branch) => {
        setEditingBranch(branch);
        setFormData({
            name: branch.name,
            code: branch.code,
            location: branch.location
        });
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingBranch(null);
        setFormData({ name: '', code: '', location: '' });
    };

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && branches.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="mt-4 text-gray-500 font-medium">Loading branches...</p>
            </div>
        );
    }

    return (
        <div className="p-1 space-y-8 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Branch Management</h1>
                    <p className="text-gray-500 mt-1 text-lg">Create and manage physical branch locations and their codes.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setIsModalOpen(true); }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
                >
                    <Plus size={20} strokeWidth={2.5} />
                    Add New Branch
                </button>
            </div>

            {/* Stats & Search Row */}
            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={22} />
                    <input
                        type="text"
                        placeholder="Search by name, code or location..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 outline-none focus:border-indigo-500 transition-all shadow-sm text-gray-700"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-4 px-6 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm">
                    <Building className="text-indigo-600" size={24} />
                    <div>
                        <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">Total Branches</div>
                        <div className="text-2xl font-bold text-gray-900 leading-none">{branches.length}</div>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            {filteredBranches.length === 0 && !loading && (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No branches found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                        {searchTerm ? `We couldn't find any results matching "${searchTerm}".` : 'Get started by adding your first branch location.'}
                    </p>
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-6 text-indigo-600 font-semibold hover:underline"
                        >
                            Clear search filter
                        </button>
                    )}
                </div>
            )}

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredBranches.map((branch) => (
                    <div
                        key={branch.id}
                        className="group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                    >
                        {/* Decorative Background Element */}
                        <div className="absolute -top-12 -right-12 w-32 h-32 bg-indigo-50 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50"></div>

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                                    <Building size={28} />
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => openEdit(branch)}
                                        className="p-2.5 hover:bg-indigo-50 rounded-xl text-gray-400 hover:text-indigo-600 transition-colors"
                                        title="Edit Branch"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch.id)}
                                        className="p-2.5 hover:bg-red-50 rounded-xl text-gray-400 hover:text-red-600 transition-colors"
                                        title="Delete Branch"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-extrabold text-gray-900 text-2xl mb-2 group-hover:text-indigo-600 transition-colors">{branch.name}</h3>

                            <div className="space-y-4 pt-4 border-t border-gray-50 mt-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">
                                        ID: {branch.code}
                                    </span>
                                </div>
                                <div className="flex items-start gap-3 text-gray-500 group-hover:text-gray-700 transition-colors">
                                    <MapPin size={20} className="mt-0.5 shrink-0 text-indigo-400" />
                                    <span className="text-base leading-relaxed">{branch.location}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Glass Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden">
                        <div className="bg-indigo-600 p-8 text-white relative">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute right-6 top-6 p-2 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={24} />
                            </button>
                            <Building size={48} className="mb-4 opacity-80" />
                            <h2 className="text-3xl font-extrabold">
                                {editingBranch ? 'Edit Department' : 'New Branch'}
                            </h2>
                            <p className="text-indigo-100 mt-2 font-medium">Please fill in the details of the branch location.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1 uppercase tracking-wider">Branch Name</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none focus:border-indigo-500 transition-all text-gray-800 font-medium"
                                        placeholder="e.g. Kathmandu Main Branch"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1 uppercase tracking-wider">Unique Code</label>
                                    <input
                                        required
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none focus:border-indigo-500 transition-all text-gray-800 font-medium font-mono"
                                        placeholder="e.g. KTM01"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 px-1 uppercase tracking-wider">Full Address</label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                        className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none focus:border-indigo-500 transition-all text-gray-800 font-medium"
                                        placeholder="e.g. Durbar Marg, KTM"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-6 py-4 text-gray-600 font-bold bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-6 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-100"
                                >
                                    {editingBranch ? 'Save Changes' : 'Create Branch'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BranchManagementView;

