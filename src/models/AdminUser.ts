import { Schema, model } from "mongoose";

export interface AdminUserDoc {
  email: string;
  name: string;
  passwordHash: string;
  /** Hashed password-reset OTP; never store the code itself. */
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts: number;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<AdminUserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    otpHash: String,
    otpExpiresAt: Date,
    otpAttempts: { type: Number, default: 0 },
    lastLoginAt: Date,
  },
  { timestamps: true },
);

export const AdminUser = model<AdminUserDoc>("AdminUser", schema);
