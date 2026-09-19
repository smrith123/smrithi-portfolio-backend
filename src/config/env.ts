import "dotenv/config";
import { z } from "zod";

/** "false"/"0" must read as false, which z.coerce.boolean() does not do. */
const bool = (fallback: boolean) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined ? fallback : !/^(false|0|no)$/i.test(v)));

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(5000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  MONGODB_URL: z.string().min(1, "MONGODB_URL connection string is required"),

  /** Media host. Uploads fail loudly at boot rather than silently at use time. */
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1),
  CLOUDINARY_API_KEY: z.string().trim().min(1),
  CLOUDINARY_API_SECRET: z.string().trim().min(1),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters")
    .refine((s) => !/^replace-me/i.test(s), "JWT_SECRET is still the .env.example placeholder"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  FROM_NAME: z.string().default("Smrithi Portfolio"),

  /**
   * Comma-separated allow-list (the public site and the admin); also accepts a
   * single origin. Required in production: the localhost default would lock the
   * live site and admin out without any error at boot.
   */
  CORS_ORIGIN: z
    .string()
    .default("http://localhost:3000,http://localhost:3001")
    .transform((v) => v.split(",").map((s) => s.trim().replace(/\/+$/, "")).filter(Boolean)),
  FRONTEND_URL: z.string().default("http://localhost:3000"),
  ADMIN_URL: z.string().default("http://localhost:3001"),

  /** Password-reset OTPs print to the server log while no mail transport is configured. */
  OTP_CONSOLE_FALLBACK: bool(true),

  /** Absolute base the API is reachable at; used for logging and links. */
  PUBLIC_API_URL: z.string().optional(),

  /** Largest upload request. Cloudinary's free plan takes up to 100MB per video (10MB per image). */
  MAX_UPLOAD_MB: z.coerce.number().positive().default(100),

  /** Used only by `npm run seed` to create the first admin; the API itself never reads them. */
  ADMIN_EMAIL: z.email().default("admin@smrithi.local"),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().default("Smrithi"),
});

const parsed = schema
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === "production" && !process.env.CORS_ORIGIN) {
      ctx.addIssue({ code: "custom", path: ["CORS_ORIGIN"], message: "is required in production (the site and admin origins)" });
    }
  })
  .safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  console.error(`Invalid environment configuration:\n${issues}`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  get baseUrl() {
    return parsed.data.PUBLIC_API_URL ?? `http://localhost:${parsed.data.PORT}`;
  },
  isProd: parsed.data.NODE_ENV === "production",
};
