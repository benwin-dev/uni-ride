"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRides } from "@/context/RidesContext";

export default function EditRidePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  const { getRideById, updateRide } = useRides();
  const ride = id ? getRideById(id) : undefined;
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    startLocation: "",
    destination: "",
    date: "",
    time: "",
    note: "",
    price: "",
    availableSeats: "",
    totalSeats: "",
  });

  useEffect(() => {
    if (ride && user && ride.createdByUserId !== user.id) {
      router.replace("/rides/my-rides");
      return;
    }
    if (ride) {
      setForm({
        startLocation: ride.startLocation,
        destination: ride.destination,
        date: ride.date,
        time: ride.time,
        note: ride.note ?? "",
        price: ride.price.toString(),
        availableSeats: ride.availableSeats.toString(),
        totalSeats: ride.totalSeats.toString(),
      });
    }
  }, [ride, user, router]);

  if (!id || !ride) {
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-md text-center">
          <p className="text-stone-500">Ride not found.</p>
          <Link href="/rides/my-rides" className="mt-4 inline-block text-teal-600 hover:underline">
            Back to My Rides
          </Link>
        </div>
      </div>
    );
  }

  if (ride.status === "cancelled" || ride.status === "completed") {
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-md rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
          <p className="text-amber-800">This ride can’t be edited (cancelled or completed).</p>
          <Link href="/rides/my-rides" className="mt-4 inline-block text-amber-700 underline">
            Back to My Rides
          </Link>
        </div>
      </div>
    );
  }

  const priceNum = form.price === "" ? 0 : Number(form.price);
  const availableSeats = Math.max(0, parseInt(form.availableSeats, 10) || 0);
  const totalSeats = Math.max(1, parseInt(form.totalSeats, 10) || 1);
  const seatsValid = availableSeats <= totalSeats && totalSeats >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.startLocation.trim() || !form.destination.trim() || !form.date || !form.time) {
      setError("Please fill in start location, destination, date, and time.");
      return;
    }
    if (!seatsValid) {
      setError("Available seats must be between 0 and total seats.");
      return;
    }
    updateRide(id, {
      startLocation: form.startLocation.trim(),
      destination: form.destination.trim(),
      date: form.date,
      time: form.time,
      note: form.note.trim() || undefined,
      price: priceNum,
      isFree: priceNum === 0,
      availableSeats,
      totalSeats,
    });
    setSaved(true);
    setTimeout(() => router.push("/rides/my-rides"), 1200);
  };

  if (saved) {
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-md rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="font-semibold text-emerald-800">Ride updated.</p>
          <Link href="/rides/my-rides" className="mt-4 inline-block text-sm font-medium text-emerald-700 underline">
            Back to My Rides
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl font-bold text-stone-900">Edit ride</h1>
        <p className="mt-1 text-stone-600">{ride.destination}</p>

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
              className="mt-1 w-full rounded-lg border border-stone-300 px-4 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
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
              className="rounded-lg bg-teal-600 px-4 py-2.5 font-semibold text-white hover:bg-teal-700"
            >
              Save changes
            </button>
            <Link
              href="/rides/my-rides"
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
