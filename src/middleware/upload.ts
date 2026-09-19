import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../lib/ApiError.js";

const ALLOWED = [
  /^image\/(jpeg|png|webp|avif|gif|svg\+xml)$/,
  /^video\/(mp4|webm|quicktime)$/,
  /^application\/pdf$/,
];

/**
 * Files are buffered in memory and handed to the storage layer, so swapping
 * local disk for S3/Cloudinary never touches this file.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_UPLOAD_MB * 1024 * 1024, files: 10 },
  fileFilter(_req, file, cb) {
    if (ALLOWED.some((re) => re.test(file.mimetype))) return cb(null, true);
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  },
});

/**
 * Multer holds every file of a request in memory before the handler runs, and
 * the upload to Cloudinary needs one more copy, so the whole request is capped,
 * not just each file: anything over MAX_UPLOAD_MB (+1MB of form overhead) is
 * refused before a byte is read. Worst case ~2x MAX_UPLOAD_MB of memory, which
 * fits a 512MB Render instance at the 100MB default.
 */
export function limitUploadRequest(req: Request, _res: Response, next: NextFunction) {
  const length = Number(req.headers["content-length"]);
  if (!Number.isFinite(length)) return next(new ApiError(411, "Upload size unknown (missing Content-Length)"));
  if (length > (env.MAX_UPLOAD_MB + 1) * 1024 * 1024) {
    return next(new ApiError(413, `Uploads are limited to ${env.MAX_UPLOAD_MB}MB per request`));
  }
  next();
}
