import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import { ContactSubmission } from "../models/ContactSubmission.js";
import { getContentPagePayload, getHomePayload, getWorkPayload } from "../services/content.service.js";

export async function getHome(_req: Request, res: Response) {
  res.json(await getHomePayload());
}

export async function getContentPage(_req: Request, res: Response) {
  res.json(await getContentPagePayload());
}

const workSlug = z.enum(["professional-work", "self-content"]);

export async function getWork(req: Request, res: Response) {
  const slug = workSlug.safeParse(req.params.slug);
  if (!slug.success) throw ApiError.notFound("Unknown work page");
  res.json(await getWorkPayload(slug.data));
}

const contactInput = z.object({
  name: z.string().trim().min(1, "Please tell me your name").max(120),
  email: z.email("Please enter a valid email").max(200),
  message: z.string().trim().min(1, "Please write a message").max(5000),
  /** Honeypot: real people never fill a hidden field, and bots must not be told they were caught. */
  website: z.string().max(500).optional(),
});

export async function submitContact(req: Request, res: Response) {
  const parsed = contactInput.safeParse(req.body);
  if (!parsed.success) throw ApiError.badRequest("Please check the form", parsed.error.issues);

  const { name, email, message, website } = parsed.data;
  if (website) return res.status(202).json({ ok: true }); // silently drop bots

  await ContactSubmission.create({
    name,
    email,
    message,
    ip: req.ip,
    userAgent: req.header("user-agent")?.slice(0, 300),
  });
  res.status(201).json({ ok: true });
}
