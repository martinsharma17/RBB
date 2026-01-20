import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
    Search,
    RefreshCw,
    Download,
    CheckSquare,
    Square,
    ShieldCheck,
    Calendar,
    FileText,
    Database
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    const [downloadPopup, setDownloadPopup] = useState<{ isOpen: boolean; items: KycUnifiedItem[] }>({ isOpen: false, items: [] });
    const [processingDownload, setProcessingDownload] = useState(false);

    const fetchFullDetails = async (id: number) => {
        try {
            const res = await fetch(`${apiBase}/api/KycApproval/details/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const json = await res.json();
            return json.success ? json.data : null;
        } catch (e) {
            console.error("Error fetching details for", id, e);
            return null;
        }
    };

    const processDownload = async (type: 'pdf' | 'csv') => {
        setProcessingDownload(true);
        try {
            const items = downloadPopup.items;
            const fullDetailsList = await Promise.all(items.map(item => fetchFullDetails(item.workflowId)));
            const validDetails = fullDetailsList.filter(d => d !== null);

            if (type === 'pdf') {
                const doc = new jsPDF();
                let isFirst = true;

                for (const detail of validDetails) {
                    if (!isFirst) doc.addPage();
                    isFirst = false;

                    // Header styling
                    doc.setFillColor(16, 185, 129);
                    doc.rect(0, 0, 210, 40, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(22);
                    doc.text("Approved KYC Record", 14, 22);
                    doc.setFontSize(10);
                    doc.text(`ID: ${detail.workflowId}`, 14, 32);
                    doc.text(`Generated: ${new Date().toLocaleString()}`, 150, 32);

                    const d = detail.details || {};
                    const tableData: any[] = [];
                    const processObj = (obj: any, prefix = '') => {
                        for (const [key, val] of Object.entries(obj)) {
                            if (typeof val === 'object' && val !== null) {
                                if (!Array.isArray(val)) {
                                    processObj(val, `${prefix}${key} `);
                                } else {
                                    tableData.push([`${prefix}${key}`, val.join(', ')]);
                                }
                            } else {
                                tableData.push([`${prefix}${key}`, val]);
                            }
                        }
                    };
                    processObj(d);

                    autoTable(doc, {
                        startY: 50,
                        head: [['Field', 'Value']],
                        body: tableData,
                        theme: 'grid',
                        styles: { fontSize: 8 },
                        headStyles: { fillColor: [16, 185, 129] }
                    });

                    // Add Documents Section
                    if (detail.attachments && detail.attachments.length > 0) {
                        const docRows = detail.attachments.map((a: any) => [
                            getDocTypeName(a.documentType),
                            `${a.documentName || 'File'} (Size: ${(a.fileSize / 1024).toFixed(2)} KB)`
                        ]);

                        autoTable(doc, {
                            startY: (doc as any).lastAutoTable.finalY + 10,
                            head: [['Document Type', 'File Details']],
                            body: docRows,
                            theme: 'grid',
                            headStyles: { fillColor: [100, 116, 139] },
                            styles: { fontSize: 8 },
                        });
                    }
                }

                doc.save(`KYC_Export_${new Date().toISOString()}.pdf`);
            } else {
                // CSV
                const allKeys = new Set<string>();
                const flattenedList = validDetails.map(detail => {
                    const flat: any = flattenObject(detail.details || {});
                    flat['WorkflowID'] = detail.workflowId;

                    // Add Documents Column
                    if (detail.attachments && detail.attachments.length > 0) {
                        flat['Documents'] = detail.attachments.map((a: any) =>
                            `${getDocTypeName(a.documentType)}: ${a.documentName}`
                        ).join('; ');
                    } else {
                        flat['Documents'] = "No Documents";
                    }

                    Object.keys(flat).forEach(k => allKeys.add(k));
                    return flat;
                });

                const headers = Array.from(allKeys).sort();
                // Ensure WorkflowID is first
                if (headers.includes('WorkflowID')) {
                    headers.splice(headers.indexOf('WorkflowID'), 1);
                    headers.unshift('WorkflowID');
                }

                const csvRows = [];
                csvRows.push(headers.join(','));

                for (const row of flattenedList) {
                    csvRows.push(headers.map(header => {
                        const val = row[header] === undefined || row[header] === null ? '' : String(row[header]);
                        return `"${val.replace(/"/g, '""')}"`;
                    }).join(','));
                }

                const csvContent = csvRows.join('\n');
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement("a");
                const url = URL.createObjectURL(blob);
                link.setAttribute("href", url);
                link.setAttribute("download", `KYC_Export_${new Date().toISOString()}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (err) {
            console.error(err);
            alert("Error generating download");
        } finally {
            setProcessingDownload(false);
            setDownloadPopup({ isOpen: false, items: [] });
        }
    };

    function flattenObject(ob: any): any {
        let toReturn: any = {};
        for (let i in ob) {
            if (!ob.hasOwnProperty(i)) continue;
            if ((typeof ob[i]) == 'object' && ob[i] !== null) {
                if (Array.isArray(ob[i])) {
                    toReturn[i] = JSON.stringify(ob[i]);
                } else {
                    let flatObject = flattenObject(ob[i]);
                    for (let x in flatObject) {
                        if (!flatObject.hasOwnProperty(x)) continue;
                        toReturn[i + ' ' + x] = flatObject[x];
                    }
                }
            } else {
                toReturn[i] = ob[i];
            }
        }
        return toReturn;
    }

    const getDocTypeName = (typeId: number) => {
        const types: any = {
            1: "Passport Photo",
            2: "Citizenship Front",
            3: "Citizenship Back",
            4: "Signature",
            5: "Left Thumb",
            6: "Right Thumb",
            10: "Location Map"
        };
        return types[typeId] || `Document Type ${typeId}`;
    };

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

    const handleBulkDownload = () => {
        if (selectedIds.size === 0) return;
        const items = filteredData.filter(i => selectedIds.has(i.workflowId));
        setDownloadPopup({ isOpen: true, items });
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
                                            <div className="flex items-center justify-center gap-2 relative">
                                                <button
                                                    onClick={() => setDownloadPopup({ isOpen: true, items: [item] })}
                                                    className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all hover:scale-110 active:scale-95 flex items-center gap-1 border border-emerald-100"
                                                    title="Download"
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
            {/* Download Option Modal */}
            {downloadPopup.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 transform transition-all scale-100 border border-gray-100">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Download Options</h3>
                            <p className="text-gray-500 mb-6">
                                Choose format to download {downloadPopup.items.length} record(s).
                            </p>

                            {processingDownload ? (
                                <div className="flex flex-col items-center py-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-2"></div>
                                    <span className="text-sm text-gray-400">Processing...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => processDownload('pdf')}
                                        className="flex items-center justify-center gap-3 w-full py-3 bg-rose-50 text-rose-700 font-bold rounded-xl hover:bg-rose-100 transition-colors border border-rose-100"
                                    >
                                        <FileText className="w-5 h-5" />
                                        Download as PDF
                                    </button>
                                    <button
                                        onClick={() => processDownload('csv')}
                                        className="flex items-center justify-center gap-3 w-full py-3 bg-emerald-50 text-emerald-700 font-bold rounded-xl hover:bg-emerald-100 transition-colors border border-emerald-100"
                                    >
                                        <Database className="w-5 h-5" />
                                        Download as CSV
                                    </button>
                                    <button
                                        onClick={() => setDownloadPopup({ isOpen: false, items: [] })}
                                        className="mt-2 text-sm text-gray-400 hover:text-gray-600"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApprovedKycListView;
