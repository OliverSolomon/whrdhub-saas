"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Share2, BadgeCheck, MapPin, BookOpen, Pin, Youtube, PenLine } from "lucide-react";
import { useReaction } from "@/lib/use-reaction";
import { promptSignIn } from "@/lib/guest-reactions";
import { timeAgo, cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/field";
import type { FeedItem } from "@/lib/feed";

type Stream =
  | { type: "post"; key: string; item: FeedItem }
  | { type: "video"; key: string; id: string; pinned?: boolean };

/** Big heart that bursts on a double-tap "support". */
function Burst({ trigger }: { trigger: number }) {
  if (!trigger) return null;
  return (
    <div key={trigger} className="pointer-events-none absolute inset-0 flex items-center justify-center z-10">
      <Heart className="w-24 h-24 text-magenta drop-shadow-lg fill-current burst" />
    </div>
  );
}

function useShare() {
  const [toast, setToast] = useState<string | null>(null);
  const share = useCallback(async (title: string, url: string) => {
    const data = { title: "WHRD Hub", text: title, url };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
    } catch { /* user cancelled */ return; }
    try {
      await navigator.clipboard.writeText(url);
      setToast("Link copied");
      setTimeout(() => setToast(null), 1600);
    } catch { /* ignore */ }
  }, []);
  return { share, toast };
}

