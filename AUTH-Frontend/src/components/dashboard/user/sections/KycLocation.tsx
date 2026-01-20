import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import html2canvas from "html2canvas";
import { useAuth } from "../../../../context/AuthContext";
import { Camera, Upload, Check } from "lucide-react";

interface KycLocationProps {
  sessionId: number | null;
  initialData?: any;
  existingImageUrl?: string;
  onNext: (data: any) => void;
  onBack: () => void;
}

interface KycLocationData {
  landmark: string;
  distanceFromMainRoad: string;
  latitude: string;
  longitude: string;
  canvasDataJson: string;
  [key: string]: any;
}

const fetchNearestLandmarkAndRoad = async (lat: string, lng: string, apiBase: string) => {
  try {
    const response = await fetch(
      `${apiBase}/api/KycData/reverse-geocode?lat=${lat}&lon=${lng}`
    );
    const data = await response.json();
    // Try to get a landmark or display name
    const landmark =
      data?.namedetails?.name ||
      data?.address?.attraction ||
      data?.address?.building ||
      data?.address?.theatre ||
      data?.address?.place ||
      data?.address?.amenity ||
      data?.display_name?.split(",")[0] ||
      "";
    // Try to get the nearest road name
    const road =
      data?.address?.road ||
      data?.address?.pedestrian ||
      data?.address?.footway ||
      data?.address?.cycleway ||
      data?.address?.path ||
      "";
    return { landmark, road };
  } catch {
    return { landmark: "", road: "" };
  }
};

const LocationPicker: React.FC<{
  setCoords: (lat: string, lng: string) => void;
}> = ({ setCoords }) => {
  useMapEvents({
    click(e: any) {
      setCoords(e.latlng.lat.toString(), e.latlng.lng.toString());
    },
  });
  return null;
};

