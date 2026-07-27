"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function requireUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function updateProfile(input: {
  full_name: string;
  title?: string;
  bio?: string;
  county_network_id?: string;
}) {
  const user = await requireUser();
  if (!user) return { error: "Please sign in." };
  const admin = createAdminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      full_name: input.full_name,
      title: input.title || null,
      bio: input.bio || null,
      ...(input.county_network_id ? { county_network_id: input.county_network_id } : {}),
    })
    .eq("id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function saveFemtorship(input: {
  in_leadership_role?: boolean;
  leadership_detail?: string;
  has_guide?: boolean;
  relationship_nature?: string;
  barriers?: string;
  wants_mentor?: boolean;
  desired_qualities?: string[];
  guidance_areas?: string[];
  can_provide?: boolean;
  support_offered?: string[];
  support_detail?: string;
}) {
  const user = await requireUser();
  if (!user) return { error: "Please sign in." };
  const admin = createAdminClient();
  const { error } = await admin.from("mentorship_profiles").upsert(
    {
      user_id: user.id,
      in_leadership_role: input.in_leadership_role ?? null,
      leadership_detail: input.leadership_detail || null,
      has_guide: input.has_guide ?? null,
      relationship_nature: input.relationship_nature || null,
      barriers: input.barriers || null,
      wants_mentor: input.wants_mentor ?? null,
      desired_qualities: input.desired_qualities ?? [],
      guidance_areas: input.guidance_areas ?? [],
      can_provide: input.can_provide ?? null,
      support_offered: input.support_offered ?? [],
      support_detail: input.support_detail || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };
  revalidatePath("/mentorship");
  return { ok: true };
}

export async function deleteOwnContent(kind: "post" | "blog", id: string) {
  const user = await requireUser();
  if (!user) return { error: "Please sign in." };
  const supabase = await createClient();
  const table = kind === "post" ? "posts" : "blogs";
  // RLS already restricts delete to the author; scope by author_id as well.
  const { error } = await supabase.from(table).delete().eq("id", id).eq("author_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/feed");
  return { ok: true };
}

/**
 * Delete the signed-out... signed-IN user's own account and all their content.
 * Uses the service role to remove the auth user; app rows cascade via FKs.
 */
export async function deleteAccount() {
  const user = await requireUser();
  if (!user) return { error: "Please sign in." };
  const admin = createAdminClient();
  // Remove content the user authored first (FKs set author_id null otherwise).
  await admin.from("posts").delete().eq("author_id", user.id);
  await admin.from("blogs").delete().eq("author_id", user.id);
  await admin.from("mentorship_profiles").delete().eq("user_id", user.id);
  await admin.from("org_memberships").delete().eq("user_id", user.id);
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };
  return { ok: true };
}
