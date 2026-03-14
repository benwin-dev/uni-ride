// MongoDB-ready types for UniRide (can map to Mongoose schemas later)

export type RideStatus = "active" | "full" | "completed" | "cancelled";

export interface User {
  id: string;
  name: string;
  email: string;
  university: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Ride {
  id: string;
  createdByUserId: string;
  creatorName: string;
  creatorEmail?: string;
  startLocation: string;
  destination: string;
  date: string;
  time: string;
  note?: string;
  price: number;
  isFree: boolean;
  availableSeats: number;
  totalSeats: number;
  status: RideStatus;
  joinedUserIds: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface RideFilters {
  destination?: string;
  priceMin?: number;
  priceMax?: number;
  freeOnly?: boolean;
  date?: string;
  time?: string;
  minSeats?: number;
  sortBy?: "soonest" | "price_asc" | "price_desc" | "destination";
}

// Ride request: user is looking for a ride (MongoDB-ready)
export type RequestStatus = "open" | "matched" | "cancelled";

export interface RideRequest {
  id: string;
  createdByUserId: string;
  requesterName: string;
  requesterEmail?: string;
  startLocation: string;
  destination: string;
  date: string;
  time: string;
  note?: string;
  seatsNeeded: number;
  maxPrice?: number; // optional; undefined or 0 = prefer free
  status: RequestStatus;
  offeredByUserIds: string[]; // users who clicked "Offer ride"
  createdAt: string;
  updatedAt?: string;
}
