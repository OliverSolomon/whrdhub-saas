import { renderDefaultOg } from "@/lib/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo";

// Default social share card for the whole site (1200x630 PNG).
export const runtime = "nodejs";
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return renderDefaultOg();
}
