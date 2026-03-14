"use client";

import type { RideRequest } from "@/lib/types";

interface RequestCardProps {
  request: RideRequest;
  currentUserId?: string;
  onOffer?: (requestId: string) => void;
  onRemoveOffer?: (requestId: string) => void;
  onClick?: () => void;
}

export function RequestCard({ request, currentUserId, onOffer, onRemoveOffer, onClick }: RequestCardProps) {
  const isOpen = request.status === "open";
  const offeredBy = request.offeredByUserIds ?? [];
  const hasOffered = currentUserId && offeredBy.includes(currentUserId);
  const isRequester = currentUserId && request.createdByUserId === currentUserId;

  return (
    <div className="flex flex-col rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm transition hover:border-teal-200 hover:shadow-md">
      <div
        className={onClick ? "cursor-pointer" : ""}
        onClick={onClick}
        onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-stone-900">{request.destination}</h3>
          <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800">
            Request
          </span>
        </div>
        {request.note && (
          <p className="mt-2 line-clamp-2 text-sm text-stone-600">{request.note}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
          <span>{request.date}</span>
          <span>{request.time}</span>
          <span>{request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""} needed</span>
          {request.maxPrice != null && request.maxPrice > 0 && (
            <span className="font-medium text-stone-700">Up to ${request.maxPrice}</span>
          )}
          {(request.maxPrice == null || request.maxPrice === 0) && (
            <span className="text-emerald-600">Prefer free</span>
          )}
        </div>
        <p className="mt-2 text-xs text-stone-400">from {request.startLocation}</p>
        {request.requesterName && (
          <p className="mt-1 text-xs text-stone-400">by {request.requesterName}</p>
        )}
        {offeredBy.length > 0 && (
          <p className="mt-2 text-xs text-stone-500">{offeredBy.length} offering to help</p>
        )}
        {!isOpen && (
          <p className="mt-2 text-xs font-medium text-stone-500">
            {request.status === "cancelled" ? "Cancelled" : "Matched"}
          </p>
        )}
      </div>
      {isOpen && !isRequester && currentUserId && (
        <div className="mt-4 pt-3 border-t border-stone-100">
          {hasOffered && onRemoveOffer ? (
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-teal-100 px-4 py-2 text-sm font-medium text-teal-800">
                You're offering to help
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveOffer(request.id);
                }}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Remove offer
              </button>
            </div>
          ) : onOffer ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOffer(request.id);
              }}
              className="w-full rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
            >
              Offer ride
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
