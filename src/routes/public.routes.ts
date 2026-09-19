import { Router } from "express";
import * as controller from "../controllers/public.controller.js";
import { rateLimit } from "../middleware/rateLimit.js";

/** Everything the public website reads. No authentication. */
export const publicRouter: Router = Router();

publicRouter.get("/home", controller.getHome);
publicRouter.get("/content-page", controller.getContentPage);
publicRouter.get("/works/:slug", controller.getWork);

publicRouter.post(
  "/contact",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }),
  controller.submitContact,
);
