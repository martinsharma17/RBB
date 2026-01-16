import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';

interface KycSearchResult {
    workflowId: number;
    customerName: string;
    email: string;
    mobileNumber: string;
    branchName: string;
    status: string;
    createdAt: string;
}

const KycSearchView: React.FC = () => {
    const { token, apiBase, user, permissions } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedBranchId, setSelectedBranchId] = useState<string>('');
    const [branches, setBranches] = useState<{ id: number, name: string }[]>([]);
    const [results, setResults] = useState<KycSearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [message, setMessage] = useState({ text: '', type: '' });
    const canExport = user?.roles?.some(r => r.toLowerCase() === 'superadmin') || permissions?.kyc?.export || false;

    // Fetch branches for the filter
    React.useEffect(() => {
        const fetchBranches = async () => {
            try {
                const res = await fetch(`${apiBase}/api/Branch`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setBranches(data);
                }
            } catch (err) {
                console.error("Failed to fetch branches", err);
            }
        };
        fetchBranches();
    }, [apiBase, token]);

    const handleSearch = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        // Allow search to proceed if there's either a query or a branch selected
        if (!searchQuery.trim() && !selectedBranchId) return;

        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            let url = `${apiBase}/api/KycApproval/search?query=${encodeURIComponent(searchQuery)}`;
            if (selectedBranchId) {
                url += `&branchId=${selectedBranchId}`;
            }

            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setResults(data.data || []);
                if (data.data?.length === 0) {
                    setMessage({ text: "No matching applications found.", type: "info" });
                }
            } else {
                setMessage({ text: data.message || "Failed to fetch results.", type: "error" });
            }
        } catch (err) {
            console.error("Search failed", err);
            setMessage({ text: "Network error occurred.", type: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handlePull = async (workflowId: number) => {
        if (!window.confirm("Are you sure you want to pull this application to your branch? This will remove it from the previous branch's queue.")) return;

        setActionLoading(workflowId);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/pull-to-my-branch`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ workflowId })
            });
            const data = await res.json();
            if (data.success) {
                setMessage({ text: "Application transferred successfully! You can now find it in your Pending queue.", type: "success" });
                handleSearch(); // Refresh results
            } else {
                alert(data.message || "Transfer failed.");
            }
        } catch (err) {
            console.error("Transfer error", err);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDownloadCsv = async (workflowId: number) => {
        setActionLoading(workflowId);
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
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Global KYC Search</h2>
                <p className="text-gray-500 mt-1">Find applicants across the organization and pull them to your branch for verification.</p>
            </div>

            {/* Search Box */}
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 mb-8">
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by Name, Email, Mobile or Citizenship Number..."
                            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Branch Filter Dropdown */}
                    <div className="w-full md:w-64">
                        <select
                            className="w-full px-4 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-gray-900 appearance-none"
                            value={selectedBranchId}
                            onChange={(e) => setSelectedBranchId(e.target.value)}
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-10 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
                    >
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {message.text && (
                    <div className={`mt-4 p-4 rounded-2xl border text-sm font-medium ${message.type === 'success' ? 'bg-green-50 border-green-100 text-green-700' :
                        message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' :
                            'bg-blue-50 border-blue-100 text-blue-700'
                        }`}>
                        {message.text}
                    </div>
                )}
            </div>

            {/* Results */}
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Customer</th>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Current Branch</th>
                                <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                {canExport && <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Export</th>}
                                <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-widest">Transfer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {results.map((res) => (
                                <tr key={res.workflowId} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-gray-900">{res.customerName}</div>
                                        <div className="text-xs text-gray-400">{res.email} • {res.mobileNumber || 'No Mobile'}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black rounded-lg uppercase">
                                            {res.branchName}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-xs font-medium text-orange-600">{res.status}</span>
                                    </td>
                                    {canExport && (
                                        <td className="px-8 py-5">
                                            <button
                                                onClick={() => handleDownloadCsv(res.workflowId)}
                                                disabled={actionLoading === res.workflowId}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                                title="Download individual KYC CSV"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </button>
                                        </td>
                                    )}
                                    <td className="px-8 py-5 text-right flex justify-end gap-2">
                                        {/* Transfer logic for Admin vs Staff */}
                                        {user?.roles?.some(r => r === 'SuperAdmin' || r === 'Admin') ? (
                                            <div className="flex items-center gap-2">
                                                <select
                                                    className="px-2 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold outline-none"
                                                    onChange={(e) => {
                                                        const targetBranchId = parseInt(e.target.value);
                                                        if (targetBranchId) {
                                                            if (window.confirm(`Are you sure you want to transfer this application to ${branches.find(b => b.id === targetBranchId)?.name}?`)) {
                                                                // Call specific transfer API for Admins
                                                                setActionLoading(res.workflowId);
                                                                fetch(`${apiBase}/api/KycApproval/transfer`, {
                                                                    method: 'POST',
                                                                    headers: {
                                                                        'Authorization': `Bearer ${token}`,
                                                                        'Content-Type': 'application/json'
                                                                    },
                                                                    body: JSON.stringify({ workflowId: res.workflowId, newBranchId: targetBranchId })
                                                                }).then(r => r.json()).then(data => {
                                                                    if (data.success) {
                                                                        setMessage({ text: "Transferred successfully!", type: "success" });
                                                                        handleSearch();
                                                                    } else alert(data.message);
                                                                }).finally(() => setActionLoading(null));
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <option value="">Move to...</option>
                                                    {branches.map(b => (
                                                        <option key={b.id} value={b.id}>{b.name}</option>
                                                    ))}
                                                </select>
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Transfer</span>
                                            </div>
                                        ) : (
                                            // Regular Staff "Pull" logic
                                            res.branchName !== user?.branchName ? (
                                                <button
                                                    onClick={() => handlePull(res.workflowId)}
                                                    disabled={actionLoading === res.workflowId}
                                                    className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50"
                                                >
                                                    {actionLoading === res.workflowId ? 'Pulling...' : 'Transfer to My Branch'}
                                                </button>
                                            ) : (
                                                <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest px-4 py-2 bg-green-50 rounded-xl border border-green-100">
                                                    In Your Branch
                                                </span>
                                            )
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default KycSearchView;
