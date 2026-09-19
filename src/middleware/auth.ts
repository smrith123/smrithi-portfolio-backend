import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/ApiError.js";
import { verifySession } from "../services/auth.service.js";

/** Bearer-token gate for every /api/admin route (and /auth/me, /auth/change-password). */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return next(ApiError.unauthorized("Sign in to continue"));
  }
  req.user = await verifySession(token);
  next();
}
