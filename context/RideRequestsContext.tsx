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

function loadFromStorage(): RideRequest[] {
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
  addRequest: (input: Omit<RideRequest, "id" | "createdAt" | "updatedAt">) => Promise<RideRequest>;
  updateRequest: (id: string, updates: Partial<RideRequest>) => Promise<void>;
  deleteRequest: (id: string, userId: string) => Promise<boolean>;
  offerRide: (requestId: string, userId: string) => Promise<boolean>;
  removeOffer: (requestId: string, userId: string) => Promise<boolean>;
  getRequestById: (id: string) => RideRequest | undefined;
  requestsByUser: (userId: string) => RideRequest[];
  requestsOfferedByUser: (userId: string) => RideRequest[];
  requestsLoading: boolean;
  requestsError: string | null;
}

const RideRequestsContext = createContext<RideRequestsContextValue | null>(null);

export function RideRequestsProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRequestsLoading(true);
    setRequestsError(null);
    fetch("/api/ride-requests")
      .then((res) => {
        if (cancelled) return null;
        if (res.ok) return res.json();
        if (res.status === 503) return null;
        throw new Error(res.statusText || "Failed to load requests");
      })
      .then((data) => {
        if (cancelled) return;
        if (data?.requests) setRequests(ensureOfferedByUserIds(data.requests));
        else setRequests(loadFromStorage());
      })
      .catch((err) => {
        if (!cancelled) {
          setRequestsError(err instanceof Error ? err.message : "Failed to load requests");
          setRequests(loadFromStorage());
        }
      })
      .finally(() => {
        if (!cancelled) setRequestsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (requestsLoading || requestsError) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));
    } catch {}
  }, [requests, requestsLoading, requestsError]);

  const openRequests = requests.filter((r) => r.status === "open");

  const addRequest = useCallback(
    async (input: Omit<RideRequest, "id" | "createdAt" | "updatedAt">): Promise<RideRequest> => {
      const res = await fetch("/api/ride-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...input, offeredByUserIds: input.offeredByUserIds ?? [] }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        const req = ensureOfferedByUserIds([data])[0];
        setRequests((prev) => [...prev, req]);
        return req;
      }
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

  const updateRequest = useCallback(async (id: string, updates: Partial<RideRequest>): Promise<void> => {
    const res = await fetch(`/api/ride-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? ensureOfferedByUserIds([data])[0] : r))
      );
      return;
    }
    const now = new Date().toISOString();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: now } : r
      )
    );
  }, []);

  const deleteRequest = useCallback(async (id: string, userId: string): Promise<boolean> => {
    const res = await fetch(`/api/ride-requests/${id}`, { method: "DELETE" });
    if (res.ok) {
      setRequests((prev) => {
        const req = prev.find((r) => r.id === id);
        if (!req || req.createdByUserId !== userId) return prev;
        return prev.filter((r) => r.id !== id);
      });
      return true;
    }
    setRequests((prev) => {
      const req = prev.find((r) => r.id === id);
      if (!req || req.createdByUserId !== userId) return prev;
      return prev.filter((r) => r.id !== id);
    });
    return true;
  }, []);

  const offerRide = useCallback(async (requestId: string, userId: string): Promise<boolean> => {
    const res = await fetch(`/api/ride-requests/${requestId}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? ensureOfferedByUserIds([data])[0] : r))
      );
      return true;
    }
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

  const removeOffer = useCallback(async (requestId: string, userId: string): Promise<boolean> => {
    const res = await fetch(`/api/ride-requests/${requestId}/remove-offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok && data.id) {
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? ensureOfferedByUserIds([data])[0] : r))
      );
      return true;
    }
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
        requestsLoading,
        requestsError,
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
