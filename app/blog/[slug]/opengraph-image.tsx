import { renderBlogOg } from "@/lib/og";

// Per-story share card (1200x630 PNG).
export const runtime = "nodejs";
export const alt = "WHRD Hub story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return renderBlogOg(slug);
}
