import type { mongoose } from "mongoose";

/** Convert Mongoose doc to JSON with string id and ISO date strings. */
export function toJSON<T extends { _id: mongoose.Types.ObjectId; createdAt?: Date; updatedAt?: Date }>(
  doc: T,
  omit: (keyof T)[] = []
): Omit<T, "_id" | "createdAt" | "updatedAt"> & {
  id: string;
  createdAt: string;
  updatedAt?: string;
} {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  const out: Record<string, unknown> = { ...obj };
  out.id = (doc._id as mongoose.Types.ObjectId).toString();
  delete out._id;
  if (out.createdAt) out.createdAt = (out.createdAt as Date).toISOString();
  if (out.updatedAt) out.updatedAt = (out.updatedAt as Date).toISOString();
  omit.forEach((k) => delete out[k as string]);
  return out as Omit<T, "_id" | "createdAt" | "updatedAt"> & {
    id: string;
    createdAt: string;
    updatedAt?: string;
  };
}
