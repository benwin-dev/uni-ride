/**
 * Map utilities: geocoding (Nominatim) and routing (OSRM).
 * No API key required; uses free OpenStreetMap services.
 * Nominatim requires a valid User-Agent per usage policy.
 */

const NOMINATIM = "https://nominatim.openstreetmap.org";
const OSRM = "https://router.project-osrm.org";
const PHOTON = "https://photon.komoot.io/api";

const NOMINATIM_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "UniRide/1.0 (campus ride-sharing; https://github.com/uni-ride)",
};

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  coordinates: [number, number][]; // [lng, lat] for Leaflet
}

/** Photon GeoJSON feature (subset used for suggestions) */
interface PhotonFeature {
  geometry?: { coordinates?: [number, number] };
  properties?: Record<string, string>;
}

/** Geocode an address/place to lat/lng (Nominatim) */
export async function geocode(query: string): Promise<GeoResult | null> {
  if (!query?.trim()) return null;
  try {
    const res = await fetch(
      `${NOMINATIM}/search?q=${encodeURIComponent(query.trim())}&format=json&limit=1`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const r = data[0];
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng, displayName: r.display_name || query };
  } catch {
    return null;
  }
}

export interface SuggestOptions {
  /** Bias results near this location (e.g. user's current position) */
  nearLat?: number;
  nearLng?: number;
}

function parsePhotonResponse(photonData: unknown, fallbackQuery: string): GeoResult[] {
  const raw = (photonData as { features?: unknown })?.features;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item: unknown) => {
      const f = item as PhotonFeature;
      const coords = f.geometry?.coordinates;
      const lat = coords?.[1];
      const lng = coords?.[0];
      if (typeof lat !== "number" || typeof lng !== "number") return null;
      const p = f.properties ?? {};
      const name = [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(", ");
      return { lat, lng, displayName: name || fallbackQuery };
    })
    .filter(Boolean) as GeoResult[];
}

/**
 * Get place suggestions for autocomplete. FREE – no API key.
 * Uses: (1) /api/places/suggest, (2) direct Photon (client), (3) direct Nominatim.
 */
