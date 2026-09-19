import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/ApiError.js";

/**
 * ponytail: fixed-window counter in memory — enough for one API process behind
 * one admin and a contact form. Move to Redis only if the API is ever scaled out.
 */
export function rateLimit({ windowMs, max, key }: { windowMs: number; max: number; key?: (req: Request) => string }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, _res: Response, next: NextFunction) => {
    const now = Date.now();
    const id = key?.(req) ?? req.ip ?? "unknown";
    const entry = hits.get(id);

    if (!entry || entry.resetAt < now) {
      hits.set(id, { count: 1, resetAt: now + windowMs });
      if (hits.size > 5_000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
      return next();
    }
    if (entry.count >= max) {
      return next(ApiError.tooMany("Too many attempts. Please try again in a few minutes."));
    }
    entry.count += 1;
    next();
  };
}
