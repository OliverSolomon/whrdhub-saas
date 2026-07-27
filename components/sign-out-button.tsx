"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter();
  const signOut = async () => {
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  };
  return (
    <button
      onClick={signOut}
      className={className ?? "inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"}
    >
      <LogOut className="w-4 h-4" /> Sign out
    </button>
  );
}
