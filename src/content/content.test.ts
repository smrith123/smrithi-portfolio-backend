import assert from "node:assert/strict";
import test from "node:test";
import { buildDefaults, seedAssets, type AssetUrls, type SeedAsset } from "./defaults.js";
import { MAX_PLATFORM_IMAGES, homeSectionKeys, sectionKeys, sectionSchemas } from "./schemas.js";
import { slugifyFilename } from "../lib/filename.js";

const urls = Object.fromEntries(
  (Object.keys(seedAssets) as SeedAsset[]).map((name) => [name, `https://cdn.test/${name}.png`]),
) as AssetUrls;

test("every section ships defaults that satisfy its own schema", () => {
  const defaults = buildDefaults(urls);
  for (const key of sectionKeys) {
    const result = sectionSchemas[key].safeParse(defaults[key]);
    assert.ok(result.success, `${key} failed validation: ${JSON.stringify(result.error?.issues)}`);
  }
});

test("the home payload covers every section the frontend renders", () => {
  const expected = ["hero", "about", "contentPortfolio", "platforms", "journey", "projects", "brands", "media", "career", "contact"];
  assert.deepEqual(homeSectionKeys.map((k) => k.split(".")[1]), expected);
});

test("schemas reject content the admin should have caught", () => {
  const defaults = buildDefaults(urls);

  const badTint = structuredClone(defaults["home.projects"]) as { items: { tint: string }[] };
  badTint.items[0].tint = "hot pink";
  assert.equal(sectionSchemas["home.projects"].safeParse(badTint).success, false);

  const badEmail = structuredClone(defaults["home.contact"]) as { email: string };
  badEmail.email = "not-an-email";
  assert.equal(sectionSchemas["home.contact"].safeParse(badEmail).success, false);

  const noImage = structuredClone(defaults["home.hero"]) as { portrait: string };
  noImage.portrait = "";
  assert.equal(sectionSchemas["home.hero"].safeParse(noImage).success, false);
});

test("each platform accepts up to six photos and rejects a seventh", () => {
  const withPhotos = (count: number) => {
    const section = structuredClone(buildDefaults(urls)["home.platforms"]) as { items: { images: { url: string }[] }[] };
    section.items[1].images = Array.from({ length: count }, (_, i) => ({ url: `https://cdn.test/p${i}.png` }));
    return sectionSchemas["home.platforms"].safeParse(section);
  };

  assert.equal(MAX_PLATFORM_IMAGES, 6);
  assert.equal(withPhotos(0).success, true);
  assert.equal(withPhotos(MAX_PLATFORM_IMAGES).success, true);

  const over = withPhotos(MAX_PLATFORM_IMAGES + 1);
  assert.equal(over.success, false);
  // The limit is per platform: the error points at the one that overflowed.
  assert.deepEqual(over.error?.issues[0]?.path, ["items", 1, "images"]);
  assert.match(over.error?.issues[0]?.message ?? "", /at most 6 photos/);
});

test("each platform carries its own small label and heading", () => {
  type Item = { eyebrow?: string; lines?: unknown };
  const section = structuredClone(buildDefaults(urls)["home.platforms"]) as { items: Item[] };
  const schema = sectionSchemas["home.platforms"];

  // Editing one platform must not change another.
  section.items[0].eyebrow = "-Instagram";
  assert.equal(section.items[1].eyebrow, "-Platforms");
  assert.equal(schema.safeParse(section).success, true);

  // No section-level heading any more: it would be silently stripped, never rendered.
  assert.equal("eyebrow" in (schema.parse({ ...section, eyebrow: "-Old" }) as object), false);

  const missing = structuredClone(section);
  delete missing.items[2].lines;
  assert.deepEqual(schema.safeParse(missing).error?.issues[0]?.path, ["items", 2, "lines"]);
});

test("a heading made only of blank rows is rejected everywhere", () => {
  const section = structuredClone(buildDefaults(urls)["home.platforms"]) as { items: { lines: unknown }[] };
  section.items[0].lines = [[{ text: "" }], [{ text: "   " }]];
  const result = sectionSchemas["home.platforms"].safeParse(section);
  assert.equal(result.success, false);
  assert.equal(result.error?.issues[0]?.message, "The heading can't be empty");

  // Blank spacer rows are still fine when some line has text.
  section.items[0].lines = [[{ text: "Shot on" }], [{ text: "" }], [{ text: "iPhone", accent: true }]];
  assert.equal(sectionSchemas["home.platforms"].safeParse(section).success, true);
});

test("uploaded filenames become safe url segments", () => {
  assert.equal(slugifyFilename("Mask group (3).png"), "mask-group-3");
  assert.equal(slugifyFilename("683922ED-17FC-49B9 5 (1).PNG"), "683922ed-17fc-49b9-5-1");
  assert.equal(slugifyFilename("...."), "file");
});
