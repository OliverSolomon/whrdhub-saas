import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, ClipboardCheck, Building2, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { SignOutButton } from "@/components/sign-out-button";

const LOGO = "https://whrdhub.org/wp-content/uploads/2025/05/imageedit_10_2063970092-600x198.png";

const NAV = [
  { href: "/hub", label: "Overview", icon: LayoutDashboard },
  { href: "/hub/queue", label: "Review queue", icon: ClipboardCheck },
  { href: "/hub/organizations", label: "Organisations", icon: Building2 },
  { href: "/hub/members", label: "Members", icon: Users },
];

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/hub");
  if (!user.profile?.is_hub_admin) redirect("/dashboard");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO} alt="WHRD Hub" className="h-8 w-auto" />
            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider text-purple bg-purple-050 px-2 py-0.5 rounded-full">
              Hub console
            </span>
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid lg:grid-cols-[200px_1fr] gap-6">
        <nav className="lg:sticky lg:top-20 lg:self-start flex lg:flex-col gap-1 overflow-x-auto">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted hover:bg-purple-050 hover:text-purple transition-colors whitespace-nowrap"
            >
              <Icon className="w-4 h-4" /> {label}
            </Link>
          ))}
        </nav>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
