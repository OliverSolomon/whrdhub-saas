import { Youtube, Pin } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { HUB_CHANNEL_URL } from "@/lib/videos";

/**
 * A live-feed card that embeds a Hub YouTube video. When `pinned` is set (the
 * most recent upload) it floats to the top of the feed.
 */
export function VideoCard({ id, pinned = false }: { id: string; pinned?: boolean }) {
  return (
    <article className="bg-surface px-4 py-4">
      <div className="flex items-center justify-between">
        <a href={HUB_CHANNEL_URL} target="_blank" className="flex items-center gap-2 min-w-0">
          <span className="w-10 h-10 rounded-full bg-[#FF0000]/10 text-[#FF0000] flex items-center justify-center shrink-0">
            <Youtube className="w-5 h-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-ink truncate">The Hub Kenya</span>
            <span className="block text-xs text-muted">Live from our YouTube channel</span>
          </span>
        </a>
        {pinned && (
          <Pill tone="magenta" className="shrink-0 bg-magenta-050 text-magenta border-magenta/20">
            <Pin className="w-3 h-3" /> Pinned
          </Pill>
        )}
      </div>
      <div className="mt-3 aspect-video w-full bg-black rounded-xl overflow-hidden border border-line">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube-nocookie.com/embed/${id}`}
          title="The Hub Kenya video"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </article>
  );
}
