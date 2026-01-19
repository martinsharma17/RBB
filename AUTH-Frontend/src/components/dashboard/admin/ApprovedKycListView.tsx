import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    Search,
    RefreshCw,
    Download,
    CheckSquare,
    Square,
    ShieldCheck,
    Calendar
} from 'lucide-react';

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

const ApprovedKycListView: React.FC = () => {
    const { token, apiBase } = useAuth();
    const [data, setData] = useState<KycUnifiedItem[]>([]);
    const [filteredData, setFilteredData] = useState<KycUnifiedItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchData();
    }, [token, apiBase]);

    useEffect(() => {
        handleFilter();
    }, [searchQuery, data]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/unified-list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if (result.success) {
                // Filter only Approved records
                const approvedRecords = result.data.filter((item: KycUnifiedItem) => item.status === 'Approved');
                setData(approvedRecords);
            }
        } catch (err) {
            console.error("Error fetching unified list:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilter = () => {
        let filtered = data;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.customerName.toLowerCase().includes(query) ||
                item.email.toLowerCase().includes(query)
            );
        }

        setFilteredData(filtered);
    };

    const toggleSelect = (id: number) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredData.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredData.map(item => item.workflowId)));
        }
    };

    const handleDownloadIndividual = async (workflowId: number, name: string) => {
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/export-csv/${workflowId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Approved_KYC_${name.replace(/\s+/g, '_')}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error("Download error:", err);
        }
    };

    const handleBulkDownload = async () => {
        if (selectedIds.size === 0) return;

        const idsParam = Array.from(selectedIds).join(',');
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/export-approved-csv?ids=${idsParam}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Approved_KYC_Bulk_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (err) {
            console.error("Bulk download error:", err);
        }
    };

    return (
        <div className="p-6 min-h-screen animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                        <ShieldCheck className="w-8 h-8 text-emerald-600" />
                        Approved KYC Records
                    </h1>
                    <p className="text-slate-500 mt-1">Archived documentation of all successfully verified KYC applications.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-all text-slate-600 font-medium"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Action Bar */}
            <div className="bg-white/70 backdrop-blur-md border border-white/20 shadow-xl rounded-2xl p-4 mb-6 sticky top-4 z-10 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 transition-all outline-none text-slate-700"
                    />
                </div>

                {selectedIds.size > 0 && (
                    <button
                        onClick={handleBulkDownload}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all font-bold animate-in slide-in-from-right-4"
                    >
                        <Download className="w-5 h-5" />
                        Download Selected ({selectedIds.size})
                    </button>
                )}

                <div className="ml-auto text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {filteredData.length} records found
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 w-12 mr-0">
                                    <button onClick={toggleSelectAll} className="p-1 rounded hover:bg-slate-200 transition-colors">
                                        {selectedIds.size === filteredData.length && filteredData.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-300" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Date</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Workflow Path</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={6} className="px-6 py-8">
                                            <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item) => (
                                    <tr
                                        key={item.workflowId}
                                        className={`hover:bg-slate-50/50 transition-colors group ${selectedIds.has(item.workflowId) ? 'bg-emerald-50/30' : ''}`}
                                        onClick={() => toggleSelect(item.workflowId)}
                                    >
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <button onClick={() => toggleSelect(item.workflowId)} className="p-1 rounded hover:bg-slate-200 transition-colors">
                                                {selectedIds.has(item.workflowId) ? (
                                                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-200" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold border border-emerald-100">
                                                    {item.customerName.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 text-base">{item.customerName}</span>
                                                    <span className="text-sm text-slate-500">{item.email}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-100">
                                                {item.branchName || 'Global'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                {new Date(item.lastUpdatedAt || item.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs text-slate-500 font-mono bg-slate-50 p-2 rounded-lg truncate max-w-[200px]" title={item.fullChain}>
                                                {item.fullChain}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleDownloadIndividual(item.workflowId, item.customerName)}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all hover:scale-110 active:scale-95"
                                                    title="Download Approved Record"
                                                >
                                                    <Download className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                        No approved KYC records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ApprovedKycListView;
