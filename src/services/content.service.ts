import { ApiError } from "../lib/ApiError.js";
import { Section } from "../models/Section.js";
import { homeSectionKeys, sectionKeys, sectionSchemas, type SectionKey } from "../content/schemas.js";
import { revalidateSite } from "../lib/revalidate.js";

/** Strips the `home.` / `works.` prefix: `home.hero` -> `hero`. */
const leaf = (key: SectionKey) => key.split(".").slice(1).join(".");

export async function listSections() {
  const docs = await Section.find().sort({ key: 1 }).lean();
  const byKey = new Map(docs.map((d) => [d.key, d]));
  return sectionKeys.map((key) => ({
    key,
    updatedAt: byKey.get(key)?.updatedAt ?? null,
    seeded: byKey.has(key),
  }));
}

export async function getSection(key: SectionKey) {
  const doc = await Section.findOne({ key }).lean();
  if (!doc) throw ApiError.notFound(`Section "${key}" has not been created yet. Run the seed script.`);
  return doc;
}

export async function updateSection(key: SectionKey, data: unknown, updatedBy?: string) {
  const parsed = sectionSchemas[key].safeParse(data);
  if (!parsed.success) {
    throw ApiError.badRequest("The submitted content is not valid", parsed.error.issues);
  }
  const doc = await Section.findOneAndUpdate(
    { key },
    { data: parsed.data, updatedBy },
    { returnDocument: "after", upsert: true, setDefaultsOnInsert: true },
  ).lean();
  await revalidateSite();
  return doc!;
}

async function dataFor(keys: readonly SectionKey[]) {
  const docs = await Section.find({ key: { $in: keys as SectionKey[] } }).lean();
  const byKey = new Map(docs.map((d) => [d.key, d.data]));
  const missing = keys.filter((k) => !byKey.has(k));
  if (missing.length) throw ApiError.notFound(`Content missing: ${missing.join(", ")}. Run the seed script.`);
  return byKey;
}

/** Exactly the shape of the frontend's `HomeContent`. */
export async function getHomePayload() {
  const keys = ["site.nav", ...homeSectionKeys] as const;
  const data = await dataFor(keys);
  const nav = data.get("site.nav") as { items: unknown[] };
  return {
    nav: nav.items,
    ...Object.fromEntries(homeSectionKeys.map((key) => [leaf(key), data.get(key)])),
  };
}

export async function getContentPagePayload() {
  return (await getSection("page.content")).data;
}

export async function getWorkPayload(slug: "professional-work" | "self-content") {
  return (await getSection(`works.${slug}` as SectionKey)).data;
}
