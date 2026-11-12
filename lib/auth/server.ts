import { createNeonAuth } from "@neon/auth/next/server";

/**
 * Neon Auth on the server: who is signed in, signing in and out, the route
 * handler behind /api/auth, and the request guard used by proxy.ts.
 *
 * Server only. The cookie secret signs the short-lived session cache cookie.
 *
 * The instance is created on first use, not when this module loads. Building
 * the site imports every route to collect its configuration, and a build
 * environment has no sign-in secret. Creating the instance at load time made
 * the whole build fail whenever the secret was missing; creating it on first
 * use means only a request that actually needs sign-in needs the secret.
 */
type NeonAuth = ReturnType<typeof createNeonAuth>;

let instance: NeonAuth | null = null;

function neonAuth(): NeonAuth {
  instance ??= createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: { secret: process.env.NEON_AUTH_COOKIE_SECRET! },
  });
  return instance;
}

/** Same methods as the Neon Auth instance; each call reaches the real instance when it is first needed. */
export const auth = new Proxy({} as NeonAuth, {
  get(_target, prop) {
    const real = neonAuth() as unknown as Record<PropertyKey, unknown>;
    const value = real[prop];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(real) : value;
  },
}) as NeonAuth;

export const authBaseUrl = () => (process.env.NEON_AUTH_BASE_URL ?? "").replace(/\/$/, "");

/** The origin Neon Auth should see on server-to-server calls; it must be a trusted domain. */
export const siteOrigin = () =>
  (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
