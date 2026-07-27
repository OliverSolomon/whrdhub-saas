import { Building2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Pill } from "@/components/ui/pill";
import { OrgVerifyControls } from "@/components/hub/org-verify-controls";
import { VERIF_STATUS_META } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

export const metadata = { title: "Organisations — WHRD Hub" };

export default async function HubOrganizations() {
  const supabase = await createClient();

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, description, verification_status, created_at, county_networks(name)")
    .order("verification_status")
    .order("created_at", { ascending: false });

  // Member counts per org.
  const { data: mems } = await supabase.from("org_memberships").select("organization_id");
  const counts = new Map<string, number>();
  for (const m of mems ?? []) counts.set(m.organization_id as string, (counts.get(m.organization_id as string) ?? 0) + 1);

  const county = (v: unknown) =>
    Array.isArray(v) ? (v[0] as { name: string })?.name : (v as { name: string } | null)?.name;

  const all = orgs ?? [];
  const pending = all.filter((o) => o.verification_status === "pending");
  const rest = all.filter((o) => o.verification_status !== "pending");

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-black text-ink">Organisations</h1>
        <p className="text-sm text-muted mt-1">Verify new CBOs so their members and content can go public.</p>
      </div>

      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-700 mb-3">Awaiting verification</h2>
          <div className="space-y-3">
            {pending.map((o) => (
              <div key={o.id} className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <p className="font-bold text-ink flex items-center gap-2"><Building2 className="w-4 h-4 text-purple" /> {o.name}</p>
                    <p className="text-xs text-muted mt-0.5">{county(o.county_networks) ?? "No county"} · added {timeAgo(o.created_at)} · {counts.get(o.id) ?? 0} member(s)</p>
                    {o.description && <p className="text-sm text-ink mt-2 max-w-2xl">{o.description}</p>}
                  </div>
                  <OrgVerifyControls id={o.id} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" /> All organisations
        </h2>
        {rest.length === 0 ? (
          <p className="text-sm text-muted">No verified organisations yet.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {rest.map((o) => (
              <div key={o.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-ink">{o.name}</p>
                  <Pill tone={VERIF_STATUS_META[o.verification_status]?.tone ?? "slate"}>
                    {VERIF_STATUS_META[o.verification_status]?.label ?? o.verification_status}
                  </Pill>
                </div>
                <p className="text-xs text-muted mt-1">{county(o.county_networks) ?? "No county"} · {counts.get(o.id) ?? 0} member(s)</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
