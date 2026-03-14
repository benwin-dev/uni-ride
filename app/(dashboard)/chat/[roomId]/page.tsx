"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import type { ChatMessage } from "@/lib/types";

export default function ChatRoomPage() {
  const params = useParams();
  const roomId = params?.roomId as string;
  const { user } = useAuth();
  const { getRoomById, getMessagesForRoom, fetchMessagesForRoom, fetchRoomsForUser, sendMessage, appendMessage } = useChat();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [roomLoadAttempted, setRoomLoadAttempted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const room = roomId ? getRoomById(roomId) : undefined;
  const messages = roomId ? getMessagesForRoom(roomId) : [];

  // Load messages once when entering the room
  useEffect(() => {
    if (!roomId) return;
    fetchMessagesForRoom(roomId);
  }, [roomId, fetchMessagesForRoom]);

  // Real-time: Server-Sent Events (SSE) – new messages from others appear instantly
  useEffect(() => {
    if (!roomId) return;
    const url = `/api/chat/stream?roomId=${encodeURIComponent(roomId)}`;
    const es = new EventSource(url);
    es.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as ChatMessage;
        if (msg.roomId === roomId) appendMessage(msg);
      } catch (_) {}
    };
    es.onerror = () => es.close();
    return () => es.close();
  }, [roomId, appendMessage]);

  // If room not in state yet (e.g. opened from another tab), fetch rooms from server once
  useEffect(() => {
    if (user?.id && roomId && !room && !roomLoadAttempted) {
      fetchRoomsForUser(user.id).then(() => setRoomLoadAttempted(true));
    }
  }, [user?.id, roomId, room, roomLoadAttempted, fetchRoomsForUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!user) return null;

  if (!roomId) {
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-stone-500">Chat not found.</p>
          <Link href="/chat" className="mt-4 inline-block text-teal-600 hover:underline">
            Back to Chat
          </Link>
        </div>
      </div>
    );
  }

  if (!room) {
    if (!roomLoadAttempted) {
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-6">
          <p className="text-stone-500">Loading chat…</p>
        </div>
      );
    }
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-stone-500">Chat not found.</p>
          <Link href="/chat" className="mt-4 inline-block text-teal-600 hover:underline">
            Back to Chat
          </Link>
        </div>
      </div>
    );
  }

  const isParticipant = room.participantIds.includes(user.id);
  if (!isParticipant) {
    return (
      <div className="p-6 md:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-stone-500">You’re not in this chat.</p>
          <Link href="/chat" className="mt-4 inline-block text-teal-600 hover:underline">
            Back to Chat
          </Link>
        </div>
      </div>
    );
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setSendError(null);
    const sent = await sendMessage(roomId, user.id, user.name, trimmed);
    setSending(false);
    if (sent) {
      setInput("");
    } else {
      setSendError("Could not send. Try again.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-0px)] flex-col p-6 md:p-8">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-stone-200/80 pb-4">
          <Link
            href="/chat"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-600"
            aria-label="Back to chat list"
          >
            <span className="text-xl">←</span>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-stone-900">{room.title}</h1>
            <p className="text-xs text-stone-500">
              {room.participantIds.length} participant{room.participantIds.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {messages.length === 0 ? (
            <p className="text-center text-sm text-stone-400">No messages yet. Say hi!</p>
          ) : (
            <ul className="space-y-3">
              {messages.map((msg) => {
                const isMe = msg.senderId === user.id;
                return (
                  <li
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                        isMe
                          ? "bg-teal-600 text-white"
                          : "bg-stone-100 text-stone-900"
                      }`}
                    >
                      {!isMe && (
                        <p className="mb-0.5 text-xs font-medium opacity-90">
                          {msg.senderName}
                        </p>
                      )}
                      <p className="whitespace-pre-wrap break-words text-sm">
                        {msg.content}
                      </p>
                      <p
                        className={`mt-1 text-xs ${isMe ? "text-teal-100" : "text-stone-400"}`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="mt-4 border-t border-stone-200/80 pt-4">
          {sendError && (
            <p className="mb-2 text-sm text-red-600">{sendError}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              className="flex-1 rounded-xl border border-stone-300 px-4 py-3 text-stone-900 placeholder:text-stone-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={sending}
              className="rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
