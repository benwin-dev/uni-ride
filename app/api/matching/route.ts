import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { RideModel } from "@/lib/models/Ride";
import { RideRequestModel } from "@/lib/models/RideRequest";
import { getTopMatches, type MatchScore } from "@/lib/matching-utils";
import type { Ride, RideRequest } from "@/lib/types";

const GOOGLE_STUDIO_API_KEY = process.env.GOOGLE_STUDIO_API_KEY;

function docToRide(d: Record<string, unknown> & { _id: { toString: () => string } }): Ride {
  return {
    id: d._id.toString(),
    createdByUserId: d.createdByUserId as string,
    creatorName: d.creatorName as string,
    creatorEmail: d.creatorEmail as string | undefined,
    startLocation: d.startLocation as string,
    destination: d.destination as string,
    startLat: d.startLat as number | undefined,
    startLng: d.startLng as number | undefined,
    destLat: d.destLat as number | undefined,
    destLng: d.destLng as number | undefined,
    distanceKm: d.distanceKm as number | undefined,
    date: d.date as string,
    time: d.time as string,
    note: d.note as string | undefined,
    price: (d.price as number) ?? 0,
    isFree: (d.isFree as boolean) ?? true,
    availableSeats: d.availableSeats as number,
    totalSeats: d.totalSeats as number,
    status: d.status as Ride["status"],
    joinedUserIds: Array.isArray(d.joinedUserIds) ? (d.joinedUserIds as string[]) : [],
    createdAt: (d.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: (d.updatedAt as Date)?.toISOString?.(),
  };
}

function docToRequest(d: Record<string, unknown> & { _id: { toString: () => string } }): RideRequest {
  return {
    id: d._id.toString(),
    createdByUserId: d.createdByUserId as string,
    requesterName: d.requesterName as string,
    requesterEmail: d.requesterEmail as string | undefined,
    startLocation: d.startLocation as string,
    destination: d.destination as string,
    startLat: d.startLat as number | undefined,
    startLng: d.startLng as number | undefined,
    destLat: d.destLat as number | undefined,
    destLng: d.destLng as number | undefined,
    date: d.date as string,
    time: d.time as string,
    note: d.note as string | undefined,
    seatsNeeded: d.seatsNeeded as number,
    maxPrice: d.maxPrice as number | undefined,
    status: d.status as RideRequest["status"],
    offeredByUserIds: Array.isArray(d.offeredByUserIds) ? (d.offeredByUserIds as string[]) : [],
    createdAt: (d.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: (d.updatedAt as Date)?.toISOString?.(),
  };
}

/** Ask Gemini for a one-line explanation of why this ride is a good match. */
async function getExplanation(
  request: RideRequest,
  match: MatchScore
): Promise<string> {
  if (!GOOGLE_STUDIO_API_KEY) {
    return `Low detour (${Math.round(match.detourKm)} km); same date & time.`;
  }
  try {
    const prompt = `You are a ride-sharing match explainer. In ONE short sentence (max 15 words), say why this ride is a good match for this request. Be specific: mention detour distance or route fit. No quotes.

Request: ${request.startLocation} → ${request.destination} (${request.date} ${request.time})
Ride: ${match.ride.startLocation} → ${match.ride.destination} (${match.ride.date} ${match.ride.time})
Stats: driver detour ${Math.round(match.detourKm)} km, efficiency ${(match.efficiency * 100).toFixed(0)}%.

Reply with only that one sentence, nothing else.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_STUDIO_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 60 },
      }),
    });
    if (!res.ok) return `Best match: ${Math.round(match.detourKm)} km detour.`;
    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    return text && text.length < 120 ? text : `Best match: ${Math.round(match.detourKm)} km detour.`;
  } catch {
    return `Best match: ${Math.round(match.detourKm)} km detour.`;
  }
}

export async function GET(request: NextRequest) {
  try {
    const requestId = request.nextUrl.searchParams.get("requestId")?.trim();
    if (!requestId) {
      return NextResponse.json(
        { error: "requestId is required" },
        { status: 400 }
      );
    }

    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const reqDoc = await RideRequestModel.findById(requestId).lean().exec();
    if (!reqDoc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const rideDocs = await RideModel.find({
      status: { $in: ["active", "full"] },
    })
      .lean()
      .exec();

    const rideRequest = docToRequest(reqDoc as Record<string, unknown> & { _id: { toString: () => string } });
    const rides = rideDocs.map((d) =>
      docToRide(d as Record<string, unknown> & { _id: { toString: () => string } })
    );

    const topScores = getTopMatches(rides, rideRequest, 3);

    const matches: Array<{
      ride: Ride;
      detourKm: number;
      efficiency: number;
      dateMatch: boolean;
      timeMatch: boolean;
      explanation?: string;
    }> = [];

    for (let i = 0; i < topScores.length; i++) {
      const m = topScores[i];
      const explanation = await getExplanation(rideRequest, m);
      matches.push({
        ride: m.ride,
        detourKm: m.detourKm,
        efficiency: m.efficiency,
        dateMatch: m.dateMatch,
        timeMatch: m.timeMatch,
        explanation,
      });
    }

    return NextResponse.json({
      request: rideRequest,
      matches,
    });
  } catch (e) {
    console.error("GET /api/matching:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Matching failed" },
      { status: 500 }
    );
  }
}
