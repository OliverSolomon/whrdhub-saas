---
title: "Security review: encryption, logging, rate-limit gaps (analysis only, nothing changed)"
author: Oliver
date: 2026-10-26
branch: reporting-overhaul
cost: { minutes: 2, tokens: 86812 }
id: l-85eb89e6
scope: repo
status: active
touches:
  - app/api/ussd/route.ts
  - app/api/ussd/events/route.ts
  - app/api/chat/route.ts
  - next.config.ts
  - proxy.ts
---

## Decided
- Review only; no code changed. Recommended plan: one lib/crypto.ts (AES-256-GCM, format v1:keyId:iv:tag:ct, AAD = table+column+row id, KEK in env with key ids so it can move to a cloud KMS), HMAC blind index (e.g. contact_hash) for phone lookup, narrative and contact fields encrypted, matching fields (incident_types, county, support_needed, urgency) left plaintext because SQL matching and stats read them. Encrypt in the app, never with pgcrypto in SQL (keys land in query logs).
- Logging as three streams: insert-only audit tables, JSON security events through a Vercel Log Drain, and scrubbed errors. Rate limiting needs a shared store (Redis via Marketplace); in-memory limits do not work on serverless.

## Tried and ruled out
- skill-issue recommend_skills failed on a missing project_description argument; pass it next time.

## Watch out
- app/api/ussd/route.ts: USSD_PIN_PEPPER defaults to "" silently, so a 4-digit PIN hash is trivially brute-forced from a DB dump. The PIN lock is permanent after 5 tries, so anyone who knows a number can lock that person out.
- app/api/ussd/route.ts and app/api/ussd/events/route.ts have no check that the caller is Africa's Talking; events sends an SMS to the request's phoneNumber.
- app/api/chat/route.ts has no rate limit and anonymous accounts are free, so sign-in is no barrier.
- report_audit_log policy ral_responders is "for all" (rows editable and deletable by responders); content_audit_log audit_write lets any authenticated user insert. The "viewed" row is written on every page load of reports/[id]/page.tsx. Signed URLs for evidence and mentor IDs (1h) are not logged.
- next.config.ts sets no security headers. proxy.ts and the report page use getSession, not getUser.
- Findings come from reading the repo, not the live Supabase project; verify applied policies there first.
