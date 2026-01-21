// filepath: AUTH-Frontend/src/components/dashboard/user/sections/KycAddress.tsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";

interface AddressItem {
  id: number;
  name: string;
}

interface KycAddressProps {
  sessionId: number | null;
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSaveAndExit?: () => void;
}

const KycAddress: React.FC<KycAddressProps> = ({
  sessionId,
  initialData,
  onNext,
  onBack,
  onSaveAndExit,
}) => {
  const { token, apiBase } = useAuth();

  // Dropdown data
  const [permProvinces, setPermProvinces] = useState<AddressItem[]>([]);
  const [permDistricts, setPermDistricts] = useState<AddressItem[]>([]);
  const [permMunicipalities, setPermMunicipalities] = useState<AddressItem[]>(
    []
  );

  const [currProvinces, setCurrProvinces] = useState<AddressItem[]>([]);
  const [currDistricts, setCurrDistricts] = useState<AddressItem[]>([]);
  const [currMunicipalities, setCurrMunicipalities] = useState<AddressItem[]>(
    []
  );

  // Form data
  const [formData, setFormData] = useState({
    permanentProvinceId: "",
    permanentDistrictId: "",
    permanentMunicipalityId: "",
    permanentWardNo: "",
    permanentCountry: "Nepal",
    permanentTole: "",
    currentProvinceId: "",
    currentDistrictId: "",
    currentMunicipalityId: "",
    currentTole: "",
    wardNo: "",
    currentCountry: "Nepal",
    contactNumber: "",
    email: initialData?.currentAddress?.emailId || initialData?.email || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch provinces
  useEffect(() => {
    fetch(`${apiBase}/api/Address/provinces`)
      .then((res) => res.json())
      .then((data) => {
        setPermProvinces(data);
        setCurrProvinces(data);
      })
      .catch(() => {
        setPermProvinces([]);
        setCurrProvinces([]);
      });
  }, [apiBase]);

  // Handle Permanent Province Change
  useEffect(() => {
    if (formData.permanentProvinceId) {
      fetch(`${apiBase}/api/Address/districts/${formData.permanentProvinceId}`)
        .then((res) => res.json())
        .then((data) => setPermDistricts(data))
        .catch(() => setPermDistricts([]));
    } else {
      setPermDistricts([]);
    }
  }, [formData.permanentProvinceId, apiBase]);

  // Handle Permanent District Change
  useEffect(() => {
    if (formData.permanentDistrictId) {
      fetch(
        `${apiBase}/api/Address/municipalities/${formData.permanentDistrictId}`
      )
        .then((res) => res.json())
        .then((data) => setPermMunicipalities(data))
        .catch(() => setPermMunicipalities([]));
    } else {
      setPermMunicipalities([]);
    }
  }, [formData.permanentDistrictId, apiBase]);

  // Handle Current Province Change
  useEffect(() => {
    if (formData.currentProvinceId) {
      fetch(`${apiBase}/api/Address/districts/${formData.currentProvinceId}`)
        .then((res) => res.json())
        .then((data) => setCurrDistricts(data))
        .catch(() => setCurrDistricts([]));
    } else {
      setCurrDistricts([]);
    }
  }, [formData.currentProvinceId, apiBase]);

  // Handle Current District Change
  useEffect(() => {
    if (formData.currentDistrictId) {
      fetch(
        `${apiBase}/api/Address/municipalities/${formData.currentDistrictId}`
      )
        .then((res) => res.json())
        .then((data) => setCurrMunicipalities(data))
        .catch(() => setCurrMunicipalities([]));
    } else {
      setCurrMunicipalities([]);
    }
  }, [formData.currentDistrictId, apiBase]);

  // Sync initialData
  useEffect(() => {
    // 1. Prioritize locally saved state (if user pressed Back)
    if (initialData?.address) {
      setFormData(prev => ({ ...prev, ...initialData.address }));
      return;
    }

    // 2. Otherwise sync from backend structure (names to IDs)
    if (initialData?.permanentAddress && permProvinces.length > 0) {
      const p = initialData.permanentAddress;
      const province = permProvinces.find(pr => pr.name === p.province);
      if (province) {
        setFormData(prev => ({
          ...prev,
          permanentProvinceId: province.id.toString(),
          permanentWardNo: p.wardNo?.toString() || prev.permanentWardNo,
          permanentTole: p.tole || prev.permanentTole,
          permanentCountry: p.country || prev.permanentCountry
        }));
      }
    }

    if (initialData?.currentAddress && currProvinces.length > 0) {
      const c = initialData.currentAddress;
      const province = currProvinces.find(pr => pr.name === c.province);
      if (province) {
        setFormData(prev => ({
          ...prev,
          currentProvinceId: province.id.toString(),
          wardNo: c.wardNo?.toString() || prev.wardNo,
          currentTole: c.tole || prev.currentTole,
          contactNumber: c.mobileNo || prev.contactNumber,
          currentCountry: c.country || prev.currentCountry
        }));
      }
    }
  }, [initialData, permProvinces, currProvinces]);

  useEffect(() => {
    if (!initialData?.address && initialData?.permanentAddress && permDistricts.length > 0) {
      const district = permDistricts.find(d => d.name === initialData.permanentAddress.district);
      if (district) setFormData(prev => ({ ...prev, permanentDistrictId: district.id.toString() }));
    }
  }, [permDistricts, initialData]);

  useEffect(() => {
    if (!initialData?.address && initialData?.permanentAddress && permMunicipalities.length > 0) {
      const mun = permMunicipalities.find(m => m.name === initialData.permanentAddress.municipalityName);
      if (mun) setFormData(prev => ({ ...prev, permanentMunicipalityId: mun.id.toString() }));
    }
  }, [permMunicipalities, initialData]);

  useEffect(() => {
    if (!initialData?.address && initialData?.currentAddress && currDistricts.length > 0) {
      const district = currDistricts.find(d => d.name === initialData.currentAddress.district);
      if (district) setFormData(prev => ({ ...prev, currentDistrictId: district.id.toString() }));
    }
  }, [currDistricts, initialData]);

  useEffect(() => {
    if (!initialData?.address && initialData?.currentAddress && currMunicipalities.length > 0) {
      const mun = currMunicipalities.find(m => m.name === initialData.currentAddress.municipalityName);
      if (mun) setFormData(prev => ({ ...prev, currentMunicipalityId: mun.id.toString() }));
    }
  }, [currMunicipalities, initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };

      // Clear dependent fields ONLY on manual change
      if (name === "permanentProvinceId") {
        newData.permanentDistrictId = "";
        newData.permanentMunicipalityId = "";
      } else if (name === "permanentDistrictId") {
        newData.permanentMunicipalityId = "";
      } else if (name === "currentProvinceId") {
        newData.currentDistrictId = "";
        newData.currentMunicipalityId = "";
      } else if (name === "currentDistrictId") {
        newData.currentMunicipalityId = "";
      }

      return newData;
    });
  };

  const copyCurrentToPermanent = () => {
    setFormData((prev) => ({
      ...prev,
      permanentProvinceId: prev.currentProvinceId,
      permanentDistrictId: prev.currentDistrictId,
      permanentMunicipalityId: prev.currentMunicipalityId,
      permanentWardNo: prev.wardNo,
      permanentTole: prev.currentTole,
      permanentCountry: prev.currentCountry,
    }));
  };

  const [isExiting, setIsExiting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, shouldExit: boolean = false) => {
    if (e) e.preventDefault();
    if (!sessionId) {
      setError("KYC session not initialized.");
      return;
    }
    setSaving(true);
    setError(null);
    if (shouldExit) setIsExiting(true);

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // Look up names for Saving (Assuming backend expects names based on previous code)
      const pProv = permProvinces.find(
        (p) => p.id.toString() === formData.permanentProvinceId
      )?.name;
      const pDist = permDistricts.find(
        (d) => d.id.toString() === formData.permanentDistrictId
      )?.name;
      const pMun = permMunicipalities.find(
        (m) => m.id.toString() === formData.permanentMunicipalityId
      )?.name;

      const cProv = currProvinces.find(
        (p) => p.id.toString() === formData.currentProvinceId
      )?.name;
      const cDist = currDistricts.find(
        (d) => d.id.toString() === formData.currentDistrictId
      )?.name;
      const cMun = currMunicipalities.find(
        (m) => m.id.toString() === formData.currentMunicipalityId
      )?.name;

      // Save Permanent Address
      await fetch(`${apiBase}/api/KycData/save-permanent-address`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          sessionId,
          stepNumber: 3,
          data: {
            country: formData.permanentCountry,
            province: pProv,
            district: pDist,
            tole: formData.permanentTole,
            municipalityName: pMun,
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
          stepNumber: 2,
          data: {
            country: formData.currentCountry,
            province: cProv,
            district: cDist,
            tole: formData.currentTole,
            municipalityName: cMun,
            wardNo: parseInt(formData.wardNo) || null,
            mobileNo: formData.contactNumber,
            emailId: formData.email,
          },
        }),
      });

      if (shouldExit && onSaveAndExit) {
        onSaveAndExit();
      } else {
        onNext({ address: formData });
      }
    } catch (err: any) {
      setError(err.message || "Error saving address information");
      setIsExiting(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6" noValidate>
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
        <div className="col-span-full flex items-center justify-between mt-2">
          <h3 className="text-md font-semibold text-indigo-700 border-l-4 border-indigo-600 pl-2">
            Current Address (Temporary)
          </h3>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current Province *
          </label>
          <select
            name="currentProvinceId"
            value={formData.currentProvinceId}
            onChange={handleChange}
            className="p-2 border rounded"
            required
          >
            <option value="">Select Province</option>
            {currProvinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current District *
          </label>
          <select
            name="currentDistrictId"
            value={formData.currentDistrictId}
            onChange={handleChange}
            className="p-2 border rounded"
            required
          >
            <option value="">Select District</option>
            {currDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Current Municipality *
          </label>
          <select
            name="currentMunicipalityId"
            value={formData.currentMunicipalityId}
            onChange={handleChange}
            className="p-2 border rounded"
            required
          >
            <option value="">Select Municipality</option>
            {currMunicipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
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
            required
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
            required
          />
        </div>

        <div className="col-span-full border-t border-gray-100 my-4"></div>

        <div className="col-span-full flex items-center justify-between">
          <h3 className="text-md font-semibold text-indigo-700 border-l-4 border-indigo-600 pl-2">
            Permanent Address
          </h3>
          <button
            type="button"
            onClick={copyCurrentToPermanent}
            className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded hover:bg-indigo-100 transition-colors"
          >
            Same as temporary
          </button>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent Province *
          </label>
          <select
            name="permanentProvinceId"
            value={formData.permanentProvinceId}
            onChange={handleChange}
            className="p-2 border rounded"
            required
          >
            <option value="">Select Province</option>
            {permProvinces.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent District *
          </label>
          <select
            name="permanentDistrictId"
            value={formData.permanentDistrictId}
            onChange={handleChange}
            className="p-2 border rounded"
            required
          >
            <option value="">Select District</option>
            {permDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Permanent Municipality *
          </label>
          <select
            name="permanentMunicipalityId"
            value={formData.permanentMunicipalityId}
            onChange={handleChange}
            className="p-2 border rounded"
            required
          >
            <option value="">Select Municipality</option>
            {permMunicipalities.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
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
            required
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
            required
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
            className="p-2 border rounded bg-gray-50"
            disabled
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
          className={`px-8 py-2 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 active:transform active:scale-95 transition-all ${saving ? "opacity-50 cursor-not-allowed" : ""
            }`}
        >
          {saving ? "Saving..." : "Save & Next"}
        </button>

      </div>
    </form>
  );
};

export default KycAddress;
