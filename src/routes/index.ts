import { Router } from "express";
import mongoose from "mongoose";
import { adminRouter } from "./admin.routes.js";
import { authRouter } from "./auth.routes.js";
import { publicRouter } from "./public.routes.js";

export const apiRouter: Router = Router();

// Render's health check: healthy only while the database is reachable.
apiRouter.get("/health", (_req, res) => {
  const db = mongoose.connection.readyState === 1;
  res.status(db ? 200 : 503).json({ status: db ? "ok" : "degraded", db: db ? "connected" : "disconnected", uptime: Math.round(process.uptime()) });
});
apiRouter.use("/auth", authRouter);
apiRouter.use("/public", publicRouter);
apiRouter.use("/admin", adminRouter);
