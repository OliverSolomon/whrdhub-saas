import { Download } from "lucide-react";
import { PageShell } from "@/components/page-hero";
import { RESOURCES, NEWSLETTER } from "@/lib/site-content";

export const metadata = {
  title: "Resources & Downloads — WHRD Hub",
  description: "Reports, research, guides, and photo books from the Women Human Rights Defenders Hub.",
};

export default function ResourcesPage() {
  return (
    <PageShell
      eyebrow="Resources"
      title="Resources and downloads"
      accent="purple"
      intro="Our reports, research, policy briefs, and guides, free to read and share. Everything here is produced by the Hub and our partners."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {RESOURCES.map((r, i) => (
          <a
            key={i}
            href={r.pdf}
            target="_blank"
            className="group rounded-2xl border border-line bg-surface overflow-hidden hover:shadow-md transition-shadow flex flex-col"
          >
            <div className="aspect-[3/4] bg-paper overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.cover} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <div className="p-4 flex flex-col flex-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-cyan-700">{r.kind}</span>
              <h2 className="mt-1 font-bold text-ink text-sm leading-snug">{r.title}</h2>
              <span className="mt-auto pt-3 inline-flex items-center gap-1.5 text-xs font-bold text-purple">
                <Download className="w-3.5 h-3.5" /> Download PDF
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Newsletter highlight */}
      <div className="mt-14 rounded-3xl border border-line bg-surface overflow-hidden grid sm:grid-cols-[200px_1fr]">
        <div className="bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={NEWSLETTER.cover} alt="" className="w-full h-full object-cover" />
        </div>
        <div className="p-8 flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-magenta">Newsletter</p>
          <h2 className="mt-2 text-2xl font-black text-ink">{NEWSLETTER.title}</h2>
          <p className="mt-1 text-muted">{NEWSLETTER.subtitle}. Read the latest edition for stories and updates from across the movement.</p>
          <a href={NEWSLETTER.pdf} target="_blank" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple text-white px-5 py-3 text-sm font-bold hover:bg-purple-600 w-fit">
            <Download className="w-4 h-4" /> Read the newsletter
          </a>
        </div>
      </div>
    </PageShell>
  );
}
