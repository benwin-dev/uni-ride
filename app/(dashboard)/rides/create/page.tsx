"use client";

import { useState, useEffect } from "react";
import { useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRides } from "@/context/RidesContext";
import { RideMapForm } from "@/components/RideMapForm";
import { LocationSearchInput } from "@/components/LocationSearchInput";
import { geocode } from "@/lib/map-utils";
import type { VoiceRidePayload } from "@/lib/types";

export default function CreateRidePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addRide } = useRides();
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
    price: "",
    availableSeats: "2",
    totalSeats: "3",
  });
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "recording" | "processing">("idle");
  const [voiceError, setVoiceError] = useState("");
  const [voiceJustPrefilled, setVoiceJustPrefilled] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const priceNum = form.price === "" ? 0 : Number(form.price);
  const isFree = priceNum === 0;
  const availableSeats = Math.max(0, parseInt(form.availableSeats, 10) || 0);
  const totalSeats = Math.max(1, parseInt(form.totalSeats, 10) || 1);
  const seatsValid = availableSeats <= totalSeats && totalSeats >= 1;

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCurrentLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

  const startVoiceRecording = useCallback(async () => {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setVoiceStatus("recording");
    } catch (err) {
      setVoiceError("Microphone access denied or unavailable.");
      setVoiceStatus("idle");
    }
  }, []);

  const stopVoiceRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || voiceStatus !== "recording") return;
    recorder.stop();
    mediaRecorderRef.current = null;
    setVoiceStatus("processing");

    const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
    try {
      const formData = new FormData();
      formData.append("audio", blob, "audio.webm");
      const res = await fetch("/api/rides/voice", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setVoiceError(data?.error ?? "Voice processing failed");
        setVoiceStatus("idle");
        return;
      }
      const ride = data.ride as VoiceRidePayload;
      setForm((f) => ({
        ...f,
        startLocation: ride.startLocation ?? "",
        destination: ride.destination ?? "",
        date: ride.date ?? "",
        time: ride.time ?? "",
        note: ride.note ?? "",
        price: ride.price != null ? String(ride.price) : "",
        availableSeats: String(ride.availableSeats ?? 2),
        totalSeats: String(ride.totalSeats ?? 3),
      }));
      setVoiceError("");
      setVoiceJustPrefilled(true);
      setTimeout(() => setVoiceJustPrefilled(false), 3000);
    } catch (err) {
      setVoiceError("Network or server error. Try again.");
    }
    setVoiceStatus("idle");
  }, [voiceStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) return;
    if (!form.startLocation.trim() || !form.destination.trim() || !form.date || !form.time) {
      setError("Please fill in start location, destination, date, and time.");
      return;
    }
    if (!seatsValid) {
      setError("Available seats must be between 0 and total seats.");
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

    addRide({
      createdByUserId: user.id,
      creatorName: user.name,
      creatorEmail: user.email,
      startLocation: form.startLocation.trim(),
      destination: form.destination.trim(),
      startLat,
      startLng,
      destLat,
      destLng,
      date: form.date,
      time: form.time,
      note: form.note.trim() || undefined,
      price: priceNum,
      isFree,
      availableSeats,
      totalSeats,
      status: "active",
      joinedUserIds: [],
    });
    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  };

  if (success) {
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="font-semibold text-emerald-800">Ride posted successfully.</p>
          <p className="mt-2 text-sm text-emerald-700">Redirecting to dashboard…</p>
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
              <h1 className="text-2xl font-bold text-stone-900">Create a ride</h1>
              <p className="mt-1 text-stone-600">Share your trip with your campus community.</p>
            </div>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Sustainable trip
            </span>
          </div>
          <p className="mt-3 rounded-lg bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800">
            Tip: choose exact pickup and drop points to help riders plan faster.
          </p>
        </section>

        <section className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4">
          <h2 className="text-sm font-semibold text-emerald-800">Create with voice</h2>
          <p className="mt-1 text-sm text-emerald-700">
            Say something like: &ldquo;Create a ride from Main Campus to Walmart tomorrow at 2pm with 2 seats available.&rdquo;
          </p>
          {voiceError && (
            <p className="mt-2 text-sm text-amber-700">{voiceError}</p>
          )}
          <div className="mt-3 flex items-center gap-3">
            {voiceStatus === "idle" && (
              <button
                type="button"
                onClick={startVoiceRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
              >
                <span aria-hidden>🎤</span>
                Start recording
              </button>
            )}
            {voiceStatus === "recording" && (
              <button
                type="button"
                onClick={stopVoiceRecording}
                className="inline-flex items-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-rose-700"
              >
                <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden />
                Stop & create from voice
              </button>
            )}
            {voiceStatus === "processing" && (
              <span className="text-sm text-emerald-700">Processing…</span>
            )}
          </div>
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
              autoSelectFirstWhenReady={voiceJustPrefilled}
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
              autoSelectFirstWhenReady={voiceJustPrefilled}
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
              placeholder="Optional details for riders"
              rows={3}
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Price ($)</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              placeholder="0 for free"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
            {isFree && (
              <p className="mt-1 text-sm text-stone-500">This ride will be shown as Free.</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-stone-700">Total seats</label>
              <input
                type="number"
                min={1}
                value={form.totalSeats}
                onChange={(e) => setForm((f) => ({ ...f, totalSeats: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Available seats</label>
              <input
                type="number"
                min={0}
                value={form.availableSeats}
                onChange={(e) => setForm((f) => ({ ...f, availableSeats: e.target.value }))}
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
              {resolvingLocations ? "Resolving locations..." : "Post Ride"}
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
