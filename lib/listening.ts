import { createAdminClient } from "@/lib/supabase/admin";
import { matchKeywords, type Keyword, type RawItem } from "@/lib/meta";
import { isActionable, triagePosts, type Triage } from "@/lib/listening-triage";

/**
 * Match a batch of raw social items against the active keywords and store the
 * ones worth a person's attention in listening_results (deduped on source +
 * source_id). Runs with the service role so it works from the webhook and the
 * poller. New tables are not in the generated DB types yet, so the query
 * builder is accessed loosely.
 *
 * With `triage` on, Jev also judges each post (a real case, abuse aimed at
 * someone, awareness, or not relevant). That has two effects: a post with no
 * watched word but which clearly is a case is kept, and one that only matched a
 * word in another sense is labelled "likely not relevant" so it sinks. Nothing
 * is ever dismissed automatically.
 */
export async function ingestItems(
  items: RawItem[],
  opts: { triage?: boolean } = {},
): Promise<{ stored: number; triaged: number }> {
  if (!items.length) return { stored: 0, triaged: 0 };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  const { data: kw } = await db.from("listening_keywords").select("word, severity").eq("active", true);
  const keywords: Keyword[] = (kw ?? []).map((k: { word: string; severity: string }) => ({ word: k.word, severity: k.severity }));

  const judged = opts.triage ? await triagePosts(items.map((it) => it.content)) : items.map(() => null as Triage | null);

  const rows = items
    .map((it, i) => {
      const { matched, severity } = matchKeywords(it.content, keywords);
      const t = judged[i];
      if (!matched.length && !isActionable(t)) return null;

      // A word match sets the floor; a confident "real case" can only raise it.
      let sev = matched.length ? severity : "medium";
      if (t?.cls === "real_incident" && t.confidence >= 0.85) sev = "high";
      return {
        source: it.source,
        source_id: it.source_id,
        permalink: it.permalink,
        author: it.author,
        content: it.content.slice(0, 2000),
        matched_keywords: matched,
        severity: sev,
        status: "new",
        ...(t ? { ai_class: t.cls, ai_confidence: t.confidence } : {}),
      };
    })
    .filter(Boolean);

  if (!rows.length) return { stored: 0, triaged: judged.filter(Boolean).length };

  let { error } = await db.from("listening_results").upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true });
  // Migration 017 adds the ai_* columns. Until it is applied, store the capture without them rather than lose it.
  if (error && /ai_class|ai_confidence/i.test(error.message)) {
    const plain = (rows as Record<string, unknown>[]).map((row) => {
      const copy = { ...row };
      delete copy.ai_class;
      delete copy.ai_confidence;
      return copy;
    });
    ({ error } = await db.from("listening_results").upsert(plain, { onConflict: "source,source_id", ignoreDuplicates: true }));
  }
  if (error) throw new Error(error.message);
  return { stored: rows.length, triaged: judged.filter(Boolean).length };
}
