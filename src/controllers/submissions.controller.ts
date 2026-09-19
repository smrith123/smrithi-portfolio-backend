import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { ContactSubmission } from "../models/ContactSubmission.js";

const query = z.object({
  status: z.enum(["new", "read", "archived"]).optional(),
  q: z.string().trim().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

export async function list(req: Request, res: Response) {
  const parsed = query.safeParse(req.query);
  if (!parsed.success) throw ApiError.badRequest("Invalid query", parsed.error.issues);
  const { status, q, page, limit } = parsed.data;

  const filter = {
    ...(status ? { status } : {}),
    ...(q
      ? { $or: [{ name: new RegExp(escapeRegex(q), "i") }, { email: new RegExp(escapeRegex(q), "i") }, { message: new RegExp(escapeRegex(q), "i") }] }
      : {}),
  };

  const [items, total, unread] = await Promise.all([
    ContactSubmission.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ContactSubmission.countDocuments(filter),
    ContactSubmission.countDocuments({ status: "new" }),
  ]);
  res.json({ items, total, unread, page, pages: Math.ceil(total / limit) || 1 });
}

export async function update(req: Request, res: Response) {
  const parsed = z.object({ status: z.enum(["new", "read", "archived"]) }).safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Invalid status", parsed.error.issues);
  const doc = await ContactSubmission.findByIdAndUpdate(req.params.id, parsed.data, { returnDocument: "after" }).lean();
  if (!doc) throw ApiError.notFound("Submission not found");
  res.json(doc);
}

export async function remove(req: Request, res: Response) {
  const doc = await ContactSubmission.findByIdAndDelete(req.params.id).lean();
  if (!doc) throw ApiError.notFound("Submission not found");
  res.json({ ok: true });
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
