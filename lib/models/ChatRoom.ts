import mongoose from "mongoose";

const chatRoomSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    type: { type: String, required: true, enum: ["ride", "request"] },
    rideId: String,
    requestId: String,
    participantIds: { type: [String], default: [] },
    title: { type: String, default: "Chat" },
  },
  { timestamps: true }
);

chatRoomSchema.index({ id: 1 });
chatRoomSchema.index({ type: 1, rideId: 1 });
chatRoomSchema.index({ type: 1, requestId: 1 });

export interface ChatRoomDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  id: string;
  type: "ride" | "request";
  rideId?: string;
  requestId?: string;
  participantIds: string[];
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ChatRoomModel =
  mongoose.models.ChatRoom ?? mongoose.model<ChatRoomDoc>("ChatRoom", chatRoomSchema);
