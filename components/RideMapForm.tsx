"use client";

import { useState, useCallback, useEffect } from "react";
import { Map } from "@/components/Map";
import { geocode, reverseGeocode } from "@/lib/map-utils";

const DEFAULT_CENTER: [number, number] = [37.8719, -122.2585]; // Berkeley area; change to your campus

interface RideMapFormProps {
  startLocation: string;
  destination: string;
  startLat?: number;
  startLng?: number;
  destLat?: number;
  destLng?: number;
  onStartChange: (value: string, lat?: number, lng?: number) => void;
  onDestinationChange: (value: string, lat?: number, lng?: number) => void;
  disabled?: boolean;
}

export function RideMapForm({
  startLocation,
  destination,
  startLat,
  startLng,
  destLat,
  destLng,
  onStartChange,
  onDestinationChange,
  disabled,
}: RideMapFormProps) {
  const [startCoords, setStartCoords] = useState<{ lat: number; lng: number } | null>(() =>
    startLat != null && startLng != null ? { lat: startLat, lng: startLng } : null
  );
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(() =>
    destLat != null && destLng != null ? { lat: destLat, lng: destLng } : null
  );
  const [route, setRoute] = useState<[number, number][] | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodeLoading, setGeocodeLoading] = useState<"start" | "dest" | null>(null);
  const [pinMode, setPinMode] = useState<"start" | "dest" | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  useEffect(() => {
    if (startLat != null && startLng != null) setStartCoords({ lat: startLat, lng: startLng });
    else if (!startLocation.trim()) setStartCoords(null);
  }, [startLat, startLng, startLocation]);
  useEffect(() => {
    if (destLat != null && destLng != null) setDestCoords({ lat: destLat, lng: destLng });
    else if (!destination.trim()) setDestCoords(null);
  }, [destLat, destLng, destination]);

  const updateStartFromGeocode = useCallback(async () => {
    if (!startLocation.trim()) return;
    setGeocodeLoading("start");
    const r = await geocode(startLocation.trim());
    setGeocodeLoading(null);
    if (r) {
      setStartCoords({ lat: r.lat, lng: r.lng });
      onStartChange(startLocation.trim(), r.lat, r.lng);
    }
  }, [startLocation, onStartChange]);

  const updateDestFromGeocode = useCallback(async () => {
    if (!destination.trim()) return;
    setGeocodeLoading("dest");
    const r = await geocode(destination.trim());
    setGeocodeLoading(null);
    if (r) {
      setDestCoords({ lat: r.lat, lng: r.lng });
      onDestinationChange(destination.trim(), r.lat, r.lng);
    }
  }, [destination, onDestinationChange]);

  useEffect(() => {
    if (startLocation.trim() && !startCoords) updateStartFromGeocode();
  }, [startLocation]);

  useEffect(() => {
    if (destination.trim() && !destCoords) updateDestFromGeocode();
  }, [destination]);

  // Always draw a single line connecting the two pins (OSRM can fail or return broken routes for long/cross-water trips).
  useEffect(() => {
    if (startCoords && destCoords) {
      const straightLine: [number, number][] = [
        [startCoords.lng, startCoords.lat],
        [destCoords.lng, destCoords.lat],
      ];
      setRoute(straightLine);
    } else {
      setRoute(null);
    }
  }, [startCoords, destCoords]);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setGeocodeLoading("start");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserLocation({ lat, lng });
        setStartCoords({ lat, lng });
        const name = await reverseGeocode(lat, lng);
        onStartChange(name?.trim() || "My location", lat, lng);
        setGeocodeLoading(null);
      },
      () => setGeocodeLoading(null)
    );
  }, [onStartChange]);

  const setAddressFromCoords = useCallback(
    async (lat: number, lng: number, isStart: boolean) => {
      const name = await reverseGeocode(lat, lng);
      const displayName = name?.trim() || "Pinned location";
      if (isStart) {
        setStartCoords({ lat, lng });
        onStartChange(displayName, lat, lng);
      } else {
        setDestCoords({ lat, lng });
        onDestinationChange(displayName, lat, lng);
      }
    },
    [onStartChange, onDestinationChange]
  );

  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      if (!pinMode) return;
      setPinLoading(true);
      await setAddressFromCoords(lat, lng, pinMode === "start");
      setPinLoading(false);
      setPinMode(null);
    },
    [pinMode, setAddressFromCoords]
  );

  const handleStartDragEnd = useCallback(
    async (lat: number, lng: number) => {
      setPinLoading(true);
      await setAddressFromCoords(lat, lng, true);
      setPinLoading(false);
    },
    [setAddressFromCoords]
  );

  const handleDestDragEnd = useCallback(
    async (lat: number, lng: number) => {
      setPinLoading(true);
      await setAddressFromCoords(lat, lng, false);
      setPinLoading(false);
    },
    [setAddressFromCoords]
  );

  const markers: { lat: number; lng: number; label: string; id?: string; draggable?: boolean; onDragEnd?: (lat: number, lng: number) => void }[] = [];
  if (startCoords) {
    markers.push({
      lat: startCoords.lat,
      lng: startCoords.lng,
      label: "Start – drag to adjust",
      id: "start",
      draggable: true,
      onDragEnd: handleStartDragEnd,
    });
  }
  if (destCoords) {
    markers.push({
      lat: destCoords.lat,
      lng: destCoords.lng,
      label: "Destination – drag to adjust",
      id: "dest",
      draggable: true,
      onDragEnd: handleDestDragEnd,
    });
  }

  const center: [number, number] =
    startCoords && destCoords
      ? [(startCoords.lat + destCoords.lat) / 2, (startCoords.lng + destCoords.lng) / 2]
      : startCoords
        ? [startCoords.lat, startCoords.lng]
        : destCoords
          ? [destCoords.lat, destCoords.lng]
          : DEFAULT_CENTER;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={updateStartFromGeocode}
          disabled={disabled || !startLocation.trim() || geocodeLoading === "start"}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {geocodeLoading === "start" ? "Searching…" : "Show start on map"}
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={disabled}
          className="rounded-lg border border-teal-300 px-3 py-1.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
        >
          Use my location
        </button>
        <button
          type="button"
          onClick={() => setPinMode((m) => (m === "start" ? null : "start"))}
          disabled={disabled || pinLoading}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
            pinMode === "start"
              ? "border-teal-500 bg-teal-100 text-teal-800"
              : "border-stone-300 text-stone-700 hover:bg-stone-50"
          }`}
        >
          {pinMode === "start" ? "Click map to set start (click again to cancel)" : "Pin start on map"}
        </button>
        <button
          type="button"
          onClick={updateDestFromGeocode}
          disabled={disabled || !destination.trim() || geocodeLoading === "dest"}
          className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {geocodeLoading === "dest" ? "Searching…" : "Show destination on map"}
        </button>
        <button
          type="button"
          onClick={() => setPinMode((m) => (m === "dest" ? null : "dest"))}
          disabled={disabled || pinLoading}
          className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
            pinMode === "dest"
              ? "border-teal-500 bg-teal-100 text-teal-800"
              : "border-stone-300 text-stone-700 hover:bg-stone-50"
          }`}
        >
          {pinMode === "dest" ? "Click map to set destination (click again to cancel)" : "Pin destination on map"}
        </button>
      </div>
      {pinMode && (
        <p className="text-sm text-teal-700">
          Click the map to set the {pinMode === "start" ? "start" : "destination"} address, or drag the pin after placing it to fine-tune.
        </p>
      )}
      {(pinLoading || geocodeLoading) && <p className="text-sm text-stone-500">Getting address…</p>}
      {(startCoords || destCoords) && !pinLoading && !geocodeLoading && (
        <p className="text-sm text-stone-500">Drag a pin on the map to update the saved address.</p>
      )}
      <Map
        center={center}
        zoom={12}
        markers={markers}
        polyline={route ?? undefined}
        userLocation={userLocation}
        onMapClick={handleMapClick}
        clickToPin={pinMode !== null}
        height="280px"
        className="rounded-xl overflow-hidden border border-stone-200"
      />
    </div>
  );
}
