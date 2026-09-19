import { createHash, randomUUID } from "node:crypto";
import { env } from "../config/env.js";
import { ApiError } from "./ApiError.js";
import { slugifyFilename } from "./filename.js";

export interface StoredFile {
  /** Absolute URL the frontend renders. */
  url: string;
  /** Cloudinary public_id — the only thing delete needs. */
  key: string;
  width?: number;
  height?: number;
}

export { slugifyFilename } from "./filename.js";

/** Cloudinary stores PDFs under the `image` resource type; only video differs. */
function resourceType(mimeType: string): "image" | "video" {
  return mimeType.startsWith("video/") ? "video" : "image";
}

/** Signed Cloudinary call. Signature = sha1 of the sorted params plus the secret. */
async function call(
  endpoint: string,
  params: Record<string, string>,
  file?: { buffer: Buffer; name: string },
): Promise<Record<string, any>> {
  const signed: Record<string, string> = { ...params, timestamp: String(Math.floor(Date.now() / 1000)) };
  const signature = createHash("sha1")
    .update(
      Object.keys(signed)
        .sort()
        .map((k) => `${k}=${signed[k]}`)
        .join("&") + env.CLOUDINARY_API_SECRET,
    )
    .digest("hex");

  const form = new FormData();
  for (const [k, v] of Object.entries(signed)) form.append(k, v);
  form.append("api_key", env.CLOUDINARY_API_KEY);
  form.append("signature", signature);
  // Blob copies the bytes once; wrapping the buffer in a Uint8Array first would copy them twice.
  if (file) form.append("file", new Blob([file.buffer as Uint8Array<ArrayBuffer>]), file.name);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/${endpoint}`, {
    method: "POST",
    body: form,
    // A stalled upload would otherwise hold its buffer in memory indefinitely.
    signal: AbortSignal.timeout(5 * 60_000),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, any>;
  if (!res.ok) {
    const reason = body?.error?.message ?? `HTTP ${res.status}`;
    // 4xx is the uploader's fault — too large, wrong format — so say so plainly.
    if (res.status < 500) throw ApiError.badRequest(`Cloudinary rejected the file: ${reason}`);
    throw new Error(`Cloudinary ${endpoint} failed: ${reason}`);
  }
  return body;
}

/**
 * Cloudinary storage. Everything that touches the media host lives here, so
 * moving to S3 later means reimplementing these two functions.
 */
export async function saveFile(buffer: Buffer, originalName: string, folder = "media", mimeType = "image/*"): Promise<StoredFile> {
  // The resource type follows the declared MIME type (not "auto"), so Cloudinary itself rejects a
  // file that is not the image or video it claims to be, and deleteFile() later finds it again.
  const body = await call(
    `${resourceType(mimeType)}/upload`,
    { folder, public_id: `${slugifyFilename(originalName)}-${randomUUID().slice(0, 8)}` },
    { buffer, name: originalName },
  );
  return { url: body.secure_url, key: body.public_id, width: body.width, height: body.height };
}

/** `mimeType` picks the resource type; deleting with the wrong one silently no-ops. */
export async function deleteFile(key: string, mimeType = "image/*"): Promise<void> {
  const body = await call(`${resourceType(mimeType)}/destroy`, { public_id: key, invalidate: "true" });
  if (body.result !== "ok") console.warn(`[storage] Cloudinary had nothing to delete for ${key} (${body.result})`);
}
