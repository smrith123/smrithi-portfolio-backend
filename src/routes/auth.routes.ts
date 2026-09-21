import { Router } from "express";
import * as controller from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter: Router = Router();

/* The single admin account lives in src/config/admin.ts: no sign-up, and no
   password reset, so these two routes are the whole of authentication. */
authRouter.post("/login", controller.login);
authRouter.get("/me", requireAuth, controller.me);
