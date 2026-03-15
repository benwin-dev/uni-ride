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
    if (amount < 0) {
      return NextResponse.json(
        { error: "amount must be non-negative" },
        { status: 400 }
      );
    }

    const user = await UserModel.findByIdAndUpdate(
      id,
      { $inc: { totalCO2SavedKg: amount } },
      { new: true }
    )
      .select("totalCO2SavedKg")
      .lean()
      .exec();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const total = (user.totalCO2SavedKg as number) ?? 0;
    return NextResponse.json({ totalCO2SavedKg: total });
  } catch (e) {
    console.error("PATCH /api/users/[id]/add-co2:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update CO₂" },
      { status: 500 }
    );
  }
}
