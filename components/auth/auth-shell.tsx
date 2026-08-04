import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

const LOGO = "/main-logo.png";
const SIDE_IMG = "https://whrdhub.org/wp-content/uploads/2025/03/IMG_0764-scaled.jpg";

/**
 * Split-screen auth layout: a branded image panel on the left (desktop) and the
 * form on the right. On mobile the panel collapses to a compact brand header so
 * the form gets the full screen.
 */
export function AuthShell({
  heading,
  sub,
  children,
  footer,
}: {
  heading: string;
  sub: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Branded panel — desktop */}
      <div className="relative hidden lg:flex flex-col justify-between overflow-hidden p-12 text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={SIDE_IMG} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple/95 via-purple/85 to-magenta/70" />
        <Link href="/" className="relative inline-flex bg-white rounded-2xl px-4 py-2.5 shadow-sm w-fit">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="WHRD Hub" className="h-9 w-auto" />
        </Link>
        <div className="relative max-w-md">
          <h2 className="text-4xl font-black leading-tight">A home for women human rights defenders across Kenya &amp; Beyond</h2>
          <p className="mt-4 text-white/85 text-lg leading-relaxed">
            Join a community of defenders across Kenya. Share your work, publish your stories, and
            grow through femtorship.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/20 px-4 py-2 text-sm font-semibold">
            <ShieldCheck className="w-4 h-4" /> One account for the Hub and the reporting platform
          </div>
        </div>
        <p className="relative text-xs text-white/70">© {new Date().getFullYear()} Women Human Rights Defenders Hub (The Hub)</p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center px-5 sm:px-8 py-10 bg-paper lg:bg-surface min-h-screen lg:min-h-0">
        <div className="w-full max-w-sm">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink mb-8 lg:hidden">
            <ArrowLeft className="w-4 h-4" /> Back to the Hub
          </Link>

          {/* Mobile brand mark */}
          <div className="lg:hidden mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="WHRD Hub" className="h-10 w-auto" />
          </div>

          <h1 className="text-3xl font-black text-ink">{heading}</h1>
          <p className="mt-1.5 text-muted">{sub}</p>

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
