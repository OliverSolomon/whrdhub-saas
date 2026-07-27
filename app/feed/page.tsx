import { Sparkles } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ImmersiveFeed } from "@/components/feed/immersive-feed";
import { getFeed } from "@/lib/feed";
import { getCurrentUser } from "@/lib/current-user";
import { HUB_VIDEOS } from "@/lib/videos";

export const metadata = {
  title: "Community Feed — WHRD Hub",
  description: "Verified updates, stories, and video from women human rights defenders and the Hub.",
};

export default async function FeedPage() {
  const user = await getCurrentUser();
  const feed = await getFeed(30, user?.id);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader />
      <div className="border-b border-line bg-surface">
        <div className="max-w-xl mx-auto px-4 sm:px-0 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-purple-700 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Community feed
          </p>
          <h1 className="mt-1 text-2xl font-black text-ink">From the movement</h1>
          <p className="text-sm text-muted">Double-tap a post to support it.</p>
        </div>
      </div>
      <ImmersiveFeed feed={feed} videos={HUB_VIDEOS} signedIn={!!user} />
    </div>
  );
}
