import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    Search,
    Filter,
    Eye,
    Clock,
    RefreshCw,
    Shield
} from 'lucide-react';
import KycReviewModal from './KycReviewModal';

interface KycUnifiedItem {
    workflowId: number;
    kycId: number;
    customerName: string;
    email: string;
    mobileNumber: string;
    status: string;
    pendingLevel: number;
    currentRoleName: string;
    submittedRoleName: string;
    fullChain: string;
    createdAt: string;
    lastUpdatedAt: string;
    lastRemarks: string;
    branchName: string;
}

const UnifiedKycQueueView: React.FC = () => {
    const { token, apiBase, user, permissions } = useAuth();
    const [data, setData] = useState<KycUnifiedItem[]>([]);
    const [filteredData, setFilteredData] = useState<KycUnifiedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Review Modal States
    const [selectedKycId, setSelectedKycId] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<any>({});

    const canExport = user?.roles?.some(r => r.toLowerCase() === 'superadmin') || permissions?.kyc?.export || false;

    useEffect(() => {
        fetchData();
    }, [token, apiBase]);

    useEffect(() => {
        handleFilter();
    }, [searchQuery, statusFilter, data]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/unified-list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setData(result.data);
            }
        } catch (err) {
            console.error("Error fetching unified list:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        let filtered = data;

        if (statusFilter !== 'All') {
            filtered = filtered.filter(item => item.status === statusFilter);
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.customerName.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query)
            );
        }

        setFilteredData(filtered);
    };

    const viewDetails = async (workflowId: number) => {
        setLoading(true);
        setSelectedKycId(workflowId);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/details/${workflowId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                setDetailData(result.data);
                setEditedData(result.data.details || {});
                setIsReviewOpen(true);
            }
        } catch (err) {
            console.error("Error fetching details:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'resubmit' | 'pull-back', returnToPrevious: boolean = false) => {
        if (!selectedKycId) return;

        if (action === 'reject' && !remarks) {
            alert("Remarks are required for rejection or returning.");
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workflowId: selectedKycId,
                    remarks: remarks,
                    returnToPrevious: returnToPrevious
                })
            });

            const result = await res.json();
            if (result.success) {
                setIsReviewOpen(false);
                setRemarks('');
                fetchData();
            } else {
                alert(result.message || `Failed to ${action} KYC.`);
            }
        } catch (err) {
            console.error(`Error during ${action}:`, err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveEdit = async (documentFiles?: { [key: number]: File }) => {
        if (!selectedKycId) return;
        setActionLoading(true);

        try {
            // Document replacement logic (if any)
            if (documentFiles && Object.keys(documentFiles).length > 0) {
                for (const [docId, file] of Object.entries(documentFiles)) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('documentId', docId);

                    await fetch(`${apiBase}/api/KycData/replace-document`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                }
            }

            // Save details
            const res = await fetch(`${apiBase}/api/KycApproval/update-details`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workflowId: selectedKycId,
                    ...editedData
                })
            });

            const result = await res.json();
            if (result.success) {
                setIsEditing(false);
                viewDetails(selectedKycId);
            } else {
                alert(result.message || "Failed to update details.");
            }
        } catch (err) {
            console.error("Error saving edits:", err);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700 border-green-200';
            case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
            case 'InProgress': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'InReview': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="p-6 min-h-screen animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <Shield className="w-8 h-8 text-blue-600" />
                        Unified KYC Queue
                    </h1>
                    <p className="text-slate-500 mt-1">Branch-scoped oversight and tracking of all KYC workflows.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all text-slate-600 font-medium"
                >
                    <RefreshCw className={`w-4 h-4 ${loading && !isReviewOpen ? 'animate-spin' : ''}`} />
                    Refresh Data
                </button>
            </div>

            {/* Filter Bar - Glassmorphism */}
            <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-4 mb-6 sticky top-4 z-10 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-slate-700"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="text-slate-400 w-5 h-5" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border-none px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 font-medium min-w-[150px]"
                    >
                        <option value="All">All Statuses</option>
                        <option value="InReview">In Review</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                </div>

                <div className="ml-auto text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {filteredData.length} entries found
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status & Level</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Holder</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow Chain</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date Created</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && !isReviewOpen ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={7} className="px-6 py-8">
                                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr key={item.workflowId} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-slate-700 text-base">{item.customerName}</span>
                                                <span className="text-sm text-slate-500">{item.email}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                                {item.branchName || 'Global'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold border inline-block w-fit ${getStatusStyle(item.status)}`}>
                                                    {item.status}
                                                </span>
                                                <span className="text-xs text-slate-400 font-medium italic">
                                                    {item.pendingLevel} approvals remaining
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-600 font-semibold bg-slate-50 p-2 rounded-lg w-fit border border-slate-100">
                                                <Clock className="w-4 h-4 text-blue-500" />
                                                {item.currentRoleName || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded-lg truncate max-w-[200px]" title={item.fullChain}>
                                                {item.fullChain}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-500 text-sm font-medium">
                                            {new Date(item.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => viewDetails(item.workflowId)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all group-hover:scale-110 active:scale-95"
                                                    title="View Action Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-slate-50 p-6 rounded-full">
                                                <Search className="w-12 h-12 text-slate-300" />
                                            </div>
                                            <p className="text-slate-400 font-medium">No results found for your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <KycReviewModal
                isOpen={isReviewOpen}
                onClose={() => !actionLoading && setIsReviewOpen(false)}
                detailData={detailData}
                apiBase={apiBase}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                editedData={editedData}
                setEditedData={setEditedData}
                onSave={handleSaveEdit}
                actionLoading={actionLoading}
                remarks={remarks}
                setRemarks={setRemarks}
                onAction={handleAction}
                canExport={canExport}
            />
        </div>
    );
};

export default UnifiedKycQueueView;

