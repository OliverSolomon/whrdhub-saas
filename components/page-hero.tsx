import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

type Accent = "purple" | "magenta" | "cyan";
const eyebrowColor: Record<Accent, string> = {
  purple: "text-purple",
  magenta: "text-magenta",
  cyan: "text-cyan-700",
};

/**
 * Shared stencil for every public route. Header + a vibrant brand-wash hero
 * (matching the landing) + page body + footer, so all marketing pages feel of a
 * piece. Pass `image` to show a photo alongside the hero text.
 */
export function PageShell({
  eyebrow,
  title,
  intro,
  accent = "purple",
  image,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  accent?: Accent;
  image?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="brand-wash border-b border-line">
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-20 ${image ? "grid lg:grid-cols-2 gap-10 items-center" : ""}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-wider ${eyebrowColor[accent]}`}>{eyebrow}</p>
            <h1 className="mt-3 text-4xl lg:text-5xl font-black text-ink leading-[1.05]">{title}</h1>
            {intro && <p className="mt-4 text-lg text-muted leading-relaxed max-w-2xl">{intro}</p>}
          </div>
          {image && (
            <div className="rounded-3xl overflow-hidden border border-line shadow-xl shadow-purple/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt="" className="w-full h-80 object-cover" />
            </div>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-14 lg:py-16">{children}</main>

      <SiteFooter />
    </div>
  );
}
