import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";
// import { adToBs } from "bikram-sambat-js"; 

interface KycPersonalInfoProps {
  sessionId: number | null;
  initialData?: any;
  onNext: (data: any) => void;
}

interface KycPersonalInfoData {
  firstName: string;
  middleName: string;
  lastName: string;
  dobAd: string;
  dobBs: string;
  gender: string;
  nationality: string;
  citizenshipNo: string;
  citizenshipIssueDate: string;
  citizenshipIssueDistrict: string;
  panNo: string;
  branchId?: string | number;
  [key: string]: any;
}

// Dummy AD to BS converter (replace with your actual logic or API call)
function convertAdToBs(adDate: string): string {
  // Example: just return the same date for now
  // Replace with actual conversion logic or API call
  if (!adDate) return "";
  // Simulate conversion: add 57 years for demo
  const date = new Date(adDate);
  if (isNaN(date.getTime())) return "";
  return `${date.getFullYear() + 57}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(date.getDate()).padStart(2, "0")}`;
}

const KycPersonalInfo: React.FC<KycPersonalInfoProps> = ({
  sessionId,
  initialData,
  onNext,
}) => {
  const { token, apiBase } = useAuth();
  const [branches, setBranches] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${apiBase}/api/Branch`)
      .then((res) => res.json())
      .then((data) => setBranches(data))
      .catch((err) => console.error("Failed to load branches", err));
  }, [apiBase]);

  // Normalize data from either backend format (Pascal/Camel) or previous frontend format
  const [formData, setFormData] = useState<KycPersonalInfoData>({
    firstName: initialData?.firstName || "",
    middleName: initialData?.middleName || "",
    lastName: initialData?.lastName || "",
    dobAd: initialData?.dateOfBirthAd || initialData?.DateOfBirthAd || "",
    dobBs: initialData?.dateOfBirthBs || initialData?.DateOfBirthBs || "",
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
    nationality:
      initialData?.isNepali || initialData?.IsNepali
        ? "Nepali"
        : initialData?.otherNationality ||
        initialData?.OtherNationality ||
        initialData?.nationality ||
        "Nepali",
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
        dobAd: initialData?.dateOfBirthAd || initialData?.DateOfBirthAd || "",
        dobBs: initialData?.dateOfBirthBs || initialData?.DateOfBirthBs || "",
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
        nationality:
          initialData?.isNepali || initialData?.IsNepali
            ? "Nepali"
            : initialData?.otherNationality ||
            initialData?.OtherNationality ||
            initialData?.nationality ||
            "Nepali",
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
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionId) {
      setError("KYC Session not initialized correctly.");
      return;
    }
    setSaving(true);
    setError(null);

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
      isNepali: formData.nationality?.toLowerCase() === "nepali",
      otherNationality:
        formData.nationality?.toLowerCase() === "nepali"
          ? null
          : formData.nationality,
      citizenshipNo: formData.citizenshipNo || null,
      citizenshipIssueDistrict: formData.citizenshipIssueDistrict || null,
      citizenshipIssueDate: formData.citizenshipIssueDate || null,
      panNo: formData.panNo || null,
      // branchId: formData.branchId ? parseInt(formData.branchId) : null
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
        onNext({ personalInfo: formData });
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
    <form onSubmit={handleSubmit} className="space-y-6">
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
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Gender
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Select Gender</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Nationality
          </label>
          <input
            type="text"
            name="nationality"
            value={formData.nationality}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
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
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {/* <div className="flex flex-col">
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
                </div> */}
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
    </form>
  );
};

export default KycPersonalInfo;
