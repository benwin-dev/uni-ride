"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { ChatRoom, ChatMessage } from "@/lib/types";
import type { Ride } from "@/lib/types";
import type { RideRequest } from "@/lib/types";

const API = "/api/chat";

interface ChatContextValue {
  rooms: ChatRoom[];
  messages: ChatMessage[];
  getRoomById: (id: string) => ChatRoom | undefined;
  getMessagesForRoom: (roomId: string) => ChatMessage[];
  getRoomsForUser: (userId: string) => ChatRoom[];
  fetchRoomsForUser: (userId: string) => Promise<void>;
  fetchMessagesForRoom: (roomId: string) => Promise<void>;
  appendMessage: (msg: ChatMessage) => void;
  getOrCreateRoomForRide: (ride: Ride) => Promise<ChatRoom>;
  getOrCreateRoomForRequest: (request: RideRequest) => Promise<ChatRoom>;
  sendMessage: (roomId: string, senderId: string, senderName: string, content: string) => Promise<ChatMessage | null>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const getRoomById = useCallback(
    (id: string) => rooms.find((r) => r.id === id),
    [rooms]
  );

  const getMessagesForRoom = useCallback(
    (roomId: string) =>
      messages
        .filter((m) => m.roomId === roomId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [messages]
  );

  const getRoomsForUser = useCallback(
    (userId: string) =>
      rooms.filter((r) => r.participantIds.includes(userId)),
    [rooms]
  );

  const fetchRoomsForUser = useCallback(async (userId: string) => {
    try {
      const res = await fetch(`${API}/rooms?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setRooms(Array.isArray(data) ? data : []);
      }
    } catch {
      // keep existing state
    }
  }, []);

  const fetchMessagesForRoom = useCallback(async (roomId: string) => {
    try {
      const res = await fetch(`${API}/messages?roomId=${encodeURIComponent(roomId)}`);
      if (res.ok) {
        const data = await res.json();
        const newMessages = Array.isArray(data) ? data : [];
        setMessages((prev) => {
          const other = prev.filter((m) => m.roomId !== roomId);
          return [...other, ...newMessages];
        });
      }
    } catch {
      // keep existing state
    }
  }, []);

  const appendMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  }, []);

  const getOrCreateRoomForRide = useCallback(async (ride: Ride): Promise<ChatRoom> => {
    const participantIds = [ride.createdByUserId, ...(ride.joinedUserIds ?? [])];
    const uniqueIds = Array.from(new Set(participantIds));
    const res = await fetch(`${API}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ride",
        rideId: ride.id,
        participantIds: uniqueIds,
        title: `Ride to ${ride.destination}`,
      }),
    });
    if (!res.ok) throw new Error("Failed to get or create room");
    const room = (await res.json()) as ChatRoom;
    setRooms((prev) => {
      const exists = prev.some((r) => r.id === room.id);
      if (exists) return prev.map((r) => (r.id === room.id ? room : r));
      return [...prev, room];
    });
    return room;
  }, []);

  const getOrCreateRoomForRequest = useCallback(async (request: RideRequest): Promise<ChatRoom> => {
    const offeredBy = request.offeredByUserIds ?? [];
    const participantIds = [request.createdByUserId, ...offeredBy];
    const uniqueIds = Array.from(new Set(participantIds));
    const res = await fetch(`${API}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "request",
        requestId: request.id,
        participantIds: uniqueIds,
        title: `Request: ${request.destination}`,
      }),
    });
    if (!res.ok) throw new Error("Failed to get or create room");
    const room = (await res.json()) as ChatRoom;
    setRooms((prev) => {
      const exists = prev.some((r) => r.id === room.id);
      if (exists) return prev.map((r) => (r.id === room.id ? room : r));
      return [...prev, room];
    });
    return room;
  }, []);

  const sendMessage = useCallback(
    async (
      roomId: string,
      senderId: string,
      senderName: string,
      content: string
    ): Promise<ChatMessage | null> => {
      const trimmed = content.trim();
      if (!trimmed) return null;
      const tempId = `temp-${Date.now()}`;
      const optimistic: ChatMessage = {
        id: tempId,
        roomId,
        senderId,
        senderName,
        content: trimmed,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);
      try {
        const res = await fetch(`${API}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomId,
            senderId,
            senderName,
            content: trimmed,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setMessages((prev) => prev.filter((m) => m.id !== tempId));
          return null;
        }
        const msg = data as ChatMessage;
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempId);
          const withoutDuplicate = withoutTemp.filter((m) => m.id !== msg.id);
          return [...withoutDuplicate, msg].sort((a, b) =>
            a.createdAt.localeCompare(b.createdAt)
          );
        });
        return msg;
      } catch {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return null;
      }
    },
    []
  );

  return (
    <ChatContext.Provider
      value={{
        rooms,
        messages,
        getRoomById,
        getMessagesForRoom,
        getRoomsForUser,
        fetchRoomsForUser,
        fetchMessagesForRoom,
        appendMessage,
        getOrCreateRoomForRide,
        getOrCreateRoomForRequest,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
