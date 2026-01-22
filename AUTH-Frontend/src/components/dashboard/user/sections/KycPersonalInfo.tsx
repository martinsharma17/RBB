import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
import NepaliDate from 'nepali-date-converter';
// import { adToBs } from "bikram-sambat-js";

interface KycPersonalInfoProps {
  sessionId: number | null;
  initialData?: any;

  onNext: (data: any) => void;
  onSaveAndExit?: () => void;
}

interface KycPersonalInfoData {
  firstName: string;
  middleName: string;
  lastName: string;
  dobAd: string;
  dobBs: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  citizenshipNo: string;
  citizenshipIssueDate: string;
  citizenshipIssueDistrict: string;
  panNo: string;
  branchId?: string | number;
  [key: string]: any;
}

// AD to BS converter using nepali-date-converter
function convertAdToBs(adDate: string): string {
  if (!adDate) return "";
  try {
    const date = new Date(adDate);
    if (isNaN(date.getTime())) return "";
    const nepaliDate = new NepaliDate(date);
    return nepaliDate.format('YYYY-MM-DD');
  } catch (e) {
    console.error("Conversion error", e);
    return "";
  }
}

const KycPersonalInfo: React.FC<KycPersonalInfoProps> = ({
  sessionId,
  initialData,
  onNext,
  onSaveAndExit,
}) => {
  const { token, apiBase } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);
  const [countries, setCountries] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${apiBase}/api/Branch`)
      .then((res) => res.json())
      .then((data) => setBranches(data))
      .catch((err) => console.error("Failed to load branches", err));

    fetch(`${apiBase}/api/Country`)
      .then((res) => res.json())
      .then((data) => setCountries(data))
      .catch((err) => console.error("Failed to load countries", err));
  }, [apiBase]);

  // Normalize data from either backend format (Pascal/Camel) or previous frontend format
  const [formData, setFormData] = useState<KycPersonalInfoData>({
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    dobAd: initialData?.dobAd || initialData?.dateOfBirthAd || initialData?.DateOfBirthAd || "",
    dobBs: initialData?.dobBs || initialData?.dateOfBirthBs || initialData?.DateOfBirthBs || "",
    gender:
      initialData?.gender === 1
        ? "Male"
        : initialData?.gender === 2
          ? "Female"
          : initialData?.gender === 3
            ? "Other"
            : typeof initialData?.gender === "string"
              ? initialData.gender
              : "",
    maritalStatus: initialData?.maritalStatus || "",

    nationality:
      initialData?.isNepali || initialData?.IsNepali
        ? "Nepal"
        : initialData?.otherNationality ||
        initialData?.OtherNationality ||
        initialData?.nationality ||
        "Nepal",
    citizenshipNo:
      initialData?.citizenshipNo || initialData?.CitizenshipNo || "",
    citizenshipIssueDate:
      initialData?.citizenshipIssueDate ||
      initialData?.CitizenshipIssueDate ||
      "",
    citizenshipIssueDistrict:
      initialData?.citizenshipIssueDistrict ||
      initialData?.CitizenshipIssueDistrict ||
      "",
    panNo: initialData?.panNo || initialData?.PanNo || "",
    nidNo: initialData?.nidNo || initialData?.NidNo || initialData?.nidNumber || initialData?.NidNumber || "",
    branchId: initialData?.branchId || initialData?.BranchId || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync if initialData changes (e.g. after a fetch)
  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData?.firstName || "",
        middleName: initialData?.middleName || "",
        lastName: initialData?.lastName || "",
        dobAd: initialData?.dobAd || initialData?.dateOfBirthAd || initialData?.DateOfBirthAd || "",
        dobBs: initialData?.dobBs || initialData?.dateOfBirthBs || initialData?.DateOfBirthBs || "",
        gender:
          initialData?.gender === 1
            ? "Male"
            : initialData?.gender === 2
              ? "Female"
              : initialData?.gender === 3
                ? "Other"
                : typeof initialData?.gender === "string"
                  ? initialData.gender
                  : "",
        maritalStatus: initialData?.maritalStatus || "", // <-- add this

        nationality:
          initialData?.isNepali || initialData?.IsNepali
            ? "Nepal"
            : initialData?.otherNationality ||
            initialData?.OtherNationality ||
            initialData?.nationality ||
            "Nepal",
        citizenshipNo:
          initialData?.citizenshipNo || initialData?.CitizenshipNo || "",
        citizenshipIssueDate:
          initialData?.citizenshipIssueDate ||
          initialData?.CitizenshipIssueDate ||
          "",
        citizenshipIssueDistrict:
          initialData?.citizenshipIssueDistrict ||
          initialData?.CitizenshipIssueDistrict ||
          "",
        panNo: initialData?.panNo || initialData?.PanNo || "",
        nidNo: initialData?.nidNo || initialData?.NidNo || initialData?.nidNumber || initialData?.NidNumber || "",
        branchId: initialData?.branchId || initialData?.BranchId || "",
      });
    }
  }, [initialData]);

  // Convert AD to BS when dobAd changes
  useEffect(() => {
    if (formData.dobAd) {
      setFormData((prev) => ({
        ...prev,
        dobBs: convertAdToBs(formData.dobAd),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        dobBs: "",
      }));
    }
  }, [formData.dobAd]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === "panNo") {
      // Allow only numbers and limit to 9 digits
      const cleaned = value.replace(/\D/g, "").slice(0, 9);
      setFormData((prev) => ({ ...prev, [name]: cleaned }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, shouldExit: boolean = false) => {
    if (e) e.preventDefault();
    if (!sessionId) {
      setError("KYC Session not initialized correctly.");
      return;
    }
    setSaving(true);
    setError(null);
    if (shouldExit) { /* Logic for exit if needed */ }

    // Map frontend data to backend PersonalInfoDto
    const mappedData = {
      fullName:
        `${formData.firstName} ${formData.middleName} ${formData.lastName}`
          .replace(/\s+/g, " ")
          .trim(),
      dateOfBirthBs: formData.dobBs || null,
      dateOfBirthAd: formData.dobAd || null,
      gender:
        formData.gender === "Male"
          ? 1
          : formData.gender === "Female"
            ? 2
            : formData.gender === "Other"
              ? 3
              : null,
      isNepali: formData.nationality?.toLowerCase() === "nepal" || formData.nationality?.toLowerCase() === "nepali",
      otherNationality:
        (formData.nationality?.toLowerCase() === "nepal" || formData.nationality?.toLowerCase() === "nepali")
          ? null
          : formData.nationality,
      citizenshipNo: formData.citizenshipNo || null,
      citizenshipIssueDistrict: formData.citizenshipIssueDistrict || null,
      citizenshipIssueDate: formData.citizenshipIssueDate || null,
      panNo: formData.panNo || null,
      branchId: formData.branchId
        ? parseInt(formData.branchId.toString())
        : null,
      maritalStatus: formData.maritalStatus || null,
      nidNo: formData.nidNo || null,
    };

    const headers: any = {
      "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const response = await fetch(
        `${apiBase}/api/KycData/save-personal-info`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            sessionId: sessionId,
            stepNumber: 1,
            data: mappedData,
          }),
        }
      );

      if (response.ok) {
        if (shouldExit && onSaveAndExit) {
          onSaveAndExit();
        } else {
          onNext({
            personalInfo: formData,
            gender: formData.gender,
            maritalStatus: formData.maritalStatus,
          });
        }
      } else {
        const data = await response.json();
        if (data.errors) {
          const firstErr = Object.values(data.errors)[0];
          setError(
            Array.isArray(firstErr)
              ? (firstErr[0] as string)
              : "Validation error"
          );
        } else {
          setError(data.message || data.title || "Failed to save section");
        }
      }
    } catch (err) {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Section 1: Personal Information
        </h2>
        <p className="text-sm text-gray-500">
          Provide your basic identity details.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200 animate-shake">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Full Name in one line */}
        <div className="flex flex-col md:flex-row gap-2 col-span-2">
          <div className="flex flex-col flex-1">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="First Name"
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Middle Name
            </label>
            <input
              type="text"
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Middle Name"
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Last Name"
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        </div>

        {/* DOB AD and BS in one line */}
        <div className="flex flex-col md:flex-row gap-2 col-span-2">
          <div className="flex flex-col flex-1">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Date of Birth (AD) *
            </label>
            <input
              type="date"
              name="dobAd"
              value={
                formData.dobAd
                  ? formData.dobAd.includes("T")
                    ? formData.dobAd.split("T")[0]
                    : formData.dobAd
                  : ""
              }
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
          <div className="flex flex-col flex-1">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Date of Birth (BS)
            </label>
            <input
              type="text"
              name="dobBs"
              value={formData.dobBs}
              readOnly
              className="p-2 border border-gray-300 rounded bg-gray-100 focus:outline-none transition-all"
              placeholder="Converted BS Date"
            />
          </div>
        </div>

        {/* Gender below */}
        <div className="flex flex-col col-span-2 md:col-span-1">
          <label className="text-sm font-semibold text-gray-700 mb-2">
            Gender *
          </label>
          <div className="flex flex-wrap gap-4">
            {[
              {
                id: "Male", label: "Male", icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="10" cy="14" r="5" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l5-5m0 0h-4m4 0v4" />
                  </svg>
                )
              },
              {
                id: "Female", label: "Female", icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="9" r="5" strokeWidth={2} />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v7m-3-3h6" />
                  </svg>
                )
              },
              {
                id: "Other", label: "Other", icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                  </svg>
                )
              }
            ].map((option) => (
              <label
                key={option.id}
                className={`flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer transition-all ${formData.gender === option.id
                  ? "bg-indigo-50 border-indigo-600 text-indigo-700 ring-2 ring-indigo-200"
                  : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300 hover:bg-gray-50"
                  }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={option.id}
                  checked={formData.gender === option.id}
                  onChange={handleChange}
                  className="hidden"
                />
                {option.icon}
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Nationality *
          </label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Select Nationality</option>
            {countries.map((c: any) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Citizenship Number
          </label>
          <input
            type="text"
            name="citizenshipNo"
            value={formData.citizenshipNo}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Citizenship Issue Date
          </label>
          <input
            type="date"
            name="citizenshipIssueDate"
            value={
              formData.citizenshipIssueDate
                ? formData.citizenshipIssueDate.includes("T")
                  ? formData.citizenshipIssueDate.split("T")[0]
                  : formData.citizenshipIssueDate
                : ""
            }
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Issue District
          </label>
          <input
            type="text"
            name="citizenshipIssueDistrict"
            value={formData.citizenshipIssueDistrict}
            onChange={handleChange}
            placeholder="e.g. Kathmandu"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            PAN Number
          </label>
          <input
            type="text"
            name="panNo"
            value={formData.panNo}
            onChange={handleChange}
            placeholder="9 digit PAN number"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            National ID (NID)
          </label>
          <input
            type="text"
            name="nidNo"
            value={formData.nidNo}
            onChange={handleChange}
            placeholder="NID Number"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">Select Branch *</label>
          <select
            name="branchId"
            value={formData.branchId || ""}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            required
          >
            <option value="">-- Select Branch --</option>
            {branches.map((branch: any) => (
              <option key={branch.id} value={branch.id}>
                {branch.name} ({branch.code})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Marital Status *
          </label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Select Marital Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

      </div>

      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={saving}
          className={`px-8 py-2 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 active:transform active:scale-95 transition-all ${saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {saving ? "Saving..." : "Save & Next"}
        </button>

      </div>
    </form >
  );
};

export default KycPersonalInfo;
