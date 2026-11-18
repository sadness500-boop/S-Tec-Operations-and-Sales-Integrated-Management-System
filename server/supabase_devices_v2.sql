-- =====================================================================
--  S-Tec Operations and Sales Integrated Management System
--  6단계 추가 SQL — 기기 승인 · 기기별 조회 전용 · 프로그램 이동 기록
--  Designed & Developed by Rat Rae Choi
--
--  ● 어디에 실행하나요?  같은 Supabase 프로젝트(mnsuebexlzhvomxhrear) → SQL Editor → 전체 붙여넣고 Run.
--    supabase_integrated.sql 다음에 "한 번" 실행합니다. 여러 번 실행해도 안전합니다.
--  ● 실행해도 지금 동작은 바뀌지 않습니다.
--      - 기기 승인은 「끔」, 기기 수 제한은 「0 = 제한 없음」으로 시작합니다.
--      - 지금까지 쓰던 기기는 모두 「승인됨 · 수정 가능」 상태로 남습니다.
--    관리 콘솔 「설정」에서 켤 때부터 적용됩니다.
--  ● 하는 일
--    1) 새 기기 승인 : 켜면, 두 번째 기기부터는 관리자가 승인해야 사용할 수 있습니다(첫 기기는 자동 승인).
--       기기 수 제한 : 승인된 기기가 이 숫자에 이르면 그 뒤의 새 기기는 승인 대기가 됩니다.
--    2) 기기별 조회 전용 : 이 기기에서는 보기만 되고 저장(sync_push · shared_put · shared_push)이 서버에서 거부됩니다.
--    3) 프로그램 이동 기록 : 메인 화면에서 프로그램을 열 때마다 접속 기록에 「프로그램 열기」로 남습니다.
-- =====================================================================

-- 1) 설정 · 기기 표에 칸 추가 ------------------------------------------------------
alter table public.app_settings add column if not exists device_approval boolean not null default false;
alter table public.app_settings add column if not exists max_devices    int     not null default 0;
alter table public.devices      add column if not exists approved boolean not null default true;
alter table public.devices      add column if not exists readonly boolean not null default false;

-- 2) 로그인 확인(client_checkin) — 기존 동작 + 기기 승인 · 조회 전용 ------------------
create or replace function public.client_checkin(
  p_device text, p_device_name text, p_ua text, p_event text, p_login_at timestamptz
) returns json
language plpgsql security definer set search_path = public as $$
declare pr public.profiles; s public.app_settings; d public.devices; reason text := 'ok'; ip text := public.client_ip();
        is_new boolean; n_ok int; need boolean := false; is_adm boolean;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'no_session'); end if;
  select * into pr from public.profiles where id = auth.uid();
  if not found then return json_build_object('ok', false, 'reason', 'no_profile'); end if;
  select * into s from public.app_settings where id = 1;
  is_adm := pr.role in ('owner','admin');

  is_new := not exists (select 1 from public.devices where user_id = pr.id and id = coalesce(p_device,''));
  if is_new and not is_adm then
    select count(*) into n_ok from public.devices where user_id = pr.id and approved;
    need := (coalesce(s.device_approval, false) and n_ok >= 1)
         or (coalesce(s.max_devices, 0) > 0 and n_ok >= s.max_devices);
  end if;

  insert into public.devices (id, user_id, name, ua, last_ip, approved)
  values (coalesce(p_device,''), pr.id, coalesce(p_device_name,''), left(coalesce(p_ua,''), 300), ip, not need)
  on conflict (user_id, id) do update
    set last_seen = now(), ua = excluded.ua, last_ip = excluded.last_ip,
        name = case when excluded.name <> '' then excluded.name else public.devices.name end
  returning * into d;

  if pr.status = 'pending' then reason := 'pending';
  elsif pr.status = 'suspended' then reason := 'suspended';
  elsif pr.expires_at is not null and pr.expires_at < (now() at time zone 'Asia/Seoul')::date then reason := 'expired';
  elsif d.blocked then reason := 'device_blocked';
  elsif not d.approved and not is_adm then reason := 'device_pending';
  elsif pr.force_logout_at is not null and p_login_at is not null and pr.force_logout_at > p_login_at then reason := 'forced';
  elsif s.global_lock and not is_adm then reason := 'locked';
  end if;

  if p_event = 'login' then
    insert into public.login_logs (user_id, email, event, device_id, device, ip, detail)
    values (pr.id, pr.email, case when reason = 'ok' then 'login' else 'blocked' end,
            coalesce(p_device,''), coalesce(nullif(p_device_name,''), left(coalesce(p_ua,''),120)), ip,
            case when reason = 'ok' then '' else reason end);
    if reason = 'ok' then update public.profiles set last_login_at = now(), last_seen_at = now() where id = pr.id; end if;
  elsif reason = 'forced' then
    insert into public.login_logs (user_id, email, event, device_id, device, ip, detail)
    values (pr.id, pr.email, 'forced', coalesce(p_device,''), coalesce(p_device_name,''), ip, '관리자 강제 로그아웃');
  else
    update public.profiles set last_seen_at = now() where id = pr.id;
  end if;

  return json_build_object(
    'ok', reason = 'ok', 'reason', reason,
    'lock_message', s.lock_message,
    'device', json_build_object('approved', d.approved, 'readonly', d.readonly and pr.role <> 'owner'),
    'profile', json_build_object('id', pr.id, 'email', pr.email, 'name', pr.name, 'phone', pr.phone, 'dept', pr.dept,
                                 'role', pr.role, 'status', pr.status, 'expires_at', pr.expires_at,
                                 'must_change_pw', pr.must_change_pw,
                                 'scope', case when pr.role = 'owner' then '{"level":"all"}'::jsonb else coalesce(pr.scope,'{}'::jsonb) end));
