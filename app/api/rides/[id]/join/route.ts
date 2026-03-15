import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { RideModel } from "@/lib/models/Ride";
import type { Ride } from "@/lib/types";

function docToRide(doc: { _id: unknown; toObject: () => Record<string, unknown> }): Ride {
  const obj = doc.toObject() as Record<string, unknown>;
  return {
    id: (doc._id as { toString: () => string }).toString(),
    createdByUserId: obj.createdByUserId as string,
    creatorName: obj.creatorName as string,
    creatorEmail: obj.creatorEmail as string | undefined,
    startLocation: obj.startLocation as string,
    destination: obj.destination as string,
    startLat: obj.startLat as number | undefined,
    startLng: obj.startLng as number | undefined,
    destLat: obj.destLat as number | undefined,
    destLng: obj.destLng as number | undefined,
    distanceKm: obj.distanceKm as number | undefined,
    date: obj.date as string,
    time: obj.time as string,
    note: obj.note as string | undefined,
    price: (obj.price as number) ?? 0,
    isFree: (obj.isFree as boolean) ?? true,
    availableSeats: obj.availableSeats as number,
    totalSeats: obj.totalSeats as number,
    status: obj.status as Ride["status"],
    joinedUserIds: Array.isArray(obj.joinedUserIds) ? (obj.joinedUserIds as string[]) : [],
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
      return NextResponse.json({ error: "Invalid ride id" }, { status: 400 });
    }

    const body = await request.json();
    const userId = body?.userId as string | undefined;
    if (!userId?.trim()) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const doc = await RideModel.findById(id).exec();
    if (!doc) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }
    if (doc.status !== "active") {
      return NextResponse.json({ error: "Ride is not available to join" }, { status: 400 });
    }
    if (doc.availableSeats <= 0) {
      return NextResponse.json({ error: "No seats available" }, { status: 400 });
    }
    if (doc.joinedUserIds.includes(userId)) {
      return NextResponse.json(docToRide(doc));
    }

    const newJoined = [...doc.joinedUserIds, userId];
    const newAvailable = doc.totalSeats - newJoined.length;
    doc.joinedUserIds = newJoined;
    doc.availableSeats = newAvailable;
    doc.status = newAvailable === 0 ? "full" : "active";
    await doc.save();

    return NextResponse.json(docToRide(doc));
  } catch (e) {
    console.error("POST /api/rides/[id]/join:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to join ride" },
      { status: 500 }
    );
  }
}
