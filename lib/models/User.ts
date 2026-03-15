import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    university: { type: String, required: true, trim: true },
    phone: String,
    avatar: String,
    bio: String,
    totalCO2SavedKg: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export interface UserDoc extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  university: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  totalCO2SavedKg?: number;
  createdAt: Date;
  updatedAt: Date;
}

export const UserModel =
  mongoose.models.User ?? mongoose.model<UserDoc>("User", userSchema);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
