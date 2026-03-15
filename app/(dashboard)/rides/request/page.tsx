"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRideRequests } from "@/context/RideRequestsContext";
import { RideMapForm } from "@/components/RideMapForm";
import { LocationSearchInput } from "@/components/LocationSearchInput";
import { geocode } from "@/lib/map-utils";

export default function RequestRidePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addRequest } = useRideRequests();
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [resolvingLocations, setResolvingLocations] = useState(false);
  const [form, setForm] = useState({
    startLocation: "",
    destination: "",
    startLat: undefined as number | undefined,
    startLng: undefined as number | undefined,
    destLat: undefined as number | undefined,
    destLng: undefined as number | undefined,
    date: "",
    time: "",
    note: "",
    seatsNeeded: "1",
    maxPrice: "",
  });

  const seatsNeeded = Math.max(1, parseInt(form.seatsNeeded, 10) || 1);
  const maxPrice = form.maxPrice === "" ? undefined : Number(form.maxPrice);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) return;
    if (!form.startLocation.trim() || !form.destination.trim() || !form.date || !form.time) {
      setError("Please fill in start location, destination, date, and time.");
      return;
    }

    setResolvingLocations(true);
    let startLat = form.startLat;
    let startLng = form.startLng;
    let destLat = form.destLat;
    let destLng = form.destLng;

    if (startLat == null || startLng == null) {
      const startResolved = await geocode(form.startLocation.trim());
      if (startResolved) {
        startLat = startResolved.lat;
        startLng = startResolved.lng;
      }
    }
    if (destLat == null || destLng == null) {
      const destResolved = await geocode(form.destination.trim());
      if (destResolved) {
        destLat = destResolved.lat;
        destLng = destResolved.lng;
      }
    }
    setResolvingLocations(false);

    if (startLat == null || startLng == null || destLat == null || destLng == null) {
      setError("Please choose start and destination from suggestions, or pin both points on the map.");
      return;
    }

    setForm((f) => ({ ...f, startLat, startLng, destLat, destLng }));

    try {
      await addRequest({
        createdByUserId: user.id,
        requesterName: user.name,
        requesterEmail: user.email,
        startLocation: form.startLocation.trim(),
        destination: form.destination.trim(),
        startLat,
        startLng,
        destLat,
        destLng,
        date: form.date,
        time: form.time,
        note: form.note.trim() || undefined,
        seatsNeeded,
        maxPrice: maxPrice ?? 0,
        status: "open",
        offeredByUserIds: [],
      });
      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post request.");
    }
  };

  if (success) {
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="font-semibold text-emerald-800">Ride request posted successfully.</p>
          <p className="mt-2 text-sm text-emerald-700">Others can see it on the dashboard. Redirecting…</p>
          <Link href="/dashboard" className="mt-4 inline-block text-sm font-medium text-emerald-700 underline">
            Go to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <section className="rounded-2xl border border-emerald-100 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Request a ride</h1>
              <p className="mt-1 text-stone-600">Looking for a ride? Post your request so drivers can find you.</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Need a lift
            </span>
          </div>
          <p className="mt-3 rounded-lg bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800">
            Add precise locations so nearby drivers can match quickly.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-sm">
          {error && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700">Start location *</label>
            <LocationSearchInput
              value={form.startLocation}
              onChange={(value, lat, lng) =>
                setForm((f) => ({ ...f, startLocation: value, startLat: lat, startLng: lng }))
              }
              placeholder="Type to search places (suggestions near you)"
              aria-label="Start location"
              nearLat={currentLocation?.lat}
              nearLng={currentLocation?.lng}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Destination *</label>
            <LocationSearchInput
              value={form.destination}
              onChange={(value, lat, lng) =>
                setForm((f) => ({ ...f, destination: value, destLat: lat, destLng: lng }))
              }
              placeholder="e.g. Walmart, Airport (suggestions near you)"
              aria-label="Destination"
              nearLat={currentLocation?.lat}
              nearLng={currentLocation?.lng}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Map – see your route</label>
            <RideMapForm
              startLocation={form.startLocation}
              destination={form.destination}
              startLat={form.startLat}
              startLng={form.startLng}
              destLat={form.destLat}
              destLng={form.destLng}
              onStartChange={(value, lat, lng) =>
                setForm((f) => ({ ...f, startLocation: value, startLat: lat, startLng: lng }))
              }
              onDestinationChange={(value, lat, lng) =>
                setForm((f) => ({ ...f, destination: value, destLat: lat, destLng: lng }))
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700">Date *</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Time *</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Note</label>
            <textarea
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Optional details for drivers"
              rows={3}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700">Seats needed</label>
              <input
                type="number"
                min={1}
                value={form.seatsNeeded}
                onChange={(e) => setForm((f) => ({ ...f, seatsNeeded: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Max price ($, optional)</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.maxPrice}
                onChange={(e) => setForm((f) => ({ ...f, maxPrice: e.target.value }))}
                placeholder="Any"
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={resolvingLocations}
              className="rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white transition hover:bg-emerald-700"
            >
              {resolvingLocations ? "Resolving locations..." : "Post request"}
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg border border-stone-300 px-4 py-2.5 font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
