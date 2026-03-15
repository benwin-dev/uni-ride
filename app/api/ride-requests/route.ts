import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { RideRequestModel } from "@/lib/models/RideRequest";
import type { RideRequest } from "@/lib/types";

function docToRequest(doc: { _id: unknown; toObject: () => Record<string, unknown> }): RideRequest {
  const obj = doc.toObject() as Record<string, unknown>;
  return {
    id: (doc._id as { toString: () => string }).toString(),
    createdByUserId: obj.createdByUserId as string,
    requesterName: obj.requesterName as string,
    requesterEmail: obj.requesterEmail as string | undefined,
    startLocation: obj.startLocation as string,
    destination: obj.destination as string,
    startLat: obj.startLat as number | undefined,
    startLng: obj.startLng as number | undefined,
    destLat: obj.destLat as number | undefined,
    destLng: obj.destLng as number | undefined,
    date: obj.date as string,
    time: obj.time as string,
    note: obj.note as string | undefined,
    seatsNeeded: obj.seatsNeeded as number,
    maxPrice: obj.maxPrice as number | undefined,
    status: obj.status as RideRequest["status"],
    offeredByUserIds: Array.isArray(obj.offeredByUserIds) ? (obj.offeredByUserIds as string[]) : [],
    createdAt: (obj.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
    updatedAt: (obj.updatedAt as Date)?.toISOString?.(),
  };
}

export async function GET() {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const docs = await RideRequestModel.find({}).lean().exec();
    const requests: RideRequest[] = docs.map((d) => {
      const o = d as Record<string, unknown>;
      return {
        id: (o._id as { toString: () => string }).toString(),
        createdByUserId: o.createdByUserId as string,
        requesterName: o.requesterName as string,
        requesterEmail: o.requesterEmail as string | undefined,
        startLocation: o.startLocation as string,
        destination: o.destination as string,
        startLat: o.startLat as number | undefined,
        startLng: o.startLng as number | undefined,
        destLat: o.destLat as number | undefined,
        destLng: o.destLng as number | undefined,
        date: o.date as string,
        time: o.time as string,
        note: o.note as string | undefined,
        seatsNeeded: o.seatsNeeded as number,
        maxPrice: o.maxPrice as number | undefined,
        status: o.status as RideRequest["status"],
        offeredByUserIds: Array.isArray(o.offeredByUserIds) ? (o.offeredByUserIds as string[]) : [],
        createdAt: (o.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: (o.updatedAt as Date)?.toISOString?.(),
      };
    });

    return NextResponse.json({ requests });
  } catch (e) {
    console.error("GET /api/ride-requests:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const doc = await RideRequestModel.create({
      createdByUserId: body.createdByUserId,
      requesterName: body.requesterName,
      requesterEmail: body.requesterEmail,
      startLocation: body.startLocation,
      destination: body.destination,
      startLat: body.startLat,
      startLng: body.startLng,
      destLat: body.destLat,
      destLng: body.destLng,
      date: body.date,
      time: body.time,
      note: body.note,
      seatsNeeded: body.seatsNeeded,
      maxPrice: body.maxPrice,
      status: body.status ?? "open",
      offeredByUserIds: body.offeredByUserIds ?? [],
    });

    return NextResponse.json(docToRequest(doc));
  } catch (e) {
    console.error("POST /api/ride-requests:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create request" },
      { status: 500 }
    );
  }
}
