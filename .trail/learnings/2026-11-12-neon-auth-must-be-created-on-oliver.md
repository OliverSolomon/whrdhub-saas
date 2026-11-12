---
title: "Neon Auth must be created on first use, never when a module loads, or the production build fails without its secret"
author: Oliver
date: 2026-11-12
branch: fix/lazy-neon-auth
cost: { minutes: 4, tokens: 494897 }
id: l-d1093368
scope: repo
status: active
src: agent
touches:
  - neon.ts
  - supabase/neon/00_neon_prep.sql
  - supabase/neon/04_service_and_accounts.sql
  - lib/supabase/server.ts
  - lib/supabase/client.ts
  - lib/supabase/admin.ts
  - lib/supabase/proxy.ts
  - lib/storage/neon.ts
  - lib/storage/server-shim.ts
  - lib/storage/browser-shim.ts
---

## Decided
The Neon Auth instance is created the first time it is used, not when lib/auth/server.ts is imported. Routes that export a handler are written as functions, not destructured at load time. Oliver's build error came from routes that merely import the auth module: Next imports every route to collect its configuration, and the build machine has no sign-in secret, so the build stopped.

In the code:
- lib/auth/server.ts: `auth` is a lazy proxy over the instance created by neonAuth().
- app/api/auth/[...path]/route.ts: GET, POST, PUT, DELETE and PATCH call auth.handler() inside each function.

## Tried and ruled out
- Destructuring `auth.handler()` at module load (the original route): it runs during the build and needs the secret.
- Only guarding the routes that failed: /auth/callback and /api/ussd/events failed too, and any future route importing the module would fail the same way.

## Watch out
- Reproduce with `NEON_AUTH_COOKIE_SECRET= NEON_AUTH_BASE_URL= npm run build`. A plain build passes locally because .env.local supplies the secret.
- Any new module-level call into Neon Auth or another external client brings this back. Create such clients inside functions.
