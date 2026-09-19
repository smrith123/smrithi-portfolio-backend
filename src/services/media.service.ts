import { ApiError } from "../lib/ApiError.js";
import { Media, type MediaKind } from "../models/Media.js";
import { deleteFile, saveFile } from "../lib/storage.js";

export function kindFor(mimeType: string): MediaKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "document";
}

export async function createMedia(file: Express.Multer.File, folder = "media", alt?: string) {
  const kind = kindFor(file.mimetype);
  // Cloudinary reports the dimensions back, so nothing has to probe the buffer.
  const stored = await saveFile(file.buffer, file.originalname, folder, file.mimetype);

  return Media.create({
    url: stored.url,
    key: stored.key,
    kind,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    width: stored.width,
    height: stored.height,
    alt,
    folder,
  });
}

export async function listMedia(options: { kind?: MediaKind; folder?: string; page?: number; limit?: number } = {}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(100, Math.max(1, options.limit ?? 40));
  const filter = {
    ...(options.kind ? { kind: options.kind } : {}),
    ...(options.folder ? { folder: options.folder } : {}),
  };
  const [items, total] = await Promise.all([
    Media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Media.countDocuments(filter),
  ]);
  return { items, total, page, pages: Math.ceil(total / limit) || 1 };
}

export async function deleteMedia(id: string) {
  const doc = await Media.findByIdAndDelete(id);
  if (!doc) throw ApiError.notFound("Media not found");
  await deleteFile(doc.key, doc.mimeType);
  return doc;
}
