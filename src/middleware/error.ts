import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import { env } from "../config/env.js";
import { ApiError } from "../lib/ApiError.js";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`No route for ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, details: err.details });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Validation failed", details: err.issues });
  }
  if (err instanceof multer.MulterError) {
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    return res.status(400).json({ error: tooBig ? `File is larger than ${env.MAX_UPLOAD_MB}MB` : err.message });
  }
  // Duplicate key, cast errors and anything unexpected.
  const e = err as { name?: string; code?: number; message?: string; status?: number; type?: string };
  // Body-parser errors are the client's: malformed JSON (400), body over the limit (413).
  if (e?.type === "entity.parse.failed") return res.status(400).json({ error: "Malformed JSON body" });
  if (e?.type === "entity.too.large") return res.status(413).json({ error: "Request body is too large" });
  if (typeof e?.status === "number" && e.status >= 400 && e.status < 500) return res.status(e.status).json({ error: "Bad request" });
  if (e?.code === 11000) return res.status(409).json({ error: "That record already exists" });
  if (e?.name === "CastError") return res.status(400).json({ error: "Malformed id" });

  console.error("[error]", err);
  res.status(500).json({ error: env.isProd ? "Something went wrong" : (e?.message ?? "Something went wrong") });
}
