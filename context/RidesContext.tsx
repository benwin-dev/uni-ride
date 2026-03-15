"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Ride, RideFilters } from "@/lib/types";
import { createInitialRides } from "@/lib/mock-data";

const STORAGE_KEY = "uniride-rides";

function loadFromStorage(): Ride[] {
  if (typeof window === "undefined") return createInitialRides();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Ride[];
      return Array.isArray(parsed) ? parsed : createInitialRides();
    }
  } catch {}
  return createInitialRides();
}

function filterAndSortRides(rides: Ride[], filters: RideFilters): Ride[] {
  let result = [...rides].filter((r) => r.status === "active" || r.status === "full");

  if (filters.destination?.trim()) {
    const q = filters.destination.toLowerCase().trim();
    result = result.filter(
      (r) =>
        r.destination.toLowerCase().includes(q) ||
        r.startLocation.toLowerCase().includes(q)
    );
  }
  if (filters.freeOnly) result = result.filter((r) => r.isFree);
  if (filters.priceMin != null) result = result.filter((r) => r.price >= filters.priceMin!);
  if (filters.priceMax != null) result = result.filter((r) => r.price <= filters.priceMax!);
  if (filters.date) result = result.filter((r) => r.date === filters.date);

  const sortBy = filters.sortBy;
  if (sortBy === "price_asc") {
    result.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price_desc") {
    result.sort((a, b) => b.price - a.price);
  } else if (sortBy === "destination") {
    result.sort((a, b) => a.destination.localeCompare(b.destination));
  }

  return result;
}

interface RidesContextValue {
  rides: Ride[];
  filteredRides: Ride[];
  filters: RideFilters;
  setFilters: (f: RideFilters | ((prev: RideFilters) => RideFilters)) => void;
  addRide: (ride: Omit<Ride, "id" | "createdAt" | "updatedAt">) => Promise<Ride>;
  updateRide: (id: string, updates: Partial<Ride>) => Promise<void>;
  joinRide: (rideId: string, userId: string) => Promise<boolean>;
  leaveRide: (rideId: string, userId: string) => Promise<boolean>;
  deleteRide: (rideId: string, creatorUserId: string) => Promise<boolean>;
  getRideById: (id: string) => Ride | undefined;
  ridesCreatedByUser: (userId: string) => Ride[];
  ridesJoinedByUser: (userId: string) => Ride[];
  ridesLoading: boolean;
  ridesError: string | null;
}

const RidesContext = createContext<RidesContextValue | null>(null);

