---
title: "Finding pending DB migrations (no runner, manual SQL)"
author: Oliver
date: 2026-10-22
branch: reporting-overhaul
cost: { minutes: 1, tokens: 35367 }
touches:
  - supabase/install.sql
---

## Decided
Migrations are numbered files in supabase/ (latest 023_mentor_verification.sql); supabase/install.sql is the idempotent full schema and is kept in sync, so running it applies everything. supabase/legacy/ is provenance only.

## Tried and ruled out
No prisma/drizzle/migrations folder and no migration runner exists, so git cannot show what is applied to the live DB.

## Watch out
Whether a migration is applied can only be checked in the live Supabase SQL editor, e.g. select to_regclass('public.mentor_verifications'). Nothing in the repo tracks applied state.
