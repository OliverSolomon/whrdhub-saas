-- Building this database on a fresh Neon branch, in order:
--   1. this file
--   2. ../install.sql                      (the app schema)
--   3. load the data
--   4. 01_remove_demo_and_test_data.sql    (only when the data came from the old Supabase project)
--   5. alter role authenticated rename to authenticated_legacy;
--      alter schema auth rename to legacy_auth;
--      Neon's Data API insists on creating both names itself.
--   6. neon deploy                         (turns on Neon Auth, the Data API and the buckets in neon.ts)
--   7. 02_carry_accounts.sql               (accounts into Neon Auth, same ids)
--   8. 03_neon_auth_compat.sql             (identity wrapper, role membership, function bodies)
--
-- Stand-ins for the Supabase-owned pieces the app schema depends on.
-- Holding tables for the legacy accounts and file records; not a running auth service.
do $$ begin create role anon nologin;          exception when duplicate_object then null; end $$;
do $$ begin create role authenticated nologin; exception when duplicate_object then null; end $$;
do $$ begin create role service_role nologin bypassrls; exception when duplicate_object then null; when insufficient_privilege then create role service_role nologin; end $$;
do $$ begin create role supabase_auth_admin nologin; exception when duplicate_object then null; end $$;

create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;

create table if not exists auth.users (
  instance_id uuid, id uuid primary key, aud varchar(255), role varchar(255), email varchar(255),
  encrypted_password varchar(255), email_confirmed_at timestamptz, invited_at timestamptz,
  confirmation_token varchar(255), confirmation_sent_at timestamptz, recovery_token varchar(255),
  recovery_sent_at timestamptz, email_change_token_new varchar(255), email_change varchar(255),
  email_change_sent_at timestamptz, last_sign_in_at timestamptz, raw_app_meta_data jsonb,
  raw_user_meta_data jsonb, is_super_admin boolean, created_at timestamptz, updated_at timestamptz,
  phone text, phone_confirmed_at timestamptz, phone_change text, phone_change_token varchar(255),
  phone_change_sent_at timestamptz, confirmed_at timestamptz, email_change_token_current varchar(255),
  email_change_confirm_status smallint, banned_until timestamptz, reauthentication_token varchar(255),
  reauthentication_sent_at timestamptz, is_sso_user boolean, deleted_at timestamptz, is_anonymous boolean
);
create table if not exists auth.identities (
  provider_id text, user_id uuid references auth.users(id) on delete cascade, identity_data jsonb, provider text,
  last_sign_in_at timestamptz, created_at timestamptz, updated_at timestamptz, email text, id uuid primary key
);
create table if not exists auth.sessions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(), updated_at timestamptz default now(), factor_id uuid, aal text,
  not_after timestamptz, refreshed_at timestamp, user_agent text, ip inet, tag text
);
create table if not exists auth.refresh_tokens (
  instance_id uuid, id bigserial primary key, token varchar(255), user_id varchar(255), revoked boolean default false,
  created_at timestamptz, updated_at timestamptz, parent varchar(255),
  session_id uuid references auth.sessions(id) on delete cascade
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$;

create table if not exists storage.buckets (
  id text primary key, name text not null, owner uuid, created_at timestamptz default now(),
  updated_at timestamptz default now(), public boolean default false, avif_autodetection boolean,
  file_size_limit bigint, allowed_mime_types text[], owner_id text, type text
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text,
  owner uuid, created_at timestamptz default now(), updated_at timestamptz default now(),
  last_accessed_at timestamptz, metadata jsonb, path_tokens text[], version text, owner_id text, user_metadata jsonb
);
alter table storage.objects enable row level security;
create or replace function storage.foldername(name text) returns text[] language sql immutable as $$
  select case when array_length(string_to_array(name, '/'), 1) > 1
              then (string_to_array(name, '/'))[1:array_length(string_to_array(name,'/'),1)-1]
              else '{}'::text[] end;
$$;
grant usage on schema auth, storage, public to anon, authenticated, service_role;
