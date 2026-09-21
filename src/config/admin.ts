import { env } from "./env.js";

/**
 * The one admin account, and the only place its credentials exist. There is no
 * sign-up, no second account and no password reset: changing who can sign in
 * means changing these values (in the environment) and restarting the API.
 *
 * The values below are the local development defaults. In production the
 * password must come from ADMIN_PASSWORD, so the committed default can never be
 * the live one — the API refuses to start otherwise.
 */
const DEFAULT_EMAIL = "admin@smrithi.com";
const DEFAULT_PASSWORD = "smrithi@123";

const fromEnv = (name: string) => process.env[name]?.trim() || undefined;

if (env.isProd && !fromEnv("ADMIN_PASSWORD")) {
  console.error(
    "Invalid environment configuration:\n  - ADMIN_PASSWORD: required in production. Set it in the host's environment; the default in src/config/admin.ts is for local development only.",
  );
  process.exit(1);
}

export const admin = {
  email: (fromEnv("ADMIN_EMAIL") ?? DEFAULT_EMAIL).toLowerCase(),
  password: fromEnv("ADMIN_PASSWORD") ?? DEFAULT_PASSWORD,
  name: fromEnv("ADMIN_NAME") ?? "Smrithi",
} as const;
