"use client";

import { useEffect, useState } from "react";
import type { Ride } from "@/lib/types";
import {
  estimateCO2SavedByJoining,
  rideNeedsDistanceEstimate,
} from "@/lib/carbon-utils";

interface RideDetailModalProps {
  ride: Ride | null;
  currentUserId: string;
  onClose: () => void;
  onJoin: (rideId: string) => void;
  onLeave?: (rideId: string) => void;
  onOpenChat?: () => void;
  joinSuccess: boolean | null;
  onDismissSuccess: () => void;
}

export function RideDetailModal({
  ride,
  currentUserId,
  onClose,
  onJoin,
  onLeave,
  onOpenChat,
  joinSuccess,
  onDismissSuccess,
}: RideDetailModalProps) {
  const isFull = ride ? ride.status === "full" || ride.availableSeats <= 0 : false;
  const alreadyJoined = ride?.joinedUserIds.includes(currentUserId) ?? false;
  const isInRide = ride && (ride.createdByUserId === currentUserId || alreadyJoined);

  const [estimatedCarbon, setEstimatedCarbon] = useState<number | null>(null);
  const [carbonLoading, setCarbonLoading] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  useEffect(() => {
    if (!ride || !joinSuccess || !rideNeedsDistanceEstimate(ride)) {
      setEstimatedCarbon(null);
      return;
    }
    let cancelled = false;
    setCarbonLoading(true);
    setEstimatedCarbon(null);
    fetch("/api/rides/estimate-distance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startLocation: ride.startLocation,
        destination: ride.destination,
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && typeof data.kgCO2Saved === "number") {
          setEstimatedCarbon(data.kgCO2Saved);
        }
      })
      .finally(() => {
        if (!cancelled) setCarbonLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ride?.id, joinSuccess, ride?.startLocation, ride?.destination]);

  const carbonDisplay =
    joinSuccess && ride
      ? estimatedCarbon != null
        ? estimatedCarbon
        : carbonLoading
          ? null
          : estimateCO2SavedByJoining(ride).kgCO2Saved
      : null;

  if (!ride) return null;

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-stone-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ride-detail-title"
    >
      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="ride-detail-title" className="text-xl font-semibold text-stone-900">
            {ride.destination}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label="Close"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        {joinSuccess === true && (
          <div className="mt-4 rounded-lg bg-emerald-50 p-4 text-emerald-800">
            <p className="font-medium">You have booked successfully.</p>
            <p className="mt-2 text-sm">
              {carbonDisplay != null ? (
                <>
                  You’ve saved approximately{" "}
                  <strong>{carbonDisplay} kg CO₂</strong> by sharing this
                  ride-one fewer car on the road.
                </>
              ) : carbonLoading ? (
                <>Estimating your carbon impact…</>
              ) : (
                <>
                  You’ve saved approximately{" "}
                  <strong>{estimateCO2SavedByJoining(ride).kgCO2Saved} kg CO₂</strong> by
                  sharing this ride-one fewer car on the road.
                </>
              )}
            </p>
            <button
              type="button"
              onClick={onDismissSuccess}
              className="mt-2 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="text-stone-500">From</dt>
            <dd className="font-medium text-stone-900">{ride.startLocation}</dd>
          </div>
          <div>
            <dt className="text-stone-500">To</dt>
            <dd className="font-medium text-stone-900">{ride.destination}</dd>
          </div>
          <div className="flex gap-4">
            <div>
              <dt className="text-stone-500">Date</dt>
              <dd className="font-medium text-stone-900">{ride.date}</dd>
            </div>
            <div>
              <dt className="text-stone-500">Time</dt>
              <dd className="font-medium text-stone-900">{ride.time}</dd>
            </div>
          </div>
          {ride.note && (
            <div>
              <dt className="text-stone-500">Note</dt>
              <dd className="text-stone-700">{ride.note}</dd>
            </div>
          )}
          <div className="flex gap-4">
            <div>
              <dt className="text-stone-500">Seats</dt>
              <dd className="font-medium text-stone-900">
                {ride.availableSeats} of {ride.totalSeats} available
              </dd>
            </div>
            <div>
              <dt className="text-stone-500">Price</dt>
              <dd className="font-medium text-stone-900">
                {ride.isFree ? "Free" : `$${ride.price}`}
              </dd>
            </div>
          </div>
          <div>
            <dt className="text-stone-500">Ride by</dt>
            <dd className="font-medium text-stone-900">{ride.creatorName}</dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          {alreadyJoined ? (
            <>
              <span className="rounded-lg bg-teal-100 px-4 py-2.5 text-sm font-medium text-teal-800">
                You joined this ride
              </span>
              {onLeave && (ride.status === "active" || ride.status === "full") && (
                <button
                  type="button"
                  onClick={() => onLeave(ride.id)}
                  className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50"
                >
                  Leave ride
                </button>
              )}
            </>
          ) : isFull ? (
            <span className="rounded-lg bg-amber-100 px-4 py-2.5 text-sm font-medium text-amber-800">
              Seats Full
            </span>
          ) : ride.createdByUserId === currentUserId ? (
            <span className="rounded-lg bg-stone-100 px-4 py-2.5 text-sm text-stone-600">
              Your ride
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onJoin(ride.id)}
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Join ride
            </button>
          )}
          {isInRide && onOpenChat && (
            <button
              type="button"
              onClick={() => { onOpenChat(); onClose(); }}
              className="rounded-lg border border-teal-300 px-4 py-2.5 text-sm font-medium text-teal-700 hover:bg-teal-50"
            >
              Open chat
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
