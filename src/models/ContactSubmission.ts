import { Schema, model } from "mongoose";

export type SubmissionStatus = "new" | "read" | "archived";

export interface ContactSubmissionDoc {
  name: string;
  email: string;
  message: string;
  status: SubmissionStatus;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<ContactSubmissionDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, enum: ["new", "read", "archived"], default: "new", index: true },
    ip: String,
    userAgent: String,
  },
  { timestamps: true },
);

schema.index({ createdAt: -1 });

export const ContactSubmission = model<ContactSubmissionDoc>("ContactSubmission", schema);
