import { ShieldCheck, ArrowUpRight, Inbox } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { createClient } from "@/lib/supabase/server";
import { Pill } from "@/components/ui/pill";
import { timeAgo } from "@/lib/utils";
import { links } from "@/lib/site-nav";

const STATUS_TONE: Record<string, "amber" | "green" | "red" | "slate" | "cyan"> = {
  submitted: "amber", under_review: "cyan", referred: "green", closed: "slate", flagged: "red",
};

export const metadata = { title: "My Reports — WHRD Hub" };

export default async function MemberReportsPage() {
  const user = await getCurrentUser();
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("reports")
    .select("id, incident_types, county, status, verification_status, urgency, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  // Assigned services per report signal "action taken".
  const ids = (reports ?? []).map((r) => r.id);
  const actioned = new Set<string>();
  if (ids.length) {
    const { data: rs } = await supabase.from("report_services").select("report_id").in("report_id", ids);
    for (const r of rs ?? []) actioned.add(r.report_id as string);
  }

  const list = reports ?? [];

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-ink flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-purple" /> My reports</h1>
          <p className="text-sm text-muted mt-1">Reports you filed on the reporting platform, shown here so you don&apos;t have to switch apps.</p>
        </div>
        <a href={links.reportingDashboard} className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 h-10 text-sm font-bold text-ink hover:bg-purple-050">
          Open reporting platform <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <Inbox className="w-8 h-8 text-purple mx-auto" />
          <p className="mt-3 font-semibold text-ink">No reports yet</p>
          <p className="text-sm text-muted mt-1">If you ever need to report abuse, it stays private and secure.</p>
          <a href={links.reportAbuse} target="_blank" className="mt-4 inline-flex rounded-xl bg-magenta text-white px-5 py-2.5 text-sm font-bold">Report abuse</a>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface divide-y divide-line overflow-hidden">
          {list.map((r) => {
            const hasAction = actioned.has(r.id) || (r.status && r.status !== "submitted");
            return (
              <a key={r.id} href={links.reportingDashboard} className="flex items-center gap-4 p-4 hover:bg-paper transition-colors">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink text-sm">
                    {(r.incident_types as string[])?.map((t) => t.replace(/_/g, " ")).join(", ") || "Report"}
                    {r.county ? ` · ${r.county}` : ""}
                  </p>
                  <p className="text-xs text-muted mt-0.5">Filed {timeAgo(r.created_at as string)}{r.urgency === "immediate" ? " · Marked urgent" : ""}</p>
                </div>
                {hasAction && <Pill tone="green">Action taken</Pill>}
                <Pill tone={STATUS_TONE[r.status as string] ?? "slate"}>{(r.status as string)?.replace(/_/g, " ") ?? "submitted"}</Pill>
                <ArrowUpRight className="w-4 h-4 text-muted shrink-0" />
              </a>
            );
          })}
        </div>
      )}
    </>
  );
}
