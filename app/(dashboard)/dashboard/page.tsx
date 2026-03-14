"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRides } from "@/context/RidesContext";
import { useRideRequests } from "@/context/RideRequestsContext";
import { RideCard } from "@/components/RideCard";
import { RequestCard } from "@/components/RequestCard";
import { RideDetailModal } from "@/components/RideDetailModal";
import type { RideFilters } from "@/lib/types";

type DashboardTab = "rides" | "requests";

export default function DashboardPage() {
  const { user } = useAuth();
  const { filteredRides, filters, setFilters, getRideById, joinRide, leaveRide } = useRides();
  const { openRequests, offerRide, removeOffer } = useRideRequests();
  const [tab, setTab] = useState<DashboardTab>("rides");
  const [detailRideId, setDetailRideId] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<boolean | null>(null);

  const detailRide = detailRideId ? getRideById(detailRideId) : null;

  const handleJoin = useCallback(
    (rideId: string) => {
      if (!user) return;
      joinRide(rideId, user.id);
      setJoinSuccess(true);
    },
    [user, joinRide]
  );

  const handleLeave = useCallback(
    (rideId: string) => {
      if (!user) return;
      leaveRide(rideId, user.id);
      setDetailRideId(null);
    },
    [user, leaveRide]
  );

  const openDetail = useCallback((id: string) => {
    setDetailRideId(id);
    setJoinSuccess(null);
  }, []);

  const closeDetail = useCallback(() => setDetailRideId(null), []);
  const dismissSuccess = useCallback(() => setJoinSuccess(null), []);

  const handleOfferRequest = useCallback(
    (requestId: string) => {
      if (!user) return;
      offerRide(requestId, user.id);
    },
    [user, offerRide]
  );

  const handleRemoveOffer = useCallback(
    (requestId: string) => {
      if (!user) return;
      removeOffer(requestId, user.id);
    },
    [user, removeOffer]
  );

  const updateFilter = useCallback(
    (key: keyof RideFilters, value: string | number | boolean | undefined) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [setFilters]
  );

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
            <p className="mt-1 text-stone-600">Find rides, request a ride, or create one.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/rides/create"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              Create Ride
            </Link>
            <Link
              href="/rides/request"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-teal-600 px-4 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
            >
              Request Ride
            </Link>
          </div>
        </div>

        <div className="mt-6 flex gap-1 rounded-lg border border-stone-200/80 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("rides")}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
              tab === "rides" ? "bg-teal-50 text-teal-700" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            Available rides ({filteredRides.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
              tab === "requests" ? "bg-teal-50 text-teal-700" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            Ride requests ({openRequests.length})
          </button>
        </div>

        {tab === "rides" && (
          <>
            <section className="mt-6 rounded-xl border border-stone-200/80 bg-white p-4">
              <h2 className="text-sm font-semibold text-stone-700">Filters</h2>
              <div className="mt-3 flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Destination search"
                  value={filters.destination ?? ""}
                  onChange={(e) => updateFilter("destination", e.target.value)}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <label className="flex items-center gap-2 text-sm text-stone-600">
                  <input
                    type="checkbox"
                    checked={filters.freeOnly ?? false}
                    onChange={(e) => updateFilter("freeOnly", e.target.checked)}
                    className="rounded border-stone-300 text-teal-600 focus:ring-teal-500"
                  />
                  Free only
                </label>
                <input
                  type="date"
                  value={filters.date ?? ""}
                  onChange={(e) => updateFilter("date", e.target.value || undefined)}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <select
                  value={filters.sortBy ?? "soonest"}
                  onChange={(e) =>
                    updateFilter(
                      "sortBy",
                      e.target.value as RideFilters["sortBy"]
                    )
                  }
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="soonest">Soonest</option>
                  <option value="price_asc">Lowest price</option>
                  <option value="price_desc">Highest price</option>
                  <option value="destination">Destination A–Z</option>
                </select>
                <input
                  type="number"
                  min={1}
                  placeholder="Min seats"
                  value={filters.minSeats ?? ""}
                  onChange={(e) =>
                    updateFilter("minSeats", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
                <input
                  type="number"
                  min={0}
                  placeholder="Max price"
                  value={filters.priceMax ?? ""}
                  onChange={(e) =>
                    updateFilter("priceMax", e.target.value ? Number(e.target.value) : undefined)
                  }
                  className="w-24 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </section>

            <div className="mt-6">
              {filteredRides.length === 0 ? (
                <div className="rounded-xl border border-stone-200/80 bg-white p-12 text-center">
                  <p className="text-stone-500">No rides match your filters.</p>
                  <p className="mt-1 text-sm text-stone-400">
                    Try adjusting filters or{" "}
                    <Link href="/rides/create" className="text-teal-600 hover:underline">
                      create a ride
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRides.map((ride) => (
                    <li key={ride.id}>
                      <RideCard
                        ride={ride}
                        currentUserId={user?.id}
                        onClick={() => openDetail(ride.id)}
                        onLeave={handleLeave}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {tab === "requests" && (
          <section className="mt-6">
            {openRequests.length === 0 ? (
              <div className="rounded-xl border border-stone-200/80 bg-white p-12 text-center">
                <p className="text-stone-500">No ride requests right now.</p>
                <p className="mt-1 text-sm text-stone-400">
                  <Link href="/rides/request" className="text-teal-600 hover:underline">
                    Request a ride
                  </Link>{" "}
                  if you need one.
                </p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {openRequests.map((req) => (
                  <li key={req.id}>
                    <RequestCard
                      request={req}
                      currentUserId={user?.id}
                      onOffer={handleOfferRequest}
                      onRemoveOffer={handleRemoveOffer}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      <RideDetailModal
        ride={detailRide ?? null}
        currentUserId={user?.id ?? ""}
        onClose={closeDetail}
        onJoin={handleJoin}
        onLeave={handleLeave}
        joinSuccess={joinSuccess}
        onDismissSuccess={dismissSuccess}
      />
    </div>
  );
}
