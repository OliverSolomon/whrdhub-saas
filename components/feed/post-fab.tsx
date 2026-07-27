"use client";

import Link from "next/link";
import { PenLine } from "lucide-react";

/**
 * Floating "add post" action, pinned to the bottom-right of the viewport.
 * Members go straight to the composer; guests are routed to sign in first.
 */
export function PostFab({ signedIn }: { signedIn: boolean }) {
  return (
    <Link
      href={signedIn ? "/dashboard/compose" : "/login?next=/dashboard/compose"}
      className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-magenta text-white pl-4 pr-5 h-14 shadow-xl shadow-magenta/25 font-bold text-sm hover:brightness-95 active:scale-95 transition focus:outline-none focus-visible:ring-4 focus-visible:ring-magenta/30"
      aria-label={signedIn ? "Create a post" : "Sign in to post"}
    >
      <PenLine className="w-5 h-5" />
      <span className="hidden sm:inline">Post</span>
    </Link>
  );
}
