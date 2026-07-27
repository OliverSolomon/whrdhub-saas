"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/current-user";
import { computePairings, type MentorshipRow } from "@/lib/mentorship";
import { revalidatePath } from "next/cache";

/**
 * Recomputes femtorship pairings across all onboarded defenders and stores the
 * suggestions. Hub-only. Uses the service-role client because a single member
 * cannot (and should not) read everyone else's questionnaire under RLS.
 */
export async function recomputeAllMatches() {
  const user = await getCurrentUser();
  if (!user?.profile?.is_hub_admin) return { error: "Only the Hub can run matching." };

  const admin = createAdminClient();
  const { data: rows, error } = await admin
    .from("mentorship_profiles")
    .select("user_id, is_mentor, is_mentee, guidance_areas, support_offered");
  if (error) return { error: error.message };

  // county_network_id lives on profiles; pull it to give same-county a boost.
  const { data: profs } = await admin
    .from("profiles")
    .select("id, county_network_id");
  const countyOf = new Map((profs ?? []).map((p) => [p.id as string, (p.county_network_id as string) ?? null]));

  const mrows: MentorshipRow[] = (rows ?? []).map((r) => ({
    user_id: r.user_id as string,
    is_mentor: !!r.is_mentor,
    is_mentee: !!r.is_mentee,
    guidance_areas: (r.guidance_areas as string[]) ?? [],
    support_offered: (r.support_offered as string[]) ?? [],
    county_network_id: countyOf.get(r.user_id as string) ?? null,
  }));

  const pairings = computePairings(mrows, 3);

  // Refresh suggestions: clear old 'suggested' rows, keep accepted/declined.
  await admin.from("mentorship_matches").delete().eq("status", "suggested");

  if (pairings.length) {
    const { error: upErr } = await admin.from("mentorship_matches").upsert(
      pairings.map((p) => ({
        mentor_id: p.mentor_id,
        mentee_id: p.mentee_id,
        score: p.score,
        overlap: p.overlap,
        status: "suggested",
      })),
      { onConflict: "mentor_id,mentee_id", ignoreDuplicates: true },
    );
    if (upErr) return { error: upErr.message };
  }

  revalidatePath("/hub");
  revalidatePath("/mentorship");
  revalidatePath("/dashboard");
  return { ok: true, count: pairings.length };
}

/** A participant accepts or declines one of their own suggested matches. */
export async function respondToMatch(matchId: string, decision: "accepted" | "declined") {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };

  const supabase = await createClient();
  const { data: match } = await supabase
    .from("mentorship_matches")
    .select("id, mentor_id, mentee_id")
    .eq("id", matchId)
    .maybeSingle();
  if (!match) return { error: "Match not found." };
  if (match.mentor_id !== user.id && match.mentee_id !== user.id) {
    return { error: "This match is not yours." };
  }

  // Admin update: the base write policy on matches is Hub-only by design.
  const admin = createAdminClient();
  const { error } = await admin
    .from("mentorship_matches")
    .update({ status: decision })
    .eq("id", matchId);
  if (error) return { error: error.message };

  revalidatePath("/mentorship");
  revalidatePath("/dashboard");
  return { ok: true };
}
