import type { Request, Response } from "express";
import { z } from "zod";
import { ApiError } from "../lib/ApiError.js";
import * as auth from "../services/auth.service.js";

const parse = <T extends z.ZodType>(schema: T, body: unknown): z.infer<T> => {
  const parsed = schema.safeParse(body);
  if (!parsed.success) throw ApiError.badRequest("Please check the form", parsed.error.issues);
  return parsed.data;
};

const password = z.string().min(8, "Use at least 8 characters").max(200);

export async function login(req: Request, res: Response) {
  const { email, password: pw } = parse(z.object({ email: z.email(), password: z.string().min(1) }), req.body);
  try {
    res.json(await auth.login(email, pw));
  } catch (err) {
    // Security log (never the password). The IP also confirms the proxy setting after deploy.
    if (err instanceof ApiError && err.status === 401) console.warn(`[auth] failed sign-in for ${email} from ${req.ip}`);
    throw err;
  }
}

export async function me(req: Request, res: Response) {
  const user = req.user;
  if (!user) throw ApiError.unauthorized();
  res.json({ user: { id: user.sub, email: user.email, name: user.name } });
}

export async function forgotPassword(req: Request, res: Response) {
  const { email } = parse(z.object({ email: z.email() }), req.body);
  await auth.requestPasswordOtp(email);
  res.json({ ok: true, message: "If that account exists, a reset code has been sent." });
}

export async function resetPassword(req: Request, res: Response) {
  const body = parse(
    z.object({ email: z.email(), code: z.string().trim().length(6, "The code is 6 digits"), password }),
    req.body,
  );
  await auth.resetPassword(body.email, body.code, body.password);
  res.json({ ok: true });
}

export async function changePassword(req: Request, res: Response) {
  const body = parse(z.object({ currentPassword: z.string().min(1), password }), req.body);
  // A fresh token: the change signs out every other session, not this one.
  const token = await auth.changePassword(req.user!.sub, body.currentPassword, body.password);
  res.json({ ok: true, token });
}
