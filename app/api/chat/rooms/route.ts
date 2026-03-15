import { NextRequest, NextResponse } from "next/server";
import type { ChatRoom } from "@/lib/types";
import { connectDB } from "@/lib/db";
import { ChatRoomModel } from "@/lib/models/ChatRoom";

function docToRoom(d: { _id: unknown; id: string; type: string; rideId?: string; requestId?: string; participantIds: string[]; title: string; createdAt: Date; updatedAt?: Date }): ChatRoom {
  return {
    id: d.id,
    type: d.type as ChatRoom["type"],
    rideId: d.rideId,
    requestId: d.requestId,
    participantIds: d.participantIds ?? [],
    title: d.title ?? "Chat",
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt?.toISOString(),
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

    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json(
        { error: "userId required" },
        { status: 400 }
      );
    }

    const docs = await ChatRoomModel.find({ participantIds: userId })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();

    const rooms: ChatRoom[] = docs.map((d) => ({
      id: d.id,
      type: d.type as ChatRoom["type"],
      rideId: d.rideId,
      requestId: d.requestId,
      participantIds: d.participantIds ?? [],
      title: d.title ?? "Chat",
      createdAt: (d.createdAt as Date).toISOString(),
      updatedAt: (d.updatedAt as Date)?.toISOString?.(),
    }));

    return NextResponse.json(rooms);
  } catch (e) {
    console.error("GET /api/chat/rooms:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load rooms" },
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
    const {
      type,
      rideId,
      requestId,
      participantIds,
      title,
    } = body as {
      type: "ride" | "request";
      rideId?: string;
      requestId?: string;
      participantIds: string[];
      title: string;
    };

    const id =
      type === "ride"
        ? `room-ride-${rideId}`
        : `room-request-${requestId}`;

    let room = await ChatRoomModel.findOne({ id }).exec();
    if (room) {
      room.participantIds = Array.isArray(participantIds) ? participantIds : room.participantIds;
      if (title) room.title = title;
      await room.save();
      const r = room.toObject();
      return NextResponse.json(docToRoom(r as Parameters<typeof docToRoom>[0]));
    }

    const newRoom = await ChatRoomModel.create({
      id,
      type,
      rideId: type === "ride" ? rideId : undefined,
      requestId: type === "request" ? requestId : undefined,
      participantIds: Array.isArray(participantIds) ? participantIds : [],
      title: title || "Chat",
    });

    return NextResponse.json(docToRoom(newRoom.toObject() as Parameters<typeof docToRoom>[0]));
  } catch (e) {
    console.error("POST /api/chat/rooms:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create room" },
      { status: 500 }
    );
  }
}
