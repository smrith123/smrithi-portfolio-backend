import type { Request, Response } from "express";
import { ApiError } from "../lib/ApiError.js";
import { isSectionKey } from "../content/schemas.js";
import { getSection, listSections, updateSection } from "../services/content.service.js";

function keyFrom(req: Request) {
  const key = String(req.params.key ?? "");
  if (!isSectionKey(key)) throw ApiError.notFound(`Unknown section "${key}"`);
  return key;
}

export async function list(_req: Request, res: Response) {
  res.json({ items: await listSections() });
}

export async function get(req: Request, res: Response) {
  res.json(await getSection(keyFrom(req)));
}

export async function update(req: Request, res: Response) {
  const doc = await updateSection(keyFrom(req), req.body?.data ?? req.body, req.user?.email);
  res.json(doc);
}
