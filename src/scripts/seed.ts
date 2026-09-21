import { readFile } from "node:fs/promises";
import path from "node:path";
import { connectDb, disconnectDb } from "../config/db.js";
import { buildDefaults, seedAssets, type AssetUrls, type SeedAsset } from "../content/defaults.js";
import { sectionKeys } from "../content/schemas.js";
import { Media } from "../models/Media.js";
import { Section } from "../models/Section.js";
import { createMedia } from "../services/media.service.js";

/**
 * Loads the site with the content it currently ships with, so the public API
 * returns exactly what the static frontend rendered before the cut-over.
 *
 *   npm run seed            create anything missing, leave edits alone
 *   npm run seed -- --force overwrite every section with the defaults
 */

const force = process.argv.includes("--force");
const assetsDir = path.resolve(process.cwd(), "../smrithi-portfolio-frontend/public/assets");

const MIME: Record<string, string> = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

async function uploadSeedAssets(): Promise<AssetUrls> {
  const urls = {} as AssetUrls;

  for (const [name, file] of Object.entries(seedAssets) as [SeedAsset, string][]) {
    const existing = await Media.findOne({ folder: "seed", originalName: file }).lean();
    if (existing) {
      urls[name] = existing.url;
      continue;
    }

    const buffer = await readFile(path.join(assetsDir, file)).catch(() => null);
    if (!buffer) {
      console.warn(`  ! missing asset, skipped: ${file}`);
      urls[name] = "";
      continue;
    }

    const doc = await createMedia(
      {
        buffer,
        originalname: file,
        mimetype: MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream",
        size: buffer.length,
      } as Express.Multer.File,
      "seed",
    );
    urls[name] = doc.url;
  }
  return urls;
}

async function main() {
  await connectDb();

  console.log("[seed] uploading the client's assets into the media library…");
  const urls = await uploadSeedAssets();

  const defaults = buildDefaults(urls);
  let created = 0;
  let updated = 0;

  for (const key of sectionKeys) {
    const exists = await Section.exists({ key });
    if (exists && !force) continue;
    await Section.findOneAndUpdate({ key }, { data: defaults[key] }, { upsert: true, setDefaultsOnInsert: true });
    exists ? updated++ : created++;
  }

  console.log(`[seed] sections created: ${created}, overwritten: ${updated}, untouched: ${sectionKeys.length - created - updated}`);
  await disconnectDb();
}

main().catch(async (err) => {
  console.error("[seed] failed", err);
  await disconnectDb().catch(() => undefined);
  process.exit(1);
});
