import type { NextConfig } from "next";

/**
 * Browser security headers, sent on every response.
 *
 * The Content-Security-Policy lists exactly what the application loads: its own
 * files, Supabase (data, sign-in, storage), the Leaflet map library from unpkg,
 * CARTO map tiles, and https embeds of posts and videos shown in the feed and
 * the listening console. Everything else is refused. Inline scripts are allowed
 * because Next.js writes small inline bootstrap scripts; eval is allowed only in
 * development (hot reload needs it). A page cannot be put inside someone else's
 * frame, and the browser is told never to guess a file's type.
 */
const isDev = process.env.NODE_ENV !== "production";
const supabaseHost = (() => { try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").host; } catch { return "*.supabase.co"; } })();

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' https://unpkg.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://unpkg.com",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://${supabaseHost} wss://${supabaseHost}${isDev ? " ws://localhost:* http://localhost:*" : ""}`,
  "frame-src https:",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(self), payment=(), usb=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Pages that show a person's own data are never kept by a shared cache.
      { source: "/(dashboard|hub|profile|mentorship)/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },

  /**
   * Serve stored files from this domain rather than Supabase's.
   *
   * Supabase returns absolute URLs on its own host, so without this a visitor
   * opening one of the Hub's own publications sees `<ref>.supabase.co` in the
   * address bar. The rewrite proxies the public storage endpoint; `hubFile()`
   * in lib/file-url.ts maps stored URLs onto it, so nothing in the database
   * has to be rewritten.
   *
   * Only the *public* buckets are reachable this way. Report evidence lives in
   * a private bucket and is still reached with a signed, expiring URL — there
   * is deliberately no proxy for it.
   */
  async rewrites() {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!base) return [];
    return [
      {
        source: "/files/:path*",
        destination: `${base.replace(/\/$/, "")}/storage/v1/object/public/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "whrdhub.org" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
