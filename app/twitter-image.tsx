import { renderDefaultOg } from "@/lib/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

// Twitter/X reuses the default branded card. Config is declared locally
// (Turbopack cannot follow re-exported route config).
export const runtime = "nodejs";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderDefaultOg();
}
