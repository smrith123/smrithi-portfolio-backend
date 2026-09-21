import assert from "node:assert/strict";
import { test } from "node:test";
import jwt from "jsonwebtoken";

/* Set before importing the service: config/env.ts validates process.env on
   import, and dotenv does not overwrite values that are already set. */
const JWT_SECRET = "test-secret-that-is-long-enough-to-pass";
Object.assign(process.env, {
  NODE_ENV: "test",
  MONGODB_URL: "mongodb://127.0.0.1:27017/unused",
  CLOUDINARY_CLOUD_NAME: "x",
  CLOUDINARY_API_KEY: "x",
  CLOUDINARY_API_SECRET: "x",
  JWT_SECRET,
  ADMIN_EMAIL: "admin@smrithi.com",
  ADMIN_PASSWORD: "smrithi@123",
  ADMIN_NAME: "Smrithi",
});

const { login, verifySession } = await import("./auth.service.js");

const status = (fn: () => unknown) => {
  try {
    fn();
  } catch (err) {
    return (err as { status?: number }).status;
  }
  return undefined;
};

test("signs in with the configured credentials, whatever the email's case", () => {
  const { token, user } = login("Admin@Smrithi.com", "smrithi@123");
  assert.equal(user.email, "admin@smrithi.com");
  assert.ok(token);
  assert.equal(verifySession(token).email, "admin@smrithi.com");
});

test("rejects a wrong password and an unknown email", () => {
  assert.equal(status(() => login("admin@smrithi.com", "wrong")), 401);
  assert.equal(status(() => login("someone@else.com", "smrithi@123")), 401);
});

test("rejects a token signed with another secret", () => {
  const forged = jwt.sign({ sub: "admin", email: "admin@smrithi.com", name: "Smrithi", pv: "x" }, "another-secret-of-sufficient-length", { algorithm: "HS256" });
  assert.equal(status(() => verifySession(forged)), 401);
});

test("rejects a token issued under a different password", () => {
  // What a token from before an ADMIN_PASSWORD change looks like: our own
  // secret, our own account, but the fingerprint of the previous password.
  const stale = jwt.sign({ sub: "admin", email: "admin@smrithi.com", name: "Smrithi", pv: "0123456789abcdef" }, JWT_SECRET, { algorithm: "HS256" });
  assert.equal(status(() => verifySession(stale)), 401);
});
