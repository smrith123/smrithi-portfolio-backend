import { env } from "../config/env.js";

/**
 * Tells the public site that content changed, so its next page view renders
 * fresh data instead of the cached copy. Awaited by the save, so by the time
 * the admin sees "Saved" the site is already updated. Never fails the save:
 * the content is stored either way, and the site's own 10-second timer catches
 * up if this call is lost.
 */
export async function revalidateSite() {
  if (!env.FRONTEND_REVALIDATE_URL || !env.REVALIDATE_SECRET) return;
  try {
    const res = await fetch(env.FRONTEND_REVALIDATE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.REVALIDATE_SECRET}` },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) console.warn(`[revalidate] the site answered ${res.status}; it will refresh on its timer`);
  } catch (err) {
    console.warn(`[revalidate] could not reach the site (${(err as Error).message}); it will refresh on its timer`);
  }
}
