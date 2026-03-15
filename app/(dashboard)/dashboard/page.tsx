"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRides } from "@/context/RidesContext";
import { estimateCO2SavedByJoining } from "@/lib/carbon-utils";
import { useRideRequests } from "@/context/RideRequestsContext";
import { useChat } from "@/context/ChatContext";
import { RideCard } from "@/components/RideCard";
import { RequestCard } from "@/components/RequestCard";
import { RideDetailModal } from "@/components/RideDetailModal";
import { DashboardRidesMap } from "@/components/DashboardRidesMap";
import type { RideFilters, RideRequest } from "@/lib/types";

type DashboardTab = "rides" | "requests";
type RidesViewMode = "list" | "map";

export default function DashboardPage() {
  const router = useRouter();
  const { user, addCO2Saved } = useAuth();
  const { filteredRides, filters, setFilters, getRideById, joinRide, leaveRide } = useRides();
  const { openRequests, offerRide, removeOffer } = useRideRequests();
  const { getOrCreateRoomForRide, getOrCreateRoomForRequest } = useChat();
  const [tab, setTab] = useState<DashboardTab>("rides");
  const [ridesViewMode, setRidesViewMode] = useState<RidesViewMode>("list");
  const [detailRideId, setDetailRideId] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<boolean | null>(null);

  const detailRide = detailRideId ? getRideById(detailRideId) : null;

  const handleJoin = useCallback(
    (rideId: string) => {
      if (!user) return;
      const ride = getRideById(rideId);
      joinRide(rideId, user.id);
      if (ride) {
        const { kgCO2Saved } = estimateCO2SavedByJoining(ride);
        addCO2Saved(kgCO2Saved);
      }
      setJoinSuccess(true);
    },
    [user, joinRide, getRideById, addCO2Saved]
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

  const handleOpenRideChat = useCallback(async () => {
    if (!detailRide) return;
    try {
      const room = await getOrCreateRoomForRide(detailRide);
      router.push(`/chat/${room.id}`);
    } catch {
      // room creation failed
    }
  }, [detailRide, getOrCreateRoomForRide, router]);

  const handleOpenRequestChat = useCallback(
    async (request: RideRequest) => {
      try {
        const room = await getOrCreateRoomForRequest(request);
        router.push(`/chat/${room.id}`);
      } catch {
        // room creation failed
      }
    },
    [getOrCreateRoomForRequest, router]
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
        <div className="rounded-2xl border border-emerald-100 bg-white/85 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
              <p className="mt-1 text-stone-600">Find rides, request a ride, or create one.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/rides/create"
                className="inline-flex shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                Create Ride
              </Link>
              <Link
                href="/rides/request"
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-emerald-500 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                Request Ride
              </Link>
            </div>
          </div>
          <div>
            <p className="mt-3 rounded-lg bg-emerald-50/70 px-3 py-2 text-xs text-emerald-800">
              Shared rides mean fewer cars, lower cost, and a cleaner campus commute.
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-1 rounded-xl border border-emerald-100 bg-white/90 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("rides")}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
              tab === "rides" ? "bg-emerald-50 text-emerald-800" : "text-stone-600 hover:bg-emerald-50/50"
            }`}
          >
            Available rides ({filteredRides.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition ${
              tab === "requests" ? "bg-emerald-50 text-emerald-800" : "text-stone-600 hover:bg-emerald-50/50"
            }`}
          >
            Ride requests ({openRequests.length})
          </button>
        </div>

        {tab === "rides" && (
          <>
            <section className="mt-6 rounded-xl border border-emerald-100 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-sm font-semibold text-stone-700">Filters</h2>
                <div className="flex gap-1 rounded-lg border border-emerald-100 bg-emerald-50/30 p-0.5">
                  <button
                    type="button"
                    onClick={() => setRidesViewMode("list")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      ridesViewMode === "list" ? "bg-emerald-100 text-emerald-800" : "text-stone-600 hover:bg-emerald-50"
                    }`}
                  >
                    List
                  </button>
                  <button
                    type="button"
                    onClick={() => setRidesViewMode("map")}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                      ridesViewMode === "map" ? "bg-emerald-100 text-emerald-800" : "text-stone-600 hover:bg-emerald-50"
                    }`}
                  >
                    Map
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <input
                  type="text"
                  placeholder="Destination search"
                  value={filters.destination ?? ""}
                  onChange={(e) => updateFilter("destination", e.target.value)}
                  className="min-w-[180px] rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
                  value={filters.sortBy ?? "price_asc"}
                  onChange={(e) =>
                    updateFilter(
                      "sortBy",
                      e.target.value as RideFilters["sortBy"]
                    )
                  }
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="price_asc">Lowest price</option>
                  <option value="price_desc">Highest price</option>
                  <option value="destination">Destination A–Z</option>
                </select>
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
              ) : ridesViewMode === "map" ? (
                <DashboardRidesMap
                  rides={filteredRides}
                  onSelectRide={(id) => openDetail(id)}
                  selectedRideId={detailRideId}
                />
              ) : (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredRides.map((ride) => (
                    <li key={ride.id} className="flex">
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
                  <li key={req.id} className="flex">
                    <RequestCard
                      request={req}
                      currentUserId={user?.id}
                      onOffer={handleOfferRequest}
                      onRemoveOffer={handleRemoveOffer}
                      onOpenChat={handleOpenRequestChat}
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
        onOpenChat={handleOpenRideChat}
        joinSuccess={joinSuccess}
        onDismissSuccess={dismissSuccess}
      />
    </div>
  );
}
