\set ON_ERROR_STOP on
begin;
-- Every report on record is either a seeded [DEMO] case or was filed by an anonymous test account.
with d as (delete from public.notifications where report_id is not null returning 1) select 'report notifications removed: '||count(*) from d;
with d as (delete from public.reports returning 1) select 'reports removed: '||count(*) from d;
with d as (delete from public.post_comments where guest_name is not null returning 1) select 'demo comments removed: '||count(*) from d;
with d as (delete from public.posts where guest_name is not null returning 1) select 'demo posts removed: '||count(*) from d;
with d as (delete from public.listening_results where source_id like 'demo-%' returning 1) select 'demo listening signals removed: '||count(*) from d;
with d as (delete from public.services where contact_phone like '+2547000001%' and created_by is null returning 1) select 'placeholder services removed: '||count(*) from d;
-- Anonymous reporter accounts (no real email, passwords cannot be carried over).
with d as (delete from auth.users where email like '%@whrdhub.local' returning 1) select 'anonymous accounts removed: '||count(*) from d;
select 'left -> accounts: '||(select count(*) from auth.users)||', profiles: '||(select count(*) from public.profiles)||', identities: '||(select count(*) from auth.identities)
  ||', reports: '||(select count(*) from public.reports)||', referrals: '||(select count(*) from public.report_services)||', report log: '||(select count(*) from public.report_audit_log)
  ||', notifications: '||(select count(*) from public.notifications)||', posts: '||(select count(*) from public.posts)||', comments: '||(select count(*) from public.post_comments)
  ||', services: '||(select count(*) from public.services)||', blogs: '||(select count(*) from public.blogs)||', resources: '||(select count(*) from public.resources)
  ||', orphan profiles: '||(select count(*) from public.profiles p where not exists (select 1 from auth.users u where u.id=p.id))
  ||', anonymous-kind profiles: '||(select count(*) from public.profiles where account_kind='anonymous' or is_anonymous);
commit;
