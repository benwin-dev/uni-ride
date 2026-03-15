import mongoose from "mongoose";

const rideRequestSchema = new mongoose.Schema(
  {
    createdByUserId: { type: String, required: true, index: true },
    requesterName: { type: String, required: true },
    requesterEmail: String,
    startLocation: { type: String, required: true },
    destination: { type: String, required: true },
    startLat: Number,
    startLng: Number,
    destLat: Number,
    destLng: Number,
    date: { type: String, required: true },
    time: { type: String, required: true },
    note: String,
    seatsNeeded: { type: Number, required: true },
    maxPrice: Number,
    status: {
      type: String,
      required: true,
      enum: ["open", "matched", "cancelled"],
      default: "open",
    },
    offeredByUserIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

rideRequestSchema.index({ status: 1 });

export interface RideRequestDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
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
  maxPrice?: number;
  status: "open" | "matched" | "cancelled";
  offeredByUserIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export const RideRequestModel =
  mongoose.models.RideRequest ??
  mongoose.model<RideRequestDoc>("RideRequest", rideRequestSchema);
