import React, { useState } from 'react';

interface KycReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    detailData: any;
    apiBase: string;
    isEditing: boolean;
    setIsEditing: (val: boolean) => void;
    editedData: any;
    setEditedData: (val: any) => void;
    onSave: () => void;
    actionLoading: boolean;
    remarks: string;
    setRemarks: (val: string) => void;
    onAction: (action: 'approve' | 'reject' | 'resubmit' | 'pull-back', returnToPrevious?: boolean) => void;
    onDownloadCsv: (workflowId: number) => void;
}

const KycReviewModal: React.FC<KycReviewModalProps> = ({
    isOpen,
    onClose,
    detailData,
    apiBase,
    isEditing,
    setIsEditing,
    editedData,
    setEditedData,
    onSave,
    actionLoading,
    remarks,
    setRemarks,
    onAction,
    onDownloadCsv
}) => {
    const [activeTab, setActiveTab] = useState('overview');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !actionLoading && onClose()}></div>
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
                            <p className="text-xs text-gray-500 font-medium">{detailData?.workflow?.kycSession?.email || detailData?.details?.email || 'Loading Applicant Info...'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {(detailData?.workflow?.status === 4 || detailData?.workflow?.status === "ResubmissionRequired" ||
                            detailData?.workflow?.status === 5 || detailData?.workflow?.status === "InReview" ||
                            detailData?.workflow?.status === 3 || detailData?.workflow?.status === "Rejected") && (
                                <button
                                    onClick={() => isEditing ? onSave() : setIsEditing(true)}
                                    disabled={actionLoading}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isEditing ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}
                                >
                                    {isEditing ? (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                            Save Changes
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            Edit Info
                                        </>
                                    )}
                                </button>
                            )}
                        <button
                            onClick={() => detailData?.workflow?.id && onDownloadCsv(detailData.workflow.id)}
                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 hover:bg-gray-800 shadow-lg shadow-gray-200"
                            title="Download CSV for printing hardcopy and bank stamp"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Print Form
                        </button>
                        <button
                            onClick={() => !actionLoading && onClose()}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
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
                                        style={{
                                            width: detailData.approvalChain?.length > 1
                                                ? `${(detailData.approvalChain.findIndex((c: any) => c.isCurrent) / (detailData.approvalChain.length - 1)) * 100}%`
                                                : detailData.approvalChain?.some((c: any) => c.isCompleted) ? '100%' : '0%'
                                        }}
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
                                <div className="grid gap-6">
                                    {detailData.logs && detailData.logs.length > 0 && (
                                        <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                                            <h4 className="text-[10px] font-black text-indigo-500 uppercase mb-3 tracking-widest flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                                                Latest Feedback
                                            </h4>
                                            <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-50">
                                                <p className="text-gray-800 text-sm font-medium italic">
                                                    "{detailData.logs[0].remarks || 'No remarks provided.'}"
                                                </p>
                                                <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
                                                    <span className="font-bold uppercase tracking-wide">By {detailData.logs[0].userFullName || 'System'} ({detailData.logs[0].actionedByRoleName})</span>
                                                    <span>{new Date(detailData.logs[0].createdAt).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="grid md:grid-cols-2 gap-6">
                                        <SectionCard title="Personal Summary">
                                            <InfoRow label="First Name" value={editedData.firstName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, firstName: v })} />
                                            <InfoRow label="Last Name" value={editedData.lastName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, lastName: v })} />
                                            <InfoRow label="Email" value={editedData.email} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, email: v })} />
                                            <InfoRow label="Mobile" value={editedData.mobileNumber} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, mobileNumber: v })} />
                                            <InfoRow label="Gender" value={editedData.gender} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, gender: v })} />
                                            <InfoRow label="Citizenship" value={editedData.citizenshipNumber} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, citizenshipNumber: v })} />
                                        </SectionCard>
                                        <SectionCard title="Address & Status">
                                            <InfoRow label="Province" value={editedData.permanentState} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, permanentState: v })} />
                                            <InfoRow label="District" value={editedData.permanentDistrict} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, permanentDistrict: v })} />
                                            <InfoRow label="Occupation" value={editedData.occupation} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, occupation: v })} />
                                            <InfoRow label="Annual Income" value={editedData.annualIncome} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, annualIncome: v })} />
                                            <InfoRow label="PEP Status" value={editedData.isPep ? 'YES' : 'NO'} isEditing={isEditing} type="checkbox" onChange={(v) => setEditedData({ ...editedData, isPep: v })} />
                                        </SectionCard>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'details' && (
                                <div className="grid gap-6">
                                    <div className="columns-1 lg:columns-2 gap-6 space-y-6">
                                        <SectionCard title="1. Personal Information">
                                            <InfoRow label="First Name" value={editedData.firstName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, firstName: v })} />
                                            <InfoRow label="Middle Name" value={editedData.middleName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, middleName: v })} />
                                            <InfoRow label="Last Name" value={editedData.lastName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, lastName: v })} />
                                            <InfoRow label="Date of Birth" value={editedData.dateOfBirth ? new Date(editedData.dateOfBirth).toLocaleDateString("en-CA") : ''} isEditing={isEditing} type="date" onChange={(v) => setEditedData({ ...editedData, dateOfBirth: v })} />
                                            <InfoRow label="Gender" value={editedData.gender} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, gender: v })} />
                                            <InfoRow label="Nationality" value={editedData.nationality} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, nationality: v })} />
                                            <InfoRow label="Marital Status" value={editedData.maritalStatus} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, maritalStatus: v })} />
                                            <InfoRow label="Email Address" value={editedData.email} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, email: v })} />
                                            <InfoRow label="Mobile Number" value={editedData.mobileNumber} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, mobileNumber: v })} />
                                            <InfoRow label="Citizenship No" value={editedData.citizenshipNumber} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, citizenshipNumber: v })} />
                                            <InfoRow label="Issue District" value={editedData.citizenshipIssuedDistrict} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, citizenshipIssuedDistrict: v })} />
                                            <InfoRow label="Issue Date" value={editedData.citizenshipIssuedDate ? new Date(editedData.citizenshipIssuedDate).toLocaleDateString("en-CA") : ''} isEditing={isEditing} type="date" onChange={(v) => setEditedData({ ...editedData, citizenshipIssuedDate: v })} />
                                        </SectionCard>

                                        <SectionCard title="2. Permanent Address">
                                            <InfoRow label="State/Province" value={editedData.permanentState} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, permanentState: v })} />
                                            <InfoRow label="District" value={editedData.permanentDistrict} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, permanentDistrict: v })} />
                                            <InfoRow label="Municipality" value={editedData.permanentMunicipality} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, permanentMunicipality: v })} />
                                            <InfoRow label="Ward No" value={editedData.permanentWardNo} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, permanentWardNo: v })} />
                                            <InfoRow label="Street/Tole" value={editedData.permanentStreet} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, permanentStreet: v })} />
                                        </SectionCard>

                                        <SectionCard title="3. Current Address">
                                            <InfoRow label="State/Province" value={editedData.currentState} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, currentState: v })} />
                                            <InfoRow label="District" value={editedData.currentDistrict} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, currentDistrict: v })} />
                                            <InfoRow label="Municipality" value={editedData.currentMunicipality} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, currentMunicipality: v })} />
                                            <InfoRow label="Ward No" value={editedData.currentWardNo} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, currentWardNo: v })} />
                                            <InfoRow label="Street/Tole" value={editedData.currentStreet} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, currentStreet: v })} />
                                        </SectionCard>

                                        <SectionCard title="4. Family Details">
                                            <InfoRow label="Father Name" value={editedData.fatherName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, fatherName: v })} />
                                            <InfoRow label="Mother Name" value={editedData.motherName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, motherName: v })} />
                                            <InfoRow label="Grandfather" value={editedData.grandFatherName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, grandFatherName: v })} />
                                            <InfoRow label="Spouse Name" value={editedData.spouseName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, spouseName: v })} />
                                        </SectionCard>

                                        <SectionCard title="5. Bank Account">
                                            <InfoRow label="Bank Name" value={editedData.bankName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, bankName: v })} />
                                            <InfoRow label="Account Number" value={editedData.bankAccountNumber} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, bankAccountNumber: v })} />
                                            <InfoRow label="Branch" value={editedData.bankBranch} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, bankBranch: v })} />
                                            <InfoRow label="Account Type" value={editedData.bankAccountType} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, bankAccountType: v })} />
                                            <InfoRow label="PAN Number" value={editedData.panNumber} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, panNumber: v })} />
                                        </SectionCard>

                                        <SectionCard title="6. Financial & Occupation">
                                            <InfoRow label="Occupation" value={editedData.occupation} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, occupation: v })} />
                                            <InfoRow label="Organization" value={editedData.organizationName} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, organizationName: v })} />
                                            <InfoRow label="Income Range" value={editedData.annualIncome} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, annualIncome: v })} />
                                            <InfoRow label="Source of Funds" value={editedData.sourceOfFunds} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, sourceOfFunds: v })} />
                                        </SectionCard>

                                        <SectionCard title="7. AML & PEP Status">
                                            <InfoRow label="PE Person?" value={editedData.isPep ? 'Yes' : 'No'} isEditing={isEditing} type="checkbox" onChange={(v) => setEditedData({ ...editedData, isPep: v })} />
                                            <InfoRow label="Criminal Record?" value={editedData.hasCriminalRecord ? 'Yes' : 'No'} isEditing={isEditing} type="checkbox" onChange={(v) => setEditedData({ ...editedData, hasCriminalRecord: v })} />
                                            <InfoRow label="Beneficial Owner?" value={editedData.hasBeneficialOwner ? 'Yes' : 'No'} isEditing={isEditing} type="checkbox" onChange={(v) => setEditedData({ ...editedData, hasBeneficialOwner: v })} />
                                            {editedData.isPep && <InfoRow label="Relation" value={editedData.pepRelation} isEditing={isEditing} onChange={(v) => setEditedData({ ...editedData, pepRelation: v })} />}
                                        </SectionCard>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                    {detailData.documents?.map((doc: any) => (
                                        <div key={doc.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative">
                                            <div className="aspect-video bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors overflow-hidden border border-gray-100">
                                                {doc.contentType?.startsWith('image/') ? (
                                                    <img
                                                        src={`${apiBase}/api/KycData/document/${doc.id}?t=${new Date().getTime()}`}
                                                        alt={doc.documentType}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-indigo-500 uppercase mb-0.5">{doc.documentType}</span>
                                                <p className="text-[10px] font-bold text-gray-800 uppercase truncate" title={doc.originalFileName}>
                                                    {doc.originalFileName}
                                                </p>
                                                <a
                                                    href={`${apiBase}/api/KycData/document/${doc.id}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[9px] text-white bg-indigo-600 px-3 py-1 rounded-full font-bold mt-2 w-fit hover:bg-indigo-700 transition-colors"
                                                >
                                                    VIEW FULL FILE
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                    {(!detailData.documents || detailData.documents.length === 0) && (
                                        <div className="col-span-full py-12 text-center text-gray-400 font-medium bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                                            <p>No documents attached to this application.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'history' && (
                                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">Audit Timeline & Security Logs</h3>
                                    <div className="space-y-8 relative">
                                        <div className="absolute top-0 bottom-0 left-[19px] w-0.5 bg-gray-100"></div>
                                        {detailData.logs?.map((h: any) => (
                                            <div key={h.id} className="flex gap-6 relative group">
                                                <div className={`w-10 h-10 rounded-full flex-shrink-0 z-10 flex items-center justify-center border-4 border-white shadow-sm transition-transform group-hover:scale-110 ${h.action === 'Approved' ? 'bg-green-500' :
                                                    h.action === 'Rejected' ? 'bg-red-500' :
                                                        h.action === 'KycDetailsEdited' ? 'bg-orange-500' :
                                                            'bg-indigo-500'
                                                    }`}>
                                                    {h.action === 'KycDetailsEdited' ? (
                                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    ) : (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                        <div className="flex items-center gap-3">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white shadow-sm ${h.action === 'Approved' ? 'bg-green-500' :
                                                                h.action === 'Rejected' ? 'bg-red-500' :
                                                                    h.action === 'KycDetailsEdited' ? 'bg-orange-500' :
                                                                        'bg-indigo-500'
                                                                }`}>
                                                                {h.action === 'KycDetailsEdited' ? '✏️ EDITED' : h.action}
                                                            </span>
                                                            <span className="text-xs text-gray-500 font-mono">{new Date(h.createdAt).toLocaleString()}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100 shadow-sm">
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">By</span>
                                                                <span className="text-[10px] font-black text-indigo-700 uppercase">{h.userFullName || 'System'}</span>
                                                            </div>
                                                            {h.action !== 'KycDetailsEdited' && (
                                                                <>
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">From</span>
                                                                        <span className="text-[10px] font-black text-indigo-700 uppercase">{h.actionedByRoleName || 'System'}</span>
                                                                    </div>
                                                                    <svg className="w-3 h-3 text-gray-300 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                                    </svg>
                                                                    <div className="flex flex-col items-start">
                                                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">To</span>
                                                                        <span className="text-[10px] font-black text-gray-600 uppercase">{h.forwardedToRoleName || 'Finalized'}</span>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className={`mt-3 bg-white p-5 rounded-2xl border shadow-sm relative overflow-hidden ${h.action === 'KycDetailsEdited' ? 'border-orange-100 bg-orange-50/30' : 'border-gray-100'
                                                        }`}>
                                                        <div className={`absolute top-0 left-0 w-1 h-full ${h.action === 'KycDetailsEdited' ? 'bg-orange-200' : 'bg-indigo-50'
                                                            }`}></div>
                                                        <p className="text-gray-700 text-sm leading-relaxed font-medium">{h.remarks || "No specific remarks provided for this action."}</p>
                                                        {h.clientIpAddress && (
                                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-[9px] text-gray-400 font-mono">
                                                                <span>IP: {h.clientIpAddress}</span>
                                                                {h.userAgent && <span className="truncate max-w-xs" title={h.userAgent}>Device: {h.userAgent.split(' ')[0]}</span>}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
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
                    <div className="flex gap-4">
                        <button
                            onClick={() => !actionLoading && onClose()}
                            className="px-6 py-3 text-gray-500 font-black uppercase text-xs tracking-widest hover:bg-gray-100 rounded-2xl transition-all"
                            disabled={actionLoading}
                        >
                            Cancel Review
                        </button>

                        {/* Pull Back option for initiators */}
                        {(detailData?.workflow?.status === 5 || detailData?.workflow?.status === "InReview" || detailData?.workflow?.status === 3 || detailData?.workflow?.status === "Rejected") && !isEditing && (
                            <button
                                onClick={() => onAction('pull-back')}
                                disabled={actionLoading}
                                className="px-6 py-3 bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-widest border-2 border-gray-100 rounded-2xl hover:bg-gray-100 transition-all"
                                title="Retract this application for corrections before it is reviewed"
                            >
                                Pull Back Application
                            </button>
                        )}
                    </div>

                    <div className="flex gap-4">
                        {detailData?.workflow?.status === 4 || detailData?.workflow?.status === "ResubmissionRequired" ? (
                            <button
                                onClick={() => onAction('resubmit')}
                                disabled={actionLoading || isEditing}
                                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:shadow-2xl hover:shadow-orange-300 disabled:opacity-50 transition-all flex items-center gap-3 active:scale-95"
                                title={isEditing ? "Save changes before resubmitting" : "Resubmit this application for review"}
                            >
                                {actionLoading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                )}
                                <span>Resubmit Application</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => onAction('reject', true)}
                                    disabled={actionLoading || !remarks}
                                    className="px-6 py-3 bg-white text-orange-600 font-bold text-xs uppercase tracking-widest border-2 border-orange-100 rounded-2xl hover:bg-orange-50 disabled:opacity-30 transition-all"
                                    title="Send back to the previous reviewer in the chain"
                                >
                                    Return to Previous
                                </button>
                                <button
                                    onClick={() => onAction('reject', false)}
                                    disabled={actionLoading || !remarks}
                                    className="px-6 py-3 bg-red-50 text-red-600 font-bold text-xs uppercase tracking-widest border-2 border-red-100 rounded-2xl hover:bg-red-100 disabled:opacity-30 transition-all shadow-lg shadow-red-200/50"
                                    title="Completely reject back to the customer (Maker)"
                                >
                                    Reject to Maker
                                </button>
                                <button
                                    onClick={() => onAction('approve')}
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
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

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

const InfoRow: React.FC<{ label: string, value: any, isEditing?: boolean, type?: string, onChange?: (val: any) => void }> = ({ label, value, isEditing, type = 'text', onChange }) => (
    <div className="flex justify-between items-center border-b border-gray-50 py-2 last:border-0 min-h-[40px]">
        <span className="text-xs text-gray-400 font-bold uppercase">{label}</span>
        {isEditing ? (
            type === 'checkbox' ? (
                <input
                    type="checkbox"
                    checked={value === 'YES' || value === true}
                    onChange={(e) => onChange?.(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-gray-300 focus:ring-indigo-500"
                />
            ) : type === 'date' ? (
                <input
                    type="date"
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="text-xs text-right font-black text-indigo-600 bg-indigo-50/50 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-300 w-1/2"
                />
            ) : (
                <input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange?.(e.target.value)}
                    className="text-xs text-right font-black text-indigo-600 bg-indigo-50/50 rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-300 w-1/2"
                />
            )
        ) : (
            <span className={`text-xs text-gray-900 font-black ${label === 'PEP Status' && (value === 'YES' || value === true) ? 'text-red-600' : ''}`}>
                {(value !== null && value !== undefined && value !== '') ? String(value) : 'N/A'}
            </span>
        )}
    </div>
);

export default KycReviewModal;
