import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface PendingKyc {
    id: number;
    kycSessionId: number;
    customerEmail: string;
    pendingLevel: number;
    totalLevels: number;
    createdAt: string;
    lastRemarks: string;
    currentRoleName: string;
    chain: string[];
}

const KycWorkflowView: React.FC = () => {
    const { token, apiBase } = useAuth();
    const [pendingKycs, setPendingKycs] = useState<PendingKyc[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedKyc, setSelectedKyc] = useState<number | null>(null);
    const [detailData, setDetailData] = useState<any>(null);
    const [remarks, setRemarks] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchPending();
    }, [token, apiBase]);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/pending`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setPendingKycs(data.data.pending || []);
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
        setActiveTab('overview');
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/details/${workflowId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setDetailData(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch details", err);
        }
    };

    const handleAction = async (action: 'approve' | 'reject', returnToPrevious: boolean = false) => {
        if (!selectedKyc) return;
        if ((action === 'reject' || returnToPrevious) && !remarks) {
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
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Applicant</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Current Location</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Submission Date</th>
                                    <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Progress</th>
                                    <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pendingKycs.map((kyc) => (
                                    <tr key={kyc.id} className="hover:bg-indigo-50/30 transition-all group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                                    {kyc.customerEmail.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{kyc.customerEmail}</div>
                                                    <div className="text-[10px] font-mono text-gray-400">SESSION #{kyc.kycSessionId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                                                {kyc.currentRoleName || 'N/A'}
                                            </span>
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
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full"
                                                        style={{ width: `${((kyc.totalLevels - kyc.pendingLevel) / kyc.totalLevels) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-indigo-600 uppercase italic">
                                                    Step {kyc.totalLevels - kyc.pendingLevel + 1} of {kyc.totalLevels}
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

            {/* Premium Review Modal */}
            {selectedKyc && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !actionLoading && setSelectedKyc(null)}></div>
                    <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative animate-scale-up">

                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b flex justify-between items-center bg-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900">Application Review</h3>
                                    <p className="text-xs text-gray-500 font-medium">{detailData?.workflow?.kycSession?.email || 'Loading...'}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => !actionLoading && setSelectedKyc(null)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="px-8 border-b bg-gray-50/50 flex gap-8">
                            <TabButton id="overview" label="Overview" active={activeTab === 'overview'} onClick={setActiveTab} />
                            <TabButton id="details" label="Full Data" active={activeTab === 'details'} onClick={setActiveTab} />
                            <TabButton id="documents" label="Documents" active={activeTab === 'documents'} onClick={setActiveTab} />
                            <TabButton id="history" label="Workflow History" active={activeTab === 'history'} onClick={setActiveTab} />
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                            {!detailData ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : (
                                <div className="space-y-8 max-w-4xl mx-auto">

                                    {/* Workflow Roadmap */}
                                    <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm overflow-hidden relative">
                                        <div className="flex items-center justify-between mb-8 px-2">
                                            <div>
                                                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">Approval Pipeline</h4>
                                                <h2 className="text-xl font-black text-gray-900">Current Progress</h2>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Step: {detailData.workflow.currentRoleId ? (detailData.approvalChain?.find((c: any) => c.roleId === detailData.workflow.currentRoleId)?.roleName || 'Unknown') : 'Finalized'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between relative px-10 mb-4">
                                            {/* Connecting Line */}
                                            <div className="absolute top-1/2 left-10 right-10 h-1 bg-gray-100 -translate-y-1/2"></div>
                                            <div
                                                className="absolute top-1/2 left-10 h-1 bg-indigo-500 -translate-y-1/2 transition-all duration-1000 ease-in-out"
                                                style={{ width: `${(detailData.approvalChain?.findIndex((c: any) => c.isCurrent) / (detailData.approvalChain?.length - 1)) * 100}%` }}
                                            ></div>

                                            {detailData.approvalChain?.map((step: any, idx: number) => (
                                                <div key={idx} className="relative flex flex-col items-center z-10">
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border-4 border-white shadow-lg ${step.isCompleted ? 'bg-green-500 text-white' :
                                                        step.isCurrent ? 'bg-indigo-600 text-white scale-125 ring-8 ring-indigo-50' :
                                                            'bg-white text-gray-300'
                                                        }`}>
                                                        {step.isCompleted ? (
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        ) : (
                                                            <span className="font-black text-sm">{idx + 1}</span>
                                                        )}
                                                    </div>
                                                    <span className={`absolute -bottom-8 whitespace-nowrap text-[9px] font-black uppercase tracking-widest ${step.isCurrent ? 'text-indigo-600' : 'text-gray-400'
                                                        }`}>
                                                        {step.roleName}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="pt-10 px-2">
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                * This application requires <span className="text-gray-900 font-bold">{detailData.approvalChain?.length} levels</span> of verification for final approval.
                                            </p>
                                        </div>
                                    </div>

                                    {activeTab === 'overview' && (
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <SectionCard title="Personal Summary">
                                                <InfoRow label="Full Name" value={`${detailData.details?.FirstName} ${detailData.details?.LastName}`} />
                                                <InfoRow label="Gender" value={detailData.details?.Gender} />
                                                <InfoRow label="Citizenship" value={detailData.details?.CitizenshipNumber} />
                                                <InfoRow label="Mobile" value={detailData.details?.MobileNumber} />
                                            </SectionCard>
                                            <SectionCard title="Address & Financial">
                                                <InfoRow label="Permanent" value={detailData.details?.PermanentDistrict} />
                                                <InfoRow label="Annual Income" value={detailData.details?.AnnualIncome} />
                                                <InfoRow label="Occupation" value={detailData.details?.Occupation} />
                                                <InfoRow label="PEP Status" value={detailData.details?.IsPep ? '🔴 HIGH RISK' : '🟢 NO'} />
                                            </SectionCard>
                                        </div>
                                    )}

                                    {activeTab === 'details' && (
                                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                                            <pre className="text-xs font-mono text-gray-700 bg-gray-50 p-6 rounded-xl overflow-x-auto border">
                                                {JSON.stringify(detailData.details, null, 2)}
                                            </pre>
                                        </div>
                                    )}

                                    {activeTab === 'documents' && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                            {detailData.details?.Documents?.map((doc: any) => (
                                                <div key={doc.Id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer">
                                                    <div className="aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </div>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase truncate" title={doc.DocumentName}>
                                                        {doc.DocumentName}
                                                    </p>
                                                    <a href={doc.FilePath} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-600 font-bold mt-1 block hover:underline">VIEW FILE</a>
                                                </div>
                                            ))}
                                            {(!detailData.details?.Documents || detailData.details.Documents.length === 0) && (
                                                <div className="col-span-full py-12 text-center text-gray-400 font-medium">No documents attached.</div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'history' && (
                                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                            <div className="space-y-8 relative">
                                                <div className="absolute top-0 bottom-0 left-[15px] w-0.5 bg-gray-100"></div>
                                                {detailData.logs?.map((h: any) => (
                                                    <div key={h.id} className="flex gap-6 relative">
                                                        <div className={`w-8 h-8 rounded-full flex-shrink-0 z-10 flex items-center justify-center border-4 border-white shadow-sm ${h.action === 'Approved' ? 'bg-green-500' : h.action === 'Rejected' ? 'bg-red-500' : 'bg-indigo-500'
                                                            }`}>
                                                            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-white ${h.action === 'Approved' ? 'bg-green-500' : h.action === 'Rejected' ? 'bg-red-500' : 'bg-indigo-500'
                                                                        }`}>
                                                                        {h.action}
                                                                    </span>
                                                                    <span className="text-[10px] text-gray-400 font-bold">{new Date(h.createdAt).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                                                    <span className="text-[10px] font-black text-indigo-600 uppercase">{h.actionedByRoleName || 'System'}</span>
                                                                    <svg className="w-3 h-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                    </svg>
                                                                    <span className="text-[10px] font-black text-gray-400 uppercase">{h.forwardedToRoleName || 'Finalized'}</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-gray-600 text-sm mt-2 leading-relaxed bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">{h.remarks || "No remarks provided."}</p>
                                                            <p className="text-[10px] text-gray-400 font-medium mt-2 flex items-center gap-2">
                                                                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">
                                                                    {h.userFullName?.charAt(0) || 'S'}
                                                                </div>
                                                                Action by: <span className="text-gray-600 font-bold">{h.userFullName || 'System'}</span> (ID: {h.userId || 'N/A'})
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="flex gap-6 relative">
                                                    <div className="w-8 h-8 rounded-full flex-shrink-0 z-10 flex items-center justify-center border-4 border-white shadow-sm bg-gray-200">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-gray-400 uppercase tracking-tight text-sm">Initiated</span>
                                                        <p className="text-gray-400 text-[10px] font-bold mt-1">Application started its journey here.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Box */}
                                    <div className="bg-white p-8 rounded-[32px] border-2 border-indigo-100 shadow-xl shadow-indigo-100/20">
                                        <label className="flex items-center gap-2 text-sm font-black text-gray-900 uppercase mb-4 tracking-widest px-1">
                                            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Reviewer Feedback
                                        </label>
                                        <textarea
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className="w-full p-5 border-2 border-gray-100 rounded-3xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none min-h-[140px] text-gray-700 font-medium transition-all"
                                            placeholder="Clearly state why you are approving or sending back this application..."
                                        />
                                        <p className="text-[10px] text-gray-400 mt-3 px-3 italic">* Remarks are mandatory for all Rejection and Return actions.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="px-8 py-6 border-t flex flex-wrap justify-between items-center gap-4 bg-white">
                            <button
                                onClick={() => !actionLoading && setSelectedKyc(null)}
                                className="px-6 py-3 text-gray-500 font-black uppercase text-xs tracking-widest hover:bg-gray-100 rounded-2xl transition-all"
                                disabled={actionLoading}
                            >
                                Cancel Review
                            </button>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => handleAction('reject', true)}
                                    disabled={actionLoading || !remarks}
                                    className="px-6 py-3 bg-white text-orange-600 font-bold text-xs uppercase tracking-widest border-2 border-orange-100 rounded-2xl hover:bg-orange-50 disabled:opacity-30 transition-all"
                                    title="Send back to the previous reviewer in the chain"
                                >
                                    Return to Previous
                                </button>
                                <button
                                    onClick={() => handleAction('reject', false)}
                                    disabled={actionLoading || !remarks}
                                    className="px-6 py-3 bg-red-50 text-red-600 font-bold text-xs uppercase tracking-widest border-2 border-red-100 rounded-2xl hover:bg-red-100 disabled:opacity-30 transition-all shadow-lg shadow-red-200/50"
                                    title="Completely reject back to the customer (Maker)"
                                >
                                    Reject to Maker
                                </button>
                                <button
                                    onClick={() => handleAction('approve')}
                                    disabled={actionLoading}
                                    className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:shadow-2xl hover:shadow-indigo-300 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
                                >
                                    {actionLoading ? (
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                    <span>{detailData?.workflow?.pendingLevel === 1 ? 'Final Approval' : 'Approve & Pass'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Sub-components for cleaner code
const TabButton: React.FC<{ id: string, label: string, active: boolean, onClick: (id: string) => void }> = ({ id, label, active, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`py-4 px-1 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
    >
        {label}
    </button>
);

const SectionCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <h4 className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">{title}</h4>
        <div className="space-y-3">{children}</div>
    </div>
);

const InfoRow: React.FC<{ label: string, value: any }> = ({ label, value }) => (
    <div className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
        <span className="text-xs text-gray-400 font-bold uppercase">{label}</span>
        <span className="text-xs text-gray-900 font-black">{value || 'N/A'}</span>
    </div>
);

export default KycWorkflowView;
