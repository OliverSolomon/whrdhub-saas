import { renderBlogOg } from "@/lib/og";

// Twitter/X reuses the per-story card. Config declared locally (Turbopack
// cannot follow re-exported route config).
export const runtime = "nodejs";
export const alt = "WHRD Hub story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderBlogOg(slug);
}
