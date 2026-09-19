import { readFile } from "node:fs/promises";
import path from "node:path";
import { connectDb, disconnectDb } from "../config/db.js";
import { env } from "../config/env.js";
import { buildDefaults, seedAssets, type AssetUrls, type SeedAsset } from "../content/defaults.js";
import { sectionKeys } from "../content/schemas.js";
import { AdminUser } from "../models/AdminUser.js";
import { Media } from "../models/Media.js";
import { Section } from "../models/Section.js";
import { createMedia } from "../services/media.service.js";
import { hashPassword } from "../services/auth.service.js";

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

  const email = env.ADMIN_EMAIL.toLowerCase();
  const admin = await AdminUser.findOne({ email });
  if (admin) {
    console.log(`[seed] admin already exists: ${email}`);
  } else {
    // Never fall back to the published default password, and never print the password.
    const pw = env.ADMIN_PASSWORD;
    if (!pw || pw.length < 8 || pw === "ChangeMe123!") {
      throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters, not the old example value) before seeding the first admin.");
    }
    await AdminUser.create({ email, name: env.ADMIN_NAME, passwordHash: await hashPassword(pw) });
    console.log(`[seed] admin created: ${email} (password from ADMIN_PASSWORD; change it after first sign-in)`);
  }

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
