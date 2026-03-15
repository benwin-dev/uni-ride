import { NextRequest, NextResponse } from "next/server";

const GOOGLE_STUDIO_API_KEY = process.env.GOOGLE_STUDIO_API_KEY;

const KG_CO2_PER_KM = 0.25;

/** Heuristic fallback when Gemini is unavailable or fails. */
function heuristicDistanceKm(startLocation: string, destination: string): number {
  const dest = destination.toLowerCase();
  if (/\bairport\b|sfo|oak|sjc|jfk|lax/.test(dest)) return 55;
  if (/\bmall\b|downtown|city\b/.test(dest)) return 15;
  if (/\bwalmart|target|grocery|trader joe|store\b/.test(dest)) return 8;
  return 12;
}

/**
 * Use Gemini to estimate typical driving distance in km between two places.
 * Falls back to heuristic when API key missing or quota/error.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const startLocation = typeof body.startLocation === "string" ? body.startLocation.trim() : "";
    const destination = typeof body.destination === "string" ? body.destination.trim() : "";

    if (!startLocation || !destination) {
      return NextResponse.json(
        { error: "startLocation and destination are required" },
        { status: 400 }
      );
    }

    let distanceKm: number | null = null;

    if (GOOGLE_STUDIO_API_KEY) {
      const prompt = `Estimate the typical one-way driving distance in kilometers between these two places. Consider them as they would be used in a ride-sharing context (e.g. campus, city, airport).

Start: "${startLocation}"
Destination: "${destination}"

Reply with ONLY a single JSON object with one key: "distanceKm" (number). Use a reasonable estimate (e.g. campus to nearby store 3-8 km, campus to airport 40-60 km, city to mall 10-20 km). No explanation, no markdown.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_STUDIO_API_KEY}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        };
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          const raw = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          try {
            const parsed = JSON.parse(raw) as { distanceKm?: number };
            const d = Number(parsed?.distanceKm);
            if (Number.isFinite(d) && d > 0 && d < 2000) distanceKm = d;
          } catch {
            // use fallback
          }
        }
      }
    }

    const km = distanceKm ?? heuristicDistanceKm(startLocation, destination);
    const kgCO2Saved = Math.round(km * KG_CO2_PER_KM * 10) / 10;

    return NextResponse.json({ distanceKm: km, kgCO2Saved });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Estimate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
