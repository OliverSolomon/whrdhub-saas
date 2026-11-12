"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/current-user";

/** Comments on feed posts. Replies are one level deep: a reply to a reply is attached to the comment at the top. */

const MAX_LENGTH = 2000;

async function notify(
  userId: string,
  title: string,
  body: string,
  link: string,
  contentId: string,
) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({
    user_id: userId,
    type: "comment",
    title,
    body,
    link,
    content_type: "comment",
    content_id: contentId,
  });
}

export async function addComment(postId: string, body: string, parentId?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in to join the conversation." };
  if (user.profile?.account_deleted_at) return { error: "This account has been deleted." };

  const text = body.trim();
  if (text.length < 1) return { error: "Write something first." };
  if (text.length > MAX_LENGTH) return { error: "That comment is too long." };

  const supabase = await createClient();

  // A reply must answer a live comment on this same post, and is kept at one level.
  let topLevelId: string | null = null;
  let parentAuthorId: string | null = null;
  if (parentId) {
    const { data: parent } = await supabase
      .from("post_comments")
      .select("id, post_id, parent_id, author_id, deleted_at")
      .eq("id", parentId)
      .maybeSingle();
    if (!parent || parent.deleted_at || parent.post_id !== postId) return { error: "That comment is no longer there." };
    topLevelId = (parent.parent_id as string | null) ?? (parent.id as string);
    parentAuthorId = (parent.author_id as string | null) ?? null;
  }

  const { data, error } = await supabase
    .from("post_comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      parent_id: topLevelId,
      body: text,
    })
    .select("id")
    .single();
  if (error) return { error: error.message };

  // Tell the post's author, unless they are talking to themselves.
  const { data: post } = await supabase
    .from("posts")
    .select("author_id, body")
    .eq("id", postId)
    .maybeSingle();
  const authorId = post?.author_id as string | null;
  // Whoever was replied to hears about it first; the post's author is told as well unless it is the same person.
  if (parentAuthorId && parentAuthorId !== user.id) {
    await notify(
      parentAuthorId,
      "New reply to your comment",
      `${user.profile?.full_name || "A member"}: ${text.slice(0, 80)}`,
      "/feed",
      data.id as string,
    );
  }
  if (authorId && authorId !== user.id && authorId !== parentAuthorId) {
    await notify(
      authorId,
      "New comment on your post",
      `${user.profile?.full_name || "A member"}: ${text.slice(0, 80)}`,
      "/feed",
      data.id as string,
    );
  }

  revalidatePath("/feed");
  revalidatePath("/dashboard/feed");
  return { ok: true, id: data?.id as string };
}

export async function editComment(id: string, body: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "Please sign in." };
  const text = body.trim();
  if (!text) return { error: "Write something first." };
  if (text.length > MAX_LENGTH) return { error: "That comment is too long." };

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("post_comments")
    .select("author_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { error: "That comment no longer exists." };
  if (row.author_id !== user.id) return { error: "You can only edit your own comments." };

  const { error } = await supabase.from("post_comments").update({ body: text }).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/feed");
  revalidatePath("/dashboard/feed");
  return { ok: true };
}
