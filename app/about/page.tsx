import Link from "next/link";
import { ArrowRight, Target, Compass, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Avatar } from "@/components/ui/field";
import { SITE, PILLARS, LAWLOR_QUOTE } from "@/lib/data";
import { LEADERSHIP, BOARD, STAFF, type Person } from "@/lib/team";
import { pageMeta } from "@/lib/seo";
import { PARTNERS } from "@/lib/site-content";

export const metadata = pageMeta({
  title: "About Us",
  description: "The Women Human Rights Defenders Hub connects and protects women defenders across Kenya. Meet our board, staff, and partners.",
  path: "/about",
});

const HERO = "https://whrdhub.org/wp-content/uploads/2024/05/DSC_8300-scaled.jpg";

function PersonCard({ p, accent = false }: { p: Person; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden flex flex-col">
      <div className="aspect-[4/3] bg-paper overflow-hidden">
        {p.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.photo} alt={p.name} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar name={p.name} size={80} />
          </div>
        )}
      </div>
      <div className="p-5 flex-1">
        <h3 className="font-bold text-ink text-lg">{p.name}</h3>
        <p className={`text-sm font-semibold ${accent ? "text-magenta-700" : "text-purple-700"}`}>{p.role}</p>
        {p.blurb && <p className="mt-2.5 text-sm text-muted leading-relaxed">{p.blurb}</p>}
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="brand-wash border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-purple">About the Hub</p>
            <h1 className="mt-3 text-4xl lg:text-5xl font-black text-ink leading-tight">Protecting the women who protect us all</h1>
            <p className="mt-4 text-lg text-muted leading-relaxed">
              The Women Human Rights Defenders Hub, known simply as the Hub, brings together defenders
              and their organisations across Kenya. We invest in their safety, wellbeing, livelihoods,
              and femtorship so the movement grows stronger together.
            </p>
          </div>
          <div className="rounded-3xl overflow-hidden border border-line shadow-xl shadow-purple/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={HERO} alt="The Hub" className="w-full h-80 object-cover" />
          </div>
        </div>
      </section>

      {/* Vision + Mission */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-6">
        <div className="rounded-3xl bg-purple text-white p-8">
          <Compass className="w-8 h-8 text-white/80" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/85">Our vision</p>
          <p className="mt-2 text-2xl font-bold leading-snug">{SITE.vision}</p>
        </div>
        <div className="rounded-3xl bg-magenta text-white p-8">
          <Target className="w-8 h-8 text-white/80" />
          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-white/85">Our mission</p>
          <p className="mt-2 text-2xl font-bold leading-snug">{SITE.mission}</p>
        </div>
      </section>

      {/* Approach / pillars */}
      <section id="impact" className="bg-paper border-y border-line scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-magenta-700">Our approach</p>
            <h2 className="mt-2 text-3xl font-black text-ink">How we work</h2>
            <p className="mt-3 text-muted">Our work rests on six pillars that wrap around the whole defender.</p>
          </div>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILLARS.map((p, i) => (
              <div key={p.title} className="rounded-2xl border border-line bg-surface p-6">
                <div className="w-10 h-10 rounded-xl bg-purple-050 text-purple flex items-center justify-center font-black">{i + 1}</div>
                <h3 className="mt-3 font-bold text-ink">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted leading-relaxed">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership + Board */}
      <section id="board" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-purple">Leadership</p>
          <h2 className="mt-2 text-3xl font-black text-ink">The people behind the Hub</h2>
          <p className="mt-3 text-muted">A board and team who bring decades of experience in human rights, media, law, and grassroots organising.</p>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEADERSHIP.map((p) => <PersonCard key={p.name} p={p} accent />)}
          {BOARD.map((p) => <PersonCard key={p.name} p={p} />)}
        </div>
      </section>

      {/* Staff */}
      <section id="staff" className="bg-paper border-y border-line scroll-mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-wider text-magenta-700">Our team</p>
            <h2 className="mt-2 text-3xl font-black text-ink">Staff</h2>
            <p className="mt-3 text-muted">The team keeping the Hub running, pillar by pillar.</p>
          </div>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {STAFF.map((p) => (
              <div key={p.name} className="rounded-2xl border border-line bg-surface overflow-hidden text-center">
                <div className="aspect-square bg-paper overflow-hidden">
                  {p.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photo} alt={p.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Avatar name={p.name} size={56} /></div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-ink text-sm">{p.name}</h3>
                  <p className="text-xs text-purple-700 font-semibold">{p.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 scroll-mt-20">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-purple">Our partners</p>
          <h2 className="mt-2 text-3xl font-black text-ink">Who we work with</h2>
          <p className="mt-3 text-muted">The funders, networks, and allies who stand with women human rights defenders across Kenya and the region.</p>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {PARTNERS.map((p, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-5 flex items-center justify-center h-28 hover:shadow-md transition-shadow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.logo} alt={p.name} className="max-h-14 max-w-full object-contain" />
            </div>
          ))}
        </div>
      </section>

      {/* Quote + CTA */}
      <section className="bg-purple text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
          <Users className="w-8 h-8 text-white/80 mx-auto" />
          <p className="mt-4 text-2xl font-medium leading-relaxed">&ldquo;{LAWLOR_QUOTE.text}&rdquo;</p>
          <p className="mt-5 font-bold">{LAWLOR_QUOTE.who}</p>
          <p className="text-sm text-white/85">{LAWLOR_QUOTE.role}</p>
          <Link href="/signup" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white text-purple-700 px-6 py-3.5 text-sm font-bold hover:bg-white/90">
            Join the movement <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
