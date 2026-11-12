"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { auth, authBaseUrl, siteOrigin } from "@/lib/auth/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { toFailure } from "@/lib/supabase/compat";
import { generateUsername } from "@/lib/anonymous-username";
import { safeNext, DEFAULT_NEXT } from "@/lib/safe-next";
import { isStaffProfile, STAFF_HOME } from "@/lib/staff-landing";
import { actionIp, rateLimit, tooMany } from "@/lib/rate-limit";

/**
 * Signing in and signing up, on the server.
 *
 * These were client-side calls followed by a client-side navigation, and the
 * two raced: the browser writes the session cookie, the middleware reads it on
 * the server, and a navigation could arrive before the cookie did. The request
 * bounced back to /login and it looked as though the password was wrong. The
 * workaround was a full page load; this is the actual fix.
 *
 * A server action runs before the response is written, so the Set-Cookie and
 * the redirect leave together. There is no window in which the browser has
 * navigated but the server does not yet know who you are.
 *
 * Two other things follow from being here rather than in the browser:
 *
 *   The redirect target is validated server-side, where it cannot be skipped.
 *   `?next=` comes from a link somebody clicked and is attacker-controlled --
 *   see lib/safe-next.ts for why that matters on this platform in particular.
 *
 *   Next verifies the Origin against the Host on every server action, so these
 *   are not submittable from another site. A plain POST handler would have
 *   needed that built by hand.
 */

/** Accounts made without an email get an address on this domain. It cannot receive mail. */
const PLACEHOLDER_DOMAIN = "@whrdhub.local";

export interface AuthState {
  error?: string;
  /** Sign-up only: the account exists but the address needs confirming. */
  checkEmail?: boolean;
  /** Anonymous sign-up only: the generated username, shown once so it can be written down. */
  username?: string;
}

/**
 * What to say when sign-in fails.
 *
 * Wrong password and unknown address are deliberately given the same words:
 * telling somebody which one they got wrong tells an attacker whether an
 * address has an account here, and on this platform the mere fact that a woman
 * has an account is information worth protecting.
 *
 * `email_not_confirmed` is the exception and is surfaced plainly. It does admit
 * the account exists, but the alternative is somebody whose password is
 * perfectly correct being told it is wrong, for ever, with no way to work out
 * why. Sign-up already reveals the same fact, so nothing is lost by saying it.
 */
