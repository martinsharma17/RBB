import React from 'react';
import { CheckCircle2, User, MapPin, Users, Briefcase, DollarSign, FileText, Shield } from 'lucide-react';

interface KycSummaryReviewProps {
    kycData: any;
    apiBase: string;
    onNext: () => void;
    onBack: () => void;
}

const KycSummaryReview: React.FC<KycSummaryReviewProps> = ({ kycData, apiBase, onNext, onBack }) => {
    const SummarySection = ({ title, icon: Icon, children }: any) => (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">{title}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {children}
            </div>
        </div>
    );

    const Field = ({ label, value }: { label: string; value: any }) => (
        <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
            <span className="text-sm font-semibold text-slate-800">{value || 'N/A'}</span>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black">Review Your KYC Application</h2>
                        <p className="text-indigo-100 mt-1">Please verify all information before proceeding</p>
                    </div>
                </div>
            </div>

            {/* Personal Information */}
            <SummarySection title="Personal Information" icon={User}>
                <Field label="First Name" value={kycData.firstName || kycData.personalInfo?.firstName} />
                <Field label="Middle Name" value={kycData.middleName || kycData.personalInfo?.middleName} />
                <Field label="Last Name" value={kycData.lastName || kycData.personalInfo?.lastName} />
                <Field label="Gender" value={kycData.gender || kycData.personalInfo?.gender} />
                <Field label="Date of Birth" value={kycData.dateOfBirth || kycData.personalInfo?.dateOfBirthAd} />
                <Field label="Marital Status" value={kycData.maritalStatus || kycData.personalInfo?.maritalStatus} />
                <Field label="Citizenship No" value={kycData.citizenshipNumber || kycData.personalInfo?.citizenshipNo} />
                <Field label="PAN Number" value={kycData.panNumber || kycData.personalInfo?.panNo} />
                <Field label="Mobile Number" value={kycData.mobileNumber} />
                <Field label="Email" value={kycData.email} />
            </SummarySection>

            {/* Address Information */}
            <SummarySection title="Address Information" icon={MapPin}>
                <div className="col-span-2">
                    <h4 className="text-sm font-bold text-indigo-600 mb-3">Permanent Address</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Province" value={kycData.permanentAddress?.province} />
                        <Field label="District" value={kycData.permanentAddress?.district} />
                        <Field label="Municipality" value={kycData.permanentAddress?.municipalityName} />
                        <Field label="Ward No" value={kycData.permanentAddress?.wardNo} />
                        <Field label="Tole" value={kycData.permanentAddress?.tole} />
                    </div>
                </div>
                <div className="col-span-2 mt-4">
                    <h4 className="text-sm font-bold text-indigo-600 mb-3">Current Address</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Province" value={kycData.currentAddress?.province} />
                        <Field label="District" value={kycData.currentAddress?.district} />
                        <Field label="Municipality" value={kycData.currentAddress?.municipalityName} />
                        <Field label="Ward No" value={kycData.currentAddress?.wardNo} />
                        <Field label="Tole" value={kycData.currentAddress?.tole} />
                    </div>
                </div>
            </SummarySection>

            {/* Family Details */}
            <SummarySection title="Family Details" icon={Users}>
                <Field label="Grandfather's Name" value={kycData.family?.grandFatherName} />
                <Field label="Father's Name" value={kycData.family?.fatherName} />
                <Field label="Mother's Name" value={kycData.family?.motherName} />
                <Field label="Spouse's Name" value={kycData.family?.spouseName} />
                <Field label="Father-in-law's Name" value={kycData.family?.fatherInLawName} />
                <Field label="Mother-in-law's Name" value={kycData.family?.motherInLawName} />
                <div className="col-span-2">
                    <Field label="Children Names" value={kycData.family?.childrenNames} />
                </div>
            </SummarySection>

            {/* Occupation & Bank */}
            <SummarySection title="Occupation & Banking" icon={Briefcase}>
                <Field label="Occupation Type" value={kycData.occupation?.occupationType} />
                <Field label="Organization" value={kycData.occupation?.organizationName} />
                <Field label="Designation" value={kycData.occupation?.designation} />
                <Field label="Annual Income" value={kycData.occupation?.annualIncomeRange} />
                <Field label="Bank Name" value={kycData.bank?.bankName} />
                <Field label="Account Number" value={kycData.bank?.bankAccountNo} />
            </SummarySection>

            {/* Financial Information */}
            <SummarySection title="Financial Information" icon={DollarSign}>
                <Field label="Source of Funds" value={kycData.sourceOfFunds} />
                <Field label="Major Source of Income" value={kycData.majorSourceOfIncome} />
                <Field label="Trading Limit" value={kycData.tradingLimit} />
                <Field label="Margin Trading" value={kycData.marginTradingFacility ? 'Yes' : 'No'} />
            </SummarySection>

            {/* Location Map */}
            <SummarySection title="Location Map" icon={MapPin}>
                <Field label="Nearest Landmark" value={kycData.locationMap?.landmark} />
                <Field label="Distance from Main Road" value={kycData.locationMap?.distanceFromMainRoad} />
                <Field label="Latitude" value={kycData.locationMap?.latitude} />
                <Field label="Longitude" value={kycData.locationMap?.longitude} />
                <div className="col-span-2 mt-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Map Preview</span>
                    {(() => {
                        const attachments = kycData.attachments || [];
                        const mapAtt = [...attachments].reverse().find((a: any) => a.documentType === 10);
                        if (mapAtt) {
                            return (
                                <img
                                    src={`${apiBase}${mapAtt.filePath}`}
                                    alt="Location Map"
                                    className="w-full max-w-md h-auto rounded-lg border border-slate-200 mt-2"
                                />
                            );
                        }
                        return <p className="text-sm text-slate-400 italic mt-1">No map image captured yet.</p>;
                    })()}
                </div>
            </SummarySection>

            {/* Compliance & Risk */}
            <SummarySection title="Compliance & Risk Assessment" icon={Shield}>
                <Field label="Politically Exposed Person" value={kycData.amlCompliance?.isPoliticallyExposedPerson ? `Yes (${kycData.amlCompliance?.pepRelationName || '-'})` : 'No'} />
                <Field label="Has Beneficial Owner" value={kycData.amlCompliance?.hasBeneficialOwner ? `Yes (${kycData.amlCompliance?.beneficialOwnerDetails || '-'})` : 'No'} />
                <Field label="Criminal Record" value={kycData.amlCompliance?.hasCriminalRecord ? `Yes (${kycData.amlCompliance?.criminalRecordDetails || '-'})` : 'No'} />
                <Field label="CIB Blacklisted" value={kycData.isCibBlacklisted ? 'Yes' : 'No'} />
            </SummarySection>

            {/* Guardian Details (Conditional) */}
            {(() => {
                const birthDate = new Date(kycData.dateOfBirth || kycData.personalInfo?.dobAd);
                const age = new Date().getFullYear() - birthDate.getFullYear();
                if (age < 18) {
                    return (
                        <SummarySection title="Guardian Details" icon={Users}>
                            <Field label="Guardian Name" value={kycData.guardian?.guardianName} />
                            <Field label="Relationship" value={kycData.guardian?.guardianRelationship} />
                            <Field label="Contact No" value={kycData.guardian?.guardianContactNo} />
                            <Field label="Email" value={kycData.guardian?.guardianEmail} />
                        </SummarySection>
                    );
                }
                return null;
            })()}

            {/* Documents */}
            <SummarySection title="Uploaded Documents" icon={FileText}>
                {[
                    { label: "Passport Photo", type: 1 },
                    { label: "Citizenship Front", type: 2 },
                    { label: "Citizenship Back", type: 3 },
                    { label: "Signature", type: 4 },
                    { label: "Left Thumbprint", type: 5 },
                    { label: "Right Thumbprint", type: 6 }
                ].map((docItem) => {
                    // Find the LATEST attachment of this type (searching from end of array)
                    const attachments = kycData.attachments || [];
                    const att = [...attachments].reverse().find((a: any) => a.documentType === docItem.type);
                    return (
                        <div key={docItem.type} className="flex flex-col space-y-2 mb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{docItem.label}</span>
                            {att ? (
                                <div className="group relative">
                                    <img
                                        src={`${apiBase}${att.filePath}`}
                                        alt={docItem.label}
                                        className="w-full h-32 object-cover rounded-lg border border-slate-200 cursor-zoom-in group-hover:bg-slate-50 transition-all"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] p-1 text-center opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg">
                                        Click to enlarge
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-32 bg-slate-100 rounded-lg flex items-center justify-center border border-dashed border-slate-200">
                                    <span className="text-xs text-slate-400 font-medium italic">No document uploaded</span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </SummarySection>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                <button
                    onClick={onBack}
                    className="px-8 py-3 border-2 border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-all"
                >
                    Back to Edit
                </button>
                <button
                    onClick={onNext}
                    className="px-12 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl transition-all flex items-center gap-2"
                >
                    <span>Next</span>
                    <CheckCircle2 className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default KycSummaryReview;
