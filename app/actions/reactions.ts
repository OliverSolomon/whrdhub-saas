"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Toggle the signed-in user's "support" reaction on a post. Returns the new
 * count and whether the user is now reacting. Requires auth — a guest gets
 * `{ needsAuth: true }` and the client redirects them to sign in.
 */
export async function toggleReaction(
  postId: string,
): Promise<{ needsAuth?: boolean; count?: number; reacted?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { needsAuth: true };

  const { data: existing } = await supabase
    .from("post_reactions")
    .select("post_id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();

  let reacted: boolean;
  if (existing) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", user.id);
    if (error) return { error: error.message };
    reacted = false;
  } else {
    const { error } = await supabase
      .from("post_reactions")
      .insert({ post_id: postId, user_id: user.id, kind: "support" });
    if (error) return { error: error.message };
    reacted = true;
  }

  const { count } = await supabase
    .from("post_reactions")
    .select("post_id", { count: "exact", head: true })
    .eq("post_id", postId);

  return { count: count ?? 0, reacted };
}

/**
 * Save a signed-out visitor's locally stored likes to the database after they
 * sign in. Ignores duplicates. Returns how many were saved.
 */
export async function flushGuestReactions(postIds: string[]): Promise<{ saved: number }> {
  if (!postIds?.length) return { saved: 0 };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { saved: 0 };

  const rows = postIds.map((id) => ({ post_id: id, user_id: user.id, kind: "support" }));
  const { error } = await supabase
    .from("post_reactions")
    .upsert(rows, { onConflict: "post_id,user_id", ignoreDuplicates: true });
  if (error) return { saved: 0 };
  return { saved: postIds.length };
}

