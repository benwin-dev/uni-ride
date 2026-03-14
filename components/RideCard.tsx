"use client";

import type { Ride } from "@/lib/types";

interface RideCardProps {
  ride: Ride;
  currentUserId?: string;
  onClick: () => void;
  onLeave?: (rideId: string) => void;
}

export function RideCard({ ride, currentUserId, onClick, onLeave }: RideCardProps) {
  const isFull = ride.status === "full" || ride.availableSeats <= 0;
  const isCreator = currentUserId && ride.createdByUserId === currentUserId;
  const alreadyJoined = currentUserId && ride.joinedUserIds.includes(currentUserId);
  const canJoin = !isFull && !isCreator && !alreadyJoined;

  return (
    <div
      className="flex flex-col rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md"
    >
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:ring-inset rounded-lg -m-1 p-1"
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-stone-900">{ride.destination}</h3>
          <div className="flex flex-wrap gap-1.5">
            {ride.isFree && (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Free
              </span>
            )}
            {isFull && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Seats Full
              </span>
            )}
            {!isFull && ride.status === "active" && (
              <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-xs font-medium text-teal-800">
                Active
              </span>
            )}
          </div>
        </div>
        {ride.note && (
          <p className="mt-2 line-clamp-2 text-sm text-stone-600">{ride.note}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
          <span>{ride.date}</span>
          <span>{ride.time}</span>
          <span>{ride.availableSeats} seat{ride.availableSeats !== 1 ? "s" : ""} left</span>
          {!ride.isFree && <span className="font-medium text-stone-700">${ride.price}</span>}
        </div>
        {ride.creatorName && (
          <p className="mt-2 text-xs text-stone-400">by {ride.creatorName}</p>
        )}
      </button>
      <div className="mt-4 pt-3 border-t border-stone-100">
        {alreadyJoined && (ride.status === "active" || ride.status === "full") && onLeave ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (typeof window !== "undefined" && window.confirm("Leave this ride? Your seat will become available again.")) {
                onLeave(ride.id);
              }
            }}
            className="w-full rounded-lg border border-red-200 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-2"
          >
            Leave ride
          </button>
        ) : canJoin ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            Join ride
          </button>
        ) : isFull ? (
          <span className="block w-full rounded-lg bg-stone-100 px-4 py-2.5 text-center text-sm font-medium text-stone-500">
            Seats full
          </span>
        ) : isCreator ? (
          <span className="block w-full rounded-lg bg-stone-100 px-4 py-2.5 text-center text-sm font-medium text-stone-600">
            Your ride
          </span>
        ) : (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="w-full rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            View details
          </button>
        )}
      </div>
    </div>
  );
}
