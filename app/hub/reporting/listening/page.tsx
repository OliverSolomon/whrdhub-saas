import { createAdminClient } from "@/lib/supabase/admin";
import type { Source } from "@/lib/listening-sources";
import { ListeningView, type Keyword, type Result } from "@/components/reporting/listening/listening-view";

export const metadata = { title: "Online Listening - WHRD Hub" };

export default async function ListeningPage() {
  // Access is enforced by app/hub/reporting/layout.tsx.

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const base = "id, source, permalink, author, content, matched_keywords, severity, status, captured_at";
  const [{ data: keywords }, withAi] = await Promise.all([
    db.from("listening_keywords").select("id, word, severity, active").order("word"),
    db.from("listening_results").select(`${base}, ai_class, ai_confidence`).order("captured_at", { ascending: false }).limit(150),
  ]);
  // Until migration 017 is applied the ai_* columns do not exist; show the captures without them.
  const results = withAi.error
    ? (await db.from("listening_results").select(base).order("captured_at", { ascending: false }).limit(150)).data
    : withAi.data;

  // Until migration 018 is applied the table does not exist; show none rather than fail.
  const { data: sources } = await db
    .from("listening_sources")
    .select("id, platform, kind, handle, note, active, last_scanned_at, last_result")
    .order("created_at", { ascending: false });

  return (
    <ListeningView
      sources={(sources ?? []) as Source[]}
      keywords={(keywords ?? []) as Keyword[]}
      results={(results ?? []) as Result[]}
    />
  );
}
