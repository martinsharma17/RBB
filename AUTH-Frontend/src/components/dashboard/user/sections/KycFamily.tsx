import React, { useState, useEffect } from "react";

import api from "../../../../services/api";

interface KycFamilyProps {
  sessionToken: string | null;
  initialData?: any;
  onNext: (data: any) => void;
  onBack: () => void;
  maritalStatus: string;
  onSaveAndExit?: () => void;
}

interface KycFamilyData {
  fatherName: string;
  motherName: string;
  grandfatherName: string;
  spouseName: string;
  fatherInLawName: string;
  motherInLawName: string;
  children: string[];
  [key: string]: any;
}

const KycFamily: React.FC<KycFamilyProps> = ({
  sessionToken,
  initialData,
  onNext,
  onBack,
  maritalStatus,
  onSaveAndExit,
}) => {

  const [formData, setFormData] = useState<KycFamilyData>({
    fatherName: initialData?.fatherName || initialData?.FatherName || "",
    motherName: initialData?.motherName || initialData?.MotherName || "",
    grandfatherName:
      initialData?.grandFatherName ||
      initialData?.GrandFatherName ||
      initialData?.grandfatherName ||
      "",
    spouseName: initialData?.spouseName || initialData?.SpouseName || "",
    fatherInLawName: initialData?.fatherInLawName || initialData?.FatherInLawName || "",
    motherInLawName: initialData?.motherInLawName || initialData?.MotherInLawName || "",
    children: initialData?.childrenNames ? initialData.childrenNames.split(",").filter(Boolean) : (initialData?.ChildrenNames ? initialData.ChildrenNames.split(",").filter(Boolean) : []),
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fatherName: initialData?.fatherName || initialData?.FatherName || "",
        motherName: initialData?.motherName || initialData?.MotherName || "",
        grandfatherName:
          initialData?.grandFatherName ||
          initialData?.GrandFatherName ||
          initialData?.grandfatherName ||
          "",
        spouseName: initialData?.spouseName || initialData?.SpouseName || "",
        fatherInLawName: initialData?.fatherInLawName || initialData?.FatherInLawName || "",
        motherInLawName: initialData?.motherInLawName || initialData?.MotherInLawName || "",
        children: initialData?.childrenNames ? initialData.childrenNames.split(",").filter(Boolean) : (initialData?.ChildrenNames ? initialData.ChildrenNames.split(",").filter(Boolean) : []),
      });
    }
  }, [initialData]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleChildNameChange = (index: number, value: string) => {
    const updatedChildren = [...formData.children];
    updatedChildren[index] = value;
    setFormData((prev) => ({ ...prev, children: updatedChildren }));
  };

  const addChild = () => {
    setFormData((prev) => ({ ...prev, children: [...prev.children, ""] }));
  };

  const removeChild = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      children: prev.children.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, shouldExit: boolean = false) => {
    if (e) e.preventDefault();
    if (!sessionToken) {
      setError("Session token not found");
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const response = await api.post(`/api/KycData/save-family/${sessionToken}`, {
        stepNumber: 4,
        data: {
          fatherName: formData.fatherName,
          motherName: formData.motherName,
          grandFatherName: formData.grandfatherName,
          spouseName: formData.spouseName,
          fatherInLawName: formData.fatherInLawName,
          motherInLawName: formData.motherInLawName,
          childrenNames: formData.children.filter(Boolean).join(",") || null,
        },
      });

      if (response.data.success) {
        if (shouldExit && onSaveAndExit) {
          onSaveAndExit();
        } else {
          onNext({ family: formData });
        }
      } else {
        setError(response.data.message || "Failed to save family section");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  // Show in-law, spouse, son, daughter fields if married
  const isMarried = String(maritalStatus || "").toLowerCase() === "married";

  return (
    <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-800">
          Section 3: Family Details
        </h2>
        <p className="text-sm text-gray-500">
          Provide details about your immediate family members.
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
            Grandfather's Name *
          </label>
          <input
            type="text"
            name="grandfatherName"
            value={formData.grandfatherName}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Father's Name *
          </label>
          <input
            type="text"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Mother's Name*
          </label>
          <input
            type="text"
            name="motherName"
            value={formData.motherName}
            onChange={handleChange}
            required
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
          />
        </div>

        {isMarried && (
          <>
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Spouse's Name
              </label>
              <input
                type="text"
                name="spouseName"
                value={formData.spouseName}
                onChange={handleChange}
                placeholder="Spouse Name"
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Father-in-law's Name
              </label>
              <input
                type="text"
                name="fatherInLawName"
                value={formData.fatherInLawName}
                onChange={handleChange}
                required
                placeholder="Father-in-law's Name"
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Mother-in-law's Name
              </label>
              <input
                type="text"
                name="motherInLawName"
                value={formData.motherInLawName}
                onChange={handleChange}
                required
                placeholder="Mother-in-law's Name"
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="col-span-2 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-bold text-indigo-900">
                  Children Details
                </label>
                <button
                  type="button"
                  onClick={addChild}
                  className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Child
                </button>
              </div>
              <div className="space-y-3">
                {formData.children.map((child: any, index: number) => (
                  <div key={index} className="flex gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
                    <input
                      type="text"
                      value={child}
                      onChange={(e) => handleChildNameChange(index, e.target.value)}
                      placeholder={`Child ${index + 1} Name`}
                      className="flex-1 p-2 border border-indigo-200 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => removeChild(index)}
                      className="text-red-500 hover:text-red-700 p-2 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {formData.children.length === 0 && (
                  <p className="text-xs text-indigo-400 italic">No children added yet. Click 'Add Child' to provide names.</p>
                )}
              </div>
            </div>
          </>
        )}
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

export default KycFamily;