end $$;

-- 3) 이 기기 상태(모든 프로그램 화면의 「조회 전용」 안내용) -----------------------------
create or replace function public.my_device(p_device text) returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('approved', coalesce(d.approved, true), 'blocked', coalesce(d.blocked, false),
                           'readonly', coalesce(d.readonly, false) and p.role <> 'owner')
  from public.profiles p left join public.devices d on d.user_id = p.id and d.id = coalesce(p_device,'')
  where p.id = auth.uid()
$$;

create or replace function public._device_readonly(p_device text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.devices d join public.profiles p on p.id = d.user_id
                  where d.user_id = auth.uid() and d.id = coalesce(p_device,'') and d.readonly and p.role <> 'owner')
$$;

-- 4) 저장 함수 3개 앞에 「조회 전용 기기」 확인을 끼워 넣습니다 ------------------------
--    원래 함수는 이름을 바꿔(_core) 그대로 두고, 같은 이름의 새 함수가 확인 후 원래 함수를 부릅니다.
--    (supabase_setup.sql 을 다시 실행해 원래 함수가 새로 생겨도, 이 파일을 다시 실행하면 자동으로 다시 감쌉니다.)
do $do$
declare f record;
begin
  for f in select * from (values
      ('sync_push',   'text, jsonb, text',              '_sync_push_core'),
      ('shared_push', 'text, jsonb, text',              '_shared_push_core'),
      ('shared_put',  'text, jsonb, timestamptz, text', '_shared_put_core')) t(fn, args, core)
  loop
    if to_regprocedure(format('public.%s(%s)', f.fn, f.args)) is null then continue; end if;
    -- 이미 감싼 상태면 건너뜀
    if (select prosrc from pg_proc where oid = to_regprocedure(format('public.%s(%s)', f.fn, f.args))) like '%/*stec-ro*/%' then continue; end if;
    execute format('drop function if exists public.%s(%s)', f.core, f.args);
    execute format('alter function public.%s(%s) rename to %s', f.fn, f.args, f.core);
    execute format('revoke all on function public.%s(%s) from public, anon, authenticated', f.core, f.args);
  end loop;
end $do$;

create or replace function public.sync_push(p_k text, p_v jsonb, p_device text) returns timestamptz
language plpgsql security definer set search_path = public as $$
begin /*stec-ro*/
  if public._device_readonly(p_device) then raise exception '이 기기는 조회 전용입니다. 저장할 수 없습니다.'; end if;
  return public._sync_push_core(p_k, p_v, p_device);
end $$;

do $do$ begin
  if to_regprocedure('public._shared_push_core(text, jsonb, text)') is not null then
    execute $f$
      create or replace function public.shared_push(p_k text, p_v jsonb, p_device text) returns timestamptz
      language plpgsql security definer set search_path = public as $b$
      begin /*stec-ro*/
        if public._device_readonly(p_device) then raise exception '이 기기는 조회 전용입니다. 저장할 수 없습니다.'; end if;
        return public._shared_push_core(p_k, p_v, p_device);
      end $b$;
      grant execute on function public.shared_push(text, jsonb, text) to authenticated;
    $f$;
  end if;
  if to_regprocedure('public._shared_put_core(text, jsonb, timestamptz, text)') is not null then
    execute $f$
      create or replace function public.shared_put(p_k text, p_v jsonb, p_expect timestamptz, p_device text) returns json
      language plpgsql security definer set search_path = public as $b$
      begin /*stec-ro*/
        if public._device_readonly(p_device) then raise exception '이 기기는 조회 전용입니다. 저장할 수 없습니다.'; end if;
        return public._shared_put_core(p_k, p_v, p_expect, p_device);
      end $b$;
      grant execute on function public.shared_put(text, jsonb, timestamptz, text) to authenticated;
    $f$;
  end if;
end $do$;

