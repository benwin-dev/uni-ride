"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRides } from "@/context/RidesContext";
import { useRideRequests } from "@/context/RideRequestsContext";
import type { Ride, RideStatus } from "@/lib/types";
import type { RideRequest, RequestStatus } from "@/lib/types";

function StatusBadge({ status }: { status: RideStatus }) {
  const styles: Record<RideStatus, string> = {
    active: "bg-teal-100 text-teal-800",
    full: "bg-amber-100 text-amber-800",
    completed: "bg-stone-100 text-stone-600",
    cancelled: "bg-red-100 text-red-800",
  };
  const labels: Record<RideStatus, string> = {
    active: "Active",
    full: "Seats Full",
    completed: "Completed",
    cancelled: "Cancelled",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

type Tab = "created" | "joined" | "requests" | "offering";

function RequestStatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    open: "bg-sky-100 text-sky-800",
    matched: "bg-emerald-100 text-emerald-800",
    cancelled: "bg-red-100 text-red-800",
  };
  const labels: Record<RequestStatus, string> = {
    open: "Open",
    matched: "Matched",
    cancelled: "Cancelled",
  };
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

export default function MyRidesPage() {
  const { user } = useAuth();
  const { ridesCreatedByUser, ridesJoinedByUser } = useRides();
  const { requestsByUser, requestsOfferedByUser } = useRideRequests();
  const [tab, setTab] = useState<Tab>("created");

  const created = user ? ridesCreatedByUser(user.id) : [];
  const joined = user ? ridesJoinedByUser(user.id) : [];
  const myRequests = user ? requestsByUser(user.id) : [];
  const offeringToHelp = user ? requestsOfferedByUser(user.id) : [];

  if (!user) return null;

  return (
    <div className="p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-stone-900">My Rides</h1>
        <p className="mt-1 text-stone-600">
          Rides you created and rides you joined.
        </p>

        <div className="mt-6 flex gap-1 rounded-lg border border-stone-200/80 bg-white p-1">
          <button
            type="button"
            onClick={() => setTab("created")}
            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              tab === "created" ? "bg-teal-50 text-teal-700" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            Rides I created ({created.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("joined")}
            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              tab === "joined" ? "bg-teal-50 text-teal-700" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            Rides I joined ({joined.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("requests")}
            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              tab === "requests" ? "bg-teal-50 text-teal-700" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            My ride requests ({myRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("offering")}
            className={`flex-1 rounded-md px-3 py-2.5 text-sm font-medium transition ${
              tab === "offering" ? "bg-teal-50 text-teal-700" : "text-stone-600 hover:bg-stone-50"
            }`}
          >
            Offering to help ({offeringToHelp.length})
          </button>
        </div>

        {tab === "created" && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-800">Rides I created</h2>
            <p className="mt-1 text-sm text-stone-500">Edit, cancel, or delete rides you created.</p>
            {created.length === 0 ? (
              <div className="mt-6 rounded-xl border border-stone-200/80 bg-white p-12 text-center">
                <p className="text-stone-500">You haven’t created any rides yet.</p>
                <Link
                  href="/rides/create"
                  className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Create a ride
                </Link>
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {created.map((ride) => (
                  <RideCardCreated key={ride.id} ride={ride} />
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "joined" && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-800">Rides I joined</h2>
            <p className="mt-1 text-sm text-stone-500">Rides you booked. You can leave a ride if your plans change.</p>
            {joined.length === 0 ? (
              <div className="mt-6 rounded-xl border border-stone-200/80 bg-white p-12 text-center">
                <p className="text-stone-500">You haven’t joined any rides yet.</p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Browse rides
                </Link>
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {joined.map((ride) => (
                  <RideCardJoined key={ride.id} ride={ride} userId={user.id} />
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "requests" && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-800">My ride requests</h2>
            <p className="mt-1 text-sm text-stone-500">Requests you posted. Cancel or delete if your plans change.</p>
            {myRequests.length === 0 ? (
              <div className="mt-6 rounded-xl border border-stone-200/80 bg-white p-12 text-center">
                <p className="text-stone-500">You haven’t requested any rides yet.</p>
                <Link
                  href="/rides/request"
                  className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Request a ride
                </Link>
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {myRequests.map((req) => (
                  <RequestCardMyRides key={req.id} request={req} />
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === "offering" && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-stone-800">Rides I'm offering to help with</h2>
            <p className="mt-1 text-sm text-stone-500">Ride requests you offered to fulfill. Remove offer if your plans change.</p>
            {offeringToHelp.length === 0 ? (
              <div className="mt-6 rounded-xl border border-stone-200/80 bg-white p-12 text-center">
                <p className="text-stone-500">You haven’t offered to help with any ride requests yet.</p>
                <Link
                  href="/dashboard"
                  className="mt-4 inline-block rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Browse ride requests
                </Link>
              </div>
            ) : (
              <ul className="mt-6 space-y-4">
                {offeringToHelp.map((req) => (
                  <RequestCardOffering key={req.id} request={req} userId={user.id} />
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function RideCardCreated({ ride }: { ride: Ride }) {
  const { updateRide, deleteRide } = useRides();

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.confirm("Cancel this ride? It will be marked as cancelled.")) {
      updateRide(ride.id, { status: "cancelled" });
    }
  };

  const handleDelete = () => {
    if (typeof window !== "undefined" && window.confirm("Permanently delete this ride? This cannot be undone.")) {
      deleteRide(ride.id, ride.createdByUserId);
    }
  };

  return (
    <li className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">{ride.destination}</h3>
          {ride.note && (
            <p className="mt-1 text-sm text-stone-600 line-clamp-2">{ride.note}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
            <span>{ride.date}</span>
            <span>{ride.time}</span>
            <span>{ride.availableSeats} / {ride.totalSeats} seats</span>
            <span>{ride.isFree ? "Free" : `$${ride.price}`}</span>
          </div>
        </div>
        <StatusBadge status={ride.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(ride.status === "active" || ride.status === "full") && (
          <Link
            href={`/rides/${ride.id}/edit`}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Edit
          </Link>
        )}
        {(ride.status === "active" || ride.status === "full") && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
          >
            Cancel ride
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
        <span className="text-xs text-stone-400">{ride.joinedUserIds.length} joined</span>
      </div>
    </li>
  );
}

function RideCardJoined({ ride, userId }: { ride: Ride; userId: string }) {
  const { leaveRide } = useRides();

  const handleLeave = () => {
    if (typeof window !== "undefined" && window.confirm("Leave this ride? Your seat will become available again.")) {
      leaveRide(ride.id, userId);
    }
  };

  return (
    <li className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">{ride.destination}</h3>
          {ride.note && (
            <p className="mt-1 text-sm text-stone-600 line-clamp-2">{ride.note}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
            <span>{ride.date}</span>
            <span>{ride.time}</span>
            <span>by {ride.creatorName}</span>
            <span>{ride.isFree ? "Free" : `$${ride.price}`}</span>
          </div>
        </div>
        <StatusBadge status={ride.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(ride.status === "active" || ride.status === "full") && (
          <button
            type="button"
            onClick={handleLeave}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Leave ride
          </button>
        )}
      </div>
    </li>
  );
}

function RequestCardMyRides({ request }: { request: RideRequest }) {
  const { updateRequest, deleteRequest } = useRideRequests();

  const handleCancel = () => {
    if (typeof window !== "undefined" && window.confirm("Cancel this ride request?")) {
      updateRequest(request.id, { status: "cancelled" });
    }
  };

  const handleDelete = () => {
    if (typeof window !== "undefined" && window.confirm("Permanently delete this request?")) {
      deleteRequest(request.id, request.createdByUserId);
    }
  };

  return (
    <li className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">{request.destination}</h3>
          {request.note && (
            <p className="mt-1 text-sm text-stone-600 line-clamp-2">{request.note}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
            <span>{request.date}</span>
            <span>{request.time}</span>
            <span>{request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""} needed</span>
            {(request.maxPrice == null || request.maxPrice === 0) ? (
              <span className="text-emerald-600">Prefer free</span>
            ) : (
              <span>Up to ${request.maxPrice}</span>
            )}
          </div>
          <p className="mt-1 text-xs text-stone-400">from {request.startLocation}</p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {request.status === "open" && (
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border border-amber-200 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
          >
            Cancel request
          </button>
        )}
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}

function RequestCardOffering({ request, userId }: { request: RideRequest; userId: string }) {
  const { removeOffer } = useRideRequests();

  const handleRemoveOffer = () => {
    if (typeof window !== "undefined" && window.confirm("Remove your offer to help with this ride?")) {
      removeOffer(request.id, userId);
    }
  };

  return (
    <li className="rounded-xl border border-stone-200/80 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-stone-900">{request.destination}</h3>
          {request.note && (
            <p className="mt-1 text-sm text-stone-600 line-clamp-2">{request.note}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-stone-500">
            <span>{request.date}</span>
            <span>{request.time}</span>
            <span>by {request.requesterName}</span>
            <span>{request.seatsNeeded} seat{request.seatsNeeded !== 1 ? "s" : ""} needed</span>
          </div>
          <p className="mt-1 text-xs text-stone-400">from {request.startLocation}</p>
        </div>
        <RequestStatusBadge status={request.status} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {request.status === "open" && (
          <button
            type="button"
            onClick={handleRemoveOffer}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Remove offer
          </button>
        )}
      </div>
    </li>
  );
}
