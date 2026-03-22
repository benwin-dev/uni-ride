import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { UserModel } from "@/lib/models/User";

/**
 * Add to the user's cumulative CO₂ saved (e.g. when they join a ride).
 * Body: { amount: number } (kg to add).
 * Returns: { totalCO2SavedKg: number }.
 */
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
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const body = await request.json();
    const amount = typeof body?.amount === "number" ? body.amount : 0;

    const existing = await UserModel.findById(id).select("totalCO2SavedKg").exec();
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const current =
      typeof existing.totalCO2SavedKg === "number" ? existing.totalCO2SavedKg : 0;
    const nextTotal = Math.max(0, current + amount);

    existing.totalCO2SavedKg = nextTotal;
    await existing.save();

    const user = existing.toObject() as { totalCO2SavedKg?: number };
    const total = user.totalCO2SavedKg ?? 0;
    return NextResponse.json({ totalCO2SavedKg: total });
  } catch (e) {
    console.error("PATCH /api/users/[id]/add-co2:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update CO₂" },
      { status: 500 }
    );
  }
}
