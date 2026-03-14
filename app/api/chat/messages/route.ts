import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage, ChatRoom } from "@/lib/types";
import { chatMessages, chatRooms, broadcastNewMessage } from "../store";

export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return NextResponse.json(
      { error: "roomId required" },
      { status: 400 }
    );
  }
  const messages = chatMessages
    .filter((m) => m.roomId === roomId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return NextResponse.json(messages);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { roomId, senderId, senderName, content } = body as {
      roomId: string;
      senderId: string;
      senderName: string;
      content: string;
    };

    const trimmed = typeof content === "string" ? content.trim() : "";
    if (!roomId || !senderId || !senderName || !trimmed) {
      return NextResponse.json(
        { error: "roomId, senderId, senderName, and content required" },
        { status: 400 }
      );
    }

    let room = chatRooms.find((r) => r.id === roomId);
    if (!room) {
      const now = new Date().toISOString();
      room = {
        id: roomId,
        type: roomId.startsWith("room-request-") ? "request" : "ride",
        participantIds: [senderId],
        title: "Chat",
        createdAt: now,
        updatedAt: now,
      } as ChatRoom;
      if (room.type === "request") (room as ChatRoom).requestId = roomId.replace("room-request-", "");
      else (room as ChatRoom).rideId = roomId.replace("room-ride-", "");
      chatRooms.push(room);
    }

    const now = new Date().toISOString();
    const msg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      roomId,
      senderId,
      senderName,
      content: trimmed,
      createdAt: now,
    };
    chatMessages.push(msg);
    broadcastNewMessage(roomId, msg);
    return NextResponse.json(msg);
  } catch (e) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
