import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

export const runtime = "nodejs";
export const alt = "WHRD Hub story";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Per-story share card: the cover image with the title over it, or a branded
// gradient fallback. This is what shows when a story link is pasted anywhere.
export default async function BlogOG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: blog } = await supabase
    .from("blogs")
    .select("title, excerpt, cover_image_url, is_hub, author_id")
    .eq("slug", slug)
    .eq("status", "approved")
    .maybeSingle();

  const title = (blog?.title as string) || SITE_TAGLINE;
  const cover = (blog?.cover_image_url as string) || null;

  let author = blog?.is_hub ? "WHRD Hub" : "WHRD member";
  if (blog && !blog.is_hub && blog.author_id) {
    const { data: p } = await supabase.from("profiles").select("full_name, username").eq("id", blog.author_id).maybeSingle();
    if (p) author = (p.full_name as string) || (p.username as string) || author;
  }

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", fontFamily: "sans-serif" }}>
        {/* Background: cover image or brand gradient */}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(135deg, #4d2f73 0%, #734e9e 42%, #ce2087 100%)" }} />
        )}

        {/* Dark gradient scrim for legibility */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180deg, rgba(20,10,30,0.15) 0%, rgba(20,10,30,0.35) 45%, rgba(20,10,30,0.86) 100%)" }} />

        {/* Content */}
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: "100%", height: "100%", color: "#ffffff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 800 }}>W</div>
            <span style={{ fontSize: 30, fontWeight: 800 }}>{SITE_NAME}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: title.length > 70 ? 52 : 64, fontWeight: 800, lineHeight: 1.06, letterSpacing: -1.5, maxWidth: 1040, textShadow: "0 2px 24px rgba(0,0,0,0.35)" }}>
              {title.length > 120 ? `${title.slice(0, 117)}…` : title}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 26, color: "rgba(255,255,255,0.9)" }}>
              <div style={{ width: 12, height: 12, borderRadius: 12, background: "#ce2087" }} />
              <span>{author}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
