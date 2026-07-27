import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/current-user";

const LOGO = "https://whrdhub.org/wp-content/uploads/2025/05/imageedit_10_2063970092-600x198.png";

export async function TopBar() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO} alt="WHRD Hub" className="h-8 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
          <Link href="/#feed" className="hover:text-ink transition-colors">Feed</Link>
          <Link href="/blog" className="hover:text-ink transition-colors">Stories</Link>
          <Link href="/organizations" className="hover:text-ink transition-colors">Networks</Link>
          <Link href="/#pillars" className="hover:text-ink transition-colors">Our work</Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {user.profile?.is_hub_admin && (
                <Button href="/hub" variant="ghost" size="sm">Hub console</Button>
              )}
              <Button href="/dashboard" variant="primary" size="sm">Dashboard</Button>
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm">Log in</Button>
              <Button href="/signup" variant="primary" size="sm">Join the Hub</Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
