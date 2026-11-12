import { scrypt, randomBytes } from "node:crypto";
import { authBaseUrl, siteOrigin } from "@/lib/auth/server";
import { serverStorage } from "@/lib/storage/server-shim";
import { dataClient, toFailure, tokenExpiry } from "./compat";

/**
 * The server's own, privileged data client. Bypasses the per-person access
 * rules. Server-only: never import in a client component.
 *
 * On Supabase this was the service-role key. Neon's Data API has no such key,
 * so the server signs in as one dedicated account (NEON_SERVICE_EMAIL /
 * NEON_SERVICE_PASSWORD) and the database treats that account as the trusted
 * server -- see supabase/neon/04_service_and_accounts.sql. Guard those two
 * variables exactly as the service-role key was guarded.
 */

let held: { cookie: string; token: string; exp: number } | null = null;
let pending: Promise<string | null> | null = null;

async function signInServer(): Promise<string | null> {
  const r = await fetch(`${authBaseUrl()}/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: siteOrigin() },
    body: JSON.stringify({ email: process.env.NEON_SERVICE_EMAIL, password: process.env.NEON_SERVICE_PASSWORD }),
    cache: "no-store",
  });
  if (!r.ok) return null;
  return r.headers.getSetCookie().map((c) => c.split(";")[0]).join("; ") || null;
}

async function tokenFor(cookie: string): Promise<string | null> {
  const r = await fetch(`${authBaseUrl()}/token`, { headers: { cookie, origin: siteOrigin() }, cache: "no-store" });
  if (!r.ok) return null;
  return ((await r.json()) as { token?: string }).token ?? null;
}

async function refresh(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  let cookie = held?.cookie ?? (await signInServer());
  let token = cookie ? await tokenFor(cookie) : null;
  if (!token) {
    // The stored session ended; sign in again once.
    cookie = await signInServer();
    token = cookie ? await tokenFor(cookie) : null;
  }
  if (!cookie || !token) {
    held = null;
    console.error("[server-account] could not sign in; check NEON_SERVICE_EMAIL and NEON_SERVICE_PASSWORD");
    return null;
  }
  held = { cookie, token, exp: tokenExpiry(token) || now + 300 };
  return token;
}

async function serverToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (held && held.exp - 60 > now) return held.token;
  pending ??= refresh().finally(() => { pending = null; });
  return pending;
}

/** A password hash in the format Neon Auth (Better Auth) stores: hex salt, scrypt, hex key. */
function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    scrypt(password.normalize("NFKC"), salt, 64, { N: 16384, r: 16, p: 1, maxmem: 128 * 16384 * 16 * 2 }, (err, key) =>
      err ? reject(err) : resolve(`${salt}:${key.toString("hex")}`),
    );
  });
}

interface NewUser {
  email: string;
  password: string;
  email_confirm?: boolean;
  user_metadata?: Record<string, unknown>;
}

export function createAdminClient() {
  const db = dataClient(serverToken);

  const admin = {
    /** Create an account on somebody's behalf (anonymous report, USSD). Does not sign anybody in. */
    async createUser(input: NewUser) {
      try {
        const meta = input.user_metadata ?? {};
        const name = String(meta.full_name ?? meta.username ?? input.email.split("@")[0]);
        const r = await fetch(`${authBaseUrl()}/sign-up/email`, {
          method: "POST",
          headers: { "content-type": "application/json", origin: siteOrigin() },
          body: JSON.stringify({ email: input.email, password: input.password, name }),
          cache: "no-store",
        });
        const body = (await r.json().catch(() => ({}))) as { user?: { id: string; email: string }; code?: string; message?: string };
        if (!r.ok || !body.user) {
          return { data: { user: null }, error: toFailure({ ...body, status: r.status }) };
        }
        const { error } = await db.rpc("server_register_account", { p_id: body.user.id, p_meta: meta });
        if (error) return { data: { user: null }, error: { message: error.message } };
        return { data: { user: { id: body.user.id, email: body.user.email } }, error: null };
      } catch (e) {
        return { data: { user: null }, error: toFailure(e) };
      }
    },

    /** Change an account's address and, optionally, its password. Other devices are signed out on a password change. */
    async updateUserById(id: string, attrs: { email: string; email_confirm?: boolean; password?: string }) {
      try {
        const { error } = await db.rpc("server_update_account", {
          p_id: id,
          p_email: attrs.email,
          p_password_hash: attrs.password ? await hashPassword(attrs.password) : null,
        });
        return { data: { user: error ? null : { id } }, error: error ? { message: error.message } : null };
      } catch (e) {
        return { data: { user: null }, error: toFailure(e) };
      }
    },

    async deleteUser(id: string) {
      const { error } = await db.rpc("server_delete_account", { p_id: id });
      return { data: {}, error: error ? { message: error.message } : null };
    },
  };

  return Object.assign(db, { auth: { admin }, storage: serverStorage() });
}