export async function suggestPlaces(query: string, options?: SuggestOptions): Promise<GeoResult[]> {
  if (!query?.trim() || query.trim().length < 2) return [];

  const q = query.trim();

  if (typeof window !== "undefined") {
    try {
      const params = new URLSearchParams({ q });
      if (options?.nearLat != null && options?.nearLng != null) {
        params.set("nearLat", String(options.nearLat));
        params.set("nearLng", String(options.nearLng));
      }
      const res = await fetch(`/api/places/suggest?${params.toString()}`);
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("Invalid API response");
      const mapped = data
        .map((r: { lat?: number; lng?: number; displayName?: string }) => {
          const lat = typeof r.lat === "number" ? r.lat : typeof r.lat === "string" ? parseFloat(r.lat) : NaN;
          const lng = typeof r.lng === "number" ? r.lng : typeof r.lng === "string" ? parseFloat(r.lng) : NaN;
          if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
          return {
            lat,
            lng,
            displayName: typeof r.displayName === "string" ? r.displayName : q,
          };
        })
        .filter(Boolean) as GeoResult[];
      if (mapped.length > 0) return mapped;
    } catch {
      // Fall through.
    }

    // Client fallback: Photon (CORS-friendly, no key)
    try {
      const photonParams = new URLSearchParams({ q, limit: "10" });
      if (options?.nearLat != null && options?.nearLng != null) {
        photonParams.set("lat", String(options.nearLat));
        photonParams.set("lon", String(options.nearLng));
      }
      const photonRes = await fetch(`${PHOTON}?${photonParams.toString()}`);
      const photonData = await photonRes.json();
      const photonResults = parsePhotonResponse(photonData, q);
      if (photonResults.length > 0) return photonResults;
    } catch {
      // Fall through to Nominatim.
    }
  }

  // Direct Nominatim (free)
  try {
    const params = new URLSearchParams({
      q: query.trim(),
      format: "json",
      limit: "10",
      addressdetails: "1",
      countrycodes: "us",
    });
    if (options?.nearLat != null && options?.nearLng != null) {
      const d = 0.5;
      const minLat = options.nearLat - d;
      const maxLat = options.nearLat + d;
      const minLng = options.nearLng - d;
      const maxLng = options.nearLng + d;
      params.set("viewbox", `${minLng},${maxLat},${maxLng},${minLat}`);
    }
    const res = await fetch(`${NOMINATIM}/search?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
    });
    const data = await res.json();
    let nominatimResults = Array.isArray(data)
      ? (data as { lat?: string; lon?: string; display_name?: string }[])
          .map((r) => {
            const lat = parseFloat(r.lat as string);
            const lng = parseFloat(r.lon as string);
            if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
            return {
              lat,
              lng,
              displayName: (r.display_name as string) || "",
            };
          })
          .filter(Boolean) as GeoResult[]
      : [];
    if (nominatimResults.length === 0) {
      const globalParams = new URLSearchParams({
        q: query.trim(),
        format: "json",
        limit: "10",
        addressdetails: "1",
      });
      const globalRes = await fetch(`${NOMINATIM}/search?${globalParams.toString()}`, {
        headers: NOMINATIM_HEADERS,
      });
      const globalData = await globalRes.json();
      nominatimResults = Array.isArray(globalData)
        ? (globalData as { lat?: string; lon?: string; display_name?: string }[])
            .map((r) => {
              const lat = parseFloat(r.lat as string);
              const lng = parseFloat(r.lon as string);
              if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
              return {
                lat,
                lng,
                displayName: (r.display_name as string) || "",
              };
            })
            .filter(Boolean) as GeoResult[]
        : [];
    }
    if (nominatimResults.length > 0) return nominatimResults;

    if (typeof window !== "undefined") {
      const photonParams = new URLSearchParams({ q: query.trim(), limit: "10" });
      if (options?.nearLat != null && options?.nearLng != null) {
        photonParams.set("lat", String(options.nearLat));
        photonParams.set("lon", String(options.nearLng));
      }
      const photonRes = await fetch(`${PHOTON}?${photonParams.toString()}`);
      const photonData = await photonRes.json();
      const photonResults = parsePhotonResponse(photonData, query.trim());
      if (photonResults.length > 0) return photonResults;
    }
  } catch {
    // ignore
  }
  return [];
}

/** Reverse geocode: get address/place name from lat/lng (for map pin) */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: NOMINATIM_HEADERS }
    );
    const data = await res.json();
    const name = data?.display_name;
    return typeof name === "string" ? name : null;
  } catch {
    return null;
  }
}

/** Get driving route and distance/duration (OSRM) */
export async function getRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
): Promise<RouteResult | null> {
  try {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const res = await fetch(
      `${OSRM}/route/v1/driving/${coords}?overview=full&geometries=geojson`
    );
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.[0]) return null;
    const route = data.routes[0];
    const coordinates = (route.geometry?.coordinates || []) as [number, number][];
    const distanceKm = (route.distance || 0) / 1000;
    const durationMin = (route.duration || 0) / 60;
    return { distanceKm, durationMin, coordinates };
  } catch {
    return null;
  }
}

/** Get distance and duration from user location to a point (e.g. ride start) – for "how close am I" */
export async function getDistanceFromUser(
  userLat: number,
  userLng: number,
  toLat: number,
  toLng: number
): Promise<{ distanceKm: number; durationMin: number } | null> {
  const r = await getRoute({ lat: userLat, lng: userLng }, { lat: toLat, lng: toLng });
  return r ? { distanceKm: r.distanceKm, durationMin: r.durationMin } : null;
}

/** Haversine straight-line distance in km (no API call) */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
