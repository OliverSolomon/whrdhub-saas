import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/seo";

// Default social share card for the whole site. Rendered as a 1200x630 PNG.
export const runtime = "nodejs";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
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
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: 20, background: "rgba(255,255,255,0.16)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, fontWeight: 800, color: "#ffffff",
            }}
          >
            W
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>{SITE_NAME}</span>
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.82)" }}>Women Human Rights Defenders</span>
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 980, letterSpacing: -1.5 }}>
            {SITE_TAGLINE}
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.85)", maxWidth: 900, lineHeight: 1.3 }}>
            Share updates, publish stories, find femtorship, and grow the movement across Kenya.
          </div>
        </div>

        {/* Footer */}
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
    { ...size },
  );
}
