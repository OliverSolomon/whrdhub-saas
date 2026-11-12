---
title: The app now signs in through Neon Auth and queries the Neon Data API behind the old Supabase-shaped client
author: Oliver
date: 2026-11-12
branch: feat/neon-migration
cost: { minutes: 21, tokens: 184291 }
id: l-cacf29c3
scope: repo
status: active
src: agent
touches:
  - supabase/neon/00_neon_prep.sql
  - supabase/neon/04_service_and_accounts.sql
  - lib/auth/server.ts
  - "app/api/auth/[...path]/route.ts"
  - lib/auth/client.ts
  - lib/supabase/compat.ts
  - lib/supabase/server.ts
  - lib/supabase/client.ts
  - lib/supabase/admin.ts
  - lib/supabase/proxy.ts
---

## Decided
lib/supabase/{server,client,admin}.ts keep their names and shape but are now built on Neon: queries go through @supabase/postgrest-js pointed at the Neon Data API, identity comes from @neon/auth, and every request carries a token (the person's, the server account's, or an anonymous one). That kept the roughly 140 files that call .from(), .rpc() and auth.getUser() unchanged. Oliver chose this over rewriting server code to direct SQL; direct SQL remains the long-term direction.

The old service-role key is replaced by one dedicated Neon Auth account (NEON_SERVICE_EMAIL and NEON_SERVICE_PASSWORD, server only). The database treats it as the trusted server: legacy_auth.is_service() is true for it, legacy_auth.uid() answers NULL for it, and a server_account_all policy on every table lets it through.

Forgotten passwords use a six-digit emailed code instead of a link, because Neon's shared mail sender cannot send links. The same flow is how people with pre-move passwords get back in.

Tested in the browser on localhost with throwaway accounts: public pages, redirect to login, sign-up, profile creation, sign-out, wrong and right password, anonymous sign-up, device list, reset-code request and wrong-code message.

In the code:
- lib/supabase/compat.ts: shared pieces. lib/auth/server.ts and client.ts: Neon Auth. app/api/auth/[...path]/route.ts: its route handler.
- supabase/neon/04_service_and_accounts.sql: server account, ensure_account, server_register_account, server_update_account, server_delete_account, guarded rate limiting.
- app/actions/auth.ts, app/actions/sessions.ts, app/auth/callback/route.ts.

## Tried and ruled out
- auth.emailOtp and auth.signIn.emailOtp on the server object: not in its types. The code calls the endpoints /email-otp/send-verification-otp and /sign-in/email-otp directly.
- Reading a profile with the per-person client straight after signing in inside a server action: the request still carries the signed-out cookies, so it sees nobody. Use createAdminClient() for that one read.

## Watch out
- After adding a database function, run neon data-api refresh-schema or the Data API answers 404 for it. Calls made in the first seconds after a refresh can fail once.
- Asking Neon Auth for an email code for an unknown address creates an account, so both reset actions first check the address has a profile.
- Not tested: a full Google sign-in round trip, a correct reset code, the report form's anonymous path, USSD, claiming an anonymous account, account purge.
- File uploads still point at Supabase Storage (legacyStorage in compat.ts) and do not work.
- Sign-up no longer confirms the email address; Neon's "verify email at signup" is off.
- Production needs: NEON_* and AWS_* variables on Vercel, its own NEON_AUTH_COOKIE_SECRET, the live domain added with neon neon-auth domain add, and the organisation's own Google keys.
