import { Download, Mail } from "lucide-react";
import { PageShell } from "@/components/page-hero";
import { NEWSLETTER } from "@/lib/site-content";

export const metadata = {
  title: "Newsletter — WHRD Hub",
  description: "Pulse of Progress, the Hub's bi-annual newsletter.",
};

export default function NewsletterPage() {
  return (
    <PageShell
      eyebrow="Resources"
      title="Newsletter"
      accent="magenta"
      intro="Pulse of Progress is our bi-annual newsletter, sharing stories, milestones, and updates from across the county networks."
    >
      <div className="grid lg:grid-cols-[minmax(0,340px)_1fr] gap-10 items-start">
        <div className="rounded-3xl overflow-hidden border border-line shadow-xl shadow-purple/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={NEWSLETTER.cover} alt={NEWSLETTER.title} className="w-full object-cover" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">Latest edition</p>
          <h2 className="mt-2 text-3xl font-black text-ink">{NEWSLETTER.title}</h2>
          <p className="mt-3 text-muted leading-relaxed max-w-xl">
            Read about the work happening across the movement: the trainings, the convenings, the
            partnerships, and the defenders at the heart of it all.
          </p>
          <a href={NEWSLETTER.pdf} target="_blank" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-purple text-white px-6 py-3.5 text-sm font-bold hover:bg-purple-600">
            <Download className="w-4 h-4" /> Read the newsletter
          </a>

          <div className="mt-10 rounded-2xl border border-line bg-surface p-6 flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-magenta-050 text-magenta flex items-center justify-center shrink-0"><Mail className="w-5 h-5" /></div>
            <div>
              <h3 className="font-bold text-ink">Never miss an edition</h3>
              <p className="text-sm text-muted mt-1">Members receive the newsletter straight to their dashboard. Join the Hub to stay in the loop.</p>
              <a href="/signup" className="mt-3 inline-flex text-sm font-bold text-purple">Join the Hub →</a>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
