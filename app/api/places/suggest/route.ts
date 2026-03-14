import { NextResponse } from "next/server";

const NOMINATIM = "https://nominatim.openstreetmap.org";
const PHOTON = "https://photon.komoot.io/api";

const NOMINATIM_HEADERS: HeadersInit = {
  Accept: "application/json",
  "User-Agent": "UniRide/1.0 (campus ride-sharing; https://github.com/uni-ride)",
};

interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

function mapNominatim(data: unknown): GeoResult[] {
  if (!Array.isArray(data)) return [];
  return data
    .map((r: { lat?: string; lon?: string; display_name?: string }) => {
      const lat = parseFloat(r.lat as string);
      const lng = parseFloat(r.lon as string);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
      return { lat, lng, displayName: (r.display_name as string) || "" };
    })
    .filter(Boolean) as GeoResult[];
}

function mapPhoton(data: unknown, fallbackQuery: string): GeoResult[] {
  const features = Array.isArray((data as { features?: unknown[] })?.features)
    ? ((data as { features: unknown[] }).features as unknown[])
    : [];
  return features
    .map(
      (f: {
        geometry?: { coordinates?: [number, number] };
        properties?: Record<string, string>;
      }) => {
        const coords = f.geometry?.coordinates;
        const lat = coords?.[1];
        const lng = coords?.[0];
        if (typeof lat !== "number" || typeof lng !== "number") return null;
        const p = f.properties ?? {};
        const name = [p.name, p.street, p.city, p.state, p.country].filter(Boolean).join(", ");
        return { lat, lng, displayName: name || fallbackQuery };
      }
    )
    .filter(Boolean) as GeoResult[];
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const nearLatRaw = searchParams.get("nearLat");
  const nearLngRaw = searchParams.get("nearLng");
  const nearLat = nearLatRaw != null ? Number(nearLatRaw) : undefined;
  const nearLng = nearLngRaw != null ? Number(nearLngRaw) : undefined;

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    // 1. Photon first (free, fast, reliable for addresses/places)
    const photonParams = new URLSearchParams({ q, limit: "10" });
    if (nearLat != null && nearLng != null && !Number.isNaN(nearLat) && !Number.isNaN(nearLng)) {
      photonParams.set("lat", String(nearLat));
      photonParams.set("lon", String(nearLng));
    }
    const photonRes = await fetch(`${PHOTON}?${photonParams.toString()}`, {
      cache: "no-store",
    });
    const photonData = await photonRes.json();
    const photonResults = mapPhoton(photonData, q);
    if (photonResults.length > 0) return NextResponse.json(photonResults);

    // 2. Nominatim (free, OpenStreetMap)
    const params = new URLSearchParams({
      q,
      format: "json",
      limit: "10",
      addressdetails: "1",
      countrycodes: "us",
    });
    if (nearLat != null && nearLng != null && !Number.isNaN(nearLat) && !Number.isNaN(nearLng)) {
      const d = 0.5;
      params.set("viewbox", `${nearLng - d},${nearLat + d},${nearLng + d},${nearLat - d}`);
    }
    const nominatimRes = await fetch(`${NOMINATIM}/search?${params.toString()}`, {
      headers: NOMINATIM_HEADERS,
      cache: "no-store",
    });
    const nominatimData = await nominatimRes.json();
    let nominatimResults = mapNominatim(nominatimData);
    if (nominatimResults.length === 0) {
      const globalRes = await fetch(
        `${NOMINATIM}/search?q=${encodeURIComponent(q)}&format=json&limit=10&addressdetails=1`,
        { headers: NOMINATIM_HEADERS, cache: "no-store" }
      );
      const globalData = await globalRes.json();
      nominatimResults = mapNominatim(globalData);
    }
    return NextResponse.json(nominatimResults);
  } catch {
    return NextResponse.json([]);
  }
}
