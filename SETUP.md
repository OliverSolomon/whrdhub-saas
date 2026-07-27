# WHRD Hub — SaaS platform

The community platform for women human rights defenders: a split-view landing
(official content on one side, a LinkedIn-style verified feed on the other),
county networks and organisations, member onboarding, content review by the Hub,
and automatic femtorship matching. It shares the **same Supabase project and
accounts** as the reporting platform.

## 1. Install dependencies

This machine's sandbox has no npm access, so install locally:

```bash
cd whrdhub-saas
npm install
```

New dependencies added: `@supabase/ssr`, `@supabase/supabase-js`, `lucide-react`,
`clsx`, `tailwind-merge`.

## 2. Run the database scripts

Open the Supabase SQL editor for the shared project
(`iygsugmosdnoowerlyel`) and run both files, in order:

```
supabase/001_hub_saas_schema.sql       -- tables, RLS, functions, seeds the 8 county networks
supabase/002_seed_blogs.sql            -- imports the Hub's blog stories from whrdhub.org
supabase/003_seed_posts.sql            -- sample community posts so the feed looks alive
supabase/004_fix_rls_recursion.sql     -- fixes org_memberships policy recursion (run this!)
supabase/005_seed_organizations.sql    -- each county's local host organisation, verified
supabase/006_dashboard_features.sql    -- notifications table, post media column, overview RPC
supabase/007_storage.sql               -- 'media' storage bucket + RLS for post/blog uploads
```

Also enable the **Google** provider in Supabase Auth (Providers) and add
`<your-domain>/auth/callback` as a redirect URL, so Google sign-in works.

Both are safe to run more than once. `001` adds new tables (`county_networks`,
`organizations`, `org_memberships`, `mentorship_profiles`, `mentorship_matches`,
`posts`, `blogs`, `post_reactions`, `content_audit_log`), nullable columns on the
existing `profiles` table (including SaaS terms tracking), RLS policies, stats
functions, and seeds the eight shared county networks (Bomet, Kisumu, Kitui,
Marsabit, Meru, Mombasa, Nairobi, Nakuru). It does not touch the reporting
platform's tables. `002` seeds the blog stories as published Hub content.

## 3. Make yourself a Hub super-admin

After you have signed up once (step 5), run this in the SQL editor with your
email so you can see the Hub console at `/hub`:

```sql
update public.profiles set is_hub_admin = true
where id = (select id from auth.users where email = 'you@example.com');
```

## 4. Environment

`.env.local` is already filled in with the shared Supabase credentials.

- `NEXT_PUBLIC_REPORTING_URL` (SaaS) points at the reporting platform
  (`https://whrdhub.vercel.app`). It drives the **Report Abuse** button
  (`/report`) and the **Switch to reporting** toggle (`/dashboard`).
- On the reporting platform, set `NEXT_PUBLIC_SAAS_URL` so its dashboard
  **Switch to Hub** button points here (defaults to `http://localhost:3000`).

For production set `NEXT_PUBLIC_SITE_URL` and these URLs to your real domains.

## 5. Run it

```bash
npm run dev
```

- `/` — vibrant landing with the live feed (latest YouTube video pinned first)
- `/about`, `/our-work`, `/counties/[slug]`, `/contact`, `/organizations` —
  public marketing pages built from whrdhub.org content and images
- `/signup` -> `/onboarding` — accept the Hub terms, pick a county network, join or
  create a CBO, answer the femtorship questions
- `/dashboard` — a member's home: submit posts and stories, track review status,
  see femtorship matches
- `/blog` and `/blog/[slug]` — the stories section
- `/hub` — the Hub console (super-admins only): review queue, organisation
  verification, member directory, and growth graphs
- `/mentorship` — femtorship matches; the Hub runs matching from here

## How the pieces connect

- **Shared accounts.** Auth and `profiles` live in the same Supabase project as
  the reporting platform, so one login works across both.
- **Content flow.** Members submit posts and stories as `pending`. The Hub
  reviews them (mirroring the reporting platform's fact-check step). Approved
  posts appear in the feed; approved stories appear in `/blog` and also surface in
  the feed as a "New story" card that links through with **Read more**. The Hub
  can pin items to the top.
- **Hierarchy.** Hub -> county network -> organisation (CBO) -> member. New CBOs
  are proposed during onboarding and verified by the Hub.
- **Femtorship.** Everyone answers the questionnaire once. A defender can be a
  femtor and a femtee at the same time. Matching pairs a femtee's "areas I need
  guidance in" against a femtor's "support I can provide", with a boost for the
  same county network. Identities stay private until both people accept.

## Notes

- Brand assets, photos, and blog covers are currently hotlinked from whrdhub.org.
  To self-host, download them into `public/` and swap the URLs in
  `components/public-nav.tsx`, `components/site-footer.tsx`, `app/page.tsx`, and
  the marketing pages.
- The live feed embeds the Hub's YouTube videos from `lib/videos.ts` (ids listed
  newest first; the first one is pinned to the top). Refresh the list from the
  channel's Videos tab when new videos go up.
- New members must accept the Hub terms as the first onboarding step. This is
  tracked in `profiles.hub_terms_accepted_at`, independent of the reporting
  platform, so switching between the two apps does not re-prompt.
- Images in member posts/stories are added by URL for now. Wiring Supabase
  Storage uploads is the natural next step.
