---
title: "Uploads go to Neon Object Storage through a signing route, with an optional copy to Google Drive"
author: Oliver
date: 2026-11-12
branch: feat/neon-migration
cost: { minutes: 9, tokens: 74606 }
id: l-027cbeba
scope: repo
status: active
src: agent
touches:
  - lib/storage/neon.ts
  - lib/storage/server-shim.ts
  - lib/storage/browser-shim.ts
  - app/api/storage/route.ts
  - lib/storage/google-backup.ts
  - lib/supabase/server.ts
  - lib/supabase/admin.ts
  - lib/supabase/client.ts
  - lib/supabase/compat.ts
  - next.config.ts
---

## Decided
Stored files moved off Supabase Storage. The browser holds no storage credentials: it asks app/api/storage/route.ts, which applies the same rules the old storage policies did (own folder for avatars, media and report evidence; Hub admins for publications; mentor documents never from the browser) and returns a five-minute signed PUT URL, so large files go straight to storage and never through a Vercel function (4.5 MB body limit). Public files are served at /files/<bucket>/<key>, the same shape the old links had, so links already saved in the database keep working once the files are uploaded under their old keys.

Oliver asked for every added file to be copied to Google. lib/storage/google-backup.ts does that to a Drive folder when three GOOGLE_BACKUP_* variables are set, and does nothing otherwise. Private buckets (report evidence, mentor documents) are skipped unless GOOGLE_BACKUP_INCLUDE_PRIVATE=true; that default is Claude's choice, not something Oliver asked for.

In the code:
- lib/storage/neon.ts (S3 client, limits, signing), server-shim.ts and browser-shim.ts (the `.storage` shape callers already use), google-backup.ts.
- next.config.ts: /files rewrites for the three public buckets only; storage host added to connect-src.
- scripts/storage-cors.mjs: run again whenever the site gains a new address.

## Watch out
- Signed upload URLs sign content-type and cache-control; the browser must send exactly the headers the route returns or storage answers 403.
- Cache-Control is set on each object at upload (a year for public files). The Cache-Control and X-Robots-Tag that next.config.ts adds to /files did not appear on rewritten responses in local dev; check them on the deployed site.
- The Drive copy is untested: no service account existed. The folder must be in a Shared Drive, because a service account cannot own files in a personal My Drive.
- Not tested through the real forms: avatar, post media, publication and report evidence uploads. The route and both shims were exercised from the browser console only.
- The buckets are empty. The 53 old files are still locked in Supabase.
