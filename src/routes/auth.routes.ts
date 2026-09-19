import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

export const authRouter: Router = Router();

/**
 * Separate buckets on purpose: someone who has locked themselves out of the
 * login form can still request a reset code.
 */
const loginLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const resetLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });

authRouter.post("/login", loginLimit, controller.login);
authRouter.post("/forgot-password", resetLimit, controller.forgotPassword);
authRouter.post("/reset-password", resetLimit, controller.resetPassword);

authRouter.get("/me", requireAuth, controller.me);
authRouter.post("/change-password", requireAuth, controller.changePassword);
