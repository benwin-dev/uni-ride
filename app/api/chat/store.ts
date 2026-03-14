/**
 * In-memory shared store for chat (rooms + messages).
 * All users hitting this server see the same data, so chat works across different logins.
 * For production, replace with MongoDB/Postgres; structure is already compatible.
 */
import type { ChatRoom, ChatMessage } from "@/lib/types";

export const chatRooms: ChatRoom[] = [];
export const chatMessages: ChatMessage[] = [];

/** SSE: subscribers per room get new messages pushed instantly */
const sseSubscribers = new Map<string, Set<(msg: ChatMessage) => void>>();

export function findRoomByRideId(rideId: string): ChatRoom | undefined {
  return chatRooms.find((r) => r.type === "ride" && r.rideId === rideId);
}

export function findRoomByRequestId(requestId: string): ChatRoom | undefined {
  return chatRooms.find((r) => r.type === "request" && r.requestId === requestId);
}

export function getRoomsForUser(userId: string): ChatRoom[] {
  return chatRooms.filter((r) => r.participantIds.includes(userId));
}

export function getMessagesForRoom(roomId: string): ChatMessage[] {
  return chatMessages
    .filter((m) => m.roomId === roomId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

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
