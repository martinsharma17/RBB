import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";

interface KycOccupationProps {
  sessionId: number | null;
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

interface KycOccupationData {
  occupation: string;
  otherOccupation: string;
  serviceSector: string;
  businessType: string;
  orgName: string;
  orgAddress: string;
  designation: string;
  employeeIdNo: string;
  annualIncomeBracket: string;
  [key: string]: any;
}

const KycOccupation: React.FC<KycOccupationProps> = ({
  sessionId,
  initialData,
  onNext,
  onBack,
}) => {
  const { token, apiBase } = useAuth();
  const DEFAULT_OCCUPATIONS = [
    { value: "Salaried", label: "Salaried" },
    { value: "Self Employed", label: "Self Employed" },
    { value: "Student", label: "Student" },
    { value: "Retired", label: "Retired" },
    { value: "Housewife", label: "Housewife" },
    { value: "Business", label: "Business" },
    { value: "Agriculture", label: "Agriculture" },
    { value: "Others", label: "Others" }
  ];

  const [occupationOptions, setOccupationOptions] = useState<
    { value: string; label: string }[]
  >(DEFAULT_OCCUPATIONS);

  useEffect(() => {
    fetch(`${apiBase}/api/Occupation`)
      .then((res) => res.json())
      .then((data) => {
        console.log("[Occupation] Raw data:", data);
        let items = Array.isArray(data) ? data : (data.success && data.data ? data.data : []);

        if (items.length > 0) {
          let options: { value: string; label: string }[] = items.map((item: any) => ({
            value: (item.id ?? item.Id)?.toString() ?? "",
            label: item.name ?? item.Name ?? "",
          }));

          // Ensure "Others" is always there
          if (!options.some(o => o.value === "Others" || o.label === "Others")) {
            options.push({ value: "Others", label: "Others" });
          }
          setOccupationOptions(options);
        }
      })
      .catch((err) => {
        console.error("[Occupation] Fetch failed, using defaults:", err);
        // keep using DEFAULT_OCCUPATIONS already set in useState
      });
  }, [apiBase]);

  const [formData, setFormData] = useState<KycOccupationData>({
    occupation: initialData?.occupationType || initialData?.occupation || "",
    otherOccupation: initialData?.otherOccupation || "",
    serviceSector: initialData?.serviceSector || "",
    businessType: initialData?.businessType || "",
    orgName: initialData?.organizationName || initialData?.orgName || "",
    orgAddress:
      initialData?.organizationAddress || initialData?.orgAddress || "",
    designation: initialData?.designation || "",
    employeeIdNo: initialData?.employeeIdNo || "",
    annualIncomeBracket:
      initialData?.annualIncomeRange || initialData?.annualIncomeBracket || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        occupation:
          initialData?.occupationType || initialData?.occupation || "",
        otherOccupation: initialData?.otherOccupation || "",
        serviceSector: initialData?.serviceSector || "",
        businessType: initialData?.businessType || "",
        orgName: initialData?.organizationName || initialData?.orgName || "",
        orgAddress:
          initialData?.organizationAddress || initialData?.orgAddress || "",
        designation: initialData?.designation || "",
        employeeIdNo: initialData?.employeeIdNo || "",
        annualIncomeBracket:
          initialData?.annualIncomeRange ||
          initialData?.annualIncomeBracket ||
          "",
      });
    }
  }, [initialData]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionId) {
      setError("Session not initialized");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`${apiBase}/api/KycData/save-occupation`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: sessionId,
          stepNumber: 6, // Adjusted to match backend
          data: {
            occupationType: formData.occupation,
            otherOccupation: formData.otherOccupation,
            serviceSector: formData.serviceSector,
            businessType: formData.businessType,
            organizationName: formData.orgName,
            organizationAddress: formData.orgAddress,
            designation: formData.designation,
            employeeIdNo: formData.employeeIdNo,
            annualIncomeRange: formData.annualIncomeBracket,
          },
        }),
      });

      if (response.ok) {
        onNext({ occupation: formData });
      } else {
        setError("Failed to save occupation section");
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
          Section 5: Occupation Details
        </h2>
        <p className="text-sm text-gray-500">
          Provide information about your profession and income.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Occupation *
          </label>
          {/* <select
            name="occupation"
            value={formData.occupation}
            onChange={handl
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Select Occupation</option>
            <option value="Salaried">Salaried</option>
            <option value="SelfEmployed">Self Employed</option>
            <option value="Student">Student</option>
            <option value="Retired">Retired</option>
            <option value="Housewife">Housewife</option>
            <option value="Business">Business</option>
            <option value="Agriculture">Agriculture</option>
            <option value="Others">Others</option>
          </select> */}
          <select
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Select Occupation</option>
            {occupationOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Organization Name
          </label>
          <input
            type="text"
            name="orgName"
            value={formData.orgName}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Organization Address
          </label>
          <input
            type="text"
            name="orgAddress"
            value={formData.orgAddress}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {formData.occupation === "Others" && (
          <div className="flex flex-col">
            <label className="text-sm font-semibold text-gray-700 mb-1">
              Other Occupation
            </label>
            <input
              type="text"
              name="otherOccupation"
              value={formData.otherOccupation}
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Service Sector
          </label>
          <select
            name="serviceSector"
            value={formData.serviceSector}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Select Service Sector</option>
            <option value="Government">Government</option>
            <option value="Private">Private</option>
            <option value="NGO">NGO/INGO</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Business Type
          </label>
          <select
            name="businessType"
            value={formData.businessType}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Select Business Type</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Trading">Trading</option>
            <option value="Service">Service</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Designation
          </label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Employee ID / Business Reg No
          </label>
          <input
            type="text"
            name="employeeIdNo"
            value={formData.employeeIdNo}
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Annual Income Bracket *
          </label>
          <select
            name="annualIncomeBracket"
            value={formData.annualIncomeBracket}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          >
            <option value="">Select Range</option>
            <option value="Below1Lakh">Below 1 Lakh</option>
            <option value="1LakhTo5Lakh">1 Lakh - 5 Lakh</option>
            <option value="5LakhTo10Lakh">5 Lakh - 10 Lakh</option>
            <option value="10LakhTo20Lakh">10 Lakh - 20 Lakh</option>
            <option value="Above20Lakh">Above 20 Lakh</option>
          </select>
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

export default KycOccupation;
