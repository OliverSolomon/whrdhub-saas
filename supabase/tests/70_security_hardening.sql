-- Insert-only audit logs and the shared rate limiter.
\set ON_ERROR_STOP on
set client_min_messages = notice;

create or replace function pg_temp.as_user(uid text, q text) returns text language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid, true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid)::text, true);
  perform set_config('role', 'authenticated', true);
  execute q;
  perform set_config('role', 'postgres', true);
  return 'ok';
exception when others then
  perform set_config('role', 'postgres', true);
  return 'DENIED: ' || SQLERRM;
end $$;

do $$
declare
  responder text := '44444444-4444-4444-4444-444444444444';
  hubadmin  text := '33333333-3333-3333-3333-333333333333';
  stranger  text := '66666666-6666-6666-6666-666666666666';
  rid uuid; got text; n int; a record;
begin
  insert into public.reports (user_id, incident_types, description, county)
    values ('55555555-5555-5555-5555-555555555555', array['online_harassment'], 'TEST audit', 'Kitui') returning id into rid;

  -- A responder may add an entry as themselves...
  got := pg_temp.as_user(responder, format('insert into public.report_audit_log (report_id, viewed_by, action) values (%L, %L, %L)', rid, responder, 'viewed'));
  if got <> 'ok' then raise exception 'FAIL responder insert own audit row: %', got; end if;
  -- ...but not in someone else's name,
  got := pg_temp.as_user(responder, format('insert into public.report_audit_log (report_id, viewed_by, action) values (%L, %L, %L)', rid, hubadmin, 'viewed'));
  if got = 'ok' then raise exception 'FAIL responder forged an audit row for another person'; end if;
  -- and cannot rewrite or erase the trail.
  got := pg_temp.as_user(responder, 'update public.report_audit_log set action = ''nothing'' where true');
  if got = 'ok' then raise exception 'FAIL responder updated the audit log'; end if;
  got := pg_temp.as_user(responder, 'delete from public.report_audit_log where true');
  if got = 'ok' then raise exception 'FAIL responder deleted from the audit log'; end if;
  select count(*) into n from public.report_audit_log where report_id = rid;
  if n <> 1 then raise exception 'FAIL audit rows survive: got %', n; end if;
  raise notice 'pass  report audit log is insert-only (% row kept)', n;

  -- A stranger cannot write to the content audit log, a Hub admin can, as themselves only.
  got := pg_temp.as_user(stranger, format('insert into public.content_audit_log (content_type, content_id, action, actor_id) values (%L, %L, %L, %L)', 'post', gen_random_uuid(), 'x', stranger));
  if got = 'ok' then raise exception 'FAIL a member wrote to the content audit log'; end if;
  got := pg_temp.as_user(hubadmin, format('insert into public.content_audit_log (content_type, content_id, action, actor_id) values (%L, %L, %L, %L)', 'post', gen_random_uuid(), 'approved', hubadmin));
  if got <> 'ok' then raise exception 'FAIL hub admin content audit insert: %', got; end if;
  got := pg_temp.as_user(hubadmin, 'delete from public.content_audit_log where true');
  if got = 'ok' then raise exception 'FAIL hub admin deleted content audit rows'; end if;
  raise notice 'pass  content audit log: members cannot write, nobody can erase';

  -- Rate limiter: the third hit in a 60 second window of 2 is refused, and a signed-in role cannot call it.
  perform public.rate_limit_hit('test:k', 60, 2);
  perform public.rate_limit_hit('test:k', 60, 2);
  select * into a from public.rate_limit_hit('test:k', 60, 2);
  if a.allowed or a.retry_after < 1 then raise exception 'FAIL rate limiter let a third hit through: %', a; end if;
  got := pg_temp.as_user(stranger, 'select public.rate_limit_hit(''test:x'', 60, 2)');
  if got = 'ok' then raise exception 'FAIL a signed-in role called the rate limiter'; end if;
  raise notice 'pass  rate limiter blocks over the limit and is service-only';
  delete from public.rate_limits where key like 'test:%';
  delete from public.reports where id = rid;
end $$;
