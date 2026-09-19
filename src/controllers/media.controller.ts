import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { Media } from "../models/Media.js";
import { createMedia, deleteMedia, listMedia } from "../services/media.service.js";

const query = z.object({
  kind: z.enum(["image", "video", "document"]).optional(),
  folder: z.string().trim().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
});

export async function list(req: Request, res: Response) {
  const parsed = query.safeParse(req.query);
  if (!parsed.success) throw ApiError.badRequest("Invalid query", parsed.error.issues);
  res.json(await listMedia(parsed.data));
}

export async function upload(req: Request, res: Response) {
  const files = (req.files as Express.Multer.File[] | undefined) ?? (req.file ? [req.file] : []);
  if (!files.length) throw ApiError.badRequest("No file was uploaded");

  // Folder names become Cloudinary paths: letters, digits and dashes only.
  const folder = typeof req.body?.folder === "string" && /^[a-z0-9][a-z0-9-]{0,39}$/i.test(req.body.folder) ? req.body.folder : "media";
  const alt = typeof req.body?.alt === "string" ? req.body.alt.slice(0, 300) : undefined;
  const items = [];
  for (const file of files) items.push(await createMedia(file, folder, alt));
  res.status(201).json({ items });
}

export async function update(req: Request, res: Response) {
  const alt = z.object({ alt: z.string().max(300) }).safeParse(req.body);
  if (!alt.success) throw ApiError.badRequest("Invalid alt text", alt.error.issues);
  const doc = await Media.findByIdAndUpdate(req.params.id, { alt: alt.data.alt }, { returnDocument: "after" }).lean();
  if (!doc) throw ApiError.notFound("Media not found");
  res.json(doc);
}

export async function remove(req: Request, res: Response) {
  await deleteMedia(String(req.params.id));
  res.json({ ok: true });
}
