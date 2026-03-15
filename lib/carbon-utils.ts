import type { Ride } from "@/lib/types";
import { haversineKm } from "@/lib/map-utils";

/**
 * Average passenger car CO2 emissions per km (approx. EPA / IEA).
 * One car avoided = one trip's worth of emissions saved.
 */
const KG_CO2_PER_KM = 0.25;

/** Default trip distance (km) when we don't have ride coordinates. */
const DEFAULT_TRIP_KM = 12;

/**
 * Estimate CO2 saved when someone joins a ride (one fewer car on the road).
 * Uses stored distanceKm when set, else straight-line from coordinates, else default trip length.
 */
export function estimateCO2SavedByJoining(ride: Ride): {
  kgCO2Saved: number;
  distanceKm: number | null;
} {
  let distanceKm: number | null = null;

  if (ride.distanceKm != null && ride.distanceKm > 0) {
    distanceKm = ride.distanceKm;
  } else if (
    ride.startLat != null &&
    ride.startLng != null &&
    ride.destLat != null &&
    ride.destLng != null
  ) {
    distanceKm = haversineKm(
      ride.startLat,
      ride.startLng,
      ride.destLat,
      ride.destLng
    );
  }

  const km = distanceKm ?? DEFAULT_TRIP_KM;
  const kgCO2Saved = Math.round(km * KG_CO2_PER_KM * 10) / 10;

  return { kgCO2Saved, distanceKm };
}

/** True if the ride has no distance data (needs Gemini or heuristic estimate). */
export function rideNeedsDistanceEstimate(ride: Ride): boolean {
  if (ride.distanceKm != null && ride.distanceKm > 0) return false;
  if (
    ride.startLat != null &&
    ride.startLng != null &&
    ride.destLat != null &&
    ride.destLng != null
  )
    return false;
  return true;
}
