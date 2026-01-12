// filepath: AUTH-Frontend/src/components/dashboard/user/sections/KycAddress.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";

interface KycAddressProps {
  sessionId: number | null;
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

const KycAddress: React.FC<KycAddressProps> = ({
  sessionId,
  initialData,
  onNext,
  onBack,
}) => {
  const { token, apiBase } = useAuth();

  // Dropdown data for permanent address
  const [permProvinces, setPermProvinces] = useState<string[]>([]);
  const [permDistricts, setPermDistricts] = useState<string[]>([]);
  const [permMunicipalities, setPermMunicipalities] = useState<string[]>([]);
  const [permWards, setPermWards] = useState<number[]>([]);

  // Dropdown data for current address
  const [currProvinces, setCurrProvinces] = useState<string[]>([]);
  const [currDistricts, setCurrDistricts] = useState<string[]>([]);
  const [currMunicipalities, setCurrMunicipalities] = useState<string[]>([]);
  const [currWards, setCurrWards] = useState<number[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    permanentProvince: "",
    permanentDistrict: "",
    permanentMunicipality: "",
    permanentWardNo: "",
    permanentCountry: "Nepal",
    permanentTole: "",
    currentTole: "",
    currentProvince: "",
    currentDistrict: "",
    currentMunicipality: "",
    wardNo: "",
    currentCountry: "Nepal",
    contactNumber: "",
    email: initialData?.currentAddress?.emailId || initialData?.email || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch provinces for permanent address on mount
  useEffect(() => {
    fetch(`${apiBase}/api/address/provinces`)
      .then((res) => res.json())
      .then((data) => setPermProvinces(data))
      .catch(() => setPermProvinces([]));
  }, [apiBase]);

  // Fetch districts for permanent address when province changes
  useEffect(() => {
    if (formData.permanentProvince) {
      fetch(
        `${apiBase}/api/address/districts?province=${formData.permanentProvince}`
      )
        .then((res) => res.json())
        .then((data) => setPermDistricts(data))
        .catch(() => setPermDistricts([]));
    } else {
      setPermDistricts([]);
    }
    setFormData((prev) => ({
      ...prev,
      permanentDistrict: "",
      permanentMunicipality: "",
      permanentWardNo: "",
    }));
  }, [formData.permanentProvince, apiBase]);

  // Fetch municipalities for permanent address when district changes
  useEffect(() => {
    if (formData.permanentDistrict) {
      fetch(
        `${apiBase}/api/address/municipalities?district=${formData.permanentDistrict}`
      )
        .then((res) => res.json())
        .then((data) => setPermMunicipalities(data))
        .catch(() => setPermMunicipalities([]));
    } else {
      setPermMunicipalities([]);
    }
    setFormData((prev) => ({
      ...prev,
      permanentMunicipality: "",
      permanentWardNo: "",
    }));
  }, [formData.permanentDistrict, apiBase]);

  // Fetch wards for permanent address when municipality changes
  useEffect(() => {
    if (formData.permanentMunicipality) {
      fetch(
        `${apiBase}/api/address/wards?municipality=${formData.permanentMunicipality}`
      )
        .then((res) => res.json())
        .then((data) => setPermWards(data))
        .catch(() => setPermWards([]));
    } else {
      setPermWards([]);
    }
    setFormData((prev) => ({
      ...prev,
      permanentWardNo: "",
    }));
  }, [formData.permanentMunicipality, apiBase]);

  // Fetch provinces for current address on mount
  useEffect(() => {
    fetch(`${apiBase}/api/address/provinces`)
      .then((res) => res.json())
      .then((data) => setCurrProvinces(data))
      .catch(() => setCurrProvinces([]));
  }, [apiBase]);

  // Fetch districts for current address when province changes
  useEffect(() => {
    if (formData.currentProvince) {
      fetch(
        `${apiBase}/api/address/districts?province=${formData.currentProvince}`
      )
        .then((res) => res.json())
        .then((data) => setCurrDistricts(data))
        .catch(() => setCurrDistricts([]));
    } else {
      setCurrDistricts([]);
    }
    setFormData((prev) => ({
      ...prev,
      currentDistrict: "",
      currentMunicipality: "",
      wardNo: "",
    }));
  }, [formData.currentProvince, apiBase]);

  // Fetch municipalities for current address when district changes
  useEffect(() => {
    if (formData.currentDistrict) {
      fetch(
        `${apiBase}/api/address/municipalities?district=${formData.currentDistrict}`
      )
        .then((res) => res.json())
        .then((data) => setCurrMunicipalities(data))
        .catch(() => setCurrMunicipalities([]));
    } else {
      setCurrMunicipalities([]);
    }
    setFormData((prev) => ({
      ...prev,
      currentMunicipality: "",
      wardNo: "",
    }));
  }, [formData.currentDistrict, apiBase]);

  // Fetch wards for current address when municipality changes
  useEffect(() => {
    if (formData.currentMunicipality) {
      fetch(
        `${apiBase}/api/address/wards?municipality=${formData.currentMunicipality}`
      )
        .then((res) => res.json())
        .then((data) => setCurrWards(data))
        .catch(() => setCurrWards([]));
    } else {
      setCurrWards([]);
    }
    setFormData((prev) => ({
      ...prev,
      wardNo: "",
    }));
  }, [formData.currentMunicipality, apiBase]);

  // Handle input change
  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // "Same as permanent" button for current address
  const copyPermanentToCurrent = () => {
    setFormData((prev) => ({
      ...prev,
      currentProvince: prev.permanentProvince,
      currentDistrict: prev.permanentDistrict,
      currentMunicipality: prev.permanentMunicipality,
      wardNo: prev.permanentWardNo,
      tole: prev.permanentTole,
      currentCountry: prev.permanentCountry,
    }));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionId) {
      setError("KYC session not initialized.");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Save Permanent Address
      await fetch(`${apiBase}/api/KycData/save-permanent-address`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId,
          stepNumber: 2,
          data: {
            country: formData.permanentCountry,
            province: formData.permanentProvince,
            district: formData.permanentDistrict,
            tole: formData.permanentTole,
            municipalityName: formData.permanentMunicipality,
            wardNo: parseInt(formData.permanentWardNo) || null,
            mobileNo: formData.contactNumber,
            emailId: formData.email,
          },
        }),
      });

