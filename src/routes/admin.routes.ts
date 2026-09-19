import { Router } from "express";
import * as media from "../controllers/media.controller.js";
import * as sections from "../controllers/sections.controller.js";
import * as submissions from "../controllers/submissions.controller.js";
import { requireAuth } from "../middleware/auth.js";
import { limitUploadRequest, upload } from "../middleware/upload.js";
import { Media } from "../models/Media.js";
import { ContactSubmission } from "../models/ContactSubmission.js";
import { listSections } from "../services/content.service.js";

/** Authenticated content management. Mounted at /api/admin. */
export const adminRouter: Router = Router();

adminRouter.use(requireAuth);

adminRouter.get("/overview", async (_req, res) => {
  const [sectionList, mediaCount, videoCount, newSubmissions, totalSubmissions, recent] = await Promise.all([
    listSections(),
    Media.countDocuments({ kind: "image" }),
    Media.countDocuments({ kind: "video" }),
    ContactSubmission.countDocuments({ status: "new" }),
    ContactSubmission.countDocuments(),
    ContactSubmission.find().sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const lastUpdated = sectionList
    .map((s) => s.updatedAt)
    .filter((d): d is Date => Boolean(d))
    .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

  res.json({
    sections: sectionList,
    counts: { images: mediaCount, videos: videoCount, newSubmissions, totalSubmissions },
    lastUpdated,
    recentSubmissions: recent,
  });
});

adminRouter.get("/sections", sections.list);
adminRouter.get("/sections/:key", sections.get);
adminRouter.put("/sections/:key", sections.update);

adminRouter.get("/media", media.list);
adminRouter.post("/media", limitUploadRequest, upload.array("files", 10), media.upload);
adminRouter.patch("/media/:id", media.update);
adminRouter.delete("/media/:id", media.remove);

adminRouter.get("/submissions", submissions.list);
adminRouter.patch("/submissions/:id", submissions.update);
adminRouter.delete("/submissions/:id", submissions.remove);
