import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid request id" }, { status: 400 });
    }

    const body = await request.json();
    const userId = body?.userId as string | undefined;
    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const doc = await RideRequestModel.findById(id).exec();
    if (!doc) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    doc.offeredByUserIds = doc.offeredByUserIds.filter((uid: string) => uid !== userId);
    await doc.save();

    return NextResponse.json(docToRequest(doc));
  } catch (e) {
    console.error("POST /api/ride-requests/[id]/remove-offer:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to remove offer" },
      { status: 500 }
    );
  }
}
