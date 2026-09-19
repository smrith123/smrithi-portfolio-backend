import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb(): Promise<void> {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URL);
  // Atlas's copy-paste string has no database path, and Mongoose then quietly uses `test`.
  if (mongoose.connection.name === "test") {
    await mongoose.disconnect();
    throw new Error("MONGODB_URL has no database name: add /smrithi-portfolio before the '?'");
  }
  console.log(`[db] connected to ${mongoose.connection.name}`);
  mongoose.connection.on("disconnected", () => console.warn("[db] disconnected"));
  mongoose.connection.on("reconnected", () => console.log("[db] reconnected"));
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
