"use client";

import { useRouter } from "next/navigation";
import { Shield, User } from "lucide-react";
import { useAdminMode, setAdminMode } from "@/lib/admin-mode";

/**
 * Toggle between the member dashboard and the Hub admin console. Only rendered
 * for accounts where profiles.is_hub_admin is true. The chosen mode is kept in
 * localStorage so it persists across sign-out (Sauti-style).
 *
 * variant "menu"  — a row inside the sidebar user dropdown.
 * variant "card"  — a standalone card for the profile page.
 */
export function RoleSwitcher({ variant = "menu" }: { variant?: "menu" | "card" }) {
  const router = useRouter();
  const adminMode = useAdminMode();

  const switchTo = (admin: boolean) => {
    setAdminMode(admin);
    router.push(admin ? "/hub" : "/dashboard");
    router.refresh();
  };

  if (variant === "card") {
    return (
      <div className="rounded-2xl border border-line bg-surface p-1.5 flex gap-1.5">
        <button
          onClick={() => switchTo(false)}
          aria-pressed={!adminMode}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${!adminMode ? "bg-purple text-white" : "text-ink/70 hover:bg-purple-050"}`}
        >
          <User className="w-4 h-4" /> Member view
        </button>
        <button
          onClick={() => switchTo(true)}
          aria-pressed={adminMode}
          className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors ${adminMode ? "bg-purple text-white" : "text-ink/70 hover:bg-purple-050"}`}
        >
          <Shield className="w-4 h-4" /> Admin view
        </button>
      </div>
    );
  }

  // menu variant
  return adminMode ? (
    <button
      onClick={() => switchTo(false)}
      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink/80 hover:bg-purple-050 hover:text-purple-700"
    >
      <User className="w-4 h-4" /> Switch to member view
    </button>
  ) : (
    <button
      onClick={() => switchTo(true)}
      className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-purple hover:bg-purple-050"
    >
      <Shield className="w-4 h-4" /> Switch to admin view
    </button>
  );
}
