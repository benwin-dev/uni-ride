"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";

export default function ChatListPage() {
  const { user } = useAuth();
  const { getRoomsForUser, getMessagesForRoom, fetchRoomsForUser } = useChat();

  const myRooms = user ? getRoomsForUser(user.id) : [];

  useEffect(() => {
    if (user?.id) fetchRoomsForUser(user.id);
  }, [user?.id, fetchRoomsForUser]);

  if (!user) return null;

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold text-stone-900">Chat</h1>
        <p className="mt-1 text-stone-600">
          Group chats for rides and ride requests you’re part of.
        </p>

        {myRooms.length === 0 ? (
          <div className="mt-8 rounded-xl border border-stone-200/80 bg-white p-12 text-center">
            <p className="text-stone-500">No chats yet.</p>
            <p className="mt-2 text-sm text-stone-400">
              Join a ride or offer to help on a request — a chat will appear here so you can coordinate.
            </p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Go to dashboard
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-2">
            {myRooms.map((room) => {
              const msgs = getMessagesForRoom(room.id);
              const lastMsg = msgs[msgs.length - 1];
              return (
                <li key={room.id}>
                  <Link
                    href={`/chat/${room.id}`}
                    className="flex items-center gap-4 rounded-xl border border-stone-200/80 bg-white p-4 transition hover:border-teal-200 hover:bg-stone-50/50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
                      <span className="text-sm font-semibold">#</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-stone-900">{room.title}</p>
                      <p className="truncate text-sm text-stone-500">
                        {lastMsg
                          ? `${lastMsg.senderName}: ${lastMsg.content}`
                          : "No messages yet"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-stone-400">
                      {room.type === "ride" ? "Ride" : "Request"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
