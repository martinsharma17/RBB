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

    const handleSaveEdit = async (documentFiles?: { [key: number]: File }) => {
        if (!selectedKyc) return;
        setActionLoading(true);
        try {
            // First, upload any new documents
            if (documentFiles && Object.keys(documentFiles).length > 0) {
                for (const [docId, file] of Object.entries(documentFiles)) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('documentId', docId);

                    const uploadRes = await fetch(`${apiBase}/api/KycData/replace-document`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!uploadRes.ok) {
                        console.error(`Failed to upload document ${docId}`);
                    }
                }
            }

            // Then save the edited data
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
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-6 py-5 text-left">
                                        <input
                                            type="checkbox"
                                            checked={pendingKycs.length > 0 && selectedIds.length === pendingKycs.length}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                        />
                                    </th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Applicant Details</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Current Routing</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Submission</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventory</th>
                                    <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Lifecycle</th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {pendingKycs.map((kyc) => (
                                    <tr
                                        key={kyc.id}
                                        className={`group hover:bg-slate-50/80 transition-all duration-300 border-b border-slate-50 last:border-0 ${selectedIds.includes(kyc.id) ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <td className="px-6 py-6">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(kyc.id)}
                                                onChange={() => toggleSelectOne(kyc.id)}
                                                className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer transition-all"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </td>
                                        <td className="px-6 py-6 cursor-pointer" onClick={() => viewDetails(kyc.id)}>
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform duration-300">
                                                    {kyc.customerName?.charAt(0) || kyc.customerEmail.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-black text-slate-900 leading-tight mb-0.5 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{kyc.customerName || 'Pending Profile'}</div>
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{kyc.customerEmail}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-1.5">
                                                <span className="w-fit px-3 py-1 bg-white border-2 border-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-sm">
                                                    {kyc.currentRoleName || 'STATION #1'}
                                                </span>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${kyc.status === 4 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{kyc.branchName || 'Global HQ'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-black text-slate-700">{new Date(kyc.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(kyc.createdAt).getFullYear()}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            {canExport && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDownloadCsv(kyc.id); }}
                                                    className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-600 rounded-xl transition-all shadow-sm hover:shadow-md"
                                                    title="Download Dataset"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </button>
                                            )}
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-2">
                                                <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-50">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-1000"
                                                        style={{ width: `${Math.max(15, ((kyc.totalLevels - kyc.pendingLevel) / kyc.totalLevels) * 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.1em] italic">
                                                    Station {kyc.totalLevels - kyc.pendingLevel + 1} of {Math.max(kyc.totalLevels, 1)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <button
                                                onClick={() => viewDetails(kyc.id)}
                                                className="h-11 px-8 bg-slate-900 text-white text-xs font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-200 transition-all duration-300 group/btn"
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
