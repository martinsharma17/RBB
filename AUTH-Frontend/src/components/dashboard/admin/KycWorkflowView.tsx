import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import KycReviewModal from './KycReviewModal';

interface PendingKyc {
    id: number;
    kycSessionId: number;
    customerEmail: string;
    customerName?: string;
    branchName?: string;
    pendingLevel: number;
    totalLevels: number;
    createdAt: string;
    lastRemarks: string;
    currentRoleName: string;
    chain: string[];
    status: number;
}

interface KycWorkflowViewProps {
    workflowId?: number | null;
    onClearActiveId?: () => void;
}

const KycWorkflowView: React.FC<KycWorkflowViewProps> = ({ workflowId, onClearActiveId }) => {
    const { token, apiBase, user, permissions } = useAuth();
    const [pendingKycs, setPendingKycs] = useState<PendingKyc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKyc, setSelectedKyc] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<any>(null);
    const [remarks, setRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<any>({});
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Check if user has export permission
    const canExport = user?.roles?.some(r => r.toLowerCase() === 'superadmin') || permissions?.kyc?.export || false;

    useEffect(() => {
        fetchPending();
    }, [token, apiBase]);

    // Automatically open specific KYC if workflowId is passed (e.g. from Dashboard)
    useEffect(() => {
        if (workflowId && token && apiBase) {
            viewDetails(workflowId);
            // Clear it in the parent context so it doesn't re-trigger wrongly later
            onClearActiveId?.();
        }
    }, [workflowId, token, apiBase]);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPendingKycs(data.data.pending || []);
                setSelectedIds([]); // Reset selection on refresh
            }
        } catch (err) {
            console.error("Failed to fetch pending KYCs", err);
        } finally {
            setLoading(false);
        }
    };

    const viewDetails = async (workflowId: number) => {
        setSelectedKyc(workflowId);
        setDetailData(null);
        setIsEditing(false);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/details/${workflowId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setDetailData(data.data);
                setEditedData(data.data.details || {});
            }
        } catch (err) {
            console.error("Failed to fetch details", err);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedKyc) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/update-details`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workflowId: selectedKyc,
                    ...editedData
                })
            });
            const data = await res.json();
            if (data.success) {
                setIsEditing(false);
                viewDetails(selectedKyc); // Refresh
            } else {
                alert(data.message || "Failed to save changes.");
            }
        } catch (err) {
            console.error("Error saving edits", err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAction = async (action: 'approve' | 'reject' | 'resubmit' | 'pull-back', returnToPrevious: boolean = false) => {
        if (!selectedKyc) return;

        // Confirmation Alert
        let actionDescription = "";
        switch (action) {
            case 'approve': actionDescription = "approve this application"; break;
            case 'resubmit': actionDescription = "resubmit this application"; break;
            case 'pull-back': actionDescription = "pull back this application"; break;
            case 'reject':
                actionDescription = returnToPrevious
                    ? "return this application to the previous reviewer"
                    : "reject this application back to the customer";
                break;
        }

        if (!window.confirm(`Are you sure you want to ${actionDescription}?`)) {
            return;
        }

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
                    workflowId: selectedKyc,
                    remarks: remarks,
                    returnToPrevious: returnToPrevious
                })
            });

            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setSelectedKyc(null);
                    setRemarks('');
                    fetchPending();
                } else {
                    alert(data.message || `Failed to ${action} KYC.`);
                }
            } else {
                // Handle non-OK responses (403, 500 etc)
                if (res.status === 403) {
                    alert(`Access Forbidden: You do not have permission to ${action} this KYC application.`);
                } else {
                    const errorText = await res.text();
                    console.error("Server Error Response:", errorText);
                    alert(`Server returned an error (${res.status}). Please check your permissions or contact support.`);
                }
            }
        } catch (err) {
            console.error(`Network Error while trying to ${action} KYC:`, err);
            alert(`A network error occurred. Please try again or check your connection.`);
        } finally {
            setActionLoading(false);
        }
    };
    const handleDownloadCsv = async (workflowId: number) => {
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/export-csv/${workflowId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `KYC_Form_${workflowId}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Failed to download CSV.");
            }
        } catch (err) {
            console.error("Download error", err);
            alert("A network error occurred while downloading the file.");
        }
    };

    const handleDownloadBulkCsv = async () => {
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/export-pending-csv`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Pending_KYC_List_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Failed to download bulk CSV.");
            }
        } catch (err) {
            console.error("Bulk download error", err);
            alert("A network error occurred while downloading the queue.");
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === pendingKycs.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingKycs.map(k => k.id));
        }
    };

    const toggleSelectOne = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleDownloadSelected = async () => {
        if (selectedIds.length === 0) return;
        try {
            // Since we don't have a bulk-specific IDs endpoint yet, we'll download one by one or 
            // if the backend supports a list of IDs, we should use that.
            // For now, let's assume we want to download the pending list filtered by these IDs if possible.
            // Actually, let's just download each individually or inform the user.
            // A better way is to have a backend endpoint that accepts a list of IDs.
            // Let's check if export-pending-csv can take a list of IDs.
            const res = await fetch(`${apiBase}/api/KycApproval/export-pending-csv?ids=${selectedIds.join(',')}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Selected_KYC_List_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                alert("Failed to download selected CSV.");
            }
        } catch (err) {
            console.error("Download error", err);
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-500 font-medium tracking-wide">Fetching Pending Applications...</p>
        </div>
    );

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">KYC Approval Queue</h2>
                    <p className="text-gray-500 mt-1">Review applicant data and manage workflow transitions.</p>
                </div>
                <div className="flex items-center gap-3">
                    {canExport && (
                        <div className="flex items-center gap-2">
                            {selectedIds.length > 0 && (
                                <button
                                    onClick={handleDownloadSelected}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Export Selected ({selectedIds.length})
                                </button>
                            )}
                            <button
                                onClick={handleDownloadBulkCsv}
                                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all duration-300"
                                title="Download entire pending queue as CSV"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export Full Queue
                            </button>
                        </div>
                    )}
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100 uppercase tracking-wider">
                        Active Tasks: {pendingKycs.length}
                    </span>
                    <button
                        onClick={fetchPending}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>

            {pendingKycs.length === 0 ? (
                <div className="bg-white p-16 rounded-3xl shadow-sm border border-gray-100 text-center">
                    <div className="w-20 h-20 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3">
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">All Caught Up!</h3>
                    <p className="text-gray-500 mt-2 max-w-xs mx-auto">There are no pending KYC applications in your queue at this time.</p>
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left">
                                        <input
                                            type="checkbox"
                                            checked={pendingKycs.length > 0 && selectedIds.length === pendingKycs.length}
                                            onChange={toggleSelectAll}
                                            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest min-w-[200px]">Customer</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Current Location</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Submission Date</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest text-center">Form</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</th>
                                    <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-5">
                                {pendingKycs.map((kyc) => (
                                    <tr key={kyc.id} className={`hover:bg-indigo-50/30 transition-colors group border-b border-gray-50 last:border-0 ${selectedIds.includes(kyc.id) ? 'bg-indigo-50/50' : ''}`}>
                                        <td className="px-6 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(kyc.id)}
                                                onChange={() => toggleSelectOne(kyc.id)}
                                                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="px-6 py-4 cursor-pointer" onClick={() => viewDetails(kyc.id)}><div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                {kyc.customerEmail.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{kyc.customerName || kyc.customerEmail}</div>
                                                <div className="text-[10px] font-mono text-gray-400">
                                                    {kyc.customerName ? kyc.customerEmail : `SESSION #${kyc.kycSessionId}`}
                                                </div>
                                            </div>
                                        </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                                                {kyc.currentRoleName || 'N/A'}
                                            </span>
                                            <div className="mt-1 flex items-center gap-1">
                                                <span className="text-[10px] font-bold text-gray-400 capitalize bg-gray-50 px-1.5 rounded border border-gray-100">{kyc.branchName || 'Global'}</span>
                                            </div>
                                            {kyc.status === 4 && (
                                                <span className="block mt-1 text-[9px] font-black text-red-500 uppercase tracking-tighter ring-1 ring-red-100 w-fit px-1.5 rounded bg-red-50">
                                                    RESUBMISSION REQ.
                                                </span>
                                            )}
                                            {kyc.status === 3 && (
                                                <span className="block mt-1 text-[9px] font-black text-orange-500 uppercase tracking-tighter ring-1 ring-orange-100 w-fit px-1.5 rounded bg-orange-50">
                                                    RETURNED / REJECTED
                                                </span>
                                            )}
                                            {kyc.chain && kyc.chain.length > 0 && (
                                                <div className="mt-2 flex items-center gap-1.5 opacity-50">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Path:</span>
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-500 uppercase tracking-tighter overflow-hidden whitespace-nowrap mask-fade-right">
                                                        {kyc.chain.map((role, i) => (
                                                            <React.Fragment key={i}>
                                                                <span className={role === kyc.currentRoleName ? 'text-indigo-600 font-extrabold ring-1 ring-indigo-100 px-1 rounded' : ''}>{role}</span>
                                                                {i < kyc.chain.length - 1 && <span>›</span>}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-gray-500">
                                            {new Date(kyc.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            {canExport && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadCsv(kyc.id); }}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Download individual KYC CSV"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${((kyc.totalLevels - kyc.pendingLevel) / kyc.totalLevels) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase italic">
                                                    Step {kyc.totalLevels - kyc.pendingLevel + 1} of {Math.max(kyc.totalLevels, 1)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <button
                                                onClick={() => viewDetails(kyc.id)}
                                                className="px-5 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-bold rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all duration-300"
                                            >
                                                Review Data
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <KycReviewModal
                isOpen={!!selectedKyc}
                onClose={() => !actionLoading && setSelectedKyc(null)}
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
                onDownloadCsv={handleDownloadCsv}
                canExport={canExport}
            />
        </div>
    );
};

export default KycWorkflowView;
