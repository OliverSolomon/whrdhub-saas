import { Suspense } from "react";
import { getCurrentUser } from "@/lib/current-user";
import { getFeed } from "@/lib/feed";
import { HUB_VIDEOS } from "@/lib/videos";
import { ImmersiveFeed } from "@/components/feed/immersive-feed";
import { PostComposerModal } from "@/components/composer/post-composer-modal";

export const metadata = { title: "Community Feed — WHRD Hub" };

export default async function MemberFeedPage() {
  const user = await getCurrentUser();
  const feed = await getFeed(30, user?.id);

  return (
    <div className="max-w-xl mx-auto">
      <Suspense fallback={null}>
        <PostComposerModal
          isHub={!!user?.profile?.is_hub_admin}
          userName={user?.profile?.full_name ?? undefined}
          avatarUrl={user?.profile?.avatar_url}
        />
      </Suspense>
      <ImmersiveFeed feed={feed} videos={HUB_VIDEOS} signedIn={!!user} showFab={false} />
    </div>
  );
}
