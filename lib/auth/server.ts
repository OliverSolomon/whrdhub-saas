import { createNeonAuth } from "@neon/auth/next/server";

/**
 * Neon Auth on the server: who is signed in, signing in and out, the route
 * handler behind /api/auth, and the request guard used by proxy.ts.
 *
 * Server only. The cookie secret signs the short-lived session cache cookie.
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
});

export const authBaseUrl = () => (process.env.NEON_AUTH_BASE_URL ?? "").replace(/\/$/, "");

/** The origin Neon Auth should see on server-to-server calls; it must be a trusted domain. */
export const siteOrigin = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
