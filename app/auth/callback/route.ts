import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext, DEFAULT_NEXT } from "@/lib/safe-next";
import { isStaffProfile, STAFF_HOME } from "@/lib/staff-landing";
import { sendMail } from "@/lib/email/send";
import { welcomeHtml, welcomeText, welcomeSubject } from "@/lib/email/welcome";

/**
 * Where the browser lands after signing in with Google.
 *
 * By the time this runs the session already exists: the request guard
 * (proxy.ts) completed the Google hand-off on the way in. What is left is the
 * app's own bookkeeping -- make sure the person has a profile, greet a new
 * member once, and send everyone to the right first page.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${origin}/login?error=auth`);

  // A first Google sign-in has an account but no profile yet. Does nothing for everybody else.
  const reporterChoice = next.startsWith("/dashboard/reports");
  const { error: ensureError } = await supabase.rpc("ensure_account", {
    p_account_kind: reporterChoice ? "reporter" : "member",
  });
  if (ensureError) console.error("[auth] could not create the profile", ensureError.message);

  const { data: profile } = await supabase
    .from("profiles")
    .select("hub_onboarded, welcomed_at, full_name, user_type, is_hub_admin")
    .eq("id", user.id)
    .maybeSingle();

  // A one-time welcome. Stamped first so a refresh of this URL cannot send it twice.
  if (profile && !profile.welcomed_at && user.email) {
    await supabase
      .from("profiles")
      .update({ welcomed_at: new Date().toISOString() })
      .eq("id", user.id);
    void sendWelcome(user.email, (profile.full_name as string) ?? null);
  }

  const staff = isStaffProfile(profile);
  // Somebody who chose "just report" on the way in is a reporter, not a chapter member.
  if (reporterChoice && !staff && !profile?.hub_onboarded) {
    await supabase.from("profiles").update({ account_kind: "reporter" }).eq("id", user.id);
  }
  const dest = staff
    ? (next === DEFAULT_NEXT ? STAFF_HOME : next)
    : profile?.hub_onboarded || reporterChoice ? next : "/onboarding";
  return NextResponse.redirect(`${origin}${dest}`);
}

async function sendWelcome(email: string, name: string | null) {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "";
  if (!site) return;
  await sendMail({
    to: email,
    subject: welcomeSubject(),
    html: welcomeHtml(name, site),
    text: welcomeText(name, site),
  });
}
