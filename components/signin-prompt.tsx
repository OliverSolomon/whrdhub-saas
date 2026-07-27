"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Heart, X } from "lucide-react";
import { GUEST_LIMIT } from "@/lib/guest-reactions";

/**
 * Global modal shown when a signed-out visitor exceeds the guest support limit.
 * Listens for the "whrd-signin-prompt" window event dispatched by the feed.
 */
export function SignInPrompt() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onPrompt = () => setOpen(true);
    window.addEventListener("whrd-signin-prompt", onPrompt);
    return () => window.removeEventListener("whrd-signin-prompt", onPrompt);
  }, []);

  if (!open) return null;

  const goSignIn = () => {
    setOpen(false);
    router.push(`/login?next=${encodeURIComponent(pathname || "/")}`);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => setOpen(false)}>
      <div className="relative w-full max-w-sm rounded-2xl bg-surface border border-line shadow-2xl p-6 text-center" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setOpen(false)} aria-label="Close" className="absolute top-4 right-4 text-muted hover:text-ink">
          <X className="w-5 h-5" />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-magenta-050 text-magenta-700 flex items-center justify-center mx-auto">
          <Heart className="w-7 h-7 fill-current" />
        </div>
        <h2 className="mt-4 text-xl font-black text-ink">Keep supporting defenders</h2>
        <p className="mt-2 text-sm text-muted">
          You have supported {GUEST_LIMIT} posts. Sign in to keep going, join the conversation, and
          save your support to your account.
        </p>
        <div className="mt-5 space-y-2">
          <button onClick={goSignIn} className="w-full rounded-xl bg-purple text-white h-11 text-sm font-bold hover:bg-purple-600">
            Sign in or create an account
          </button>
          <button onClick={() => setOpen(false)} className="w-full rounded-xl border border-line h-11 text-sm font-semibold text-ink hover:bg-purple-050">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
