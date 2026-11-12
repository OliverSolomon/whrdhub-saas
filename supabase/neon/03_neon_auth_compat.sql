\set ON_ERROR_STOP on
-- Make the app schema (written for Supabase) work on Neon Auth + the Neon Data API.
-- Safe to run again.
begin;

-- 1. Identity. Neon's Data API owns the "auth" schema and provides auth.uid() / auth.user_id().
--    The app's policies and column defaults are bound to the old stand-in function, so it now
--    simply asks Neon who the caller is. It runs with the owner's rights because ordinary
--    callers may not look inside Neon's auth schema by name.
create or replace function legacy_auth.uid() returns uuid
  language sql stable security definer set search_path = ''
  as $fn$ select auth.uid() $fn$;
create or replace function legacy_auth.role() returns text
  language sql stable security definer set search_path = ''
  as $fn$ select case when auth.uid() is null then 'anon' else 'authenticated' end $fn$;

-- 2. Roles. The Data API signs requests in as "authenticated" or "anonymous"; the app's grants
--    and policies name "authenticated" (now authenticated_legacy) and "anon". Membership makes
--    every existing grant and policy apply unchanged.
grant authenticated_legacy to authenticated;
grant anon to anonymous;
grant usage on schema legacy_auth to authenticated_legacy, anon, service_role;
grant execute on function legacy_auth.uid(), legacy_auth.role() to authenticated_legacy, anon, service_role;

-- 3. Functions that name the account tables or auth.uid(): point them at legacy_auth.
do $do$
declare f record; def text; n int := 0;
begin
  for f in
    select p.oid, pg_get_functiondef(p.oid) as def
    from pg_proc p
    where p.pronamespace = 'public'::regnamespace and p.prokind = 'f'
      and p.prosrc ~ '(?<![a-z_])auth\.(users|sessions|refresh_tokens|identities|uid|role)\M'
      and not exists (select 1 from pg_depend e where e.objid = p.oid and e.deptype = 'e')
  loop
    def := regexp_replace(f.def, '(?<![a-z_])auth\.(users|sessions|refresh_tokens|identities|uid|role)\M', 'legacy_auth.\1', 'g');
    execute def;
    n := n + 1;
  end loop;
  raise notice 'functions repointed: %', n;
end $do$;

commit;
select 'policies using the wrapper: '||count(*) from pg_policies where schemaname in ('public','storage') and (qual like '%legacy_auth.uid()%' or with_check like '%legacy_auth.uid()%');
select 'functions still naming auth.*: '||count(*) from pg_proc where pronamespace='public'::regnamespace and prosrc ~ '(?<![a-z_])auth\.(users|sessions|refresh_tokens|identities|uid|role)\M';
