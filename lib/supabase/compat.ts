import { PostgrestClient } from "@supabase/postgrest-js";

/**
 * The app was written against the Supabase client. The database now lives on
 * Neon, whose Data API speaks the same query language (PostgREST), and sign-in
 * is Neon Auth. This file builds an object with the same shape the rest of the
 * code already uses -- `.from()`, `.rpc()`, `.auth` -- so the hundred-odd
 * files that query data did not have to change. Stored files get the same
 * treatment in lib/storage/ (Neon Object Storage behind a `.storage` shape).
 *
 * Every request to the Data API must carry a token: the signed-in person's, the
 * server account's, or an anonymous one for public reads.
 */

export interface AuthUser {
  id: string;
  email?: string;
  user_metadata: Record<string, unknown>;
  app_metadata: Record<string, unknown>;
}

export interface AuthFailure {
  message: string;
  code?: string;
  status?: number;
}

type NeonUser = { id: string; email?: string | null; name?: string | null; image?: string | null };

export function toUser(u: NeonUser | null | undefined): AuthUser | null {
  if (!u?.id) return null;
  return {
    id: u.id,
    email: u.email ?? undefined,
    user_metadata: { full_name: u.name ?? undefined, avatar_url: u.image ?? undefined },
    app_metadata: {},
  };
}

/**
 * Neon Auth (Better Auth) error -> the codes the app already knows how to word.
 * See readableError() in app/actions/auth.ts.
 */
export function toFailure(e: unknown): AuthFailure | null {
  if (!e) return null;
  const err = e as { message?: string; code?: string; status?: number; statusCode?: number; error?: { code?: string; message?: string } };
  const raw = String(err.code ?? err.error?.code ?? "").toUpperCase();
  const message = err.message ?? err.error?.message ?? "Something went wrong. Please try again.";
  const status = err.status ?? err.statusCode;
  let code: string | undefined = err.code;
  if (/INVALID_(EMAIL_OR_)?PASSWORD|INVALID_CREDENTIALS|USER_NOT_FOUND|CREDENTIAL_ACCOUNT_NOT_FOUND/.test(raw) || raw === "INVALID_EMAIL") code = "invalid_credentials";
  else if (/EMAIL_NOT_VERIFIED/.test(raw)) code = "email_not_confirmed";
  else if (/USER_ALREADY_EXISTS/.test(raw)) code = "user_already_exists";
  else if (/PASSWORD_TOO_SHORT|PASSWORD_TOO_LONG|WEAK_PASSWORD/.test(raw)) code = "weak_password";
  else if (/BANNED/.test(raw)) code = "user_banned";
  else if (status === 429 || /TOO_MANY|RATE_LIMIT/.test(raw)) code = "over_request_rate_limit";
  else if (/INVALID_OTP|OTP_EXPIRED|TOO_MANY_ATTEMPTS/.test(raw)) code = "otp_invalid";
  return { message, code, status };
}

export const dataApiUrl = () =>
  (process.env.NEXT_PUBLIC_NEON_DATA_API_URL ?? process.env.NEON_DATA_API_URL ?? "").replace(/\/$/, "");

/** A query client whose every request carries whatever token `getToken` hands back. */
export function dataClient(getToken: () => Promise<string | null>) {
  return new PostgrestClient(dataApiUrl(), {
    fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
      const headers = new Headers(init?.headers);
      const token = await getToken();
      if (token) headers.set("Authorization", `Bearer ${token}`);
      else headers.delete("Authorization");
      // Tokens are per person and short-lived; never let a framework cache a response keyed without them.
      return fetch(input, { ...init, headers, cache: "no-store" });
    },
  });
}

/** Seconds-since-epoch expiry of a JWT, or 0 if it cannot be read. */
export function tokenExpiry(token: string): number {
  try {
    const payload = token.split(".")[1];
    const json = typeof atob === "function"
      ? atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      : Buffer.from(payload, "base64url").toString();
    return Number(JSON.parse(json).exp) || 0;
  } catch {
    return 0;
  }
}
