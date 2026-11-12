import type { MetadataRoute } from "next";

/**
 * Crawler rules.
 *
 * Stored files (/files/*) are the Hub's PDFs and cover images, served from
 * metered Supabase Storage. Search engines fetching every report, and AI
 * scrapers taking every cover, used up the monthly egress allowance, so no
 * crawler is asked to fetch them. The pages that link to the files are still
 * indexed, which is where people should arrive from search.
 *
 * Known AI-training crawlers are blocked from the whole site.
 */
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "CCBot",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "PerplexityBot",
  "Bytespider",
  "Amazonbot",
  "Applebot-Extended",
  "FacebookBot",
  "img2dataset",
  "omgili",
  "Diffbot",
];

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/files/", "/api/"] },
      { userAgent: AI_CRAWLERS, disallow: "/" },
    ],
    ...(site ? { host: site } : {}),
  };
}