function PostCard({ item, signedIn, onShare }: { item: FeedItem; signedIn: boolean; onShare: (t: string, u: string) => void }) {
  const isBlog = item.kind === "blog";
  const { count, reacted, react } = useReaction({
    postId: item.id,
    signedIn,
    initialCount: item.reactions,
    initialReacted: item.reactedByMe,
  });
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);

  const doReact = useCallback((force?: boolean) => {
    const nowLiked = react(force);
    if (nowLiked) setBurst(Date.now());
  }, [react]);

  // Double tap (touch) / double click (mouse) → support
  const onTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 320) doReact(true);
    lastTap.current = now;
  };

  const shareUrl = isBlog ? `/blog/${item.slug}` : "/";

  return (
    <article className="relative bg-surface rounded-2xl border border-line overflow-hidden">
      <div onDoubleClick={() => doReact(true)} onTouchEnd={onTap} className="select-none">
        <Burst trigger={burst} />
        <header className="flex items-start gap-3 p-4">
          <Avatar name={item.author.name} src={item.author.avatar_url} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm text-ink truncate">{item.author.name}</span>
              {item.is_hub && <BadgeCheck className="w-4 h-4 text-purple shrink-0" />}
            </div>
            <p className="text-xs text-muted truncate">{[item.author.title, item.org].filter(Boolean).join(" · ") || "Woman human rights defender"}</p>
            <p className="text-xs text-muted mt-0.5 flex items-center gap-2">
              <span>{timeAgo(item.published_at)}</span>
              {item.county && <span className="inline-flex items-center gap-0.5"><MapPin className="w-3 h-3" />{item.county}</span>}
            </p>
          </div>
          {item.pinned && <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-purple-050 text-purple-700 border border-purple/20 px-2.5 py-0.5 text-xs font-semibold"><Pin className="w-3 h-3" /> Pinned</span>}
        </header>

        {isBlog ? (
          <div className="px-4 pb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-050 text-cyan-700 border border-cyan/30 px-2.5 py-0.5 text-xs font-semibold mb-2"><BookOpen className="w-3 h-3" /> New story</span>
            <h3 className="font-bold text-ink leading-snug">{item.title}</h3>
            {item.body && <p className="text-sm text-muted mt-1.5 leading-relaxed">{item.body}</p>}
          </div>
        ) : (
          <p className="px-4 pb-1 text-[15px] text-ink whitespace-pre-wrap leading-relaxed">{item.body}</p>
        )}

        {!isBlog && item.media.length > 0 ? (
          <div className="px-4"><MediaBlock media={item.media} /></div>
        ) : item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image} alt="" className="mt-2 w-full object-cover max-h-[26rem]" />
        ) : null}
      </div>

      {isBlog && (
        <Link href={`/blog/${item.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-purple hover:text-purple-700 px-4 pt-2">
          Read more <span aria-hidden>→</span>
        </Link>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 p-2 mt-1 border-t border-line">
        <button onClick={() => doReact()} aria-pressed={reacted}
          className={cn("inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors", reacted ? "text-magenta-700" : "text-ink/70 hover:bg-purple-050 hover:text-purple-700")}>
          <Heart className={cn("w-5 h-5", reacted && "fill-current")} /> {count > 0 ? count : "Support"}
        </button>
        <button onClick={() => promptSignIn()}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-purple-050 hover:text-purple-700">
          <MessageCircle className="w-5 h-5" /> Comment
        </button>
        <button onClick={() => onShare(item.title || item.body?.slice(0, 80) || "From the movement", shareUrl)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-purple-050 hover:text-purple-700">
          <Share2 className="w-5 h-5" /> Share
        </button>
      </div>
    </article>
  );
}

function VideoItem({ id, pinned, onShare }: { id: string; pinned?: boolean; onShare: (t: string, u: string) => void }) {
  return (
    <article className="bg-surface rounded-2xl border border-line overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <span className="w-10 h-10 rounded-full bg-[#FF0000]/10 text-[#FF0000] flex items-center justify-center"><Youtube className="w-5 h-5" /></span>
          <div><p className="text-sm font-semibold text-ink">The Hub Kenya</p><p className="text-xs text-muted">From our YouTube channel</p></div>
        </div>
        {pinned && <span className="inline-flex items-center gap-1 rounded-full bg-magenta-050 text-magenta-700 border border-magenta/20 px-2.5 py-0.5 text-xs font-semibold"><Pin className="w-3 h-3" /> Pinned</span>}
      </div>
      <div className="aspect-video w-full bg-black">
        <iframe className="w-full h-full" src={`https://www.youtube-nocookie.com/embed/${id}`} title="The Hub Kenya" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
      </div>
      <div className="flex items-center p-2 border-t border-line">
        <a href={`https://youtu.be/${id}`} target="_blank" className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-purple-050 hover:text-purple-700"><Youtube className="w-5 h-5" /> Watch</a>
        <button onClick={() => onShare("Watch on The Hub Kenya", `https://youtu.be/${id}`)} className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-purple-050 hover:text-purple-700"><Share2 className="w-5 h-5" /> Share</button>
      </div>
    </article>
  );
}

export function ImmersiveFeed({
  feed,
  videos,
  signedIn,
  showFab = true,
}: {
  feed: FeedItem[];
  videos: string[];
  signedIn: boolean;
  showFab?: boolean;
}) {
  const { share, toast } = useShare();
  const onShare = (t: string, u: string) => share(t, u.startsWith("http") ? u : `${window.location.origin}${u}`);

  // Merge posts/blogs with the videos (latest pinned first).
  const otherVideos = videos.slice(1);
  const stream: Stream[] = [{ type: "video", key: `v-${videos[0]}`, id: videos[0], pinned: true }];
  let vi = 0;
  feed.forEach((item, i) => {
    stream.push({ type: "post", key: `${item.kind}-${item.id}`, item });
    if (i % 2 === 1 && vi < otherVideos.length) {
      stream.push({ type: "video", key: `v-${otherVideos[vi]}`, id: otherVideos[vi] });
      vi += 1;
    }
  });
  while (vi < otherVideos.length) { stream.push({ type: "video", key: `v-${otherVideos[vi]}`, id: otherVideos[vi] }); vi += 1; }

  return (
    <div className="mx-auto max-w-xl px-3 sm:px-0 pb-28 pt-4 space-y-4">
      {stream.map((s) =>
        s.type === "post" ? (
          <PostCard key={s.key} item={s.item} signedIn={signedIn} onShare={onShare} />
        ) : (
          <VideoItem key={s.key} id={s.id} pinned={s.pinned} onShare={onShare} />
        ),
      )}
      <div className="text-center">
        <Link href="/blog" className="text-sm font-semibold text-purple hover:text-purple-700">Browse all stories →</Link>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 rounded-full bg-ink text-white px-4 py-2 text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}

      {/* Add post (hidden when the host page provides its own composer) */}
      {showFab && (
        <Link href={signedIn ? "/dashboard/feed?compose=1" : "/login?next=/dashboard/feed"}
          className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-magenta text-white pl-4 pr-5 h-14 shadow-xl shadow-magenta/25 font-bold text-sm hover:brightness-95 active:scale-95 transition">
          <PenLine className="w-5 h-5" /> <span className="hidden sm:inline">Post</span>
        </Link>
      )}
    </div>
  );
}
