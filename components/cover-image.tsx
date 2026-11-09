import Image from "next/image";
import { hubFile } from "@/lib/file-url";

/**
 * A publication or story cover, resized before it reaches the visitor.
 *
 * Covers are uploaded as full-size PNGs (1 to 2.6 MB each), and a plain <img>
 * made every page view download all of them from Supabase Storage. That is
 * what used up the free Cached Egress quota. Going through Next's image
 * optimiser serves a small WebP instead, and caches it (see `images` in
 * next.config.ts), so Supabase is asked for the original once, not once per
 * visitor.
 *
 * Only our own files and the hosts allowed in `images.remotePatterns` can be
 * optimised. Any other address an admin pasted in as a cover falls back to a
 * plain lazy <img>, so nothing that worked before stops working.
 *
 * `fill` expects a positioned parent with a size (add `relative` to it).
 * Without `fill` the image takes the full width and keeps its own proportions.
 */
const OPTIMISABLE_HOSTS = ["whrdhub.org"];

function canOptimise(src: string): boolean {
  if (src.startsWith("/")) return true;
  try {
    const host = new URL(src).hostname;
    return host.endsWith(".supabase.co") || OPTIMISABLE_HOSTS.includes(host);
  } catch {
    return false;
  }
}

type Props = {
  src: string | null | undefined;
  alt?: string;
  className?: string;
  sizes: string;
  fill?: boolean;
};

export function CoverImage({ src, alt = "", className, sizes, fill = false }: Props) {
  const url = hubFile(src);
  if (!url) return null;

  if (!canOptimise(url)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt={alt} loading="lazy" className={className} />;
  }

  return fill ? (
    <Image src={url} alt={alt} fill sizes={sizes} className={className} />
  ) : (
    <Image
      src={url}
      alt={alt}
      width={0}
      height={0}
      sizes={sizes}
      className={className}
      style={{ width: "100%", height: "auto" }}
    />
  );
}
