---
title: "Handover document: where it lives and what the dev DB can show"
author: Oliver
date: 2026-10-23
branch: reporting-overhaul
cost: { minutes: 37, tokens: 477065 }
id: l-3398e645
scope: repo
status: active
touches:
  - AGENTS.md
---

## Decided
- The handover TDD is docs/WHRD_Hub_Platform_Handover_TDD.pdf (docs/ is gitignored, local only). It was built by headless Chrome from HTML; screenshots came from `npm run dev` against the DEV Supabase project (.env.local), never production (.env.prod).
- The dev project holds only [DEMO]-tagged reports, so case screenshots are safe. Hub member lists show real names and emails: crop or skip them.

## Watch out
- test.reportadmin has user_type admin but not is_hub_admin, so /hub/* community pages redirect it to the reporting console. To capture them, set is_hub_admin on it in dev and set it back.
- `next dev` rewrites the tracked AGENTS.md; `git checkout -- AGENTS.md` after running it.
- Escalation windows (15 and 60 min) only bite if the cron runs sub-daily, which needs a Vercel plan above Hobby.
