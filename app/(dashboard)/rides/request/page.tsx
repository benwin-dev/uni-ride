"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRideRequests } from "@/context/RideRequestsContext";

export default function RequestRidePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { addRequest } = useRideRequests();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    startLocation: "",
    destination: "",
    date: "",
    time: "",
    note: "",
    seatsNeeded: "1",
    maxPrice: "",
  });

  const seatsNeeded = Math.max(1, parseInt(form.seatsNeeded, 10) || 1);
  const maxPrice = form.maxPrice === "" ? undefined : Number(form.maxPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) return;
    if (!form.startLocation.trim() || !form.destination.trim() || !form.date || !form.time) {
      setError("Please fill in start location, destination, date, and time.");
      return;
    }
    addRequest({
      createdByUserId: user.id,
      requesterName: user.name,
      requesterEmail: user.email,
      startLocation: form.startLocation.trim(),
      destination: form.destination.trim(),
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
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-stone-900">Request a ride</h1>
        <p className="mt-1 text-stone-600">Looking for a ride? Post your request so drivers can find you.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5 rounded-xl border border-stone-200/80 bg-white p-6">
          {error && (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-stone-700">Start location *</label>
            <input
              type="text"
              value={form.startLocation}
              onChange={(e) => setForm((f) => ({ ...f, startLocation: e.target.value }))}
              placeholder="e.g. Campus Main Gate"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Destination *</label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => setForm((f) => ({ ...f, destination: e.target.value }))}
              placeholder="e.g. Walmart, Airport"
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              required
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
              className="rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700"
            >
              Post request
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
