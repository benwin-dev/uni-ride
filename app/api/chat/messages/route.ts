import { NextRequest, NextResponse } from "next/server";
import type { ChatMessage } from "@/lib/types";
import { connectDB } from "@/lib/db";
import { ChatRoomModel } from "@/lib/models/ChatRoom";
import { ChatMessageModel } from "@/lib/models/ChatMessage";
import { broadcastNewMessage } from "../store";

export async function GET(request: NextRequest) {
  try {
    const db = await connectDB();
    if (!db) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      );
    }

    const roomId = request.nextUrl.searchParams.get("roomId");
    if (!roomId) {
      return NextResponse.json(
        { error: "roomId required" },
        { status: 400 }
      );
    }

    const docs = await ChatMessageModel.find({ roomId })
      .sort({ createdAt: 1 })
      .lean()
      .exec();

    const messages: ChatMessage[] = docs.map((d) => ({
      id: (d._id as { toString: () => string }).toString(),
      roomId: d.roomId,
      senderId: d.senderId,
      senderName: d.senderName,
      content: d.content,
      createdAt: (d.createdAt as Date).toISOString(),
    }));

    return NextResponse.json(messages);
  } catch (e) {
    console.error("GET /api/chat/messages:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to load messages" },
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

    let room = await ChatRoomModel.findOne({ id: roomId }).lean().exec();
    if (!room) {
      const type = roomId.startsWith("room-request-") ? "request" : "ride";
      const rideId = type === "ride" ? roomId.replace("room-ride-", "") : undefined;
      const requestId = type === "request" ? roomId.replace("room-request-", "") : undefined;
      await ChatRoomModel.create({
        id: roomId,
        type,
        rideId,
        requestId,
        participantIds: [senderId],
        title: "Chat",
      });
    }

    const doc = await ChatMessageModel.create({
      roomId,
      senderId,
      senderName,
      content: trimmed,
    });

    const msg: ChatMessage = {
      id: doc._id.toString(),
      roomId: doc.roomId,
      senderId: doc.senderId,
      senderName: doc.senderName,
      content: doc.content,
      createdAt: doc.createdAt.toISOString(),
    };

    broadcastNewMessage(roomId, msg);

    return NextResponse.json(msg);
  } catch (e) {
    console.error("POST /api/chat/messages:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to send message" },
      { status: 500 }
    );
  }
}
