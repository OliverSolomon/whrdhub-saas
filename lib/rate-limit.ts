import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * A rate limit shared by every server instance.
 *
 * A counter kept in a function's memory does not work on serverless: each
 * request can land on a fresh instance. The count lives in Postgres instead
 * (public.rate_limit_hit, one atomic upsert), so the limit holds however the
 * traffic is spread. Only the service role can call it.
 *
 * If the database cannot be reached, or the update that adds the function has
 * not been applied, the request is allowed and the problem logged: a limiter
 * that fails closed would lock real people out of a safety service.
 */
export interface LimitResult { ok: boolean; retryAfter: number; remaining: number }

export async function rateLimit(key: string, windowSeconds: number, max: number): Promise<LimitResult> {
  try {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", { p_key: key, p_window_seconds: windowSeconds, p_max: max });
    if (error) throw error;
    const row = (Array.isArray(data) ? data[0] : data) as { allowed: boolean; remaining: number; retry_after: number } | null;
    if (!row) return { ok: true, retryAfter: 0, remaining: max };
    return { ok: row.allowed, retryAfter: row.retry_after, remaining: row.remaining };
  } catch (e) {
    console.error("[rate-limit] unavailable, allowing the request:", (e as Error).message);
    return { ok: true, retryAfter: 0, remaining: max };
  }
}

/** The caller's address as Vercel reports it, for keys that cannot use an account. */
export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? headers.get("x-real-ip") ?? "unknown").trim();
}

/** The caller's address inside a server action. */
export async function actionIp(): Promise<string> { return clientIp(await headers()); }

export const tooMany = (retryAfter: number) =>
  `Too many attempts. Please wait ${retryAfter > 90 ? Math.ceil(retryAfter / 60) + " minutes" : retryAfter + " seconds"} and try again.`;
