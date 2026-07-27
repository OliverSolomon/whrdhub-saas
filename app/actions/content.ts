"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/current-user";
import { revalidatePath } from "next/cache";

async function logAudit(
  content_type: string,
  content_id: string,
  action: string,
  detail?: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  await supabase.from("content_audit_log").insert({
    content_type,
    content_id,
    action,
    actor_id: user?.id ?? null,
    detail: detail ?? null,
  });
}

// ── Member submissions ─────────────────────────────────────────────────────

export async function createPost(body: string, imageUrls: string[] = []) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  if (body.trim().length < 3) return { error: "Write a little more before posting." };

  const supabase = await createClient();
  const isHub = !!user.profile?.is_hub_admin;
  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    organization_id: user.membership?.organization_id ?? null,
    county_network_id: user.profile?.county_network_id ?? null,
    body: body.trim(),
    image_urls: imageUrls,
    is_hub: isHub,
    // Hub posts publish immediately; member posts wait for review.
    status: isHub ? "approved" : "pending",
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/");
  return { ok: true };
}

export async function createBlog(input: {
  title: string;
  excerpt: string;
  body: string;
  cover_image_url?: string;
}) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  if (input.title.trim().length < 3) return { error: "Give your story a title." };
  if (input.body.trim().length < 30) return { error: "Your story needs a little more content." };

  const supabase = await createClient();
  const isHub = !!user.profile?.is_hub_admin;
  const { error } = await supabase.from("blogs").insert({
    author_id: user.id,
    organization_id: user.membership?.organization_id ?? null,
    county_network_id: user.profile?.county_network_id ?? null,
    title: input.title.trim(),
    excerpt: input.excerpt.trim() || input.body.trim().slice(0, 160),
    body: input.body.trim(),
    cover_image_url: input.cover_image_url || null,
    is_hub: isHub,
    status: isHub ? "approved" : "pending",
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/blog");
  revalidatePath("/");
  return { ok: true };
}

// ── Hub moderation ─────────────────────────────────────────────────────────

async function requireHub() {
  const user = await getCurrentUser();
  if (!user?.profile?.is_hub_admin) return null;
  return user;
}

export async function reviewContent(
  kind: "post" | "blog",
  id: string,
  decision: "approved" | "rejected",
  notes?: string,
) {
  const hub = await requireHub();
  if (!hub) return { error: "Only the Hub can review content." };
  const supabase = await createClient();
  const table = kind === "post" ? "posts" : "blogs";
  const { error } = await supabase
    .from(table)
    .update({
      status: decision,
      review_notes: notes || null,
      reviewed_by: hub.id,
      // published_at is set by the DB trigger on approval
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit(kind, id, decision, notes);
  revalidatePath("/hub");
  revalidatePath("/");
  revalidatePath("/blog");
  return { ok: true };
}

export async function togglePin(kind: "post" | "blog", id: string, pinned: boolean) {
  const hub = await requireHub();
  if (!hub) return { error: "Only the Hub can pin content." };
  const supabase = await createClient();
  const table = kind === "post" ? "posts" : "blogs";
  const { error } = await supabase.from(table).update({ pinned }).eq("id", id);
  if (error) return { error: error.message };
  await logAudit(kind, id, pinned ? "pinned" : "unpinned");
  revalidatePath("/hub");
  revalidatePath("/");
  return { ok: true };
}

export async function verifyOrganization(
  id: string,
  decision: "verified" | "rejected" | "needs_more_info",
  notes?: string,
) {
  const hub = await requireHub();
  if (!hub) return { error: "Only the Hub can verify organisations." };
  const supabase = await createClient();
  const { error } = await supabase
    .from("organizations")
    .update({
      verification_status: decision,
      verification_notes: notes || null,
      verified_by: hub.id,
      verified_at: decision === "verified" ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  await logAudit("organization", id, decision, notes);
  revalidatePath("/hub");
  revalidatePath("/organizations");
  return { ok: true };
}
