import { connectDb, disconnectDb } from "../config/db.js";
import { sectionSchemas } from "../content/schemas.js";
import { Section } from "../models/Section.js";

/**
 * One-off, 2026-09-18: the platforms section had one small label and heading
 * shared by all three tabs; each platform now carries its own. Copies the
 * shared pair onto every platform that has none yet (a platform's own values
 * win), then drops the section-level fields. Safe to re-run.
 *
 *   npm run migrate:platform-headings               apply
 *   npm run migrate:platform-headings -- --dry-run  print the result, write nothing
 */

const dryRun = process.argv.includes("--dry-run");

type Stored = { eyebrow?: unknown; lines?: unknown; items?: Record<string, unknown>[] };

const headingText = (lines: { text: string }[][]) => lines.map((line) => line.map((p) => p.text).join("")).join(" / ");

async function main() {
  await connectDb();

  const section = await Section.findOne({ key: "home.platforms" });
  if (!section) {
    console.log("[migrate] no home.platforms section, nothing to do");
    return;
  }

  const data = section.data as Stored;
  const items = data.items ?? [];
  const pending = "eyebrow" in data || "lines" in data || items.some((item) => !("eyebrow" in item) || !("lines" in item));
  if (!pending) {
    console.log("[migrate] already migrated, nothing to do");
    return;
  }

  const next = { items: items.map((item) => ({ eyebrow: data.eyebrow, lines: data.lines, ...item })) };

  // Refuse to write anything the admin could not have saved itself.
  const parsed = sectionSchemas["home.platforms"].safeParse(next);
  if (!parsed.success) {
    console.error("[migrate] result would be invalid, nothing written:", JSON.stringify(parsed.error.issues, null, 2));
    process.exitCode = 1;
    return;
  }

  for (const item of parsed.data.items) {
    console.log(`  ${item.id.padEnd(10)} label ${JSON.stringify(item.eyebrow)}  heading "${headingText(item.lines)}"`);
  }

  if (dryRun) {
    console.log("[migrate] dry run, nothing written");
    return;
  }

  section.set({ data: parsed.data, updatedBy: "migrate:platform-headings" });
  section.markModified("data");
  await section.save();
  console.log("[migrate] home.platforms updated");
}

main()
  .catch((err) => {
    console.error("[migrate] failed", err);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb().catch(() => undefined));
