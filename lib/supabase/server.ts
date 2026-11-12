import { cache } from "react";
import { headers } from "next/headers";
import { auth, authBaseUrl, siteOrigin } from "@/lib/auth/server";
import { serverStorage } from "@/lib/storage/server-shim";
import { dataClient, toFailure, toUser, type AuthFailure, type AuthUser } from "./compat";

/**
 * Server-side data client. The name and shape are the old Supabase ones on
 * purpose (see ./compat.ts); underneath it is Neon Auth for identity and the
 * Neon Data API for queries.
 *
 * Create a new one inside every server function; never hoist it to a module
 * global (Fluid compute reuses workers, and a client belongs to one request).
 */

// Signed-out visitors still need a token to read public pages. It carries no
// identity, so one can be shared by every request until it expires.
let anonymous: { token: string; exp: number } | null = null;

export async function anonymousToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (anonymous && anonymous.exp - 60 > now) return anonymous.token;
  try {
    const r = await fetch(`${authBaseUrl()}/token/anonymous`, {
      headers: { origin: siteOrigin() },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const body = (await r.json()) as { token?: string; expires_at?: number };
    if (!body.token) return null;
    anonymous = { token: body.token, exp: body.expires_at ?? now + 300 };
    return body.token;
  } catch {
    return null;
  }
}

/** The signed-in session for this request, read once. */
const currentSession = cache(async () => {
  // Reading the request first, outside the try, tells Next this page depends on
  // who is asking. Inside the try that signal would be swallowed and the page
  // would be built once, at build time, for nobody.
  await headers();
  try {
    const { data } = await auth.getSession();
    return data ?? null;
  } catch {
    return null;
  }
});

/** A Data API token for the person making this request, or null if nobody is signed in. */
const personToken = cache(async (): Promise<string | null> => {
  const cookie = (await headers()).get("cookie") ?? "";
  if (!cookie.includes("neon-auth")) return null;
  try {
    const r = await fetch(`${authBaseUrl()}/token`, {
      headers: { cookie, origin: siteOrigin() },
      cache: "no-store",
    });
    if (!r.ok) return null;
    const body = (await r.json()) as { token?: string };
    return body.token ?? null;
  } catch {
    return null;
  }
});

export async function createClient() {
  const db = dataClient(async () => (await personToken()) ?? (await anonymousToken()));

  const authShim = {
    async getUser(): Promise<{ data: { user: AuthUser | null }; error: AuthFailure | null }> {
      const s = await currentSession();
      return { data: { user: toUser(s?.user) }, error: null };
    },

    async getSession() {
      const s = await currentSession();
      const user = toUser(s?.user);
      return {
        data: { session: user ? { user, access_token: await personToken() } : null },
        error: null,
      };
    },

    /** Password sign-in. Sets the session cookie, so call it only from a server action or route handler. */
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const { data, error } = await auth.signIn.email({ email, password });
        const user = toUser((data as { user?: { id: string; email?: string } } | null)?.user);
        if (error || !user) {
          return { data: { user: null, session: null }, error: toFailure(error ?? { code: "INVALID_EMAIL_OR_PASSWORD" }) };
        }
        return { data: { user, session: { user } }, error: null };
      } catch (e) {
        return { data: { user: null, session: null }, error: toFailure(e) };
      }
    },

    /** `scope: "others"` ends every other device's session and keeps this one. */
    async signOut(options?: { scope?: "global" | "local" | "others" }) {
      try {
        if (options?.scope === "others") await auth.revokeOtherSessions();
        else await auth.signOut();
        return { error: null };
      } catch (e) {
        return { error: toFailure(e) };
      }
    },
  };

  return Object.assign(db, { auth: authShim, storage: serverStorage() });
}
