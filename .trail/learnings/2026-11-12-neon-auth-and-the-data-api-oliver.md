---
title: "Neon Auth and the Data API are live on Neon with accounts carried over, but the app code still talks to Supabase"
author: Oliver
date: 2026-11-12
branch: fix/storage-egress
cost: { minutes: 15, tokens: 141537 }
id: l-e0132c4f
scope: repo
status: active
src: agent
touches:
  - supabase/neon/00_neon_prep.sql
---

## Decided
On 12 November 2026 Neon Auth (managed Better Auth), the Neon Data API and five storage buckets were turned on for the Neon project, and all 409 remaining accounts were inserted into neon_auth.user with their original ids. The 27 Google sign-ins were linked by Google's account number (neon_auth.account, providerId google), so a Google sign-in lands on the same profile. Checked with a throwaway account: sign-up, sign-in, token, Data API reads with the app's row rules enforced, sign-out. The app itself is NOT ported: lib/supabase/* still creates Supabase clients.

Oliver asked for demo and test data to go: all 25 reports (4 seeded [DEMO], 21 filed by anonymous test accounts), 10 demo feed posts, 3 demo comments, 2 demo listening signals, 4 services with placeholder phone numbers and the 19 anonymous whrdhub.local accounts were deleted on Neon only. Supabase was not touched. Neon branch pre-cleanup-2026-11-12 holds the state before the deletes.

In the code:
- supabase/neon/00..03: the scripts, with the run order at the top of 00_neon_prep.sql.
- neon.ts: auth, dataApi and buckets, deployed.
- .env.local: NEON_AUTH_BASE_URL, NEON_DATA_API_URL, AWS_* for the buckets, NEON_AUTH_COOKIE_SECRET (local only).

## Tried and ruled out
- Keeping our own "authenticated" role and "auth" schema: the Data API refuses to start if either exists. Renamed to authenticated_legacy and legacy_auth, then granted authenticated_legacy to authenticated and anon to anonymous so every grant and policy still applies.
- A service-role login through the Data API: the token's role claim is always "authenticated" whatever neon_auth.user.role says, so there is no service key equivalent.
- A trigger on neon_auth.user to create profiles: the database owner has no trigger right on that table.
- Carrying passwords: Supabase hashes are bcrypt and managed Neon Auth cannot import them.

## Watch out
- Ordinary callers cannot use the auth schema by name. Policies work because they hold the function by id, but any function body that says auth.uid() fails with "permission denied for schema auth". Use legacy_auth.uid(), a security definer wrapper; 03_neon_auth_compat.sql rewrites existing bodies.
- Signed-out requests to the Data API get 401 unless they carry an anonymous token from GET {NEON_AUTH_BASE_URL}/token/anonymous. A signed-in server gets its token from GET {NEON_AUTH_BASE_URL}/token with the session cookie.
- New sign-ups get no profiles row yet: handle_new_user fires on legacy_auth.users, which Neon Auth never writes to. The port needs an "ensure account" step.
- my_sessions, revoke_session and revoke_other_sessions still read the old session tables, which are empty.
- Google sign-in uses Neon's shared development keys (Neon's name on the consent screen). Production needs the organisation's own Google client id and secret added with neon neon-auth oauth-provider.
- The neon CLI sign-in expires within about an hour; neon deploy then fails with a credentials error until neon login is run again.
- Still to design: how server code that used the Supabase service role (40 files, plus auth.admin calls) gets privileged access.
