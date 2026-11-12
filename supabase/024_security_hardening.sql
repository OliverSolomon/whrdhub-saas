-- Security hardening: encrypted report columns, a shared rate limiter, insert-only audit logs.
-- Idempotent. Run once in the Supabase SQL editor (also safe to re-run). Already part of install.sql.

-- 1. Where the application puts encrypted data ---------------------------------------------------
-- The exact coordinates move into geo_enc (ciphertext). contact_hash is a keyed fingerprint of the
-- reporter's phone number, so a USSD status check can find a report without storing the number.
alter table public.reports add column if not exists geo_enc text;
alter table public.reports add column if not exists contact_hash text;
create index if not exists reports_contact_hash_idx on public.reports (contact_hash) where contact_hash is not null;

-- 2. A rate limiter that works on serverless -----------------------------------------------------
-- A counter held in a function's memory is lost between requests and not shared between instances,
-- so the count lives here. One atomic upsert per call. Only the service role may call it.
create table if not exists public.rate_limits (
  key          text primary key,
  window_start timestamptz not null default now(),
  hits         integer not null default 0
);
alter table public.rate_limits enable row level security;   -- no policies: nobody but the service role

create or replace function public.rate_limit_hit(p_key text, p_window_seconds integer, p_max integer)
returns table (allowed boolean, remaining integer, retry_after integer)
language plpgsql security definer set search_path = public as $$
declare r public.rate_limits;
begin
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
end $$;

create or replace function public.purge_rate_limits() returns integer
language sql security definer set search_path = public as $$
  with d as (delete from public.rate_limits where window_start < now() - interval '1 day' returning 1)
  select count(*)::integer from d;
$$;

revoke all on function public.rate_limit_hit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.purge_rate_limits() from public, anon, authenticated;
do $$ begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.rate_limit_hit(text, integer, integer) to service_role;
    grant execute on function public.purge_rate_limits() to service_role;
  end if;
end $$;

-- 3. Audit logs are insert-only ------------------------------------------------------------------
-- Responders used to have FOR ALL on the report audit log, so they could rewrite or delete the trail
-- of who opened a case. Now they can read it and add to it as themselves, and nothing else.
drop policy if exists ral_responders on public.report_audit_log;
drop policy if exists ral_read       on public.report_audit_log;
drop policy if exists ral_insert     on public.report_audit_log;
create policy ral_read   on public.report_audit_log for select using (public.can_triage_reports());
create policy ral_insert on public.report_audit_log for insert
  with check (public.can_triage_reports() and viewed_by = auth.uid());

-- The content log accepted a row from any signed-in person. Only a Hub admin recording their own action now.
drop policy if exists audit_write on public.content_audit_log;
create policy audit_write on public.content_audit_log for insert to authenticated
  with check (public.is_hub_admin() and actor_id = auth.uid());

-- Defence in depth: even a policy mistake cannot let a signed-in role change or erase history.
revoke update, delete, truncate on public.report_audit_log  from anon, authenticated;
revoke update, delete, truncate on public.content_audit_log from anon, authenticated;

-- 4. One onboarding flag ---------------------------------------------------------------------------
-- Two existed and only hub_onboarded was ever read.
alter table public.profiles drop column if exists onboarding_completed;
