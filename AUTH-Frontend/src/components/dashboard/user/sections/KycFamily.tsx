import React, { useState, useEffect } from "react";
import { useAuth } from "../../../../context/AuthContext";

interface KycFamilyProps {
  sessionId: number | null;
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
  sonName: string;
  daughterName: string;
  daughterInLawName: string;
  fatherInLawName: string;
  motherInLawName: string;
  [key: string]: any;
}

const KycFamily: React.FC<KycFamilyProps> = ({
  sessionId,
  initialData,
  onNext,
  onBack,
  maritalStatus,
  onSaveAndExit,
}) => {
  const { token, apiBase } = useAuth();

  const [formData, setFormData] = useState<KycFamilyData>({
    fatherName: initialData?.fatherName || initialData?.FatherName || "",
    motherName: initialData?.motherName || initialData?.MotherName || "",
    grandfatherName:
      initialData?.grandFatherName ||
      initialData?.GrandFatherName ||
      initialData?.grandfatherName ||
      "",
    spouseName: initialData?.spouseName || initialData?.SpouseName || "",
    sonName: initialData?.sonName || initialData?.SonName || "",
    daughterName: initialData?.daughterName || initialData?.DaughterName || "",
    daughterInLawName: initialData?.daughterInLawName || initialData?.DaughterInLawName || "",
    fatherInLawName:
      initialData?.fatherInLawName || initialData?.FatherInLawName || "",
    motherInLawName:
      initialData?.motherInLawName || initialData?.MotherInLawName || "",
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
        sonName: initialData?.sonName || initialData?.SonName || "",
        daughterName:
          initialData?.daughterName || initialData?.DaughterName || "",
        daughterInLawName: initialData?.daughterInLawName || initialData?.DaughterInLawName || "",
        fatherInLawName:
          initialData?.fatherInLawName || initialData?.FatherInLawName || "",
        motherInLawName:
          initialData?.motherInLawName || initialData?.MotherInLawName || "",
      });
    }
  }, [initialData]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isExiting, setIsExiting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement> | null, shouldExit: boolean = false) => {
    if (e) e.preventDefault();
    if (!sessionId) {
      setError("Session not initialized");
      return;
    }
    setSaving(true);
    setError(null);
    if (shouldExit) setIsExiting(true);

    try {
      const response = await fetch(`${apiBase}/api/KycData/save-family`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: sessionId,
          stepNumber: 4,
          data: {
            fatherName: formData.fatherName,
            motherName: formData.motherName,
            grandFatherName: formData.grandfatherName,
            spouseName: formData.spouseName,
            sonName: formData.sonName,
            daughterName: formData.daughterName,
            daughterInLawName: formData.daughterInLawName,
            fatherInLawName: formData.fatherInLawName,
            motherInLawName: formData.motherInLawName,
          },
        }),
      });

      if (response.ok) {
        if (shouldExit && onSaveAndExit) {
          onSaveAndExit();
        } else {
          onNext({ family: formData });
        }
      } else {
        setError("Failed to save family section");
        setIsExiting(false);
      }
    } catch (err) {
      setError("Network error while saving");
      setIsExiting(false);
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

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Son's Name
              </label>
              <input
                type="text"
                name="sonName"
                value={formData.sonName}
                onChange={handleChange}
                placeholder="Son's Name"
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Daughter's Name
              </label>
              <input
                type="text"
                name="daughterName"
                value={formData.daughterName}
                onChange={handleChange}
                placeholder="Daughter's Name"
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-700 mb-1">
                Daughter in-Law's Name
              </label>
              <input
                type="text"
                name="daughterInLawName"
                value={formData.daughterInLawName}
                onChange={handleChange}
                placeholder="Daughter in-Law's Name"
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
              />
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
