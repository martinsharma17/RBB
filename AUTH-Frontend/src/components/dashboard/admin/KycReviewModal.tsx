import React, { useState } from 'react';
import {
    X, FileText, Database,
    CheckCircle2, AlertCircle, Edit3, Download,
    Eye, ArrowLeft, ShieldCheck, User,
    ArrowRightCircle, RotateCcw, ChevronDown
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface KycReviewModalProps {
    isOpen: boolean; onClose: () => void; detailData: any; apiBase: string;
    isEditing: boolean; setIsEditing: (val: boolean) => void;
    editedData: any; setEditedData: (val: any) => void;
    onSave: (documentFiles?: { [key: number]: File }) => void; actionLoading: boolean;
    remarks: string; setRemarks: (val: string) => void;
    onAction: (action: 'approve' | 'reject' | 'resubmit' | 'pull-back', prev?: boolean) => void;
    canExport: boolean;
}

const KycReviewModal: React.FC<KycReviewModalProps> = ({
    isOpen, onClose, detailData, apiBase, isEditing, setIsEditing,
    editedData, setEditedData, onSave, actionLoading, remarks, setRemarks,
    onAction, canExport
}) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [previewDoc, setPreviewDoc] = useState<any>(null);
    const [documentFiles, setDocumentFiles] = useState<{ [key: number]: File }>({});
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    const downloadAsCSV = () => {
        const data = editedData;
        const headers = ["Field Name", "Value"];
        const rows = Object.entries(data)
            .filter(([key, value]) => !['id', 'sessionId', 'userId', 'updatedAt', 'branchId'].includes(key) && typeof value !== 'object')
            .map(([key, value]) => {
                const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                const formattedValue = value === true ? 'YES' : value === false ? 'NO' : value || '—';
                return [formattedKey, formattedValue];
            });

        const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `KYC_Details_${data.firstName || 'User'}_${data.lastName || ''}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setShowDownloadMenu(false);
    };

    const getImageBase64 = async (id: number): Promise<string | null> => {
        try {
            const url = `${apiBase}/api/KycData/document/${id}`;
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) return null;
            const blob = await response.blob();
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.error("Failed to fetch image for PDF:", err);
            return null;
        }
    };

    const downloadAsPDF = async () => {
        const data = editedData;
        const doc = new jsPDF();

        // Header styling
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("KYC Review Document", 14, 22);

        doc.setFontSize(9);
        doc.text(`Application ID: ${detailData?.workflow?.id || 'N/A'}`, 14, 32);
        doc.text(`Email: ${detailData?.workflow?.kycSession?.email || data.email || 'N/A'}`, 80, 32);
        doc.text(`Date: ${new Date().toLocaleString()}`, 150, 32);

        // Group data for better readability
        const sections = [
            {
                title: 'Personal Information',
                fields: ['firstName', 'middleName', 'lastName', 'gender', 'dateOfBirth', 'nationality', 'citizenshipNumber', 'panNumber']
            },
            {
                title: 'Permanent Address',
                fields: ['permanentState', 'permanentDistrict', 'permanentMunicipality', 'permanentWardNo', 'permanentStreet']
            },
            {
                title: 'Current Address',
                fields: ['currentState', 'currentDistrict', 'currentMunicipality', 'currentWardNo', 'currentStreet']
            }
        ];

        let startY = 50;
        for (const section of sections) {
            const sectionData = Object.entries(data)
                .filter(([key]) => section.fields.includes(key))
                .map(([key, value]) => {
                    const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    const formattedValue = value === true ? 'YES' : value === false ? 'NO' : value || '—';
                    return [formattedKey, formattedValue];
                });

            if (sectionData.length > 0) {
                doc.setTextColor(79, 70, 229);
                doc.setFontSize(12);
                doc.text(section.title, 14, startY - 2);

                autoTable(doc, {
                    startY: startY,
                    head: [['Field', 'Value']],
                    body: sectionData,
                    theme: 'grid',
                    headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
                    bodyStyles: { fontSize: 8, cellPadding: 2 },
                    margin: { left: 14, right: 14 }
                });
                startY = (doc as any).lastAutoTable.finalY + 15;

                // Add new page if needed
                if (startY > 270) {
                    doc.addPage();
                    startY = 20;
                }
            }
        }

        // Add Supporting Documents (Visual Representation)
        if (detailData.documents && detailData.documents.length > 0) {
            doc.addPage();
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(18);
            doc.text("Supporting Documents", 14, 20);
            doc.line(14, 22, 80, 22);

            // Deduplicate (latest version only)
            const uniqueMap = new Map();
            detailData.documents.forEach((d: any) => uniqueMap.set(d.documentType, d));
            const uniqueDocs = Array.from(uniqueMap.values());

            let photoY = 35;
            for (const docItem of uniqueDocs) {
                const base64 = await getImageBase64(docItem.id);
                if (base64) {
                    if (photoY + 105 > 285) {
                        doc.addPage();
                        photoY = 20;
                    }
                    doc.setTextColor(31, 41, 55);
                    doc.setFontSize(11);
                    doc.setFont("helvetica", "bold");
                    doc.text(String(docItem.documentType), 14, photoY);
                    doc.setFont("helvetica", "normal");

                    try {
                        doc.addImage(base64, 'JPEG', 14, photoY + 5, 140, 95, undefined, 'FAST');
                        photoY += 105;
                    } catch (e) {
                        console.error("Error adding image:", e);
                        photoY += 15;
                    }
                }
            }
        }

        // Footer
        const pageCount = (doc as any).internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
        }

        doc.save(`KYC_Review_${data.firstName || 'User'}_${data.lastName || ''}.pdf`);
        setShowDownloadMenu(false);
    };

    if (!isOpen) return null;
    const isCompleted = detailData?.workflow?.status === 'Approved' || detailData?.workflow?.status === 2;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => !actionLoading && onClose()} />
            <div className="bg-white rounded-[40px] shadow-2xl w-[98vw] h-[98vh] max-w-none overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <FileText className="w-7 h-7" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Application Review</h3>
                                <span className="bg-slate-100 px-2 py-0.5 rounded-lg text-[10px] font-black text-slate-500 uppercase">ID: {detailData?.workflow?.id}</span>
                            </div>
                            <p className="text-sm text-slate-500 font-medium">{detailData?.workflow?.kycSession?.email || detailData?.details?.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {isEditing && <span className="px-4 py-2 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-2xl border border-amber-200 animate-pulse">Editing Mode</span>}
                        {!isCompleted && (
                            <button onClick={() => isEditing ? onSave(documentFiles) : setIsEditing(true)} disabled={actionLoading}
                                className={`h-11 px-6 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all gap-2 flex items-center border-2 ${isEditing ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-600'}`}>
                                {isEditing ? <CheckCircle2 className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />} {isEditing ? 'Save Changes' : 'Quick Edit'}
                            </button>
                        )}



                        {/* download button in application review modal  */}


                        {canExport && (
                            <div className="relative">
                                <button
                                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                    className="h-11 px-6 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"
                                >
                                    <Download className="w-4 h-4" /> Export <ChevronDown className={`w-3 h-3 transition-transform ${showDownloadMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showDownloadMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <button
                                            onClick={downloadAsPDF}
                                            className="w-full text-left px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                                <FileText className="w-4 h-4" />
                                            </div>
                                            PDF Document
                                        </button>
                                        <button
                                            onClick={downloadAsCSV}
                                            className="w-full text-left px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                                <Database className="w-4 h-4" />
                                            </div>
                                            CSV Spreadsheet
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}





                        <button onClick={() => !actionLoading && onClose()} className="w-11 h-11 flex items-center justify-center text-slate-400 hover:bg-slate-50 rounded-2xl border border-slate-100"><X className="w-6 h-6" /></button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-10 border-b border-slate-100 bg-slate-50/40 flex gap-10">
                    {['overview', 'details', 'documents', 'history', 'pipeline'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`py-6 px-2 text-[11px] font-black uppercase tracking-widest border-b-[4px] transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-400'}`}>
                            {tab === 'pipeline' ? 'Approval Pipeline' : tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 bg-white p-0 sm:p-10 overflow-y-auto relative">
                    {!detailData ? <div className="py-32 text-center opacity-30">Loading...</div> : (
                        <div className="max-w-5xl mx-auto space-y-10">

                            {/* Approval Pipeline Tab */}
                            {activeTab === 'pipeline' && (
                                <div className="bg-gradient-to-br from-slate-50 to-white p-12 rounded-[36px] border border-slate-200 shadow-sm">
                                    <div className="max-w-3xl mx-auto">
                                        <div className="text-center mb-12">
                                            <h4 className="text-2xl font-black text-slate-800 mb-2">Approval Pipeline</h4>
                                            <p className="text-slate-500 text-sm">Track the application's journey through verification stages</p>
                                        </div>

                                        {/* Vertical Timeline */}
                                        <div className="relative">
                                            {/* Connecting Line */}
                                            <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200"></div>

                                            {/* Pipeline Steps */}
                                            <div className="space-y-8">
                                                {detailData.approvalChain?.map((step: any, index: number) => {
                                                    const isCompleted = step.isCompleted;
                                                    const isCurrent = step.isCurrent;

                                                    return (
                                                        <div key={index} className="relative flex items-start gap-6 group">
                                                            {/* Step Indicator */}
                                                            <div className="relative z-10 flex-shrink-0">
                                                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isCompleted
                                                                    ? 'bg-emerald-500 shadow-lg shadow-emerald-200'
                                                                    : isCurrent
                                                                        ? 'bg-indigo-600 shadow-xl shadow-indigo-300 ring-4 ring-indigo-100 animate-pulse'
                                                                        : 'bg-white border-2 border-slate-200'
                                                                    }`}>
                                                                    {isCompleted ? (
                                                                        <CheckCircle2 className="w-8 h-8 text-white" />
                                                                    ) : isCurrent ? (
                                                                        <div className="w-3 h-3 rounded-full bg-white"></div>
                                                                    ) : (
                                                                        <span className="text-slate-300 font-black text-lg">{index + 1}</span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Step Content */}
                                                            <div className={`flex-1 pb-2 pt-2 transition-all ${isCurrent ? 'transform scale-105' : ''}`}>
                                                                <div className={`p-6 rounded-2xl border-2 transition-all ${isCompleted
                                                                    ? 'bg-emerald-50 border-emerald-200'
                                                                    : isCurrent
                                                                        ? 'bg-indigo-50 border-indigo-300 shadow-lg'
                                                                        : 'bg-white border-slate-100'
                                                                    }`}>
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <h5 className={`font-black text-lg ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-indigo-700' : 'text-slate-400'
                                                                            }`}>
                                                                            {step.roleName}
                                                                        </h5>
                                                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${isCompleted
                                                                            ? 'bg-emerald-200 text-emerald-800'
                                                                            : isCurrent
                                                                                ? 'bg-indigo-200 text-indigo-800'
                                                                                : 'bg-slate-100 text-slate-400'
                                                                            }`}>
                                                                            {isCompleted ? '✓ Approved' : isCurrent ? '● In Progress' : 'Pending'}
                                                                        </span>
                                                                    </div>
                                                                    <p className={`text-xs ${isCompleted ? 'text-emerald-600' : isCurrent ? 'text-indigo-600' : 'text-slate-400'
                                                                        }`}>
                                                                        {isCompleted
                                                                            ? 'This stage has been completed successfully'
                                                                            : isCurrent
                                                                                ? 'Currently under review at this level'
                                                                                : 'Awaiting approval from previous stages'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Progress Summary */}
                                        <div className="mt-12 p-6 bg-white rounded-2xl border border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Overall Progress</p>
                                                    <p className="text-2xl font-black text-slate-800">
                                                        {detailData.approvalChain?.filter((s: any) => s.isCompleted).length || 0} of {detailData.approvalChain?.length || 0} Stages
                                                    </p>
                                                </div>
                                                <div className="w-24 h-24 relative">
                                                    <svg className="transform -rotate-90" width="96" height="96">
                                                        <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                                        <circle
                                                            cx="48"
                                                            cy="48"
                                                            r="40"
                                                            fill="none"
                                                            stroke="#4f46e5"
                                                            strokeWidth="8"
                                                            strokeDasharray={`${2 * Math.PI * 40}`}
                                                            strokeDashoffset={`${2 * Math.PI * 40 * (1 - ((detailData.approvalChain?.filter((s: any) => s.isCompleted).length || 0) / (detailData.approvalChain?.length || 1)))}`}
                                                            className="transition-all duration-1000"
                                                        />
                                                    </svg>
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-lg font-black text-indigo-600">
                                                            {Math.round(((detailData.approvalChain?.filter((s: any) => s.isCompleted).length || 0) / (detailData.approvalChain?.length || 1)) * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'overview' && (
                                <div className="grid gap-8">
                                    {detailData.logs?.[0] && (
                                        <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl">
                                            <h4 className="text-[10px] font-black text-white/60 uppercase mb-3 tracking-widest">Recent Feedback</h4>
                                            <p className="text-lg italic leading-relaxed">"{detailData.logs[0].remarks || 'No remarks provided.'}"</p>
                                            <div className="mt-4 text-[10px] font-black opacity-70">BY {detailData.logs[0].userFullName} • {new Date(detailData.logs[0].createdAt).toLocaleString()}</div>
                                        </div>
                                    )}
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <SectionCard title="Core Attributes">
                                            <InfoRow label="NAME" value={`${editedData.firstName || ''} ${editedData.lastName || ''}`} isEditing={isEditing} onChange={v => { const p = v.split(' '); setEditedData({ ...editedData, firstName: p[0], lastName: p[1] || '' }); }} />
                                            <InfoRow label="EMAIL" value={editedData.email} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, email: v })} />
                                            <InfoRow label="MOBILE" value={editedData.mobileNumber} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, mobileNumber: v })} />
                                        </SectionCard>
                                        <SectionCard title="Risk Controls">
                                            <InfoRow label="PEP STATUS" value={editedData.isPep ? 'HIGH RISK' : 'NO RISK'} color={editedData.isPep ? 'text-rose-600' : 'text-emerald-600'} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, isPep: v })} />
                                            <InfoRow label="CRIMINAL RECORD" value={editedData.hasCriminalRecord ? 'YES' : 'NONE'} color={editedData.hasCriminalRecord ? 'text-rose-600' : 'text-emerald-600'} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, hasCriminalRecord: v })} />
                                        </SectionCard>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'details' && (
                                <div className="max-w-5xl mx-auto space-y-16 pb-20">
                                    {/* 01. PERSONAL INFORMATION */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><User className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">01. Personal Information</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-8">
                                            <DetailField label="First Name" value={editedData.firstName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, firstName: v })} />
                                            <DetailField label="Middle Name" value={editedData.middleName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, middleName: v })} />
                                            <DetailField label="Last Name" value={editedData.lastName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, lastName: v })} />
                                            <DetailField label="Gender" value={editedData.gender} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, gender: v })} />
                                            <DetailField label="Date of Birth" value={editedData.dateOfBirth?.split('T')[0]} isEditing={isEditing} type="date" onChange={v => setEditedData({ ...editedData, dateOfBirth: v })} />
                                            <DetailField label="Marital Status" value={editedData.maritalStatus} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, maritalStatus: v })} />
                                            <DetailField label="Nationality" value={editedData.nationality} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, nationality: v })} />
                                            <DetailField label="Citizenship No" value={editedData.citizenshipNumber} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, citizenshipNumber: v })} />
                                            <DetailField label="Issue District" value={editedData.citizenshipIssuedDistrict} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, citizenshipIssuedDistrict: v })} />
                                            <DetailField label="Issue Date" value={editedData.citizenshipIssuedDate?.split('T')[0]} isEditing={isEditing} type="date" onChange={v => setEditedData({ ...editedData, citizenshipIssuedDate: v })} />
                                            <DetailField label="PAN No" value={editedData.panNumber} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, panNumber: v })} />
                                        </div>
                                    </section>

                                    {/* 02. ADDRESS */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><CheckCircle2 className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">02. Location Details</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-6">
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Permanent Address</h5>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                                    <DetailField label="Province" value={editedData.permanentState} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, permanentState: v })} />
                                                    <DetailField label="District" value={editedData.permanentDistrict} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, permanentDistrict: v })} />
                                                    <DetailField label="Municipality" value={editedData.permanentMunicipality} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, permanentMunicipality: v })} />
                                                    <DetailField label="Ward No" value={editedData.permanentWardNo} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, permanentWardNo: v })} />
                                                    <DetailField label="Tole" value={editedData.permanentStreet} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, permanentStreet: v })} />
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Current Address</h5>
                                                <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                                                    <DetailField label="Province" value={editedData.currentState} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, currentState: v })} />
                                                    <DetailField label="District" value={editedData.currentDistrict} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, currentDistrict: v })} />
                                                    <DetailField label="Municipality" value={editedData.currentMunicipality} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, currentMunicipality: v })} />
                                                    <DetailField label="Ward No" value={editedData.currentWardNo} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, currentWardNo: v })} />
                                                    <DetailField label="Tole" value={editedData.currentStreet} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, currentStreet: v })} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 03. FAMILY */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><User className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">03. Family Details</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <DetailField label="Grandfather" value={editedData.grandFatherName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, grandFatherName: v })} />
                                            <DetailField label="Father" value={editedData.fatherName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, fatherName: v })} />
                                            <DetailField label="Mother" value={editedData.motherName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, motherName: v })} />
                                            <DetailField label="Spouse" value={editedData.spouseName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, spouseName: v })} />
                                            <DetailField label="Son" value={editedData.sonName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, sonName: v })} />
                                            <DetailField label="Daughter" value={editedData.daughterName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, daughterName: v })} />
                                            <DetailField label="Daughter-in-law" value={editedData.daughterInLawName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, daughterInLawName: v })} />
                                            <DetailField label="Father-in-law" value={editedData.fatherInLawName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, fatherInLawName: v })} />
                                            <DetailField label="Mother-in-law" value={editedData.motherInLawName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, motherInLawName: v })} />
                                        </div>
                                    </section>

                                    {/* 04. BANK & OCCUPATION */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Database className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">04. Bank & Occupation</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-6">
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Bank Details</h5>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <DetailField label="Bank Name" value={editedData.bankName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, bankName: v })} />
                                                    <DetailField label="Account No" value={editedData.bankAccountNumber} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, bankAccountNumber: v })} />
                                                    <DetailField label="Branch" value={editedData.bankBranch} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, bankBranch: v })} />
                                                    <DetailField label="Account Type" value={editedData.bankAccountType} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, bankAccountType: v })} />
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Occupation</h5>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <DetailField label="Occupation" value={editedData.occupation} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, occupation: v })} />
                                                    <DetailField label="Organization" value={editedData.organizationName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, organizationName: v })} />
                                                    <DetailField label="Designation" value={editedData.designation} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, designation: v })} />
                                                    <DetailField label="Annual Income" value={editedData.annualIncome} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, annualIncome: v })} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 05. FINANCIALS & GUARDIAN */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><ShieldCheck className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">05. Financial & AML</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                            <div className="space-y-6">
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Funds & Risks</h5>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <DetailField label="Source of Funds" value={editedData.sourceOfFunds} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, sourceOfFunds: v })} />
                                                    <DetailField label="Major Income" value={editedData.majorSourceOfIncome} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, majorSourceOfIncome: v })} />
                                                    <DetailField label="Is PEP?" value={editedData.isPep} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, isPep: v })} />
                                                    <DetailField label="Criminal Record?" value={editedData.hasCriminalRecord} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, hasCriminalRecord: v })} />
                                                </div>
                                            </div>
                                            <div className="space-y-6">
                                                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Guardian (If Minor)</h5>
                                                <div className="grid grid-cols-2 gap-6">
                                                    <DetailField label="Name" value={editedData.guardianName} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, guardianName: v })} />
                                                    <DetailField label="Relation" value={editedData.guardianRelationship} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, guardianRelationship: v })} />
                                                    <DetailField label="Contact" value={editedData.guardianContactNo} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, guardianContactNo: v })} />
                                                    <DetailField label="PAN No" value={editedData.guardianPanNumber} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, guardianPanNumber: v })} />
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    {/* 06. LOCATION MAP */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><CheckCircle2 className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">06. Location Map</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <DetailField label="Nearest Landmark" value={editedData.locationLandmark} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, locationLandmark: v })} />
                                            <DetailField label="Distance from Main Road" value={editedData.locationDistance} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, locationDistance: v })} />
                                            <DetailField label="Latitude" value={editedData.locationLatitude} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, locationLatitude: v })} />
                                            <DetailField label="Longitude" value={editedData.locationLongitude} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, locationLongitude: v })} />

                                            {detailData.documents?.find((d: any) => d.documentType === "LocationMap" || d.documentType === "Other_10") && (
                                                <div className="col-span-full mt-4">
                                                    <label className="text-sm font-semibold text-gray-700 mb-2 block">Captured Location Map</label>
                                                    <div className="p-2 border border-slate-200 rounded-2xl bg-slate-50 inline-block">
                                                        <img
                                                            src={`${apiBase}/api/KycData/document/${detailData.documents.find((d: any) => d.documentType === "LocationMap" || d.documentType === "Other_10").id}`}
                                                            alt="Location Map"
                                                            className="max-w-full h-auto rounded-xl shadow-sm border border-slate-200 max-h-[300px]"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* 07. INVESTMENT DETAILS */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><Database className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">07. Investment Details</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <DetailField label="Source of Funds" value={editedData.sourceOfFunds} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, sourceOfFunds: v })} />
                                            <DetailField label="Major Source of Income" value={editedData.majorSourceOfIncome} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, majorSourceOfIncome: v })} />
                                            <DetailField label="Has Other Broker Account?" value={editedData.hasOtherBrokerAccount} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, hasOtherBrokerAccount: v })} />
                                            {editedData.hasOtherBrokerAccount && (
                                                <div className="col-span-full">
                                                    <DetailField label="Other Broker Names" value={editedData.otherBrokerNames} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, otherBrokerNames: v })} />
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* 08. TRANSACTION INFORMATION */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600"><FileText className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">08. Transaction Information</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <DetailField label="Trading Limit" value={editedData.tradingLimit} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, tradingLimit: v })} />
                                            <DetailField label="Margin Trading Facility?" value={editedData.marginTradingFacility} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, marginTradingFacility: v })} />
                                        </div>
                                    </section>

                                    {/* 09. LEGAL & AML COMPLIANCE */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-600"><ShieldCheck className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">09. Legal & AML Compliance</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <DetailField label="Politically Exposed Person (PEP)?" value={editedData.isPep} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, isPep: v })} />
                                            {editedData.isPep && (
                                                <div className="col-span-full">
                                                    <DetailField label="PEP Relation/Details" value={editedData.pepRelation} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, pepRelation: v })} />
                                                </div>
                                            )}
                                            <DetailField label="Has Beneficial Owner?" value={editedData.hasBeneficialOwner} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, hasBeneficialOwner: v })} />
                                            <DetailField label="Has Criminal Record?" value={editedData.hasCriminalRecord} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, hasCriminalRecord: v })} />
                                            {editedData.hasCriminalRecord && (
                                                <div className="col-span-full">
                                                    <DetailField label="Criminal Record Details" value={editedData.criminalRecordDetails} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, criminalRecordDetails: v })} />
                                                </div>
                                            )}
                                            <DetailField label="CIB Blacklisted?" value={editedData.isCibBlacklisted} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, isCibBlacklisted: v })} />
                                            {editedData.isCibBlacklisted && (
                                                <div className="col-span-full">
                                                    <DetailField label="CIB Blacklist Details" value={editedData.cibBlacklistDetails} isEditing={isEditing} onChange={v => setEditedData({ ...editedData, cibBlacklistDetails: v })} />
                                                </div>
                                            )}
                                        </div>
                                    </section>

                                    {/* 10. DECLARATIONS & AGREEMENTS */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"><CheckCircle2 className="w-4 h-4" /></div>
                                            <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">10. Declarations & Agreements</h4>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                            <DetailField label="Agree to Terms?" value={editedData.agreeToTerms} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, agreeToTerms: v })} />
                                            <DetailField label="No Other Financial Liability?" value={editedData.noOtherFinancialLiability} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, noOtherFinancialLiability: v })} />
                                            <DetailField label="All Information True?" value={editedData.allInformationTrue} isEditing={isEditing} type="checkbox" onChange={v => setEditedData({ ...editedData, allInformationTrue: v })} />
                                            <DetailField label="Agreement Date" value={editedData.agreementDate?.split('T')[0]} isEditing={isEditing} type="date" onChange={v => setEditedData({ ...editedData, agreementDate: v })} />
                                        </div>
                                    </section>

                                    {/* Reviewer Feedback - Integrated here */}
                                    {!isCompleted && (
                                        <section className="bg-slate-50 rounded-3xl p-8 border border-slate-100">
                                            <label className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Edit3 className="w-4 h-4" /> Reviewer Remarks (Required for Reject)</label>
                                            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full h-32 p-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-indigo-500 text-slate-700 text-sm font-medium resize-none shadow-sm" placeholder="Write your observation here..." />
                                        </section>
                                    )}
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="space-y-6">
                                    <div className="border-b border-gray-200 pb-4">
                                        <h2 className="text-xl font-bold text-gray-800">Uploaded Documents</h2>
                                        <p className="text-sm text-gray-500">Review all uploaded documents for this application.</p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {detailData.documents?.map((doc: any) => (
                                            <div key={doc.id} className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 transition-all">
                                                <div className="aspect-[4/3] bg-gray-100 rounded overflow-hidden mb-3 relative group">
                                                    {documentFiles[doc.id] ? (
                                                        // Show preview of newly selected file
                                                        <img
                                                            src={URL.createObjectURL(documentFiles[doc.id]!)}
                                                            className="w-full h-full object-cover"
                                                            alt={doc.documentType}
                                                        />
                                                    ) : doc.contentType?.startsWith('image/') ? (
                                                        // Show original document
                                                        <img src={`${apiBase}/api/KycData/document/${doc.id}?t=${Date.now()}`} className="w-full h-full object-cover" alt={doc.documentType} />
                                                    ) : (
                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                                            <FileText className="w-16 h-16" />
                                                            <span className="text-xs mt-2">Document</span>
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                                        <button onClick={() => setPreviewDoc(doc)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-indigo-600 hover:scale-110 transition-transform">
                                                            <Eye className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                    {documentFiles[doc.id] && (
                                                        <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                                                            NEW
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xs font-semibold text-indigo-600">{doc.documentType}</span>
                                                        <span className="text-xs text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-gray-700 truncate">{doc.originalFileName}</p>

                                                    {isEditing ? (
                                                        <div className="space-y-2">
                                                            <label className="block text-xs font-semibold text-gray-700">Replace Document</label>
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) {
                                                                        setDocumentFiles(prev => ({ ...prev, [doc.id]: file }));
                                                                    }
                                                                }}
                                                                className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                                                            />
                                                            {documentFiles[doc.id] && (
                                                                <p className="text-xs text-green-600 font-semibold">✓ New file selected: {documentFiles[doc.id]?.name}</p>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <a href={`${apiBase}/api/KycData/document/${doc.id}`} target="_blank" className="block text-center py-2 bg-indigo-50 text-indigo-700 rounded text-xs font-semibold hover:bg-indigo-600 hover:text-white transition-all">
                                                            View Full File
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="bg-white p-10 rounded-[40px] border border-slate-200 shadow-sm">
                                    <div className="space-y-12 relative px-4">
                                        <div className="absolute top-0 bottom-0 left-[31px] w-1 bg-slate-100" />

                                        {/* Initiator Block - manually constructed if logs don't clearly show it first */}
                                        <div className="flex gap-8 relative group">
                                            <div className="w-10 h-10 rounded-2xl flex-shrink-0 z-10 flex items-center justify-center border-4 border-white shadow-xl bg-slate-900">
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-3">
                                                    <div className="flex items-center gap-4">
                                                        <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase text-white bg-slate-900">INITIATED</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{new Date(detailData?.workflow?.kycSession?.createdAt || Date.now()).toLocaleString()}</span>
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{detailData?.workflow?.kycSession?.email || "Applicant"} <span className="text-slate-400">(APPLICANT)</span></div>
                                                </div>
                                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">"Application draft created and submitted for verification."</div>
                                            </div>
                                        </div>

                                        {detailData.logs?.map((h: any) => (
                                            <div key={h.id} className="flex gap-8 relative group">
                                                <div className={`w-10 h-10 rounded-2xl flex-shrink-0 z-10 flex items-center justify-center border-4 border-white shadow-xl ${h.action.includes('Approved') ? 'bg-emerald-500' : h.action.includes('Rejected') ? 'bg-rose-500' : 'bg-indigo-600'}`}>
                                                    <div className="w-2 h-2 rounded-full bg-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <div className="flex items-center gap-4">
                                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase text-white ${h.action.includes('Approved') ? 'bg-emerald-500' : h.action.includes('Rejected') ? 'bg-rose-500' : 'bg-indigo-600'}`}>{h.action}</span>
                                                            <span className="text-[10px] text-slate-400 font-mono">{new Date(h.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{h.userFullName} <span className="text-slate-400">({h.actionedByRoleName})</span></div>
                                                    </div>
                                                    {h.action === 'Edited' && <div className="mb-2 text-[10px] font-bold text-amber-600 bg-amber-50 inline-block px-3 py-1 rounded-lg border border-amber-100">DATA MODIFIED</div>}
                                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed">"{h.remarks || 'No remarks.'}"</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!isCompleted && activeTab !== 'details' && (
                                <div className="bg-white p-10 rounded-[40px] border-2 border-indigo-100 shadow-xl shadow-indigo-100/20 relative">
                                    <label className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2"><Edit3 className="w-5 h-5 text-indigo-500" /> Reviewer Feedback</label>
                                    <textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="w-full h-40 p-6 border-2 border-slate-100 rounded-3xl outline-none focus:border-indigo-500 text-slate-700 font-medium" placeholder="Mandatory for Rejection or Return actions..." />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-10 py-8 border-t border-slate-100 flex justify-between items-center bg-white shadow-lg">
                    <button onClick={() => !actionLoading && onClose()} className="h-14 px-8 text-slate-500 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl" disabled={actionLoading}>Cancel</button>
                    {!isCompleted && (
                        <div className="flex gap-4">
                            {detailData?.workflow?.status === 4 || detailData?.workflow?.status === "ResubmissionRequired" ? (
                                <button onClick={() => onAction('resubmit')} disabled={actionLoading || isEditing} className="h-14 px-10 bg-orange-600 text-white font-black text-xs uppercase rounded-2xl flex items-center gap-3"><RotateCcw /> Resubmit Application</button>
                            ) : (
                                <>
                                    <button onClick={() => onAction('reject', true)} disabled={actionLoading || !remarks} className="h-14 px-6 border-2 border-slate-200 text-slate-600 font-black text-xs uppercase rounded-2xl hover:border-indigo-600 hover:text-indigo-600 flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Back to Previous Role</button>
                                    <button onClick={() => onAction('reject', false)} disabled={actionLoading || !remarks} className="h-14 px-6 border-2 border-rose-100 text-rose-600 font-black text-xs uppercase rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Reject</button>
                                    <button onClick={() => onAction('approve')} disabled={actionLoading} className="h-14 px-12 bg-indigo-600 text-white font-black text-xs uppercase rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center gap-3"><ArrowRightCircle className="w-5 h-5" /> Forward to Next Role</button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Document Preview */}
            {previewDoc && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
                    <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setPreviewDoc(null)} />
                    <div className="relative max-w-5xl max-h-full flex flex-col items-center">
                        <button className="absolute -top-16 right-0 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center" onClick={() => setPreviewDoc(null)}><X /></button>
                        <div className="bg-white p-4 rounded-[40px] shadow-2xl overflow-hidden">
                            {previewDoc.contentType?.startsWith('image/')
                                ? <img src={`${apiBase}/api/KycData/document/${previewDoc.id}`} className="max-h-[70vh] rounded-[32px] object-contain" />
                                : <div className="p-20 flex flex-col items-center"><FileText className="w-20 h-20 text-slate-200 mb-4" /><h3 className="font-black">{previewDoc.documentType}</h3><a href={`${apiBase}/api/KycData/document/${previewDoc.id}`} target="_blank" className="mt-8 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl">Download File</a></div>
                            }
                        </div>
                        <div className="mt-8 bg-white/10 backdrop-blur-md px-10 py-6 rounded-3xl border border-white/20 text-center text-white">
                            <h4 className="text-xl font-black">{previewDoc.documentType}</h4>
                            <p className="opacity-60 text-xs mt-1">CERTIFICATE ID: {previewDoc.id} • UPLOADED: {new Date(previewDoc.uploadedAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SectionCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
        <h4 className="text-[10px] font-black text-slate-400 uppercase mb-8 tracking-[0.2em]">{title}</h4>
        <div className="space-y-4">{children}</div>
    </div>
);


const DetailField: React.FC<{ label: string, value: any, isEditing?: boolean, type?: string, onChange?: (v: any) => void }> = ({ label, value, isEditing, type = 'text', onChange }) => (
    <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-700 mb-1">{label}</label>
        {isEditing ? (
            type === 'checkbox' ? (
                <label className="flex items-center gap-2 p-2 border border-gray-300 rounded cursor-pointer hover:border-indigo-500 transition-all">
                    <input type="checkbox" checked={value === true || value === 'YES' || value === 'HIGH RISK'} onChange={e => onChange?.(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">{value ? 'YES' : 'NO'}</span>
                </label>
            ) : (
                <input type={type} value={value || ''} onChange={e => onChange?.(e.target.value)} className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all" />
            )
        ) : (
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-sm text-gray-800 min-h-[38px] flex items-center">
                {type === 'checkbox' ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${value ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
                        {value ? 'YES' : 'NO'}
                    </span>
                ) : type === 'date' && value ? (
                    new Date(value).toLocaleDateString()
                ) : (value || '—')}
            </div>
        )}
    </div>
);

const InfoRow: React.FC<{ label: string, value: any, isEditing?: boolean, color?: string, type?: string, onChange?: (v: any) => void }> = ({ label, value, isEditing, color = 'text-slate-900', type = 'text', onChange }) => (
    <div className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 min-h-[44px]">
        <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest">{label}</span>
        {isEditing ? (
            <input type={type} value={value === true ? undefined : (value || '')} checked={type === 'checkbox' ? (value === true || value === 'YES' || value === 'HIGH RISK') : undefined} onChange={e => onChange?.(type === 'checkbox' ? e.target.checked : e.target.value)} className="w-1/2 text-[11px] text-right font-black text-indigo-600 bg-indigo-50/50 rounded-xl px-4 py-2 outline-none" />
        ) : (
            <span className={`text-[11px] font-black ${color}`}>{value === true ? 'YES' : value === false ? 'NO' : (value || 'N/A').toString().toUpperCase()}</span>
        )}
    </div>
);

export default KycReviewModal;
