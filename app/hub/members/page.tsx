import { Users, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/ui/field";

export const metadata = { title: "Members — WHRD Hub" };

export default async function HubMembers() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: counties }, { data: mems }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, username, title, avatar_url, county_network_id, hub_onboarded")
      .eq("hub_onboarded", true)
      .order("full_name"),
    supabase.from("county_networks").select("id, name").order("name"),
    supabase.from("org_memberships").select("user_id, organizations(name)"),
  ]);

  const countyName = new Map((counties ?? []).map((c) => [c.id as string, c.name as string]));
  const orgByUser = new Map<string, string>();
  for (const m of mems ?? []) {
    const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
    if (org) orgByUser.set(m.user_id as string, (org as { name: string }).name);
  }

  // Group members by county.
  const groups = new Map<string, typeof profiles>();
  for (const p of profiles ?? []) {
    const key = (p.county_network_id as string) || "none";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  const orderedKeys = Array.from(groups.keys()).sort((a, b) =>
    (countyName.get(a) ?? "zzz").localeCompare(countyName.get(b) ?? "zzz"),
  );

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-black text-ink">Members</h1>
        <p className="text-sm text-muted mt-1">
          Every defender onboarded to the Hub, by county network. {profiles?.length ?? 0} in total.
        </p>
      </div>

      {(profiles?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          <Users className="w-8 h-8 mx-auto text-purple" />
          <p className="mt-3">No members have completed onboarding yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orderedKeys.map((key) => {
            const members = groups.get(key)!;
            return (
              <section key={key}>
                <h2 className="text-sm font-bold text-ink mb-3 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-cyan-700" />
                  {countyName.get(key) ?? "No county set"}
                  <span className="text-muted font-normal">({members.length})</span>
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {members.map((p) => (
                    <div key={p.id} className="rounded-xl border border-line bg-surface p-3.5 flex items-center gap-3">
                      <Avatar name={p.full_name as string} src={p.avatar_url as string} size={40} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{(p.full_name as string) || (p.username as string) || "WHRD member"}</p>
                        <p className="text-xs text-muted truncate">
                          {[p.title as string, orgByUser.get(p.id as string)].filter(Boolean).join(" · ") || "Defender"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
