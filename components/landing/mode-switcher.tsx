"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutGrid, Sparkles, X } from "lucide-react";
import { ImmersiveFeed } from "@/components/feed/immersive-feed";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/feed";

const LOGO = "/main-logo.png";

function Segmented({ mode, setMode }: { mode: "site" | "feed"; setMode: (m: "site" | "feed") => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface p-1 shadow-sm" role="tablist" aria-label="Switch view">
      <button
        role="tab"
        aria-selected={mode === "site"}
        onClick={() => setMode("site")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-bold transition-colors",
          mode === "site" ? "bg-purple text-white" : "text-ink/70 hover:text-purple-700",
        )}
      >
        <LayoutGrid className="w-4 h-4" /> Website
      </button>
      <button
        role="tab"
        aria-selected={mode === "feed"}
        onClick={() => setMode("feed")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-bold transition-colors",
          mode === "feed" ? "bg-magenta text-white" : "text-ink/70 hover:text-magenta-700",
        )}
      >
        <Sparkles className="w-4 h-4" /> Feed
      </button>
    </div>
  );
}

/**
 * TikTok-style stem tabs on the landing page. "Website" shows the official
 * marketing site (children); "Feed" takes over the whole screen with the
 * immersive community feed (double-tap to support, share).
 */
export function LandingModeSwitcher({
  feed,
  videos,
  signedIn,
  children,
}: {
  feed: FeedItem[];
  videos: string[];
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<"site" | "feed">("site");

  useEffect(() => {
    document.body.style.overflow = mode === "feed" ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mode]);

  return (
    <>
      {/* Sticky toggle under the header — MOBILE ONLY. On large screens the feed
          lives in the split-view hero and the "Feed" nav item goes to /feed. */}
      <div className="lg:hidden sticky top-16 z-30 border-b border-line bg-surface/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex justify-center">
          <Segmented mode={mode} setMode={setMode} />
        </div>
      </div>

      {children}

      {/* Immersive feed overlay (feed mode) — mobile only */}
      {mode === "feed" && (
        <div className="lg:hidden fixed inset-0 z-50 bg-paper overflow-y-auto feed-scroll">
          <div className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur-md">
            <div className="max-w-xl mx-auto px-3 sm:px-0 h-14 flex items-center justify-between gap-3">
              <Link href="/" onClick={() => setMode("site")} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LOGO} alt="WHRD Hub" className="h-7 w-auto" />
              </Link>
              <Segmented mode={mode} setMode={setMode} />
              <button onClick={() => setMode("site")} aria-label="Close feed" className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full border border-line text-ink/70 hover:bg-purple-050 hover:text-purple-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          <ImmersiveFeed feed={feed} videos={videos} signedIn={signedIn} />
        </div>
      )}
    </>
  );
}
