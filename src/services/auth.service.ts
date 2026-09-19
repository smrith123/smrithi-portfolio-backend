import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { ApiError } from "../lib/ApiError.js";
import { AdminUser } from "../models/AdminUser.js";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  /** Fingerprint of the password the token was issued under; see verifySession(). */
  pv: string;
}

/** Short, non-reversible fingerprint of the stored hash: changes whenever the password does. */
const passwordVersion = (passwordHash: string) => createHash("sha256").update(passwordHash).digest("hex").slice(0, 16);

function sign(user: { _id: unknown; email: string; name: string; passwordHash: string }): string {
  const payload: TokenPayload = { sub: String(user._id), email: user.email, name: user.name, pv: passwordVersion(user.passwordHash) };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" } as jwt.SignOptions);
}

const expired = () => ApiError.unauthorized("Session expired, please sign in again");

/**
 * A valid signature is not enough: the account must still exist and the token
 * must have been issued under its current password, so changing or resetting
 * the password signs out every other session (e.g. a stolen token).
 */
export async function verifySession(token: string): Promise<TokenPayload> {
  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as TokenPayload;
  } catch {
    throw expired();
  }
  const user = await AdminUser.findById(payload.sub).select("email name passwordHash").lean();
  if (!user || payload.pv !== passwordVersion(user.passwordHash)) throw expired();
  return { sub: String(user._id), email: user.email, name: user.name, pv: payload.pv };
}

export async function login(email: string, password: string) {
  const user = await AdminUser.findOne({ email: email.toLowerCase() });
  // Same message either way, so the endpoint cannot be used to enumerate accounts.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw ApiError.unauthorized("Incorrect email or password");
  }
  user.lastLoginAt = new Date();
  await user.save();

  return { token: sign(user), user: { id: String(user._id), email: user.email, name: user.name } };
}

export async function requestPasswordOtp(email: string) {
  const user = await AdminUser.findOne({ email: email.toLowerCase() });
  // Always report success: an attacker learns nothing about which emails exist.
  if (!user) return;

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  user.otpHash = await bcrypt.hash(code, 10);
  user.otpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  await user.save();

  if (env.OTP_CONSOLE_FALLBACK) {
    console.log(`\n[${env.FROM_NAME}] password reset code for ${user.email}: ${code} (valid 10 minutes)\n`);
  }
  // ponytail: no mail transport configured; add one here when SMTP credentials exist.
}

export async function resetPassword(email: string, code: string, newPassword: string) {
  const user = await AdminUser.findOne({ email: email.toLowerCase() });
  if (!user?.otpHash || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
    throw ApiError.badRequest("That reset code has expired. Request a new one.");
  }
  if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
    throw ApiError.tooMany("Too many incorrect codes. Request a new one.");
  }
  if (!(await bcrypt.compare(code, user.otpHash))) {
    user.otpAttempts += 1;
    await user.save();
    throw ApiError.badRequest("That code is not correct");
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  user.otpHash = undefined;
  user.otpExpiresAt = undefined;
  user.otpAttempts = 0;
  await user.save();
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await AdminUser.findById(userId);
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw ApiError.badRequest("Your current password is not correct");
  }
  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  // Every older token is now invalid; this one keeps the person who changed it signed in.
  return sign(user);
}

export const hashPassword = (plain: string) => bcrypt.hash(plain, 12);