function readableError(code: string | undefined, message: string, status?: number): string {
  // The backend refuses service outright (402) when the hosting plan's quota is
  // spent. Its message names the plan and the meter, which is nothing a visitor
  // can act on and not something to publish, so say only that the service is down.
  if (status === 402) {
    return "The platform is temporarily unavailable. Please try again later. If you are reporting urgently, contact the Hub directly.";
  }
  switch (code) {
    case "invalid_credentials":
      return "Those details did not match an account. Check the email and password and try again.";
    case "email_not_confirmed":
      return "Your email address has not been confirmed yet. Check your inbox for the confirmation link.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Too many attempts just now. Please wait a minute and try again.";
    case "user_banned":
      return "This account is not available. Contact the Hub if you think that is a mistake.";
    case "same_password":
      return "That is your current password. Choose a different one.";
    case "weak_password":
      return "Please choose a longer password — at least eight characters.";
    case "user_already_exists":
      return "There is already an account with that email. Try signing in instead.";
    case "validation_failed":
      return "Please enter a valid email address.";
    default:
      return message || "Something went wrong. Please try again.";
  }
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  // Guessing passwords: 8 tries per address and 40 per network every 15 minutes.
  const ip = await actionIp();
  const [byAccount, byNetwork] = await Promise.all([
    rateLimit(`signin:${ip}:${email.toLowerCase()}`, 900, 8),
    rateLimit(`signin-ip:${ip}`, 900, 40),
  ]);
  if (!byAccount.ok || !byNetwork.ok) return { error: tooMany(Math.max(byAccount.retryAfter, byNetwork.retryAfter)) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: readableError(error.code, error.message, error.status) };
  }

  // Staff land in the console, not on the member dashboard. Sending an admin to
  // /dashboard meant the member onboarding wall (or a second trip through the
  // login page) stood between them and the console, so signing in seemed to
  // need doing twice. The profile is read with the server's own client: the
  // session cookie was only just set, so this request still carries the old,
  // signed-out cookies and a per-person client would see nobody.
  let destination = next;
  if (next === DEFAULT_NEXT && data.user) {
    const { data: profile } = await createAdminClient()
      .from("profiles")
      .select("user_type, is_hub_admin")
      .eq("id", data.user.id)
      .maybeSingle();
    if (isStaffProfile(profile)) destination = STAFF_HOME;
  }

  // Every layout reads the session, so the whole tree is stale now.
  revalidatePath("/", "layout");
  // redirect() signals by throwing, so it must be the last thing and must not
  // sit inside a try/catch that would swallow it.
  redirect(destination);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("fullName") ?? "").trim();
  // Two email routes: just report, or join a chapter. Anything else is a chapter member, as before.
  const kind = formData.get("accountKind") === "reporter" ? "reporter" : "member";

  if (!email || !password) {
    return { error: "Enter your email and a password." };
  }
  if (kind === "member" && !fullName) {
    return { error: "Tell us your name so your chapter knows who you are." };
  }
  if (password.length < 8) {
    return { error: "Please choose a password of at least eight characters." };
  }
  if (email.toLowerCase().endsWith(PLACEHOLDER_DOMAIN)) {
    return { error: "Please enter a valid email address." };
  }
  const signup = await rateLimit(`signup:${await actionIp()}`, 3600, 10);
  if (!signup.ok) return { error: tooMany(signup.retryAfter) };

  let userId: string | undefined;
  try {
    const { data, error } = await auth.signUp.email({
      email,
      password,
      name: fullName || email.split("@")[0],
    });
    if (error) {
      const f = toFailure(error);
      return { error: readableError(f?.code, f?.message ?? "", f?.status) };
    }
    userId = (data as { user?: { id: string } } | null)?.user?.id;
  } catch (e) {
    const f = toFailure(e);
    return { error: readableError(f?.code, f?.message ?? "", f?.status) };
  }
  if (!userId) return { error: "Something went wrong. Please try again." };

  // Create the profile. Roles are never taken from here: the handle_new_user
  // trigger decides user_type itself and only reads the kind of account being joined.
  const admin = createAdminClient();
  const { error: registerError } = await admin.rpc("server_register_account", {
    p_id: userId,
    p_meta: { full_name: fullName, account_kind: kind },
  });
  if (registerError) console.error("[auth] could not create the profile", registerError.message);
  else if (fullName) {
    await admin.from("profiles").update({ full_name: fullName }).eq("id", userId).is("full_name", null);
  }

  revalidatePath("/", "layout");
  redirect(kind === "reporter" ? "/dashboard/reports" : "/onboarding");
}

/**
 * Join with no email and no name: a generated username and a password of the
 * person's choosing. Nothing identifies them, and there is no reset, so the
 * page that follows tells them to write the details down. The session is
 * created here, so they are already signed in when they continue.
 */
export async function signUpAnonymous(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { error: "Please choose a password of at least eight characters." };
  }

  const anon = await rateLimit(`anon-signup:${await actionIp()}`, 3600, 10);
  if (!anon.ok) return { error: tooMany(anon.retryAfter) };

  const username = generateUsername();
  const email = `${username}${PLACEHOLDER_DOMAIN}`;

  // Created by the server, so no mail is ever sent to an address that cannot receive it.
  const { error: createError } = await createAdminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, is_anonymous: true, account_kind: "anonymous" },
  });
  if (createError) {
    return { error: "Could not create your account just now. Please try again." };
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) {
    return { error: "Your account was created, but signing in failed. Log in with your username and password." };
  }

  revalidatePath("/", "layout");
  return { username };
}

/**
 * Sign out, and land somewhere public.
 *
 * Also a server action so the cookie is cleared before the response, rather
 * than clearing it in the browser and hoping the next request agrees.
 */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}


/* ── Forgotten passwords ───────────────────────────────────────────────── */

// Remembers, for fifteen minutes and in this browser only, which address asked
// for a code. Kept in a cookie the page cannot read rather than in the URL, so
// the address never lands in history, logs or a shared link.
const RESET_COOKIE = "whrd_reset_for";

