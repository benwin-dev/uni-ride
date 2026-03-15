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
  startLat?: number;
  startLng?: number;
  destLat?: number;
  destLng?: number;
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
  sortBy?: "price_asc" | "price_desc" | "destination";
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
  startLat?: number;
  startLng?: number;
  destLat?: number;
  destLng?: number;
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

// Chat: group chats for a ride or ride request (MongoDB-ready)
export type ChatRoomType = "ride" | "request";

export interface ChatRoom {
  id: string;
  type: ChatRoomType;
  rideId?: string;   // when type === "ride"
  requestId?: string; // when type === "request"
  participantIds: string[];
  title: string;     // e.g. "Ride to Walmart"
  createdAt: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
}

/** Parsed ride fields from voice (for API response and form prefill). */
export interface VoiceRidePayload {
  startLocation: string;
  destination: string;
  date: string;
  time: string;
  note?: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
}
