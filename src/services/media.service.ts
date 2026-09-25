import { ApiError } from "../lib/ApiError.js";
import { Media, type MediaKind } from "../models/Media.js";
import { Section } from "../models/Section.js";
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

/** "home.contentPortfolio" -> "Content portfolio", "works.self-content" -> "Self content". */
const sectionLabel = (key: string) => {
  const words = (key.split(".").pop() ?? key).replace(/([a-z])([A-Z])/g, "$1 $2").replace(/-/g, " ").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Sections whose saved content points at this file. Section content stores absolute file URLs. */
async function sectionsUsing(url: string) {
  const sections = await Section.find().select("key data").lean();
  return sections.filter((s) => JSON.stringify(s.data).includes(url)).map((s) => sectionLabel(s.key));
}

export async function deleteMedia(id: string) {
  const doc = await Media.findById(id);
  if (!doc) throw ApiError.notFound("Media not found");
  // Deleting removes the file from Cloudinary, so a file the live site still shows would break there.
  const usedIn = await sectionsUsing(doc.url);
  if (usedIn.length) {
    throw new ApiError(409, `This file is still used on the site (${usedIn.join(", ")}). Replace it there first, then delete it.`);
  }
  await doc.deleteOne();
  await deleteFile(doc.key, doc.mimeType);
  return doc;
}
