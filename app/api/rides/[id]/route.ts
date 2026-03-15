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

export async function GET(
  _request: NextRequest,
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

    const doc = await RideModel.findById(id).exec();
    if (!doc) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    return NextResponse.json(docToRide(doc));
  } catch (e) {
    console.error("GET /api/rides/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch ride" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
    const allowed = [
      "startLocation", "destination", "startLat", "startLng", "destLat", "destLng",
      "distanceKm", "date", "time", "note", "price", "isFree", "availableSeats",
      "totalSeats", "status",
    ];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }

    const doc = await RideModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true }
    ).exec();

    if (!doc) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    return NextResponse.json(docToRide(doc));
  } catch (e) {
    console.error("PATCH /api/rides/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update ride" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
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

    const doc = await RideModel.findByIdAndDelete(id).exec();
    if (!doc) {
      return NextResponse.json({ error: "Ride not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/rides/[id]:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to delete ride" },
      { status: 500 }
    );
  }
}
