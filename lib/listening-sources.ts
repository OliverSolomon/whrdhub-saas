import { createAdminClient } from "@/lib/supabase/admin";
import { recentInstagramPosts, instagramConfigured } from "@/lib/social-fetch";
import { ingestItems } from "@/lib/listening";
import { broadcastToStaff } from "@/lib/alerts";
import type { RawItem } from "@/lib/meta";

/**
 * Listening that does not wait to be handed a link. An administrator lists
 * Instagram accounts and hashtags worth watching; a scan reads their latest
 * public posts, runs them through the same keyword and Jev triage as everything
 * else, and keeps what matters. It also notices when several captured posts
 * point at the same person, which is how a targeted campaign shows itself.
 *
 * Bounded on purpose: each source is one provider run, so a scan reads at most
 * MAX_SOURCES sources, the least recently scanned first.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createAdminClient() as any;

const MAX_SOURCES = Math.max(1, Math.min(10, Number(process.env.SOCIAL_DAILY_CAP) || 10));
const POSTS_PER_SOURCE = 10;
/** Captured posts naming the same account within a day before the team is warned. */
const BURST_AT = 3;

export interface Source { id: string; platform: string; kind: "profile" | "hashtag"; handle: string; note: string | null; active: boolean; last_scanned_at: string | null; last_result: string | null }

export async function scanSources(onlyId?: string): Promise<{ sources: number; read: number; stored: number; bursts: number; message?: string }> {
  if (!instagramConfigured()) return { sources: 0, read: 0, stored: 0, bursts: 0, message: "Instagram is not connected (APIFY_TOKEN)." };

  let q = db().from("listening_sources").select("id, platform, kind, handle").eq("active", true).eq("platform", "instagram");
  if (onlyId) q = q.eq("id", onlyId);
  const { data, error } = await q.order("last_scanned_at", { ascending: true, nullsFirst: true }).limit(MAX_SOURCES);
  if (error) return { sources: 0, read: 0, stored: 0, bursts: 0, message: "Run migration 018 to add watched sources." };

  let read = 0;
  let stored = 0;
  for (const src of (data ?? []) as Pick<Source, "id" | "kind" | "handle">[]) {
    let result = "ok";
    try {
      const posts = await recentInstagramPosts(src.kind, src.handle, POSTS_PER_SOURCE);
      read += posts.length;
      const items: RawItem[] = posts.map((p) => ({ source: "instagram", source_id: p.sourceId, permalink: p.url, author: p.author, content: p.text }));
      const r = await ingestItems(items, { triage: true });
      stored += r.stored;
      result = `${posts.length} read, ${r.stored} kept`;
    } catch (err) {
      result = `failed: ${err instanceof Error ? err.message.slice(0, 80) : "unknown"}`;
    }
    await db().from("listening_sources").update({ last_scanned_at: new Date().toISOString(), last_result: result }).eq("id", src.id);
  }

  return { sources: (data ?? []).length, read, stored, bursts: await detectBursts() };
}

/**
 * When several captures in the last day all name the same account, warn the
 * team once. Three posts about one defender is a pattern, not a coincidence.
 */
export async function detectBursts(): Promise<number> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data } = await db()
    .from("listening_results")
    .select("id, content, status")
    .gt("captured_at", since)
    .neq("status", "dismissed")
    .limit(500);

  const byHandle = new Map<string, Set<string>>();
  for (const r of (data ?? []) as { id: string; content: string }[]) {
    for (const m of r.content.matchAll(/@([A-Za-z0-9._]{2,30})/g)) {
      const h = m[1].toLowerCase();
      if (!byHandle.has(h)) byHandle.set(h, new Set());
      byHandle.get(h)!.add(r.id);
    }
  }

  let sent = 0;
  for (const [handle, ids] of byHandle) {
    if (ids.size < BURST_AT) continue;
    const ok = await broadcastToStaff({
      type: "listening_burst",
      title: `Possible campaign against @${handle}`,
      body: `${ids.size} captured posts in the last day name this account. Review them together.`,
      path: "/hub/reporting/listening",
      tag: `burst-${handle}`,
    });
    if (ok) sent++;
  }
  return sent;
}
