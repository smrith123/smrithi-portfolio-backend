import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import * as auth from "../services/auth.service.js";

const parse = <T extends z.ZodType>(schema: T, body: unknown): z.infer<T> => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw ApiError.badRequest("Please check the form", parsed.error.issues);
  return parsed.data;
};

export function login(req: Request, res: Response) {
  const { email, password } = parse(z.object({ email: z.email(), password: z.string().min(1) }), req.body);
  try {
    res.json(auth.login(email, password));
  } catch (err) {
    // Security log (never the password). The IP also confirms the proxy setting after deploy.
    if (err instanceof ApiError && err.status === 401) console.warn(`[auth] failed sign-in for ${email} from ${req.ip}`);
    throw err;
  }
}

export function me(req: Request, res: Response) {
  const user = req.user;
  if (!user) throw ApiError.unauthorized();
  res.json({ user: { id: user.sub, email: user.email, name: user.name } });
}
