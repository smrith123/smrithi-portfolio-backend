import express, { type Express } from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { apiRouter } from "./routes/index.js";

export function createApp(): Express {
  const app = express();

  // Behind a proxy (Render/Railway/nginx) so req.ip is the real client.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // Baseline headers for a JSON API (no helmet: four headers do not need a dependency).
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (env.isProd) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    next();
  });

  // JSON for the website and admin, never a search result.
  app.use((_req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    next();
  });

  app.use(
    cors({
      origin(origin, cb) {
        // Same-origin/curl requests have no Origin header.
        // Unknown origins get a normal response without CORS headers, so the browser blocks it (not a 500).
        cb(null, !origin || env.CORS_ORIGIN.includes(origin));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