/** The emailed-code endpoints of the sign-in service, called server to server. */
function emailCode(path: string, body: Record<string, string>) {
  return fetch(`${authBaseUrl()}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: siteOrigin() },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}

/**
 * Ask for a code to set a new password with.
 *
 * The reply is identical whether or not the address has an account, and it is
 * returned even when sending fails. That is deliberate: a form that says "no
 * account with that email" is an account-existence oracle, and anyone can
 * query it. On this platform the bare fact that a woman has an account here
 * can put her at risk, so the page must not confirm it — not by wording, and
 * not by succeeding for one address and failing for another.
 *
 * The one exception is rate limiting, which is said plainly. It reveals
 * nothing about any particular address and, withheld, leaves somebody
 * refreshing a page that has quietly stopped sending anything.
 */
export async function requestPasswordReset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) return { error: "Enter the email address for your account." };

  // Five requests an hour per network and three per address, so the form cannot be used to flood someone's inbox.
  const ip = await actionIp();
  const [reqIp, reqMail] = await Promise.all([rateLimit(`reset-ip:${ip}`, 3600, 5), rateLimit(`reset:${email}`, 3600, 3)]);
  if (!reqIp.ok || !reqMail.ok) return { error: tooMany(Math.max(reqIp.retryAfter, reqMail.retryAfter)) };

  // A code is only sent to an address that already has an account here.
  // Asking the sign-in service for a code for an unknown address would create
  // an account for it, and placeholder addresses cannot receive mail at all.
  const { data: known } = await createAdminClient().from("profiles").select("id").eq("email", email).maybeSingle();
  if (known && !email.endsWith(PLACEHOLDER_DOMAIN)) {
    try {
      const r = await emailCode("/email-otp/send-verification-otp", { email, type: "sign-in" });
      // Logged for us, invisible to the person: a delivery failure is our problem
      // to fix, not a signal to hand back about which addresses exist.
      if (!r.ok) console.error("[auth] could not send a reset code, status", r.status);
    } catch (e) {
      console.error("[auth] could not send a reset code", toFailure(e)?.message);
    }
  }

  (await cookies()).set(RESET_COOKIE, email, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });
  return { checkEmail: true };
}

/**
 * Set a new password, proving ownership of the address with the emailed code.
 *
 * Two things happen afterwards that matter more than the password change
 * itself. Every session is revoked, because somebody resetting a password may
 * be doing it precisely because another person has access to the account —
 * leaving those sessions alive would make the reset cosmetic. And she is sent
 * to sign in again with the new password rather than being carried straight
 * in, so the change is confirmed by use.
 */
export async function updatePassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const code = String(formData.get("code") ?? "").replace(/\s+/g, "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const jar = await cookies();
  const email = jar.get(RESET_COOKIE)?.value ?? "";

  if (!email) {
    return { error: "This reset request has expired. Request a new code and try again." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { error: "Enter the six-digit code from the email." };
  }
  if (password.length < 8) {
    return { error: "Please choose a password of at least eight characters." };
  }
  if (password !== confirm) {
    return { error: "The two passwords do not match." };
  }

  // Guessing codes: ten tries per address every fifteen minutes.
  const tries = await rateLimit(`reset-code:${email}`, 900, 10);
  if (!tries.ok) return { error: tooMany(tries.retryAfter) };

  const wrongCode = "That code is not right, or it has expired. Check it, or request a new code.";
  const admin = createAdminClient();
  const { data: known } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (!known) return { error: wrongCode };

  // The code signs her in; that is the proof the address is hers.
  let userId: string | undefined;
  // Asked of the sign-in service directly and without keeping its cookie: all
  // that is wanted here is its answer about whose code this is.
  try {
    const r = await emailCode("/sign-in/email-otp", { email, otp: code });
    if (r.ok) userId = ((await r.json()) as { user?: { id: string } }).user?.id;
  } catch {
    /* reported below */
  }
  if (!userId || userId !== known.id) return { error: wrongCode };

  // Sets the password and ends every session, including the one the code just opened.
  const { error } = await admin.auth.admin.updateUserById(userId, { email, password });
  if (error) return { error: "Could not save the new password just now. Please try again." };

  jar.delete(RESET_COOKIE);

  revalidatePath("/", "layout");
  redirect("/login?reset=1");
}
