import { createAdminClient } from "@/lib/supabase/admin";
import { ListeningView } from "@/components/reporting/listening/listening-view";
import type { Keyword, Result } from "@/components/reporting/listening/types";
import type { Source } from "@/lib/listening-sources";
import { ensurePacks } from "@/lib/listening-packs";

export const metadata = { title: "Online Listening - WHRD Hub" };

export default async function ListeningPage() {
  // Access is enforced by app/hub/reporting/layout.tsx.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;

  // Columns added by later migrations are tried first and dropped if the database does not have them yet.
  const base = "id, source, permalink, author, content, matched_keywords, severity, status, captured_at";
  const attempts = [`${base}, ai_class, ai_confidence, handled_by, handled_at, report_id`, `${base}, ai_class, ai_confidence, handled_by, handled_at`, `${base}, ai_class, ai_confidence`, base];
  let rows: Record<string, unknown>[] = [];
  for (const cols of attempts) {
    const { data, error } = await db.from("listening_results").select(cols).order("captured_at", { ascending: false }).limit(300);
    if (!error) { rows = data ?? []; break; }
  }

  const ids = [...new Set(rows.map((r) => r.handled_by as string | null).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: people } = await db.from("profiles").select("id, full_name, username").in("id", ids);
    for (const p of (people ?? []) as { id: string; full_name: string | null; username: string | null }[]) names.set(p.id, p.full_name || p.username || "a colleague");
  }
  const results: Result[] = rows.map((r) => ({ ...(r as unknown as Result), handled_by_name: r.handled_by ? names.get(r.handled_by as string) ?? "a colleague" : null }));

  // The preset packs (Usikimye, Political) add their accounts and words the first time they are seen.
  const packs = await ensurePacks();

  const srcBase = "id, platform, kind, handle, note, active, last_scanned_at, last_result";
  const withPack = await db.from("listening_sources").select(`${srcBase}, index_all, pack`).order("created_at", { ascending: false });
  // Until migrations 018 and 020 are applied the table or columns may be missing; show what exists rather than fail.
  const sources = withPack.error ? (await db.from("listening_sources").select(srcBase).order("created_at", { ascending: false })).data : withPack.data;
  const { data: keywords } = await db.from("listening_keywords").select("id, word, severity, active").order("word");

  return <ListeningView sources={(sources ?? []) as Source[]} keywords={(keywords ?? []) as Keyword[]} results={results} packs={packs ?? []} />;
}
