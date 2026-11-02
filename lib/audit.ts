import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Writes to the report audit log (insert-only in the database).
 * Everything here is best effort: a failed audit row must never block the
 * person doing their work, but it is logged so the gap is visible.
 */

/** A "viewed" entry once per person per case per half hour, not once per page load. */
export async function logReportView(reportId: string, userId: string): Promise<void> {
  try {
    const db = createAdminClient();
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data } = await db.from("report_audit_log").select("id").eq("report_id", reportId).eq("viewed_by", userId).eq("action", "viewed").gte("created_at", since).limit(1);
    if (data && data.length > 0) return;
    await db.from("report_audit_log").insert({ report_id: reportId, viewed_by: userId, action: "viewed" });
  } catch (e) { console.error("[audit] view not logged:", (e as Error).message); }
}

/** A signed link to private evidence was handed out: who asked, for how many files, for how long. */
export async function logFileLinks(reportId: string, userId: string, kind: "evidence" | "voice_note", count: number, ttlSeconds: number): Promise<void> {
  if (count <= 0) return;
  try {
    await createAdminClient().from("report_audit_log").insert({
      report_id: reportId, viewed_by: userId, action: `file_link:${kind}`, notes: `${count} file(s), link valid ${Math.round(ttlSeconds / 60)} min`,
    });
  } catch (e) { console.error("[audit] file link not logged:", (e as Error).message); }
}

/** Mentor identity documents: who opened them, and when. Stored in the content log, which only the server writes. */
export async function logMentorDocuments(mentorId: string, adminId: string, count: number): Promise<void> {
  if (count <= 0) return;
  try {
    await createAdminClient().from("content_audit_log").insert({
      content_type: "mentor_documents", content_id: mentorId, action: "documents_opened", actor_id: adminId, detail: `${count} document link(s), valid 60 min`,
    });
  } catch (e) { console.error("[audit] mentor document access not logged:", (e as Error).message); }
}
