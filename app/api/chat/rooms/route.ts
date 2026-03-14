import { NextRequest, NextResponse } from "next/server";
import type { ChatRoom } from "@/lib/types";
import {
  chatRooms,
  findRoomByRideId,
  findRoomByRequestId,
  getRoomsForUser,
} from "../store";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId required" },
      { status: 400 }
    );
  }
  const rooms = getRoomsForUser(userId);
  return NextResponse.json(rooms);
}

export async function POST(request: NextRequest) {
  try {
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

    let existing: ChatRoom | undefined;
    if (type === "ride" && rideId) {
      existing = findRoomByRideId(rideId);
    } else if (type === "request" && requestId) {
      existing = findRoomByRequestId(requestId);
    }

    if (existing) {
      // Update participants so new joiners/offerers are included
      existing.participantIds = Array.isArray(participantIds) ? participantIds : existing.participantIds;
      existing.title = title || existing.title;
      existing.updatedAt = new Date().toISOString();
      return NextResponse.json(existing);
    }

    const now = new Date().toISOString();
    const id =
      type === "ride"
        ? `room-ride-${rideId}`
        : `room-request-${requestId}`;
    const newRoom: ChatRoom = {
      id,
      type,
      rideId: type === "ride" ? rideId : undefined,
      requestId: type === "request" ? requestId : undefined,
      participantIds: Array.isArray(participantIds) ? participantIds : [],
      title: title || "Chat",
      createdAt: now,
      updatedAt: now,
    };
    chatRooms.push(newRoom);
    return NextResponse.json(newRoom);
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
