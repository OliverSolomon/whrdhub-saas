---
title: "While the hosting quota is spent, sign-in is down too, so visitors see a plain outage message"
author: Oliver
date: 2026-11-09
branch: fix/storage-egress
cost: { minutes: 1, tokens: 17122 }
id: l-cd36da1a
scope: repo
status: active
src: agent
touches:
  - app/actions/auth.ts
---

## Decided
When Supabase restricts the organisation, its auth service answers 402 for sign-in and sign-up, not only storage. Code changes cannot lift it; only a paid plan or the billing reset can. Visitors get a plain "temporarily unavailable" message and never the backend's quota wording.

In the code:
- app/actions/auth.ts: readableError takes the auth error status and returns the outage text on 402.

## Tried and ruled out
- Fetching the original files to compress them: public storage URLs return 402, and resources.source_url is empty for every row, so no copy exists outside Supabase Storage.

## Watch out
- Supabase SQL through the management API still works during the restriction, so database reads are possible while the app and storage are not.
- Originals must come from the team's own computers, or wait for access to return.