export function RidesProvider({ children }: { children: React.ReactNode }) {
  const [rides, setRides] = useState<Ride[]>([]);
  const [ridesLoading, setRidesLoading] = useState(true);
  const [ridesError, setRidesError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<RideFilters>({});

  useEffect(() => {
    let cancelled = false;
    setRidesLoading(true);
    setRidesError(null);
    fetch("/api/rides")
      .then((res) => {
        if (cancelled) return null;
        if (res.ok) return res.json();
        if (res.status === 503) return null;
        throw new Error(res.statusText || "Failed to load rides");
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.rides) setRides(data.rides);
        else setRides(loadFromStorage());
      })
      .catch((err) => {
        if (!cancelled) {
          setRidesError(err instanceof Error ? err.message : "Failed to load rides");
          setRides(loadFromStorage());
        }
      })
      .finally(() => {
        if (!cancelled) setRidesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (ridesLoading || ridesError) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rides));
    } catch {}
  }, [rides, ridesLoading, ridesError]);

  const setFilters = useCallback((f: RideFilters | ((prev: RideFilters) => RideFilters)) => {
    setFiltersState((prev) =>
      typeof f === "function" ? (f as (p: RideFilters) => RideFilters)(prev) : f
    );
  }, []);

  const filteredRides = filterAndSortRides(rides, filters);

  const addRide = useCallback(
    async (input: Omit<Ride, "id" | "createdAt" | "updatedAt">): Promise<Ride> => {
      const res = await fetch("/api/rides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        const ride = data as Ride;
        setRides((prev) => [...prev, ride]);
        return ride;
      }
      const now = new Date().toISOString();
      const ride: Ride = {
        ...input,
        id: `ride-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setRides((prev) => [...prev, ride]);
      return ride;
    },
    []
  );

  const updateRide = useCallback(async (id: string, updates: Partial<Ride>): Promise<void> => {
    const res = await fetch(`/api/rides/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      setRides((prev) =>
        prev.map((r) => (r.id === id ? (data as Ride) : r))
      );
      return;
    }
    const now = new Date().toISOString();
    setRides((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: now } : r
      )
    );
  }, []);

  const joinRide = useCallback(async (rideId: string, userId: string): Promise<boolean> => {
    const res = await fetch(`/api/rides/${rideId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      setRides((prev) =>
        prev.map((r) => (r.id === rideId ? (data as Ride) : r))
      );
      return true;
    }
    setRides((prev) =>
      prev.map((r) => {
        if (r.id !== rideId || r.status !== "active" || r.availableSeats <= 0) return r;
        if (r.joinedUserIds.includes(userId)) return r;
        const newJoined = [...r.joinedUserIds, userId];
        const newAvailable = r.totalSeats - newJoined.length;
        return {
          ...r,
          joinedUserIds: newJoined,
          availableSeats: newAvailable,
          status: newAvailable === 0 ? "full" : "active",
          updatedAt: new Date().toISOString(),
        };
      })
    );
    return true;
  }, []);

  const leaveRide = useCallback(async (rideId: string, userId: string): Promise<boolean> => {
    const res = await fetch(`/api/rides/${rideId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      setRides((prev) =>
        prev.map((r) => (r.id === rideId ? (data as Ride) : r))
      );
      return true;
    }
    setRides((prev) =>
      prev.map((r) => {
        if (r.id !== rideId || !r.joinedUserIds.includes(userId)) return r;
        const newJoined = r.joinedUserIds.filter((id) => id !== userId);
        const newAvailable = r.totalSeats - newJoined.length;
        return {
          ...r,
          joinedUserIds: newJoined,
          availableSeats: newAvailable,
          status: newAvailable === 0 ? "full" : "active",
          updatedAt: new Date().toISOString(),
        };
      })
    );
    return true;
  }, []);

  const deleteRide = useCallback(
    async (rideId: string, creatorUserId: string): Promise<boolean> => {
      const res = await fetch(`/api/rides/${rideId}`, { method: "DELETE" });
      if (res.ok) {
        setRides((prev) => {
          const ride = prev.find((r) => r.id === rideId);
          if (!ride || ride.createdByUserId !== creatorUserId) return prev;
          return prev.filter((r) => r.id !== rideId);
        });
        return true;
      }
      setRides((prev) => {
        const ride = prev.find((r) => r.id === rideId);
        if (!ride || ride.createdByUserId !== creatorUserId) return prev;
        return prev.filter((r) => r.id !== rideId);
      });
      return true;
    },
    []
  );

  const getRideById = useCallback(
    (id: string) => rides.find((r) => r.id === id),
    [rides]
  );

  const ridesCreatedByUser = useCallback(
    (userId: string) => rides.filter((r) => r.createdByUserId === userId),
    [rides]
  );

  const ridesJoinedByUser = useCallback(
    (userId: string) =>
      rides.filter(
        (r) => r.joinedUserIds.includes(userId) && r.createdByUserId !== userId
      ),
    [rides]
  );

  return (
    <RidesContext.Provider
      value={{
        rides,
        filteredRides,
        filters,
        setFilters,
        addRide,
        updateRide,
        joinRide,
        leaveRide,
        deleteRide,
        getRideById,
        ridesCreatedByUser,
        ridesJoinedByUser,
        ridesLoading,
        ridesError,
      }}
    >
      {children}
    </RidesContext.Provider>
  );
}

export function useRides() {
  const ctx = useContext(RidesContext);
  if (!ctx) throw new Error("useRides must be used within RidesProvider");
  return ctx;
}
