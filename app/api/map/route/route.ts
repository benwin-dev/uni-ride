import { NextRequest, NextResponse } from "next/server";

const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY;
const OSRM = "https://router.project-osrm.org";

/**
 * Try OpenRouteService first (reliable driving routes, free tier with key).
 * Fall back to OSRM. Returns GeoJSON-style coordinates [lng, lat][].
 */
export async function GET(request: NextRequest) {
  try {
    const from = request.nextUrl.searchParams.get("from"); // "lat,lng"
    const to = request.nextUrl.searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing from or to (use from=lat,lng&to=lat,lng)" },
        { status: 400 }
      );
    }
    const [fromLat, fromLng] = from.split(",").map(Number);
    const [toLat, toLng] = to.split(",").map(Number);
    if (
      !Number.isFinite(fromLat) ||
      !Number.isFinite(fromLng) ||
      !Number.isFinite(toLat) ||
      !Number.isFinite(toLng)
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    let coordinates: [number, number][] | null = null;
    let distanceKm = 0;
    let durationMin = 0;

    if (OPENROUTESERVICE_API_KEY) {
      const res = await fetch("https://api.openrouteservice.org/v2/directions/driving-car", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: OPENROUTESERVICE_API_KEY,
        },
        body: JSON.stringify({
          coordinates: [
            [fromLng, fromLat],
            [toLng, toLat],
          ],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          routes?: Array<{
            geometry?: { coordinates?: [number, number][] };
            summary?: { distance?: number; duration?: number };
          }>;
        };
        const route = data?.routes?.[0];
        const coords = route?.geometry?.coordinates;
        if (Array.isArray(coords) && coords.length >= 2) {
          coordinates = coords;
          distanceKm = (route?.summary?.distance ?? 0) / 1000;
          durationMin = (route?.summary?.duration ?? 0) / 60;
        }
      }
    }

    if (!coordinates || coordinates.length < 2) {
      const coords = `${fromLng},${fromLat};${toLng},${toLat}`;
      const res = await fetch(
        `${OSRM}/route/v1/driving/${coords}?overview=full&geometries=geojson`
      );
      const data = await res.json();
      if (data.code === "Ok" && data.routes?.[0]) {
        const route = data.routes[0];
        const coords = (route.geometry?.coordinates || []) as [number, number][];
        if (coords.length >= 2) {
          coordinates = coords;
          distanceKm = (route.distance || 0) / 1000;
          durationMin = (route.duration || 0) / 60;
        }
      }
    }

    if (!coordinates || coordinates.length < 2) {
      return NextResponse.json(
        { error: "No route found", coordinates: null, distanceKm: 0, durationMin: 0 },
        { status: 200 }
      );
    }

    return NextResponse.json({
      coordinates,
      distanceKm,
      durationMin,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Route failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
