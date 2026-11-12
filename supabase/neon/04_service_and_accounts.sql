\set ON_ERROR_STOP on
-- Server-side access and account housekeeping on Neon. Safe to run again.
--
-- Supabase gave the server a "service role" key that skipped every access rule. Neon's Data API
-- has no such key: each request is a signed-in person or anonymous. So the server signs in as
-- ONE dedicated account, and the database treats that account as the trusted server:
--   * legacy_auth.is_service() is true only for it;
--   * legacy_auth.uid() answers NULL for it, exactly what the old service role looked like, so
--     every existing "no user id means the server" check keeps working;
--   * one extra policy per table lets it through.
-- Which account that is lives in legacy_auth.service_account (one row, set by the setup script).
begin;

create table if not exists legacy_auth.service_account (
  only_one boolean primary key default true check (only_one),
  user_id  uuid not null
);
revoke all on legacy_auth.service_account from public, anon, authenticated_legacy;

create or replace function legacy_auth.is_service() returns boolean
  language sql stable security definer set search_path = ''
  as $fn$ select coalesce(auth.uid() = (select user_id from legacy_auth.service_account), false) $fn$;

create or replace function legacy_auth.uid() returns uuid
  language sql stable security definer set search_path = ''
  as $fn$
    select case when auth.uid() = (select user_id from legacy_auth.service_account) then null else auth.uid() end
  $fn$;

grant execute on function legacy_auth.is_service() to authenticated_legacy, anon, service_role;

-- One pass-through policy per table for the server account.
do $do$
declare t record;
begin
  for t in
    select c.oid::regclass as tbl
    from pg_class c
    where c.relkind = 'r'
      and (c.relnamespace = 'public'::regnamespace or c.oid in ('storage.objects'::regclass, 'storage.buckets'::regclass))
  loop
    execute format('drop policy if exists server_account_all on %s', t.tbl);
    execute format(
      'create policy server_account_all on %s for all to authenticated_legacy using (legacy_auth.is_service()) with check (legacy_auth.is_service())',
      t.tbl);
  end loop;
end $do$;
grant select, insert, update, delete on public.rate_limits to authenticated_legacy;  -- RLS still limits it to the server account

-- Rate limiting was "service role only" by grant. The server now arrives as an ordinary signed-in
-- role, so the functions check for the server account themselves.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql security definer set search_path = public as $fn$
declare r public.rate_limits;
begin
  if not legacy_auth.is_service() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then now() else rl.window_start end,
    hits         = case when rl.window_start < now() - make_interval(secs => p_window_seconds) then 1 else rl.hits + 1 end
  returning * into r;
  allowed     := r.hits <= p_max;
  remaining   := greatest(p_max - r.hits, 0);
  retry_after := case when allowed then 0
                      else greatest(1, ceil(extract(epoch from (r.window_start + make_interval(secs => p_window_seconds) - now())))::integer) end;
  return next;
end $fn$;

create or replace function public.purge_rate_limits() returns integer
language plpgsql security definer set search_path = public as $fn$
declare n integer;
begin
  if not legacy_auth.is_service() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
  with d as (delete from public.rate_limits where window_start < now() - interval '1 day' returning 1)
  select count(*)::integer into n from d;
  return n;
end $fn$;
grant execute on function public.rate_limit_hit(text, integer, integer) to authenticated_legacy;
grant execute on function public.purge_rate_limits() to authenticated_legacy;

-- New accounts. Neon Auth keeps people in neon_auth."user"; the app's profile is created by the
-- handle_new_user trigger on legacy_auth.users. These two functions put the missing row there.

-- For the person who has just signed in (sign-up, or a first Google sign-in).
create or replace function public.ensure_account(p_full_name text default null, p_account_kind text default null, p_username text default null)
returns void language plpgsql security definer set search_path = public as $fn$
declare
  me uuid := legacy_auth.uid();
  u  record;
  kind text := case when p_account_kind in ('reporter', 'member', 'anonymous') then p_account_kind else null end;
begin
  if me is null then return; end if;
  if exists (select 1 from legacy_auth.users where id = me) then return; end if;
  select id, email, name, "emailVerified" as verified, "createdAt" as created into u from neon_auth."user" where id = me;
  if not found then return; end if;
  insert into legacy_auth.users (id, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at, is_anonymous)
  values (
    u.id, u.email,
    jsonb_strip_nulls(jsonb_build_object(
      'full_name', coalesce(nullif(btrim(p_full_name), ''), u.name),
      'account_kind', kind,
      'is_anonymous', kind = 'anonymous',
      'username', nullif(btrim(p_username), ''))),
    u.created, now(), case when u.verified then now() end, coalesce(kind = 'anonymous', false))
  on conflict (id) do nothing;
  update public.profiles
     set full_name = coalesce(full_name, nullif(btrim(p_full_name), ''), u.name)
   where id = me and full_name is null and coalesce(kind, '') <> 'anonymous';
end $fn$;
grant execute on function public.ensure_account(text, text, text) to authenticated_legacy;

-- For the server, when it creates an account on somebody's behalf (anonymous report, USSD).
create or replace function public.server_register_account(p_id uuid, p_meta jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = public as $fn$
declare u record;
begin
  if not legacy_auth.is_service() then raise exception 'not allowed' using errcode = '42501'; end if;
  select id, email, "emailVerified" as verified, "createdAt" as created into u from neon_auth."user" where id = p_id;
  if not found then raise exception 'no such account'; end if;
  insert into legacy_auth.users (id, email, raw_user_meta_data, created_at, updated_at, email_confirmed_at, is_anonymous)
  values (u.id, u.email, coalesce(p_meta, '{}'::jsonb), u.created, now(), now(),
          coalesce((p_meta->>'is_anonymous')::boolean, false))
  on conflict (id) do nothing;
end $fn$;
grant execute on function public.server_register_account(uuid, jsonb) to authenticated_legacy;

-- Change an account's address (claiming an anonymous account). Password, when given, arrives
-- already hashed by the server in Better Auth's own format.
create or replace function public.server_update_account(p_id uuid, p_email text, p_password_hash text default null)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if not legacy_auth.is_service() then raise exception 'not allowed' using errcode = '42501'; end if;
  update neon_auth."user" set email = lower(p_email), "emailVerified" = true, "updatedAt" = now() where id = p_id;
  update legacy_auth.users set email = lower(p_email), email_confirmed_at = coalesce(email_confirmed_at, now()), updated_at = now() where id = p_id;
  if p_password_hash is not null then
    update neon_auth.account set password = p_password_hash, "updatedAt" = now()
     where "userId" = p_id and "providerId" = 'credential';
    if not found then
      insert into neon_auth.account ("accountId", "providerId", "userId", password, "createdAt", "updatedAt")
      values (p_id::text, 'credential', p_id, p_password_hash, now(), now());
    end if;
    delete from neon_auth.session where "userId" = p_id;
  end if;
end $fn$;
grant execute on function public.server_update_account(uuid, text, text) to authenticated_legacy;

-- Remove an account entirely.
create or replace function public.server_delete_account(p_id uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if not legacy_auth.is_service() then raise exception 'not allowed' using errcode = '42501'; end if;
  if p_id = (select user_id from legacy_auth.service_account) then raise exception 'not allowed'; end if;
  delete from neon_auth."user" where id = p_id;
  delete from legacy_auth.users where id = p_id;
end $fn$;
grant execute on function public.server_delete_account(uuid) to authenticated_legacy;

commit;
select 'server policies: '||count(*) from pg_policies where policyname = 'server_account_all';
