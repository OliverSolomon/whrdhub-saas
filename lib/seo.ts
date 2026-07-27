import type { Metadata } from "next";

/**
 * Central place for share/link-preview (Open Graph + Twitter) settings, so a
 * link pasted into WhatsApp, Slack, X, LinkedIn, iMessage, etc. unfurls with an
 * image and text — the same way the reporting platform's links appear.
 */

const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
const fromVercel = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined;

/** Absolute base URL of this deployment (no trailing slash). */
export const SITE_URL = (fromEnv || fromVercel || "http://localhost:3000").replace(/\/$/, "");

export const SITE_NAME = "WHRD Hub";
export const SITE_TAGLINE = "A home for women human rights defenders";
export const SITE_DESCRIPTION =
  "The WHRD Hub connects women human rights defenders and their organisations across Kenya. Share updates, publish stories, find femtorship, and grow the movement.";

/**
 * Build a consistent Metadata object for a page: title, description, canonical,
 * and matching Open Graph + Twitter cards. When `image` is omitted the route's
 * own opengraph-image (or the site default) is used automatically by Next.
 */
export function pageMeta({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  images,
  type = "website",
}: {
  title: string;
  description?: string;
  path?: string;
  images?: { url: string; width?: number; height?: number; alt?: string }[];
  type?: "website" | "article";
}): Metadata {
  const url = `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const ogImages = images && images.length ? images : undefined;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_KE",
      type,
      ...(ogImages ? { images: ogImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImages ? { images: ogImages.map((i) => i.url) } : {}),
    },
  };
}
