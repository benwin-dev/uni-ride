import { NextRequest } from "next/server";
import type { ChatMessage } from "@/lib/types";
import { subscribeToRoom } from "../store";

/**
 * Server-Sent Events (SSE) stream for a chat room.
 * Client connects here and receives new messages instantly when anyone sends.
 * GET /api/chat/stream?roomId=room-ride-xyz
 */
export async function GET(request: NextRequest) {
  const roomId = request.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return new Response("roomId required", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const send = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch (_) {}
      };

      // SSE: send event with new message
      const onMessage = (msg: ChatMessage) => {
        send(`data: ${JSON.stringify(msg)}\n\n`);
      };

      const unsubscribe = subscribeToRoom(roomId, onMessage);

      // Keep connection alive with a comment every 30s (optional)
      const heartbeat = setInterval(() => {
        try {
          send(": heartbeat\n\n");
        } catch (_) {
          clearInterval(heartbeat);
        }
      }, 30000);

      request.signal?.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
