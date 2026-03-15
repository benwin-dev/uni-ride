import mongoose from "mongoose";

const rideSchema = new mongoose.Schema(
  {
    createdByUserId: { type: String, required: true, index: true },
    creatorName: { type: String, required: true },
    creatorEmail: String,
    startLocation: { type: String, required: true },
    destination: { type: String, required: true },
    startLat: Number,
    startLng: Number,
    destLat: Number,
    destLng: Number,
    distanceKm: Number,
    date: { type: String, required: true, index: true },
    time: { type: String, required: true },
    note: String,
    price: { type: Number, required: true, default: 0 },
    isFree: { type: Boolean, required: true, default: true },
    availableSeats: { type: Number, required: true },
    totalSeats: { type: Number, required: true },
    status: {
      type: String,
      required: true,
      enum: ["active", "full", "completed", "cancelled"],
      default: "active",
    },
    joinedUserIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

rideSchema.index({ status: 1, date: 1 });

export interface RideDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  createdByUserId: string;
  creatorName: string;
  creatorEmail?: string;
  startLocation: string;
  destination: string;
  startLat?: number;
  startLng?: number;
  destLat?: number;
  destLng?: number;
  distanceKm?: number;
  date: string;
  time: string;
  note?: string;
  price: number;
  isFree: boolean;
  availableSeats: number;
  totalSeats: number;
  status: "active" | "full" | "completed" | "cancelled";
  joinedUserIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const RideModel =
  mongoose.models.Ride ?? mongoose.model<RideDoc>("Ride", rideSchema);
