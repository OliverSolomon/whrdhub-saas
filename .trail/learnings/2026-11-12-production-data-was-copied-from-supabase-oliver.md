---
title: "Production data was copied from Supabase to Neon through the two connections, and Neon runs the repo's newer schema"
author: Oliver
date: 2026-11-12
branch: fix/storage-egress
cost: { minutes: 35, tokens: 282509 }
id: l-c654fcfa
scope: repo
status: active
src: agent
touches:
  - neon.ts
  - supabase/install.sql
---

## Decided
On 12 November 2026 the production database (WHRD-Hub-Prod) was copied into the Neon project whrdhub-saas (rapid-firefly-69884862, Frankfurt, Postgres 18). The schema on Neon was built from the repo's own installer rather than dumped from Supabase, then the rows were moved and every table was checked by row count and content checksum (27 tables identical). Supabase was only read, never changed. The app still runs on Supabase; nothing in the code points at Neon yet.

Neon's schema is ahead of live Supabase: migrations 019 to 024 had never been applied to production, so Neon has three extra tables (listening_packs, listening_tag_declines, rate_limits) and a few newer columns. The only thing live had that Neon lacks is profiles.onboarding_completed, which 024 drops on purpose.

The old accounts and file records sit in holding tables (auth.users, auth.identities, storage.buckets, storage.objects) so the foreign keys and policies still resolve. They are a copy of the data, not a working sign-in service.

In the code:
- supabase/neon/00_neon_prep.sql: roles (anon, authenticated, service_role), the auth and storage holding tables, auth.uid(), storage.foldername(). Run it before supabase/install.sql on a fresh Neon branch.
- neon.ts: declares auth and five buckets but was NOT deployed.
- .env.local: DATABASE_URL (pooled) and DATABASE_URL_UNPOOLED (use this one for schema work and loads).

## Tried and ruled out
- pg_dump over a direct connection: no database password on hand, the direct host is IPv6 only, and the REST API answers 402 while the org is restricted.
- Creating a temporary login role on Supabase to dump with: blocked by the permission classifier as adding access; do not retry.
- session_replication_role = replica on Neon to skip triggers during the load: Neon refuses it.

## Watch out
- How the rows moved: one Supabase MCP query returning jsonb_agg(to_jsonb(t)) per table. A result that large is saved to a file instead of being shown, and a local script loads it with jsonb_populate_recordset. Pad small results past the size limit so they also go to a file. Delete the export files afterwards; they hold password hashes and personal data.
- Loading on Neon: inside one transaction, set the foreign keys deferrable, disable user triggers on the loaded tables, load, then set constraints immediate and put both back. Otherwise handle_new_user and the notification triggers fire on the copied rows.
- The installer seeds demo content; truncate the loaded tables before loading or the seeds mix with real rows.
- Postgres 18 records NOT NULL as constraints, so constraint counts differ from Postgres 17 for no real reason.
- The backfills inside migrations 019 to 024 (for example listening pack names) ran against the installer's seed rows, not the copied rows. Re-running install.sql would redo them but also re-seeds demo content, so check before running it.
- The copy is a snapshot. Anything written to Supabase after 12 November needs copying again before a switch.
- Password hashes are bcrypt and Neon's managed sign-in cannot import them; the 7 whrdhub.org staff all sign in with Google, the 19 anonymous reporters have no real email to reset through.