-- 5) 관리자: 기기 목록(승인 · 조회 전용 칸 추가) · 기기 설정 ---------------------------
drop function if exists public.admin_list_devices(uuid);
create or replace function public.admin_list_devices(p_user uuid default null) returns table (
  id text, user_id uuid, email text, user_name text, name text, ua text, blocked boolean,
  first_seen timestamptz, last_seen timestamptz, last_ip text, approved boolean, readonly boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '권한이 없습니다'; end if;
  return query select d.id, d.user_id, p.email, p.name, d.name, d.ua, d.blocked, d.first_seen, d.last_seen, d.last_ip,
                      d.approved, d.readonly
    from public.devices d join public.profiles p on p.id = d.user_id
    where p_user is null or d.user_id = p_user
    order by (not d.approved) desc, d.last_seen desc;
end $$;

create or replace function public.admin_set_device(p_user uuid, p_device text, p_action text) returns void
language plpgsql security definer set search_path = public as $$
declare t public.profiles; me text := public.my_role();
begin
  if me not in ('owner','admin') or me is null then raise exception '권한이 없습니다'; end if;
  select * into t from public.profiles where id = p_user;
  if not found then raise exception '사용자를 찾을 수 없습니다'; end if;
  if t.role = 'owner' and me <> 'owner' then raise exception '제작자 기기는 바꿀 수 없습니다'; end if;
  if t.role = 'admin' and me <> 'owner' then raise exception '관리자 계정은 제작자만 변경할 수 있습니다'; end if;
  if p_action = 'approve'        then update public.devices set approved = true  where user_id = p_user and id = p_device;
  elsif p_action = 'unapprove'   then update public.devices set approved = false where user_id = p_user and id = p_device;
  elsif p_action = 'readonly'    then update public.devices set readonly = true  where user_id = p_user and id = p_device;
  elsif p_action = 'edit'        then update public.devices set readonly = false where user_id = p_user and id = p_device;
  elsif p_action = 'delete'      then delete from public.devices where user_id = p_user and id = p_device;
  else raise exception '알 수 없는 작업: %', p_action; end if;
  if not found then raise exception '기기를 찾을 수 없습니다'; end if;
  perform public._admin_log(p_user, 'device_' || p_action, p_device);
end $$;

create or replace function public.admin_get_device_policy() returns json
language plpgsql stable security definer set search_path = public as $$
declare s public.app_settings;
begin
  if not public.is_admin() then raise exception '권한이 없습니다'; end if;
  select * into s from public.app_settings where id = 1;
  return json_build_object('device_approval', s.device_approval, 'max_devices', s.max_devices);
end $$;

create or replace function public.admin_save_device_policy(p_approval boolean, p_max int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception '기기 정책은 제작자만 바꿀 수 있습니다'; end if;
  if coalesce(p_max, 0) < 0 or coalesce(p_max, 0) > 50 then raise exception '기기 수는 0~50 사이로 정하세요'; end if;
  update public.app_settings set device_approval = coalesce(p_approval, false), max_devices = coalesce(p_max, 0), updated_at = now() where id = 1;
  perform public._admin_log(null, 'device_policy',
    case when p_approval then '새 기기 승인 필요' else '새 기기 자동 승인' end || ' · 기기 수 ' ||
    case when coalesce(p_max,0) = 0 then '제한 없음' else p_max::text || '대' end);
end $$;

-- 6) 프로그램 이동 기록 -------------------------------------------------------------
create or replace function public.log_app_open(p_app text, p_device text, p_device_name text) returns void
language plpgsql security definer set search_path = public as $$
declare pr public.profiles;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found then return; end if;
  insert into public.login_logs (user_id, email, event, device_id, device, ip, detail)
  values (pr.id, pr.email, 'app_open', coalesce(p_device,''), coalesce(p_device_name,''), public.client_ip(), left(coalesce(p_app,''), 40));
  update public.profiles set last_seen_at = now() where id = pr.id;
end $$;

-- 7) 실행 권한 ---------------------------------------------------------------------
revoke all on function public.my_device(text) from public, anon;
revoke all on function public._device_readonly(text) from public, anon, authenticated;
revoke all on function public.admin_list_devices(uuid) from public, anon;
revoke all on function public.admin_set_device(uuid, text, text) from public, anon;
revoke all on function public.admin_get_device_policy() from public, anon;
revoke all on function public.admin_save_device_policy(boolean, int) from public, anon;
revoke all on function public.log_app_open(text, text, text) from public, anon;
revoke all on function public.sync_push(text, jsonb, text) from public, anon;
grant execute on function public.client_checkin(text, text, text, text, timestamptz) to authenticated;
grant execute on function public.my_device(text) to authenticated;
grant execute on function public.admin_list_devices(uuid) to authenticated;
grant execute on function public.admin_set_device(uuid, text, text) to authenticated;
grant execute on function public.admin_get_device_policy() to authenticated;
grant execute on function public.admin_save_device_policy(boolean, int) to authenticated;
grant execute on function public.log_app_open(text, text, text) to authenticated;
grant execute on function public.sync_push(text, jsonb, text) to authenticated;
