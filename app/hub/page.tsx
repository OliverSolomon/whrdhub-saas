import Link from "next/link";
import { Users, Building2, FileText, BookOpen, Clock, CheckCircle2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { BarChart, LineChart } from "@/components/hub/mini-chart";

export const metadata = { title: "Hub overview — WHRD Hub" };

interface Overview {
  members: number;
  organizations: number;
  orgs_pending: number;
  posts_pending: number;
  blogs_pending: number;
  posts_live: number;
  blogs_live: number;
  counties_active: number;
}

export default async function HubOverview() {
  const supabase = await createClient();

  const [{ data: overviewData }, { data: subs }, { data: growth }] = await Promise.all([
    supabase.rpc("hub_overview"),
    supabase.rpc("hub_submissions_timeseries", { days: 30 }),
    supabase.rpc("hub_member_growth", { days: 30 }),
  ]);

  const o = (overviewData as Overview) ?? {
    members: 0, organizations: 0, orgs_pending: 0, posts_pending: 0,
    blogs_pending: 0, posts_live: 0, blogs_live: 0, counties_active: 0,
  };

  const subsSeries = ((subs as { day: string; posts: number; blogs: number }[]) ?? []).map((r) => ({
    label: r.day,
    value: Number(r.posts) + Number(r.blogs),
  }));
  const growthSeries = ((growth as { day: string; joins: number }[]) ?? []).map((r) => ({
    label: r.day,
    value: Number(r.joins),
  }));

  const pendingTotal = o.posts_pending + o.blogs_pending;

  const stats = [
    { label: "Members", value: o.members, icon: Users },
    { label: "Organisations", value: o.organizations, icon: Building2 },
    { label: "Active counties", value: o.counties_active, icon: MapPin },
    { label: "Awaiting review", value: pendingTotal, icon: Clock, accent: pendingTotal > 0 },
  ];

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-black text-ink">Overview</h1>
        <p className="text-sm text-muted mt-1">How the movement is growing, and what needs your attention.</p>
      </div>

      {/* Action needed */}
      {(pendingTotal > 0 || o.orgs_pending > 0) && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center gap-4">
          <p className="text-sm font-semibold text-amber-900">Needs your attention:</p>
          {pendingTotal > 0 && (
            <Link href="/hub/queue" className="text-sm font-semibold text-amber-900 underline">
              {pendingTotal} submission{pendingTotal > 1 ? "s" : ""} to review
            </Link>
          )}
          {o.orgs_pending > 0 && (
            <Link href="/hub/organizations" className="text-sm font-semibold text-amber-900 underline">
              {o.orgs_pending} organisation{o.orgs_pending > 1 ? "s" : ""} to verify
            </Link>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className={`rounded-2xl border p-5 ${accent ? "border-amber-200 bg-amber-50" : "border-line bg-surface"}`}>
            <Icon className={`w-5 h-5 ${accent ? "text-amber-600" : "text-purple"}`} />
            <p className="mt-3 text-3xl font-black text-ink">{value}</p>
            <p className="text-xs text-muted">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-ink">Submissions, last 30 days</h2>
            <span className="text-xs text-muted">posts + stories</span>
          </div>
          <BarChart data={subsSeries} />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-ink">New members, last 30 days</h2>
            <span className="text-xs text-muted">joins per day</span>
          </div>
          <LineChart data={growthSeries} />
        </div>
      </div>

      {/* Live content counts */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-line bg-surface p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-cyan-050 text-cyan-700 flex items-center justify-center"><FileText className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-black text-ink">{o.posts_live}</p>
            <p className="text-xs text-muted flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> posts live on the feed</p>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-050 text-purple flex items-center justify-center"><BookOpen className="w-5 h-5" /></div>
          <div>
            <p className="text-2xl font-black text-ink">{o.blogs_live}</p>
            <p className="text-xs text-muted flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-500" /> stories published</p>
          </div>
        </div>
      </div>
    </div>
  );
}
