---
title: "Supabase free-tier outage was Cached Egress from huge publication files; fixed by shrinking and blocking crawlers, not by changing database"
author: Oliver
date: 2026-11-09
branch: fix/storage-egress
cost: { minutes: 4, tokens: 92358 }
id: l-8f12c684
scope: repo
status: active
src: agent
touches:
  - app/blog/page.tsx
  - app/newsletter/page.tsx
  - app/page.tsx
  - app/resources/page.tsx
  - components/cover-image.tsx
  - next.config.ts
  - app/robots.ts
  - lib/supabase/proxy.ts
---

## Decided
The "organization has used up its quota" restriction came from one meter only: Cached Egress (6.96 GB of 5 GB). Storage, database and normal egress were all low. Cause: publication PDFs up to 25 MB and 1-2.6 MB PNG covers, shown full size on every list page, plus search and AI crawlers fetching them. A new project, a new org or another database would not help; the quota is per organisation and follows the owner. Fix is to serve small cached covers, keep crawlers off the stored files, and later shrink the PDFs or move them to cheaper egress storage.

In the code:
- components/cover-image.tsx: covers go through the Next image optimiser (WebP, resized); falls back to a plain lazy img for hosts the optimiser cannot handle.
- next.config.ts: images.minimumCacheTTL is 31 days; /files gets X-Robots-Tag noindex, noai, noimageai plus a CDN cache header.
- app/robots.ts: Disallow /files/ and /api/ for everyone, whole site for known AI scrapers.
- lib/supabase/proxy.ts: /robots.txt added to public paths.

## Tried and ruled out
- Creating another project or organisation: limits are per owner, so it only buys a fresh quota.
- Switching to another database: the apps depend on Supabase Auth, Storage and RLS on auth.uid(), so it is a rewrite.
- Self-hosting: possible, but backups and security for defenders' reports become our job.

## Watch out
- While the org is restricted, Supabase answers 402 to downloads and uploads from /files, so original files cannot be fetched or replaced until the billing cycle resets on 22 November. The /files headers and the image optimiser against live files were not tested for that reason; check after the reset.
- Replacing a cover under the same file name will not show for up to 31 days because of the image cache; upload under a new name.
- Blocking /files/ in robots.txt removes the PDFs themselves from search results; the pages linking to them stay indexed.
- Still to do: compress the big PDFs, delete the duplicate Annual Report and the "300 mB sample pdf" test file, consider Cloudflare R2 for downloads.