      // Save Current Address
      await fetch(`${apiBase}/api/KycData/save-current-address`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId,
          stepNumber: 3,
          data: {
            country: formData.currentCountry,
            province: formData.currentProvince,
            district: formData.currentDistrict,
            tole: formData.currentTole,
            municipalityName: formData.currentMunicipality,
            wardNo: parseInt(formData.wardNo) || null,
            mobileNo: formData.contactNumber,
            emailId: formData.email,
          },
        }),
      });

      onNext({ address: formData });
    } catch (err: any) {
      setError(err.message || "Error saving address information");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Section 2: Address Information
        </h2>
        <p className="text-sm text-gray-500">
          Permanent and Current residence details.
        </p>
      </div>
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <h3 className="col-span-full text-md font-semibold text-indigo-700 border-l-4 border-indigo-600 pl-2 mt-2">
          Permanent Address
        </h3>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent Province *
          </label>
          <select
            name="permanentProvince"
            value={formData.permanentProvince}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Province</option>
            {permProvinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent District *
          </label>
          <select
            name="permanentDistrict"
            value={formData.permanentDistrict}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select District</option>
            {permDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent Municipality *
          </label>
          <select
            name="permanentMunicipality"
            value={formData.permanentMunicipality}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Municipality</option>
            {permMunicipalities.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent Ward No. *
          </label>
          <input
            type="text"
            name="permanentWardNo"
            value={formData.permanentWardNo}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent Tole
          </label>
          <input
            type="text"
            name="permanentTole"
            value={formData.permanentTole}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent Country *
          </label>
          <input
            type="text"
            name="permanentCountry"
            value={formData.permanentCountry}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>

        <div className="col-span-full border-t border-gray-100 my-4"></div>
        <div className="col-span-full flex items-center justify-between">
          <h3 className="text-md font-semibold text-indigo-700 border-l-4 border-indigo-600 pl-2">
            Current Address
          </h3>
          <button
            type="button"
            onClick={copyPermanentToCurrent}
            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition-colors"
          >
            Same as permanent
          </button>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current Province *
          </label>
          <select
            name="currentProvince"
            value={formData.currentProvince}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Province</option>
            {currProvinces.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current District *
          </label>
          <select
            name="currentDistrict"
            value={formData.currentDistrict}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select District</option>
            {currDistricts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current Municipality *
          </label>
          <select
            name="currentMunicipality"
            value={formData.currentMunicipality}
            onChange={handleChange}
            className="p-2 border rounded"
          >
            <option value="">Select Municipality</option>
            {currMunicipalities.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current Ward No. *
          </label>
          <input
            type="text"
            name="wardNo"
            value={formData.wardNo}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current Tole
          </label>
          <input
            type="text"
            name="currentTole"
            value={formData.currentTole}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current Country *
          </label>
          <input
            type="text"
            name="currentCountry"
            value={formData.currentCountry}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>

        <h3 className="col-span-full text-md font-semibold text-indigo-700 border-l-4 border-indigo-600 pl-2 mt-4">
          Contact Info
        </h3>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Contact Number
          </label>
          <input
            type="text"
            name="contactNumber"
            value={formData.contactNumber}
            onChange={handleChange}
            className="p-2 border rounded"
          />
        </div>
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="p-2 border rounded"
            disabled // Email is pre-filled and not editable
          />
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 text-gray-600 font-semibold rounded hover:bg-gray-100 transition-all"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`px-8 py-2 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 active:transform active:scale-95 transition-all ${
            saving ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {saving ? "Saving..." : "Save & Next"}
        </button>
      </div>
    </form>
  );
};

export default KycAddress;
