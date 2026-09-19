import { readFile } from "node:fs/promises";
import path from "node:path";
import { connectDb, disconnectDb } from "../config/db.js";
import { saveFile } from "../lib/storage.js";
import { Media } from "../models/Media.js";
import { Section } from "../models/Section.js";

/**
 * One-off cut-over from local-disk media to Cloudinary: re-uploads every file
 * still living under ./uploads and rewrites the URLs stored in the sections.
 * Safe to re-run — docs already on Cloudinary are skipped.
 *
 *   npm run migrate:media
 */

const uploadRoot = path.resolve(process.cwd(), "uploads");

async function main() {
  await connectDb();

  const docs = await Media.find({ url: { $not: /^https:\/\/res\.cloudinary\.com/ } });
  console.log(`[migrate] ${docs.length} media file(s) to move`);

  const rewrites = new Map<string, string>();
  let missing = 0;

  for (const doc of docs) {
    const buffer = await readFile(path.join(uploadRoot, doc.key)).catch(() => null);
    if (!buffer) {
      console.warn(`  ! missing on disk, left alone: ${doc.key}`);
      missing++;
      continue;
    }

    const stored = await saveFile(buffer, doc.originalName, doc.folder);
    rewrites.set(doc.url, stored.url);
    doc.set({ url: stored.url, key: stored.key, width: stored.width ?? doc.width, height: stored.height ?? doc.height });
    await doc.save();
    console.log(`  ✓ ${doc.originalName} -> ${stored.url}`);
  }

  // Section data is free-form JSON, so the URLs are swapped on the serialised form.
  let touched = 0;
  for (const section of await Section.find()) {
    const before = JSON.stringify(section.data);
    let after = before;
    for (const [oldUrl, newUrl] of rewrites) after = after.split(oldUrl).join(newUrl);
    if (after === before) continue;
    section.set("data", JSON.parse(after));
    section.markModified("data");
    await section.save();
    touched++;
  }

  console.log(`[migrate] uploaded: ${rewrites.size}, missing: ${missing}, sections rewritten: ${touched}`);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error("[migrate] failed", err);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
