import path from "node:path";

/**
 * `Ballerina Shoes (2).PNG` -> `ballerina-shoes-2`. Kept free of the env and
 * storage modules so tests can use it without any configuration or secrets.
 */
export function slugifyFilename(name: string): string {
  return (
    path
      .basename(name, path.extname(name))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "file"
  );
}
