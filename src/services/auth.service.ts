import { createHash, timingSafeEqual } from "node:crypto";
import jwt from "jsonwebtoken";
import { admin } from "../config/admin.js";
import { env } from "../config/env.js";
import { ApiError } from "../lib/ApiError.js";

export interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  /** Fingerprint of the password the token was issued under; see verifySession(). */
  pv: string;
}

/**
 * Keyed fingerprint of the configured password: changing ADMIN_PASSWORD
 * invalidates every token already issued. Keyed with JWT_SECRET so the claim,
 * which travels inside the readable part of the token, cannot be used to guess
 * the password offline.
 */
const passwordVersion = () => createHash("sha256").update(`${env.JWT_SECRET}:${admin.password}`).digest("hex").slice(0, 16);

/** Constant-time compare; the digests also make the two sides equal length. */
const matches = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

const expired = () => ApiError.unauthorized("Session expired, please sign in again");

const session = () => ({ id: "admin", email: admin.email, name: admin.name });

export function login(email: string, password: string) {
  // Same message either way, and both sides compared in constant time.
  if (!matches(email.trim().toLowerCase(), admin.email) || !matches(password, admin.password)) {
    throw ApiError.unauthorized("Incorrect email or password");
  }
  const user = session();
  const payload: TokenPayload = { sub: user.id, email: user.email, name: user.name, pv: passwordVersion() };
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN, algorithm: "HS256" } as jwt.SignOptions);
  return { token, user };
}

/**
 * A valid signature is not enough: the token must name the configured account
 * and have been issued under its current password, so changing ADMIN_PASSWORD
 * signs out every session (e.g. a stolen token).
 */
export function verifySession(token: string): TokenPayload {
  let payload: TokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] }) as TokenPayload;
  } catch {
    throw expired();
  }
  if (payload.email !== admin.email || payload.pv !== passwordVersion()) throw expired();
  return payload;
}
