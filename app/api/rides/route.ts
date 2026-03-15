import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = request.nextUrl;
    const destination = searchParams.get("destination")?.trim();
    const date = searchParams.get("date")?.trim();
    const freeOnly = searchParams.get("freeOnly") === "true";
    const priceMin = searchParams.get("priceMin");
    const priceMax = searchParams.get("priceMax");

    let query = RideModel.find({
      status: { $in: ["active", "full"] },
    });

    if (destination) {
      const q = destination.toLowerCase();
      query = query.find({
        $or: [
          { destination: new RegExp(q, "i") },
          { startLocation: new RegExp(q, "i") },
        ],
      });
    }
    if (date) query = query.where("date").equals(date);
    if (freeOnly) query = query.where("isFree").equals(true);
    if (priceMin != null && priceMin !== "") {
      const n = Number(priceMin);
      if (Number.isFinite(n)) query = query.where("price").gte(n);
    }
    if (priceMax != null && priceMax !== "") {
      const n = Number(priceMax);
      if (Number.isFinite(n)) query = query.where("price").lte(n);
    }

    const docs = await query.lean().exec();
    const rides: Ride[] = docs.map((d) => {
      const o = d as Record<string, unknown>;
      return {
        id: (o._id as { toString: () => string }).toString(),
        createdByUserId: o.createdByUserId as string,
        creatorName: o.creatorName as string,
        creatorEmail: o.creatorEmail as string | undefined,
        startLocation: o.startLocation as string,
        destination: o.destination as string,
        startLat: o.startLat as number | undefined,
        startLng: o.startLng as number | undefined,
        destLat: o.destLat as number | undefined,
        destLng: o.destLng as number | undefined,
        distanceKm: o.distanceKm as number | undefined,
        date: o.date as string,
        time: o.time as string,
        note: o.note as string | undefined,
        price: (o.price as number) ?? 0,
        isFree: (o.isFree as boolean) ?? true,
        availableSeats: o.availableSeats as number,
        totalSeats: o.totalSeats as number,
        status: o.status as Ride["status"],
        joinedUserIds: Array.isArray(o.joinedUserIds) ? (o.joinedUserIds as string[]) : [],
        createdAt: (o.createdAt as Date)?.toISOString?.() ?? new Date().toISOString(),
        updatedAt: (o.updatedAt as Date)?.toISOString?.(),
      };
    });

    return NextResponse.json({ rides });
  } catch (e) {
    console.error("GET /api/rides:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch rides" },
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
    const doc = await RideModel.create({
      createdByUserId: body.createdByUserId,
      creatorName: body.creatorName,
      creatorEmail: body.creatorEmail,
      startLocation: body.startLocation,
      destination: body.destination,
      startLat: body.startLat,
      startLng: body.startLng,
      destLat: body.destLat,
      destLng: body.destLng,
      distanceKm: body.distanceKm,
      date: body.date,
      time: body.time,
      note: body.note,
      price: body.price ?? 0,
      isFree: body.isFree ?? true,
      availableSeats: body.availableSeats,
      totalSeats: body.totalSeats,
      status: body.status ?? "active",
      joinedUserIds: body.joinedUserIds ?? [],
    });

    const ride = docToRide(doc);
    return NextResponse.json(ride);
  } catch (e) {
    console.error("POST /api/rides:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create ride" },
      { status: 500 }
    );
  }
}
