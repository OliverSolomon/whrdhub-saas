---
title: Report data is encrypted by the application and the classification columns stay readable on purpose
author: Oliver
date: 2026-11-02
branch: reporting-overhaul
cost: { minutes: 19, tokens: 550679 }
id: l-5d0a98a1
scope: repo
status: active
src: agent
touches:
  - lib/crypto.ts
  - lib/report-crypto.ts
  - app/hub/reporting/reports/page.tsx
  - app/actions/report-submit.ts
---

## Decided
- Narrative, contact, file names and exact location are sealed (AES-256-GCM, tied to table, column and row). Incident type, county, urgency, status and dates stay readable because matching, filters, statistics and row-level security read them.
- Phone lookup uses a keyed fingerprint (contact_hash), never the number.
- Rate limits are counted in Postgres (rate_limit_hit) because in-function counters reset on serverless; the limiter fails open so a fault never blocks a safety service.
- Audit tables are insert-only (RLS plus revoked update/delete/truncate).

## Tried and ruled out
- Encrypting every column: breaks matching and RLS.
- In-memory rate limiting: useless across serverless instances.

## Watch out
- Sealed text cannot be searched in SQL; Reports search is case reference, id or county only.
- Losing DATA_ENCRYPTION_KEYS loses the data; never change BLIND_INDEX_KEY once reports exist.
- Existing rows need scripts/encrypt-existing.mts --apply after a backup.

In the code: lib/crypto.ts, lib/report-crypto.ts, lib/rate-limit.ts, lib/audit.ts, supabase/024_security_hardening.sql.
