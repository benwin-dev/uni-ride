"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Map } from "@/components/Map";
import type { Ride } from "@/lib/types";
import { geocode, getDistanceFromUser, haversineKm } from "@/lib/map-utils";

const DEFAULT_CENTER: [number, number] = [37.8719, -122.2585];

interface DashboardRidesMapProps {
  rides: Ride[];
  onSelectRide: (rideId: string) => void;
  selectedRideId: string | null;
}

interface ResolvedCoords {
  start: { lat: number; lng: number };
  dest: { lat: number; lng: number };
}

export function DashboardRidesMap({ rides, onSelectRide, selectedRideId }: DashboardRidesMapProps) {
  const [mapSearch, setMapSearch] = useState("");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [coordsCache, setCoordsCache] = useState<Record<string, ResolvedCoords>>({});
  const [distanceCache, setDistanceCache] = useState<Record<string, { distanceKm: number; durationMin: number }>>({});
  const [loadingTime, setLoadingTime] = useState(false);

  // Only show rides that match the search (e.g. "Walmart" → only Walmart destinations/starts)
  const ridesFilteredBySearch = useMemo(() => {
    const q = mapSearch.trim().toLowerCase();
    if (!q) return []; // show nothing until user types a destination/start to filter
    return rides.filter(
      (r) =>
        r.destination.toLowerCase().includes(q) ||
        r.startLocation.toLowerCase().includes(q)
    );
  }, [rides, mapSearch]);

  const resolveCoords = useCallback(async (ride: Ride): Promise<ResolvedCoords | null> => {
    const start =
      ride.startLat != null && ride.startLng != null
        ? { lat: ride.startLat, lng: ride.startLng }
        : await geocode(ride.startLocation).then((r) => (r ? { lat: r.lat, lng: r.lng } : null));
    const dest =
      ride.destLat != null && ride.destLng != null
        ? { lat: ride.destLat, lng: ride.destLng }
        : await geocode(ride.destination).then((r) => (r ? { lat: r.lat, lng: r.lng } : null));
    if (!start || !dest) return null;
    return { start, dest };
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    ridesFilteredBySearch.forEach(async (ride) => {
      if (coordsCache[ride.id]) return;
      const coords = await resolveCoords(ride);
      if (cancelled || !coords) return;
      setCoordsCache((prev) => ({ ...prev, [ride.id]: coords }));
    });
    return () => {
      cancelled = true;
    };
  }, [ridesFilteredBySearch, resolveCoords, coordsCache]);

  useEffect(() => {
    if (!userLocation) return;
    queueMicrotask(() => setLoadingTime(true));
    const run = async () => {
      const updates: Record<string, { distanceKm: number; durationMin: number }> = {};
      for (const ride of ridesFilteredBySearch) {
        const coords = coordsCache[ride.id];
        if (!coords) continue;
        const d = await getDistanceFromUser(
          userLocation.lat,
          userLocation.lng,
          coords.start.lat,
          coords.start.lng
        );
        if (d) updates[ride.id] = d;
      }
      setDistanceCache((prev) => ({ ...prev, ...updates }));
      setLoadingTime(false);
    };
    run();
  }, [userLocation, ridesFilteredBySearch, coordsCache]);

  const ridesWithDistance = useMemo(() => {
    return ridesFilteredBySearch
      .map((ride) => {
        const coords = coordsCache[ride.id];
        const haversineKm_ =
          userLocation && coords
            ? haversineKm(userLocation.lat, userLocation.lng, coords.start.lat, coords.start.lng)
            : null;
        const fromApi = distanceCache[ride.id];
        const distanceKm = fromApi?.distanceKm ?? haversineKm_ ?? null;
        const durationMin = fromApi?.durationMin ?? null;
        return { ride, coords, distanceKm, durationMin };
      })
      .filter((r) => r.coords != null) as {
        ride: Ride;
        coords: ResolvedCoords;
        distanceKm: number | null;
        durationMin: number | null;
      }[];
  }, [ridesFilteredBySearch, coordsCache, userLocation, distanceCache]);

  const sortedRides = useMemo(() => {
    const list = [...ridesWithDistance];
    if (userLocation) {
      list.sort((a, b) => (a.durationMin ?? Infinity) - (b.durationMin ?? Infinity));
    }
    return list;
  }, [ridesWithDistance, userLocation]);

  // Only starting points (no routes, no destination pins) so people can see which start is closer to them
  const markers = useMemo(() => {
    return ridesWithDistance.map(({ ride, coords }) => ({
      lat: coords.start.lat,
      lng: coords.start.lng,
      label: `${ride.startLocation} → ${ride.destination}`,
      id: ride.id,
    }));
  }, [ridesWithDistance]);

  const center: [number, number] = useMemo(() => {
    const points = markers.map((m) => [m.lat, m.lng] as const);
    if (userLocation) points.push([userLocation.lat, userLocation.lng]);
    if (points.length === 0) return DEFAULT_CENTER;
    const sumLat = points.reduce((s, p) => s + p[0], 0);
    const sumLng = points.reduce((s, p) => s + p[1], 0);
    return [sumLat / points.length, sumLng / points.length];
  }, [markers, userLocation]);

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="rounded-xl border border-stone-200/80 bg-white p-3">
        <label htmlFor="map-search" className="sr-only">
          Search rides by destination or start point
        </label>
        <input
          id="map-search"
          type="search"
          value={mapSearch}
          onChange={(e) => setMapSearch(e.target.value)}
          placeholder="Type a destination or start (e.g. Walmart) to see rides on the map"
          className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          aria-label="Search by destination or start point to see matching rides"
        />
        {!mapSearch.trim() ? (
          <p className="mt-1.5 text-xs text-stone-500">
            Type a destination or starting point above to see only those rides on the map and choose one.
          </p>
        ) : ridesFilteredBySearch.length === 0 ? (
          <p className="mt-1.5 text-sm text-stone-600">
            No rides match “{mapSearch.trim()}”. Try another destination or start.
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-stone-500">
            Showing {ridesFilteredBySearch.length} ride{ridesFilteredBySearch.length !== 1 ? "s" : ""} matching “{mapSearch.trim()}”
          </p>
        )}
      </div>

      {mapSearch.trim() && ridesFilteredBySearch.length === 0 ? (
        <div className="rounded-xl border border-stone-200/80 bg-stone-50 p-8 text-center">
          <p className="text-stone-600">No rides match “{mapSearch.trim()}”.</p>
          <p className="mt-1 text-sm text-stone-500">Change the search above to see rides on the map.</p>
        </div>
      ) : (
      <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex-1 overflow-hidden rounded-xl border border-stone-200/80 bg-white">
        <Map
          center={center}
          zoom={11}
          markers={markers}
          onMarkerClick={(id) => onSelectRide(id)}
          height="420px"
          className="rounded-xl"
        />
      </div>
      <div className="w-full lg:w-80 shrink-0 space-y-3 rounded-xl border border-stone-200/80 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-stone-700">
            Rides matching “{mapSearch.trim()}”
          </span>
          {ridesFilteredBySearch.length > 0 && (
            <span className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs text-stone-600">
              {loadingTime ? "Finding best nearby match…" : "Sorted by best nearby match"}
            </span>
          )}
        </div>
        {!mapSearch.trim() ? (
          <p className="text-sm text-stone-500 py-4">
            Enter a destination or starting point in the search above (e.g. Walmart) to see only those rides on the map and pick one.
          </p>
        ) : (
        <>
        <ul className="max-h-[320px] space-y-2 overflow-y-auto">
          {sortedRides.map(({ ride, distanceKm, durationMin }, index) => (
            <li key={ride.id}>
              <button
                type="button"
                onClick={() => onSelectRide(ride.id)}
                className={`w-full rounded-lg border px-3 py-2.5 text-left text-sm transition ${
                  selectedRideId === ride.id
                    ? "border-teal-500 bg-teal-50 text-stone-900"
                    : "border-stone-200 bg-white hover:border-teal-200 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-900">{ride.destination}</span>
                  {userLocation && index === 0 && durationMin != null && (
                    <span className="rounded bg-teal-100 px-1.5 py-0.5 text-xs font-medium text-teal-700">
                      Best nearby match
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-xs text-stone-500">
                  {ride.startLocation} → {ride.date} {ride.time}
                </div>
                {(distanceKm != null || durationMin != null) && (
                  <div className="mt-1 text-xs text-teal-700">
                    {distanceKm != null && `~${distanceKm.toFixed(1)} km from you`}
                    {distanceKm != null && durationMin != null && " · "}
                    {durationMin != null && `~${Math.round(durationMin)} min drive`}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
        {ridesFilteredBySearch.length > 0 && sortedRides.length === 0 && (
          <p className="text-sm text-stone-500">Resolving locations for map…</p>
        )}
        </>
        )}
      </div>
      </div>
      )}
    </div>
  );
}
