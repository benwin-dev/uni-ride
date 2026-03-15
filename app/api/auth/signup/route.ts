import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { UserModel, hashPassword } from "@/lib/models/User";
import { toJSON } from "@/lib/api-utils";

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
    const { name, email, university, password } = body as {
      name?: string;
      email?: string;
      university?: string;
      password?: string;
    };

    const trimmedEmail = String(email ?? "").toLowerCase().trim();
    const trimmedName = String(name ?? "").trim();
    const trimmedUniversity = String(university ?? "").trim();
    const pass = typeof password === "string" ? password : "";

    if (!trimmedEmail || !trimmedName || !trimmedUniversity) {
      return NextResponse.json(
        { error: "Name, email, and university are required" },
        { status: 400 }
      );
    }
    if (pass.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const existing = await UserModel.findOne({ email: trimmedEmail });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(pass);
    const user = await UserModel.create({
      name: trimmedName,
      email: trimmedEmail,
      university: trimmedUniversity,
      passwordHash,
    });

    const json = toJSON(user, ["passwordHash"]);
    return NextResponse.json({
      user: {
        id: json.id,
        name: json.name,
        email: json.email,
        university: json.university,
        phone: json.phone,
        avatar: json.avatar,
        bio: json.bio,
        totalCO2SavedKg: (json as { totalCO2SavedKg?: number }).totalCO2SavedKg ?? 0,
        createdAt: json.createdAt,
        updatedAt: json.updatedAt,
      },
    });
  } catch (e) {
    console.error("Signup error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Signup failed" },
      { status: 500 }
    );
  }
}
