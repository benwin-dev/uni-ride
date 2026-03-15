import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, index: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

chatMessageSchema.index({ roomId: 1, createdAt: 1 });

export interface ChatMessageDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ChatMessageModel =
  mongoose.models.ChatMessage ?? mongoose.model<ChatMessageDoc>("ChatMessage", chatMessageSchema);
