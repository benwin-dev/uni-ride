/**
 * In-memory SSE subscribers only. Chat data is stored in MongoDB.
 * New messages are broadcast to connected clients for real-time updates.
 */
import type { ChatMessage } from "@/lib/types";

const sseSubscribers = new Map<string, Set<(msg: ChatMessage) => void>>();

export function subscribeToRoom(roomId: string, onMessage: (msg: ChatMessage) => void): () => void {
  if (!sseSubscribers.has(roomId)) sseSubscribers.set(roomId, new Set());
  sseSubscribers.get(roomId)!.add(onMessage);
  return () => {
    sseSubscribers.get(roomId)?.delete(onMessage);
  };
}

export function broadcastNewMessage(roomId: string, msg: ChatMessage): void {
  sseSubscribers.get(roomId)?.forEach((cb) => {
    try {
      cb(msg);
    } catch (_) {}
  });
}
