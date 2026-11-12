import { authClient } from "@/lib/auth/client";
import { browserStorage } from "@/lib/storage/browser-shim";
import { dataClient, toFailure, toUser, tokenExpiry, type AuthFailure, type AuthUser } from "./compat";

/**
 * Browser-side data client. Same shape as the old Supabase one (see ./compat.ts).
 * Identity comes from Neon Auth through this site's own /api/auth, so the
 * session cookie never leaves this domain.
 */

let held: { token: string; exp: number } | null = null;

async function fetchToken(path: string): Promise<string | null> {
  try {
    const r = await fetch(path, { credentials: "same-origin", cache: "no-store" });
    if (!r.ok) return null;
    const body = (await r.json()) as { token?: string };
    return body.token ?? null;
  } catch {
    return null;
  }
}

/** The signed-in person's token if there is one, otherwise an anonymous token for public reads. */
async function browserToken(): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (held && held.exp - 30 > now) return held.token;
  const token = (await fetchToken("/api/auth/token")) ?? (await fetchToken("/api/auth/token/anonymous"));
  held = token ? { token, exp: tokenExpiry(token) || now + 300 } : null;
  return token;
}

/** Call after anything that changes who is signed in, so the next query asks for a fresh token. */
export function forgetToken() {
  held = null;
}

export function createClient() {
  const db = dataClient(browserToken);

  const authShim = {
    async getUser(): Promise<{ data: { user: AuthUser | null }; error: AuthFailure | null }> {
      try {
        const { data } = await authClient.getSession();
        return { data: { user: toUser(data?.user) }, error: null };
      } catch {
        return { data: { user: null }, error: null };
      }
    },

    async getSession() {
      const { data } = await this.getUser();
      return { data: { session: data.user ? { user: data.user } : null }, error: null };
    },

    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const { data, error } = await authClient.signIn.email({ email, password });
        forgetToken();
        const user = toUser((data as { user?: { id: string; email?: string } } | null)?.user);
        if (error || !user) {
          return { data: { user: null, session: null }, error: toFailure(error ?? { code: "INVALID_EMAIL_OR_PASSWORD" }) };
        }
        return { data: { user, session: { user } }, error: null };
      } catch (e) {
        return { data: { user: null, session: null }, error: toFailure(e) };
      }
    },

    /** Leaves the page for Google and comes back to `redirectTo`. */
    async signInWithOAuth({ provider, options }: { provider: "google"; options?: { redirectTo?: string } }) {
      try {
        await authClient.signIn.social({ provider, callbackURL: options?.redirectTo ?? window.location.origin });
        return { data: {}, error: null };
      } catch (e) {
        return { data: {}, error: toFailure(e) };
      }
    },

    async signOut() {
      try {
        await authClient.signOut();
        forgetToken();
        return { error: null };
      } catch (e) {
        return { error: toFailure(e) };
      }
    },

    /**
     * Sign-in happens through server actions followed by a navigation, so there
     * is no live event to forward. Callers already check the session when they
     * mount; this tells them once if somebody is signed in and nothing more.
     */
    onAuthStateChange(callback: (event: "SIGNED_IN" | "SIGNED_OUT", session: { user: AuthUser } | null) => void) {
      let live = true;
      void this.getUser().then(({ data }) => {
        if (live && data.user) callback("SIGNED_IN", { user: data.user });
      });
      return { data: { subscription: { unsubscribe: () => { live = false; } } } };
    },
  };

  return Object.assign(db, { auth: authShim, storage: browserStorage() });
}
