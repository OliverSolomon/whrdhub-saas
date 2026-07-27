import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";

/**
 * Shared Open Graph image renderers. The route files (opengraph-image.tsx /
 * twitter-image.tsx) keep their own literal `runtime`/`size`/`contentType`
 * exports — Turbopack must statically parse those and cannot follow a
 * re-export — and simply call these helpers for the picture itself.
 */

export const OG_SIZE = { width: 1200, height: 630 };

/** The default, site-wide branded share card. */
export function renderDefaultOg() {
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          backgroundImage: "linear-gradient(135deg, #4d2f73 0%, #734e9e 42%, #ce2087 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800, color: "#ffffff" }}>W</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>{SITE_NAME}</span>
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.82)" }}>Women Human Rights Defenders</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 980, letterSpacing: -1.5 }}>{SITE_TAGLINE}</div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.85)", maxWidth: 900, lineHeight: 1.3 }}>
            Share updates, publish stories, find femtorship, and grow the movement across Kenya.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{host}</span>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: 16, background: "#4bb6e2" }} />
            <div style={{ width: 16, height: 16, borderRadius: 16, background: "#ffffff" }} />
            <div style={{ width: 16, height: 16, borderRadius: 16, background: "#ce2087" }} />
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE },
  );
}

/** Per-story share card: cover image with title + author, or brand fallback. */
export async function renderBlogOg(slug: string) {
  const supabase = await createClient();
  const { data: blog } = await supabase
    .from("blogs")
    .select("title, cover_image_url, is_hub, author_id")
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
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} />
        ) : (
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(135deg, #4d2f73 0%, #734e9e 42%, #ce2087 100%)" }} />
        )}

        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(180deg, rgba(20,10,30,0.15) 0%, rgba(20,10,30,0.35) 45%, rgba(20,10,30,0.86) 100%)" }} />

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
    { ...OG_SIZE },
  );
}
