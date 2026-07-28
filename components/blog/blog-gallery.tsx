"use client";

import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";

/**
 * Photo gallery for a story. The image URLs are stored as data (not inside the
 * body HTML) and only start loading AFTER the article has rendered — we hold the
 * <img src> back until the component has mounted, then let the browser lazy-load
 * them as they scroll into view.
 */
export function BlogGallery({ images }: { images: string[] }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Defer to the next frame so the article text paints first.
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!images || images.length === 0) return null;

  return (
    <section className="mt-10 pt-8 border-t border-line">
      <h2 className="text-sm font-bold uppercase tracking-wide text-muted flex items-center gap-2 mb-4">
        <ImageIcon className="w-4 h-4 text-purple" /> Photos
      </h2>
      <div className={`grid gap-3 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
        {images.map((src, i) => (
          <a
            key={i}
            href={ready ? src : undefined}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-xl overflow-hidden border border-line bg-paper group"
            title="Open full image"
          >
            {ready ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt={`Story photo ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="w-full max-h-[26rem] object-cover transition duration-500 opacity-0 group-hover:scale-[1.02]"
                onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
              />
            ) : (
              <div className="w-full h-56 animate-pulse bg-purple-050" />
            )}
          </a>
        ))}
      </div>
    </section>
  );
}
