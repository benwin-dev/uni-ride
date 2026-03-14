"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { RideRequest } from "@/lib/types";

const STORAGE_KEY = "uniride-ride-requests";

function ensureOfferedByUserIds(requests: RideRequest[]): RideRequest[] {
  return requests.map((r) => ({
    ...r,
    offeredByUserIds: Array.isArray(r.offeredByUserIds) ? r.offeredByUserIds : [],
  }));
}

function loadRequests(): RideRequest[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as RideRequest[];
      return Array.isArray(parsed) ? ensureOfferedByUserIds(parsed) : [];
    }
  } catch {}
  return [];
}

interface RideRequestsContextValue {
  requests: RideRequest[];
  openRequests: RideRequest[];
  addRequest: (input: Omit<RideRequest, "id" | "createdAt" | "updatedAt">) => RideRequest;
  updateRequest: (id: string, updates: Partial<RideRequest>) => void;
  deleteRequest: (id: string, userId: string) => boolean;
  offerRide: (requestId: string, userId: string) => boolean;
  removeOffer: (requestId: string, userId: string) => boolean;
  getRequestById: (id: string) => RideRequest | undefined;
  requestsByUser: (userId: string) => RideRequest[];
  requestsOfferedByUser: (userId: string) => RideRequest[];
}

const RideRequestsContext = createContext<RideRequestsContextValue | null>(null);

export function RideRequestsProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<RideRequest[]>(loadRequests);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch {}
  }, [requests]);

  const openRequests = requests.filter((r) => r.status === "open");

  const addRequest = useCallback(
    (input: Omit<RideRequest, "id" | "createdAt" | "updatedAt">) => {
      const now = new Date().toISOString();
      const req: RideRequest = {
        ...input,
        offeredByUserIds: [],
        id: `request-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      setRequests((prev) => [...prev, req]);
      return req;
    },
    []
  );

  const updateRequest = useCallback((id: string, updates: Partial<RideRequest>) => {
    const now = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: now } : r))
    );
  }, []);

  const deleteRequest = useCallback((id: string, userId: string): boolean => {
    setRequests((prev) => {
      const req = prev.find((r) => r.id === id);
      if (!req || req.createdByUserId !== userId) return prev;
      return prev.filter((r) => r.id !== id);
    });
    return true;
  }, []);

  const offerRide = useCallback((requestId: string, userId: string): boolean => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId || r.status !== "open") return r;
        const offered = r.offeredByUserIds ?? [];
        if (offered.includes(userId)) return r;
        return {
          ...r,
          offeredByUserIds: [...offered, userId],
          updatedAt: new Date().toISOString(),
        };
      })
    );
    return true;
  }, []);

  const removeOffer = useCallback((requestId: string, userId: string): boolean => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== requestId) return r;
        const offered = (r.offeredByUserIds ?? []).filter((id) => id !== userId);
        return { ...r, offeredByUserIds: offered, updatedAt: new Date().toISOString() };
      })
    );
    return true;
  }, []);

  const getRequestById = useCallback(
    (id: string) => requests.find((r) => r.id === id),
    [requests]
  );

  const requestsByUser = useCallback(
    (userId: string) => requests.filter((r) => r.createdByUserId === userId),
    [requests]
  );

  const requestsOfferedByUser = useCallback(
    (userId: string) =>
      requests.filter((r) => (r.offeredByUserIds ?? []).includes(userId)),
    [requests]
  );

  return (
    <RideRequestsContext.Provider
      value={{
        requests,
        openRequests,
        addRequest,
        updateRequest,
        deleteRequest,
        offerRide,
        removeOffer,
        getRequestById,
        requestsByUser,
        requestsOfferedByUser,
      }}
    >
      {children}
    </RideRequestsContext.Provider>
  );
}

export function useRideRequests() {
  const ctx = useContext(RideRequestsContext);
  if (!ctx) throw new Error("useRideRequests must be used within RideRequestsProvider");
  return ctx;
}
