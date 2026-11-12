\set ON_ERROR_STOP on
-- Carry the Supabase accounts into Neon Auth, keeping each account's id so every
-- profile, membership and post still belongs to the same person.
-- Google sign-ins are linked by Google's own account number, so they work straight away.
-- Passwords cannot be carried (different hashing); those people set a new one by "forgot password".
begin;
insert into neon_auth."user" (id, name, email, "emailVerified", image, "createdAt", "updatedAt")
select u.id,
       coalesce(nullif(btrim(p.full_name),''), nullif(btrim(p.display_name),''), nullif(btrim(u.raw_user_meta_data->>'full_name'),''),
                nullif(btrim(u.raw_user_meta_data->>'name'),''), nullif(btrim(p.username),''), split_part(u.email,'@',1)),
       lower(u.email), u.email_confirmed_at is not null, nullif(p.avatar_url,''),
       coalesce(u.created_at, now()), coalesce(u.updated_at, u.created_at, now())
from auth.users u left join public.profiles p on p.id = u.id
on conflict (id) do nothing;

insert into neon_auth.account ("accountId", "providerId", "userId", "createdAt", "updatedAt")
select i.provider_id, 'google', i.user_id, coalesce(i.created_at, now()), coalesce(i.updated_at, i.created_at, now())
from auth.identities i
where i.provider = 'google'
  and not exists (select 1 from neon_auth.account a where a."providerId"='google' and a."accountId"=i.provider_id);

select 'neon auth users: '||(select count(*) from neon_auth."user")||', verified: '||(select count(*) from neon_auth."user" where "emailVerified")
    ||', google links: '||(select count(*) from neon_auth.account where "providerId"='google')
    ||', staff with google: '||(select count(*) from neon_auth."user" u join neon_auth.account a on a."userId"=u.id where u.email like '%@whrdhub.org');
commit;