const KycLocation: React.FC<KycLocationProps> = ({
  sessionId,
  initialData,
  existingImageUrl,
  onNext,
  onBack,
}) => {
  const { token, apiBase } = useAuth();
  const [mapImageFile, setMapImageFile] = useState<File | null>(null);
  const [mapImageUrl, setMapImageUrl] = useState<string | null>(existingImageUrl || null);
  const [capturing, setCapturing] = useState(false);

  const [formData, setFormData] = useState<KycLocationData>({
    landmark: initialData?.landmark || "",
    distanceFromMainRoad: initialData?.distanceFromMainRoad || "",
    latitude: initialData?.latitude || "",
    longitude: initialData?.longitude || "",
    canvasDataJson: initialData?.canvasDataJson || "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        landmark: initialData?.landmark || "",
        distanceFromMainRoad: initialData?.distanceFromMainRoad || "",
        latitude: initialData?.latitude || "",
        longitude: initialData?.longitude || "",
        canvasDataJson: initialData?.canvasDataJson || "",
      });
    }
  }, [initialData]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoFilling, setAutoFilling] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const setCoords = async (lat: string, lng: string) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    setAutoFilling(true);
    const { landmark, road } = await fetchNearestLandmarkAndRoad(lat, lng, apiBase);
    setFormData((prev) => ({
      ...prev,
      landmark: landmark || prev.landmark,
      distanceFromMainRoad: road ? `Near ${road}` : prev.distanceFromMainRoad,
    }));
    setAutoFilling(false);
  };

  const captureMap = async () => {
    const mapElement = document.getElementById("kyc-map-container");
    if (!mapElement) return;

    setCapturing(true);
    try {
      // Small delay to ensure marker and tiles are settled
      await new Promise((r) => setTimeout(r, 500));

      const canvas = await html2canvas(mapElement, {
        useCORS: true,
        allowTaint: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `location_map_${sessionId}.png`, {
            type: "image/png",
          });
          setMapImageFile(file);
          setMapImageUrl(URL.createObjectURL(blob));
        }
      }, "image/png");
    } catch (err) {
      console.error("Failed to capture map", err);
      setError("Failed to capture map screenshot. Please upload manually.");
    } finally {
      setCapturing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMapImageFile(file);
      setMapImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionId) {
      setError("Session not initialized");
      return;
    }

    if (!mapImageFile && !initialData?.mapImageId) {
      setError("Please capture or upload a location map image.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Upload map image if new one exists
      if (mapImageFile) {
        const formDataUpload = new FormData();
        formDataUpload.append("sessionId", sessionId.toString());
        formDataUpload.append("documentType", "10"); // 10 = LocationMap
        formDataUpload.append("file", mapImageFile);

        const uploadRes = await fetch(`${apiBase}/api/KycData/upload-document`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataUpload,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload map image");
        }
      }

      // 2. Save location data
      const response = await fetch(`${apiBase}/api/KycData/save-location-map`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          sessionId: sessionId,
          stepNumber: 11,
          data: {
            landmark: formData.landmark,
            distanceFromMainRoad: formData.distanceFromMainRoad,
            latitude: formData.latitude,
            longitude: formData.longitude,
            canvasDataJson: formData.canvasDataJson,
          },
        }),
      });

      if (response.ok) {
        onNext({ locationMap: formData });
      } else {
        setError("Failed to save location map");
      }
    } catch (err) {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  };

  // Default map center (Nepal)
  const defaultPosition: [number, number] =
    formData.latitude && formData.longitude
      ? [parseFloat(formData.latitude), parseFloat(formData.longitude)]
      : [27.7172, 85.324];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="border-b border-gray-200 pb-4">
        <h2 className="text-xl font-bold text-gray-800">Location Map</h2>
        <p className="text-sm text-gray-500">
          Pin your residence location on the map.
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
            Nearest Landmark
          </label>
          <input
            type="text"
            name="landmark"
            value={formData.landmark}
            onChange={handleChange}
            placeholder="e.g. Near Kalanki Temple"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={autoFilling}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-700 mb-1">
            Distance from Main Road
          </label>
          <input
            type="text"
            name="distanceFromMainRoad"
            value={formData.distanceFromMainRoad}
            onChange={handleChange}
            placeholder="e.g. 500 meters"
            className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            disabled={autoFilling}
          />
        </div>
      </div>

      <div className="my-6">
        <div id="kyc-map-container" className="relative group">
          <MapContainer
            {...({
              center: defaultPosition,
              zoom: 13,
              style: { height: "300px", width: "100%", borderRadius: "12px" },
            } as any)}
          >
            <TileLayer
              {...({
                url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                attribution:
                  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
              } as any)}
            />
            <LocationPicker setCoords={setCoords} />
            {formData.latitude && formData.longitude ? (
              <Marker
                position={[
                  parseFloat(formData.latitude),
                  parseFloat(formData.longitude),
                ]}
              />
            ) : null}
          </MapContainer>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={captureMap}
            disabled={capturing || !formData.latitude}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold hover:bg-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-indigo-200"
          >
            {capturing ? (
              <div className="w-4 h-4 border-2 border-indigo-700 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Camera className="w-4 h-4" />
            )}
            {capturing ? "Capturing..." : "Capture Map Screenshot"}
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition-all cursor-pointer border border-gray-200">
            <Upload className="w-4 h-4" />
            Upload Map Manually
            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
          </label>
        </div>

        {mapImageUrl && (
          <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-3">
              <Check className="w-4 h-4" />
              Location Map Captured / Uploaded Successfully
            </div>
            <img src={mapImageUrl} alt="Captured Map" className="w-full max-w-md h-auto rounded-lg shadow-sm border border-emerald-200" />
            <p className="text-[10px] text-emerald-600 mt-2 italic font-medium">This map will be used in your bank recruitment forms.</p>
          </div>
        )}

        <div className="mt-2 text-xs text-gray-600">
          Click on the map to set your location.
          {autoFilling && (
            <span className="ml-2 text-indigo-600">Auto-filling fields...</span>
          )}
        </div>
        <div className="mt-2 flex gap-4">
          <div>
            <label className="text-xs font-semibold">Latitude:</label>
            <input
              type="text"
              name="latitude"
              value={formData.latitude}
              readOnly
              className="ml-2 p-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold">Longitude:</label>
            <input
              type="text"
              name="longitude"
              value={formData.longitude}
              readOnly
              className="ml-2 p-1 border rounded text-xs"
            />
          </div>
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

export default KycLocation;
