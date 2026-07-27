import { createClient } from "@/lib/supabase/server";

export interface FeedAuthor {
  name: string;
  title: string | null;
  avatar_url: string | null;
}

export interface MediaItem {
  type: "image" | "video" | "document";
  url: string;
  name: string;
}

export interface FeedItem {
  kind: "post" | "blog";
  id: string;
  slug?: string | null;
  title?: string | null;
  body: string; // post body, or blog excerpt
  image: string | null;
  media: MediaItem[];
  author: FeedAuthor;
  org: string | null;
  county: string | null;
  is_hub: boolean;
  pinned: boolean;
  published_at: string;
  reactions: number;
  reactedByMe: boolean;
}

type Row = {
  id: string;
  author_id: string | null;
  body?: string;
  title?: string;
  slug?: string;
  excerpt?: string;
  image_urls?: string[] | null;
  media?: MediaItem[] | null;
  cover_image_url?: string | null;
  is_hub: boolean;
  pinned: boolean;
  published_at: string | null;
  created_at: string;
  guest_name?: string | null;
  guest_title?: string | null;
  organizations?: { name: string } | { name: string }[] | null;
  county_networks?: { name: string } | { name: string }[] | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/**
 * Builds the public feed: approved posts plus published blogs (each surfaced as
 * a post-style card). Pinned items float to the top, then newest first.
 */
export async function getFeed(limit = 40, userId?: string): Promise<FeedItem[]> {
  const supabase = await createClient();

  const [{ data: posts }, { data: blogs }] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, author_id, body, image_urls, media, is_hub, pinned, published_at, created_at, guest_name, guest_title, organizations(name), county_networks(name)",
      )
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(limit),
    supabase
      .from("blogs")
      .select(
        "id, author_id, title, slug, excerpt, cover_image_url, is_hub, pinned, published_at, created_at, organizations(name), county_networks(name)",
      )
      .eq("status", "approved")
      .order("published_at", { ascending: false })
      .limit(limit),
  ]);

  const rows: (Row & { kind: "post" | "blog" })[] = [
    ...((posts as Row[]) ?? []).map((r) => ({ ...r, kind: "post" as const })),
    ...((blogs as Row[]) ?? []).map((r) => ({ ...r, kind: "blog" as const })),
  ];

  // Stitch author profiles (author_id points at auth.users, not profiles).
  const ids = Array.from(new Set(rows.map((r) => r.author_id).filter(Boolean))) as string[];
  const authorMap = new Map<string, FeedAuthor>();
  if (ids.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, username, title, avatar_url")
      .in("id", ids);
    for (const p of profiles ?? []) {
      authorMap.set(p.id as string, {
        name: (p.full_name as string) || (p.username as string) || "WHRD member",
        title: (p.title as string) ?? null,
        avatar_url: (p.avatar_url as string) ?? null,
      });
    }
  }

  const hubAuthor: FeedAuthor = { name: "WHRD Hub", title: "National office", avatar_url: null };

  // Reaction counts + whether the current user has reacted (posts only).
  const postIds = rows.filter((r) => r.kind === "post").map((r) => r.id);
  const reactionCount = new Map<string, number>();
  const reactedByMe = new Set<string>();
  if (postIds.length) {
    const { data: reactions } = await supabase
      .from("post_reactions")
      .select("post_id, user_id")
      .in("post_id", postIds);
    for (const r of reactions ?? []) {
      const pid = r.post_id as string;
      reactionCount.set(pid, (reactionCount.get(pid) ?? 0) + 1);
      if (userId && r.user_id === userId) reactedByMe.add(pid);
    }
  }

  const items: FeedItem[] = rows.map((r) => {
    const author = r.is_hub
      ? hubAuthor
      : (r.author_id && authorMap.get(r.author_id)) ||
        (r.guest_name
          ? { name: r.guest_name, title: r.guest_title ?? null, avatar_url: null }
          : { name: "WHRD member", title: null, avatar_url: null });
    return {
      kind: r.kind,
      id: r.id,
      slug: r.slug ?? null,
      title: r.title ?? null,
      body: r.kind === "post" ? (r.body ?? "") : (r.excerpt ?? ""),
      image: r.kind === "post" ? (r.image_urls?.[0] ?? null) : (r.cover_image_url ?? null),
      media: r.kind === "post" ? ((r.media as MediaItem[]) ?? []) : [],
      author,
      org: one(r.organizations)?.name ?? null,
      county: one(r.county_networks)?.name ?? null,
      is_hub: r.is_hub,
      pinned: r.pinned,
      published_at: r.published_at ?? r.created_at,
      reactions: reactionCount.get(r.id) ?? 0,
      reactedByMe: reactedByMe.has(r.id),
    };
  });

  items.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
  });

  return items.slice(0, limit);
}
