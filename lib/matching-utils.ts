import { haversineKm } from "@/lib/map-utils";
import type { Ride, RideRequest } from "@/lib/types";

export interface MatchScore {
  ride: Ride;
  /** Extra km the driver travels to pick up and drop off the requester (lower is better). */
  detourKm: number;
  /** Requester's trip length (straight-line) in km. */
  requesterSegmentKm: number;
  /** Driver's original trip length (straight-line) in km. */
  driverTripKm: number;
  /** 0–1: how much of the driver's route is "shared" with the requester's need; higher is better. */
  efficiency: number;
  /** Same date (YYYY-MM-DD). */
  dateMatch: boolean;
  /** Time within 2 hours (simple string compare / parse). */
  timeMatch: boolean;
}

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function timeWithinHours(t1: string, t2: string, hours: number): boolean {
  const m1 = parseTimeToMinutes(t1);
  const m2 = parseTimeToMinutes(t2);
  let diff = Math.abs(m1 - m2);
  if (diff > 12 * 60) diff = 24 * 60 - diff;
  return diff <= hours * 60;
}

function hasCoords(
  r: { startLat?: number; startLng?: number; destLat?: number; destLng?: number }
): boolean {
  return (
    r.startLat != null &&
    r.startLng != null &&
    r.destLat != null &&
    r.destLng != null &&
    Number.isFinite(r.startLat) &&
    Number.isFinite(r.startLng) &&
    Number.isFinite(r.destLat) &&
    Number.isFinite(r.destLng)
  );
}

/**
 * Score a single (ride, request) pair. Uses coordinates when available;
 * otherwise falls back to date/time and a low efficiency so it sorts last.
 */
export function scoreMatch(ride: Ride, request: RideRequest): MatchScore {
  const dateMatch = ride.date === request.date;
  const timeMatch = timeWithinHours(ride.time, request.time, 2);

  if (!hasCoords(ride) || !hasCoords(request)) {
    return {
      ride,
      detourKm: 999,
      requesterSegmentKm: 0,
      driverTripKm: 0,
      efficiency: dateMatch && timeMatch ? 0.3 : 0,
      dateMatch,
      timeMatch,
    };
  }

  const driverTripKm = haversineKm(
    ride.startLat!,
    ride.startLng!,
    ride.destLat!,
    ride.destLng!
  );
  const requesterSegmentKm = haversineKm(
    request.startLat!,
    request.startLng!,
    request.destLat!,
    request.destLng!
  );
  const pickupDetourKm = haversineKm(
    ride.startLat!,
    ride.startLng!,
    request.startLat!,
    request.startLng!
  );
  const dropOffDetourKm = haversineKm(
    request.destLat!,
    request.destLng!,
    ride.destLat!,
    ride.destLng!
  );
  const detourKm = pickupDetourKm + dropOffDetourKm;
  const totalDriverKm = driverTripKm + detourKm;
  const efficiency =
    totalDriverKm > 0 ? Math.min(1, requesterSegmentKm / totalDriverKm) : 0;

  return {
    ride,
    detourKm,
    requesterSegmentKm,
    driverTripKm,
    efficiency,
    dateMatch,
    timeMatch,
  };
}

/**
 * Filter rides that could possibly serve the request (date, time, seats),
 * then score and return the top N by lowest detour (then by efficiency).
 */
export function getTopMatches(
  rides: Ride[],
  request: RideRequest,
  topN: number = 3
): MatchScore[] {
  const candidates = rides.filter((r) => {
    if (r.status !== "active" && r.status !== "full") return false;
    if (r.availableSeats < request.seatsNeeded) return false;
    if (r.date !== request.date) return false;
    if (!timeWithinHours(r.time, request.time, 2)) return false;
    return true;
  });

  const scored = candidates.map((ride) => scoreMatch(ride, request));
  scored.sort((a, b) => {
    if (a.dateMatch !== b.dateMatch) return a.dateMatch ? -1 : 1;
    if (a.timeMatch !== b.timeMatch) return a.timeMatch ? -1 : 1;
    if (Math.abs(a.detourKm - b.detourKm) > 0.1) return a.detourKm - b.detourKm;
    return b.efficiency - a.efficiency;
  });

  return scored.slice(0, topN);
}
