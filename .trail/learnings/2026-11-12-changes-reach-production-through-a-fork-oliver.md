---
title: "Changes reach production through a fork pull request that only the WHRD-Hub account can merge, and a build caught a hidden per-visitor bug"
author: Oliver
date: 2026-11-12
branch: feat/neon-migration
cost: { minutes: 7, tokens: 56320 }
id: l-2051dcfa
scope: repo
status: active
src: agent
touches:
  - app/actions/auth.ts
  - app/actions/sessions.ts
  - "app/api/auth/[...path]/route.ts"
  - app/api/storage/route.ts
  - app/auth/callback/route.ts
  - app/auth/confirm/route.ts
  - app/forgot-password/page.tsx
  - app/login/page.tsx
  - app/reset-password/page.tsx
  - lib/auth/client.ts
---

## Decided
Work is pushed to the fork (OliverSolomon/whrdhub-saas) and opened as a pull request against WHRD-Hub/whrdhub-saas main. The fork account has read-only rights on the organisation repo, so merging has to be done by the WHRD-Hub account in GitHub. The Vercel project sits in the Vercel team WHRD-Hub (slug whrd-hub-ke), which the Vercel account connected to Claude is not a member of.

Always run `npm run build` before committing a change to how the session is read. The type check and the dev server both passed while the production build failed.

In the code:
- lib/supabase/server.ts: currentSession() calls `await headers()` before its try block.
- .env.prod.neon (git-ignored): the Neon variables for Vercel production, to import in Vercel's settings.

## Tried and ruled out
- Wrapping auth.getSession() in try/catch on its own: Next signals "this page depends on the visitor" by throwing, the catch swallowed it, and the build then rendered member pages once for nobody and crashed on a null user.
- Merging the pull request through the API with the fork account's sign-in: GitHub answers 404.

## Watch out
- A red "Vercel" check on a fork pull request reading "Authorization required to deploy" is Vercel's fork protection, not a failed build.
- The GitHub CLI is not installed on this machine.
- Local .env.local and production share one Neon branch, so local testing writes to live data until local work gets its own branch.
