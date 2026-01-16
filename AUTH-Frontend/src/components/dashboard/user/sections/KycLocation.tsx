import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useAuth } from "../../../../context/AuthContext";

interface KycLocationProps {
  sessionId: number | null;
  initialData?: any;
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
  onNext,
  onBack,
}) => {
  const { token, apiBase } = useAuth();

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!sessionId) {
      setError("Session not initialized");
      return;
    }
    setSaving(true);
    setError(null);

    try {
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
        <label className="text-sm font-semibold text-gray-700 mb-2 block">
          Pin Location on Map
        </label>
        <MapContainer
          {...({
            center: defaultPosition,
            zoom: 13,
            style: { height: "300px", width: "100%" },
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
