import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Building2, Users, ArrowRight, Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { COUNTIES, countyBySlug } from "@/lib/counties";
import { pageMeta } from "@/lib/seo";

export function generateStaticParams() {
  return COUNTIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = countyBySlug(slug);
  return pageMeta({
    title: c ? `${c.name} County Network` : "County Network",
    description: c?.description || `The Women Human Rights Defenders Hub network in ${c?.name ?? "Kenya"}.`,
    path: `/counties/${slug}`,
  });
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const county = countyBySlug(slug);
  if (!county) notFound();

  // Live counts, best-effort. Never let a DB hiccup 404 the page.
  let orgs: { id: string; name: string; description: string | null }[] = [];
  let memberCount = 0;
  try {
    const supabase = await createClient();
    const { data: cn } = await supabase
      .from("county_networks")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (cn?.id) {
      const [{ data: o }, { count }] = await Promise.all([
        supabase
          .from("organizations")
          .select("id, name, description")
          .eq("county_network_id", cn.id)
          .eq("verification_status", "verified")
          .order("name"),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("county_network_id", cn.id),
      ]);
      orgs = o ?? [];
      memberCount = count ?? 0;
    }
  } catch {
    /* render with static content only */
  }

  const others = COUNTIES.filter((c) => c.slug !== slug);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={county.hero} alt={county.name} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#3a2357]/95 via-[#3a2357]/80 to-[#3a2357]/40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 lg:py-24 text-white">
          <p className="text-xs font-bold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
            <MapPin className="w-4 h-4" /> County network
          </p>
          <h1 className="mt-2 text-4xl lg:text-6xl font-black">{county.name}</h1>
          <p className="mt-4 text-lg text-white/90 max-w-2xl leading-relaxed">{county.blurb}</p>
          <div className="mt-7 flex flex-wrap gap-8">
            <div>
              <p className="text-3xl font-black">{orgs.length}</p>
              <p className="text-sm text-white/80">organisations</p>
            </div>
            <div>
              <p className="text-3xl font-black">{memberCount}</p>
              <p className="text-sm text-white/80">members</p>
            </div>
          </div>
          <Link href="/signup" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white text-[#3a2357] px-6 py-3.5 text-sm font-bold hover:bg-white/90">
            Join {county.name} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-16">
        {/* Local host network */}
        <div className="rounded-3xl border border-line bg-surface p-6 sm:p-8 flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-050 text-purple flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Local network</p>
            <h2 className="mt-1 text-xl font-black text-ink">{county.network}</h2>
            {county.founded && <p className="text-xs text-muted mt-0.5">{county.founded}</p>}
            <p className="mt-3 text-ink/80 leading-relaxed">{county.description}</p>
          </div>
        </div>

        {/* Moments from this network */}
        <div className="mt-6 rounded-3xl overflow-hidden border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={county.hero} alt={`${county.name} network`} className="w-full h-64 sm:h-80 object-cover" />
        </div>

        {/* Organisations */}
        <h2 className="mt-12 text-2xl font-black text-ink flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple" /> Organisations in {county.name}
        </h2>
        {orgs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
            <Users className="w-8 h-8 text-purple mx-auto" />
            <p className="mt-3 font-semibold text-ink">This network is growing.</p>
            <p className="text-sm text-muted mt-1">Register your organisation to be listed here.</p>
            <Link href="/signup" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-purple text-white px-5 py-2.5 text-sm font-bold hover:bg-purple-600">
              Join {county.name}
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map((o) => (
              <div key={o.id} className="rounded-2xl border border-line bg-surface p-5">
                <div className="w-10 h-10 rounded-xl bg-purple-050 text-purple flex items-center justify-center"><Building2 className="w-5 h-5" /></div>
                <h3 className="mt-3 font-bold text-ink">{o.name}</h3>
                {o.description && <p className="mt-1.5 text-sm text-muted line-clamp-3">{o.description}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Other counties */}
        <h2 className="mt-14 text-lg font-black text-ink">Explore other county networks</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {others.map((c) => (
            <Link key={c.slug} href={`/counties/${c.slug}`} className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-purple-050 hover:text-purple-700 transition-colors">
              {c.name}
            </Link>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
