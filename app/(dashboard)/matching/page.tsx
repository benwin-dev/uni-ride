"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRides } from "@/context/RidesContext";
import { useRideRequests } from "@/context/RideRequestsContext";
import { getTopMatches } from "@/lib/matching-utils";
import { estimateCO2SavedByJoining } from "@/lib/carbon-utils";
import type { Ride, RideRequest } from "@/lib/types";

interface MatchResult {
  ride: Ride;
  detourKm: number;
  efficiency: number;
  dateMatch: boolean;
  timeMatch: boolean;
  explanation?: string;
}

export default function MatchingPage() {
  const { user, addCO2Saved } = useAuth();
  const { rides, getRideById, joinRide } = useRides();
  const { openRequests, getRequestById } = useRideRequests();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<{ rideId: string; kgCO2Saved: number } | null>(null);

  const selectedRequest = selectedRequestId
    ? getRequestById(selectedRequestId) ?? openRequests.find((r) => r.id === selectedRequestId)
    : null;

  const fetchMatches = useCallback(
    async (requestId: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/matching?requestId=${encodeURIComponent(requestId)}`);
        const data = await res.json();
        if (res.ok && data.matches) {
          setMatches(data.matches);
          return;
        }
        if (res.status === 503 || res.status === 400) {
          const req = getRequestById(requestId) ?? openRequests.find((r) => r.id === requestId);
          if (req) {
            const top = getTopMatches(rides, req, 3);
            setMatches(
              top.map((m) => ({
                ride: m.ride,
                detourKm: m.detourKm,
                efficiency: m.efficiency,
                dateMatch: m.dateMatch,
                timeMatch: m.timeMatch,
                explanation: `Low detour (${Math.round(m.detourKm)} km); same date & time.`,
              }))
            );
            return;
          }
        }
        setMatches([]);
        setError(data?.error ?? "Could not load matches.");
      } catch (e) {
        const req = getRequestById(requestId) ?? openRequests.find((r) => r.id === requestId);
        if (req) {
          const top = getTopMatches(rides, req, 3);
          setMatches(
            top.map((m) => ({
              ride: m.ride,
              detourKm: m.detourKm,
              efficiency: m.efficiency,
              dateMatch: m.dateMatch,
              timeMatch: m.timeMatch,
              explanation: `Low detour (${Math.round(m.detourKm)} km); same date & time.`,
            }))
          );
        } else {
          setMatches([]);
          setError(e instanceof Error ? e.message : "Failed to load matches.");
        }
      } finally {
        setLoading(false);
      }
    },
    [rides, openRequests, getRequestById]
  );

  useEffect(() => {
    if (!selectedRequestId) {
      setMatches([]);
      setError(null);
      return;
    }
    fetchMatches(selectedRequestId);
  }, [selectedRequestId, fetchMatches]);

  const handleJoin = useCallback(
    (ride: Ride) => {
      if (!user) return;
      joinRide(ride.id, user.id);
      const { kgCO2Saved } = estimateCO2SavedByJoining(ride);
      addCO2Saved(kgCO2Saved);
      setJoinSuccess({ rideId: ride.id, kgCO2Saved });
    },
    [user, joinRide, addCO2Saved]
  );

  const dismissJoinSuccess = useCallback(() => setJoinSuccess(null), []);

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-stone-900">Smart Matching</h1>
        <p className="mt-1 text-stone-600">
          Select a ride request to see the best matching rides (by shortest detour and efficiency).
        </p>

        {joinSuccess && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
            <p className="font-medium">You have joined the ride successfully.</p>
            <p className="mt-2 text-sm">
              You&apos;ve saved approximately <strong>{joinSuccess.kgCO2Saved} kg CO₂</strong> by
              sharing this ride—one fewer car on the road.
            </p>
            <button
              type="button"
              onClick={dismissJoinSuccess}
              className="mt-2 text-sm font-medium underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <section className="mt-8">
          <h2 className="text-lg font-semibold text-stone-800">Open requests</h2>
          {openRequests.length === 0 ? (
            <p className="mt-2 text-sm text-stone-500">
              No open requests. <Link href="/rides/request" className="text-emerald-600 underline">Request a ride</Link> first.
            </p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {openRequests.map((req) => (
                <li key={req.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRequestId(selectedRequestId === req.id ? null : req.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      selectedRequestId === req.id
                        ? "border-emerald-400 bg-emerald-50 shadow-sm"
                        : "border-stone-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                    }`}
                  >
                    <span className="font-medium text-stone-900">{req.destination}</span>
                    <p className="mt-1 text-sm text-stone-500">
                      {req.startLocation} → {req.destination}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">
                      {req.date} {req.time} · {req.seatsNeeded} seat{req.seatsNeeded !== 1 ? "s" : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {selectedRequest && (
          <section className="mt-8 rounded-2xl border border-emerald-100 bg-white/95 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-stone-800">Selected request</h2>
            <div className="mt-3 rounded-xl bg-emerald-50/80 p-4">
              <p className="font-medium text-stone-900">
                {selectedRequest.startLocation} → {selectedRequest.destination}
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {selectedRequest.date} {selectedRequest.time} · {selectedRequest.requesterName}
              </p>
              {selectedRequest.note && (
                <p className="mt-2 text-sm text-stone-500">{selectedRequest.note}</p>
              )}
            </div>

            <h3 className="mt-6 text-lg font-semibold text-stone-800">Top matches</h3>
            {loading ? (
              <p className="mt-2 text-sm text-stone-500">Finding best rides…</p>
            ) : error && matches.length === 0 ? (
              <p className="mt-2 text-sm text-amber-700">{error}</p>
            ) : matches.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">
                No rides match this request (same date and time window). Check back later or create a ride.
              </p>
            ) : (
              <ul className="mt-3 space-y-4">
                {matches.map((m, i) => {
                  const ride = m.ride;
                  const isCreator = user && ride.createdByUserId === user.id;
                  const alreadyJoined = user && ride.joinedUserIds.includes(user.id);
                  const canJoin =
                    ride.status === "active" &&
                    ride.availableSeats >= selectedRequest.seatsNeeded &&
                    !isCreator &&
                    !alreadyJoined;
                  return (
                    <li
                      key={ride.id}
                      className="flex flex-col gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
                            #{i + 1}
                          </span>
                          <span className="font-medium text-stone-900">{ride.destination}</span>
                          {ride.isFree && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                              Free
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-stone-600">
                          {ride.startLocation} → {ride.destination}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {ride.date} {ride.time} · {ride.creatorName} · {ride.availableSeats} seat
                          {ride.availableSeats !== 1 ? "s" : ""} left
                        </p>
                        {m.explanation && (
                          <p className="mt-2 text-sm italic text-stone-600">&ldquo;{m.explanation}&rdquo;</p>
                        )}
                        <p className="mt-1 text-xs text-stone-400">
                          Detour {Math.round(m.detourKm)} km · {(m.efficiency * 100).toFixed(0)}% route fit
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Link
                          href={`/dashboard?rideId=${ride.id}`}
                          className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                        >
                          View
                        </Link>
                        {canJoin && (
                          <button
                            type="button"
                            onClick={() => handleJoin(ride)}
                            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                          >
                            Join ride
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
