import React, { useState, useEffect } from "react";
import api from "../../../../services/api";

interface KycOccupationProps {
  sessionToken: string | null;
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSaveAndExit?: () => void;
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
  sessionToken,
  initialData,
  onNext,
  onBack,
  onSaveAndExit,
}) => {
  const [occupationOptions, setOccupationOptions] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
    api.get(`/api/Occupation`)
      .then((res) => {
        let items = Array.isArray(res.data) ? res.data : (res.data.success && res.data.data ? res.data.data : []);

        if (items.length > 0) {
          let options: { value: string; label: string }[] = items.map((item: any) => ({
            value: (item.name ?? item.Name ?? item.id ?? item.Id)?.toString() ?? "",
            label: item.name ?? item.Name ?? "",
          }));

          if (!options.some(o => o.value === "Others" || o.label === "Others")) {
            options.push({ value: "Others", label: "Others" });
          }
          setOccupationOptions(options);
        } else {
          setOccupationOptions([
            { value: "Salaried", label: "Salaried" },
            { value: "Self Employed", label: "Self Employed" },
            { value: "Business", label: "Business" },
            { value: "Others", label: "Others" },
          ]);
          return;
        }

        const options = items.map((item: any) => ({
          value: item.name?.toString(),
          label: item.name?.toString(),
        }));

        if (!options.some((o) => o.value === "Others")) {
          options.push({ value: "Others", label: "Others" });
        }

        setOccupationOptions(options);
      })
      .catch((err) => {
        console.error("Occupation fetch error:", err);
      });
  }, []);

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
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | null,
    shouldExit: boolean = false,
  ) => {
    if (e) e.preventDefault();
    if (!sessionToken) {
      setError("Session token not found");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const response = await api.post(`/api/KycData/save-occupation/${sessionToken}`, {
        stepNumber: 6,
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
      });

      if (response.data.success) {
        if (shouldExit && onSaveAndExit) {
          onSaveAndExit();
        } else {
          onNext({ occupation: formData });
        }
      } else {
        setError(response.data.message || "Failed to save occupation section");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={(e) => handleSubmit(e, false)}
      className="space-y-8 animate-fadeIn"
    >
      <header className="border-b border-indigo-100 pb-5">
        <h2 className="text-2xl font-extrabold text-indigo-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm">
            5
          </span>
          Occupation Details
        </h2>
        <p className="text-gray-500 mt-1 ml-10">
          Please provide accurate information regarding your current profession
          and income sources.
        </p>
      </header>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100 flex items-center gap-3">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          {error}
        </div>
      )}

      {/* Primary Occupation Data */}
      <fieldset className="space-y-6">
        <legend className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 px-1">
          Professional Identity
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <section className="flex flex-col space-y-1.5">
            <label
              htmlFor="occupation"
              className="text-sm font-semibold text-gray-700"
            >
              Primary Occupation *
            </label>
            <select
              id="occupation"
              name="occupation"
              value={formData.occupation}
              onChange={handleChange}
              className="p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all hover:border-indigo-400"
            >
              <option value="">Select your occupation</option>
              {occupationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </section>

          {formData.occupation === "Others" && (
            <section className="flex flex-col space-y-1.5 animate-slideDown">
              <label
                htmlFor="otherOccupation"
                className="text-sm font-semibold text-gray-700"
              >
                Specify Other Occupation *
              </label>
              <input
                id="otherOccupation"
                type="text"
                name="otherOccupation"
                value={formData.otherOccupation}
                onChange={handleChange}
                required
                placeholder="e.g. Freelance Musician"
                className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </section>
          )}

          <section className="flex flex-col space-y-1.5">
            <label
              htmlFor="designation"
              className="text-sm font-semibold text-gray-700"
            >
              Designation / Position
            </label>
            <input
              id="designation"
              type="text"
              name="designation"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Senior Manager"
              className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </section>
        </div>
      </fieldset>

      {/* Organization Details */}
      <fieldset className="space-y-6 pt-2">
        <legend className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 px-1">
          Workplace Information
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-1">
          <section className="flex flex-col space-y-1.5">
            <label
              htmlFor="orgName"
              className="text-sm font-semibold text-gray-700"
            >
              Organization Name
            </label>
            <input
              id="orgName"
              type="text"
              name="orgName"
              value={formData.orgName}
              onChange={handleChange}
              className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </section>

          <section className="flex flex-col space-y-1.5">
            <label
              htmlFor="employeeIdNo"
              className="text-sm font-semibold text-gray-700"
            >
              Employee ID / Business Reg No
            </label>
            <input
              id="employeeIdNo"
              type="text"
              name="employeeIdNo"
              value={formData.employeeIdNo}
              onChange={handleChange}
              className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </section>

          <section className="flex flex-col col-span-full space-y-1.5">
            <label
              htmlFor="orgAddress"
              className="text-sm font-semibold text-gray-700"
            >
              Organization Address
            </label>
            <input
              id="orgAddress"
              type="text"
              name="orgAddress"
              value={formData.orgAddress}
              onChange={handleChange}
              className="p-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all w-full"
            />
          </section>

          <section className="flex flex-col space-y-1.5">
            <label
              htmlFor="serviceSector"
              className="text-sm font-semibold text-gray-700"
            >
              Service Sector
            </label>
            <select
              id="serviceSector"
              name="serviceSector"
              value={formData.serviceSector}
              onChange={handleChange}
              className="p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">Select Sector</option>
              <option value="Government">Government</option>
              <option value="Private">Private</option>
              <option value="NGO">NGO/INGO</option>
              <option value="Other">Other</option>
            </select>
          </section>

          <section className="flex flex-col space-y-1.5">
            <label
              htmlFor="businessType"
              className="text-sm font-semibold text-gray-700"
            >
              Business Type
            </label>
            <select
              id="businessType"
              name="businessType"
              value={formData.businessType}
              onChange={handleChange}
              className="p-2.5 bg-white border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="">Select Type</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Trading">Trading</option>
              <option value="Service">Service</option>
              <option value="Other">Other</option>
            </select>
          </section>
        </div>
      </fieldset>

      {/* Financial Information */}
      <fieldset className="space-y-6 pt-2">
        <legend className="text-sm font-bold text-indigo-600 uppercase tracking-wider mb-4 px-1">
          Financial Data
        </legend>

        <div className="bg-gradient-to-br from-gray-50 to-indigo-50/30 p-6 rounded-2xl border border-indigo-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <label className="text-sm font-bold text-gray-800">
              Estimated Annual Income Range *
            </label>
            <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-xs font-bold shadow-lg shadow-indigo-200">
              {formData.annualIncomeBracket
                ? formData.annualIncomeBracket.replace(/([A-Z])/g, " $1").trim()
                : "Select Range"}
            </span>
          </div>

          <div className="relative pt-2">
            <input
              type="range"
              id="annualIncomeRange"
              min="0"
              max="4"
              step="1"
              value={
                formData.annualIncomeBracket === "Below1Lakh"
                  ? "0"
                  : formData.annualIncomeBracket === "1LakhTo5Lakh"
                    ? "1"
                    : formData.annualIncomeBracket === "5LakhTo10Lakh"
                      ? "2"
                      : formData.annualIncomeBracket === "10LakhTo20Lakh"
                        ? "3"
                        : formData.annualIncomeBracket === "Above20Lakh"
                          ? "4"
                          : "0"
              }
              onChange={(e) => {
                const val = e.target.value;
                const map: any = {
                  "0": "Below1Lakh",
                  "1": "1LakhTo5Lakh",
                  "2": "5LakhTo10Lakh",
                  "3": "10LakhTo20Lakh",
                  "4": "Above20Lakh",
                };
                setFormData((prev) => ({
                  ...prev,
                  annualIncomeBracket: map[val],
                }));
              }}
              className="w-full h-2.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />

            <div className="flex justify-between text-[11px] text-gray-500 font-bold px-1 mt-3">
              <span className="flex flex-col items-center">
                <span>|</span>
                <span>Below 1L</span>
              </span>
              <span className="flex flex-col items-center">
                <span>|</span>
                <span>1L - 5L</span>
              </span>
              <span className="flex flex-col items-center">
                <span>|</span>
                <span>5L - 10L</span>
              </span>
              <span className="flex flex-col items-center">
                <span>|</span>
                <span>10L - 20L</span>
              </span>
              <span className="flex flex-col items-center">
                <span>|</span>
                <span>Above 20L</span>
              </span>
            </div>
          </div>
        </div>
      </fieldset>

      <footer className="flex justify-between items-center pt-8 border-t border-gray-100 mt-4">
        <button
          type="button"
          onClick={onBack}
          className="group px-7 py-3 border-2 border-gray-200 text-gray-500 font-bold rounded-xl hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center gap-2"
        >
          <svg
            className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <button
          type="submit"
          disabled={saving}
          className={`group px-10 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 active:scale-95 transition-all flex items-center gap-2 ${saving ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {saving ? (
            <>
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              Save & Continue
              <svg
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </>
          )}
        </button>
      </footer>
    </form>
  );
};

export default KycOccupation;
