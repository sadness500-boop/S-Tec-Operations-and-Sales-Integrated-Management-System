-- v1.10.0 「사전 등록(초대)」 · 「가입 없이 체험(기본 7일)」 · 「체험 프로그램 1개」 · 체험자에게 회사 기준정보 숨김
-- ① 제작자·관리자·조직 관리자(가입 승인 권한)가 사람을 미리 등록 → 초대 링크로 가입하면 승인 없이 바로 사용
-- ② 로그인 화면 「가입 없이 체험하기」 → Supabase 익명 로그인 → 체험 N일 (Authentication › Sign In / Providers › Allow anonymous sign-ins 켜기)
-- ③ 체험자는 「체험 허용」 프로그램 중 1개만 사용 → 가입 신청하면 체험 중 서버 자료(동기화 · 성과 · 출입)를 새 계정으로 옮김
-- Supabase → SQL Editor에서 한 번 실행 (여러 번 실행해도 같은 결과)   Designed & Developed by Rat Rae Choi

-- ---------- 0. 칸 추가 ----------
alter table public.profiles add column if not exists is_trial  boolean not null default false;
alter table public.profiles add column if not exists trial_app text;
alter table public.app_settings add column if not exists trial_open boolean not null default true;
alter table public.app_settings add column if not exists trial_days int not null default 7;
alter table public.program_registry add column if not exists trial_ok boolean not null default false;

create table if not exists public.invites (
  id         uuid primary key default gen_random_uuid(),
  token      text not null unique default replace(gen_random_uuid()::text, '-', ''),
  email      text not null default '',          -- 비우면 누구나 이 링크로 1회 가입
  name       text not null default '',
  phone      text not null default '',
  dept       text not null default '',
  org_id     text,
  apps       text[] not null default '{}',      -- 개인 권한을 미리 줄 프로그램(권한 필요한 프로그램만 의미 있음)
  days       int not null default 0,            -- 계정 사용기간(일) · 0 = 무기한
  memo       text not null default '',
  created_by uuid,
  created_at timestamptz not null default now(),
  used_by    uuid,
  used_at    timestamptz,
  revoked    boolean not null default false
);
alter table public.invites enable row level security;   -- 정책 없음: 아래 함수로만

-- ---------- 1. 새 계정 만들 때 (익명 체험 · 초대 · 체험 → 가입 전환) ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare s public.app_settings; is_own boolean; iv public.invites; tok text := new.raw_user_meta_data->>'invite';
        ho text := new.raw_user_meta_data->>'trial_handoff'; old public.profiles; today date := (now() at time zone 'Asia/Seoul')::date;
        a text; ok_now boolean;
begin
  select * into s from public.app_settings where id = 1;
  -- 가입 없이 체험 (익명 로그인)
  if coalesce(new.is_anonymous, false) then
    insert into public.profiles (id, email, name, role, status, approved_at, expires_at, is_trial)
    values (new.id, '', '체험 사용자', 'user', case when coalesce(s.trial_open, true) then 'active' else 'suspended' end,
            now(), today + greatest(coalesce(s.trial_days, 7), 1) - 1, true)
    on conflict (id) do nothing;
    return new;
  end if;
  is_own := lower(new.email) = lower(s.owner_email);
  if tok is not null and tok <> '' then
    select * into iv from public.invites
     where token = tok and not revoked and used_at is null and created_at > now() - interval '30 days'
       and (email = '' or lower(email) = lower(new.email));
  end if;
  ok_now := is_own or iv.id is not null or not s.require_approval;
  insert into public.profiles (id, email, name, phone, dept, role, status, approved_at, expires_at, org_id)
  values (
    new.id, lower(new.email),
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), iv.name, ''),
    coalesce(nullif(new.raw_user_meta_data->>'phone', ''), iv.phone, ''),
    coalesce(nullif(new.raw_user_meta_data->>'dept', ''), iv.dept, ''),
    case when is_own then 'owner' else 'user' end,
    case when ok_now then 'active' else 'pending' end,
    case when ok_now then now() end,
    case when is_own then null
         when iv.id is not null then case when iv.days > 0 then today + iv.days end
         when not s.require_approval and s.default_days > 0 then today + s.default_days end,
    iv.org_id
  )
  on conflict (id) do nothing;
  if iv.id is not null then
    update public.invites set used_by = new.id, used_at = now() where id = iv.id;
    foreach a in array coalesce(iv.apps, '{}') loop
      insert into public.app_access (user_id, app, perm, updated_at, updated_by) values (new.id, a, 'use', now(), iv.created_by)
      on conflict (user_id, app) do update set perm = 'use', updated_at = now();
    end loop;
  end if;
  -- 체험하던 사람이 가입: 체험 중 서버에 올린 자료를 새 계정으로 옮김
  if ho is not null and ho <> '' then
    select * into old from public.profiles where is_trial and extra->>'handoff' = ho;
    if found then
      update public.user_data set user_id = new.id where user_id = old.id
         and not exists (select 1 from public.user_data u2 where u2.user_id = new.id and u2.k = public.user_data.k);
      if to_regclass('public.pm_records') is not null then execute 'update public.pm_records set owner = $1 where owner = $2' using new.id, old.id; end if;
      if to_regclass('public.ac_records') is not null then execute 'update public.ac_records set owner = $1 where owner = $2' using new.id, old.id; end if;
      update public.profiles set status = 'suspended', memo = '가입으로 전환: ' || lower(new.email), extra = extra - 'handoff' where id = old.id;
      update public.profiles set extra = extra || jsonb_build_object('trial_from', old.id, 'trial_app', old.trial_app) where id = new.id;
    end if;
  end if;
  return new;
end $$;

-- ---------- 2. 프로그램 사용 판단 (체험 단계 추가) ----------
create or replace function public._app_state(pr public.profiles, r public.program_registry) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare adm boolean := pr.role in ('owner','admin'); a public.app_access; x jsonb; ox jsonb; feats text[]; orgapps text[];
  allf text[] := array(select jsonb_array_elements(r.features)->>'key');
  sysf text[] := coalesce(r.features_on, array(select jsonb_array_elements(r.features)->>'key'));
begin
  if not r.visible and pr.role <> 'owner' then return null; end if;              -- ① 시스템 비공개
  if r.beta and not adm then return null; end if;
  if pr.status <> 'active' then return jsonb_build_object('access', 'account'); end if;
  if r.open_all then return jsonb_build_object('access', 'use', 'features', to_jsonb(sysf)); end if;   -- ⓪ 전체 공개
  if pr.is_trial then                                                               -- 🎁 체험: 체험 허용 프로그램 중 1개만
    if not r.trial_ok then return jsonb_build_object('access', 'trial_locked'); end if;
    if pr.trial_app is null then return jsonb_build_object('access', 'trial_pick'); end if;
    if pr.trial_app = r.code then return jsonb_build_object('access', 'use', 'trial', true, 'app_expires_at', pr.expires_at, 'features', to_jsonb(sysf), 'branches', '[]'::jsonb); end if;
    return jsonb_build_object('access', 'trial_locked');
  end if;
  if adm then return jsonb_build_object('access', 'use', 'features', to_jsonb(case when pr.role = 'owner' then allf else sysf end)); end if;
  ox := pr.extra->'apps'->r.code;                                                   -- ⭐ 제작자 추가 권한
  if ox is not null and coalesce(ox->>'perm', 'use') = 'use'
     and (ox->>'expires_at' is null or (ox->>'expires_at')::date >= (now() at time zone 'Asia/Seoul')::date) then
    feats := public._arr_and(sysf, case when ox ? 'features' and jsonb_typeof(ox->'features') = 'array' then array(select jsonb_array_elements_text(ox->'features')) end);
    return jsonb_build_object('access', 'use', 'extra', true, 'app_expires_at', ox->>'expires_at', 'features', to_jsonb(feats), 'branches', '[]'::jsonb);
  end if;
  orgapps := public._ou_apps(pr.org_id);                                             -- ③ 회사·조직 공개
  if orgapps is not null and not (r.code = any(orgapps)) then return null; end if;
  feats := public._arr_and(sysf, public._ou_feats(pr.org_id, r.code));               -- ② 세부 기능
  if not r.uses_access then return jsonb_build_object('access', 'use', 'features', to_jsonb(feats)); end if;
  select * into a from public.app_access where user_id = pr.id and app = r.code;      -- ④ 개인 권한
  if not found or a.perm = 'none' then return jsonb_build_object('access', 'none'); end if;
  if a.expires_at is not null and a.expires_at < (now() at time zone 'Asia/Seoul')::date then
    return jsonb_build_object('access', 'expired', 'app_expires_at', a.expires_at); end if;
  return jsonb_build_object('access', 'use', 'app_expires_at', a.expires_at, 'branches', to_jsonb(coalesce(a.branches, '{}')),
    'features', to_jsonb(public._arr_and(feats, a.features)));
end $$;

-- 체험 프로그램 고르기 (메인 화면 카드 · 개별 프로그램을 처음 열 때 자동)
create or replace function public._trial_pick(pr public.profiles, p_app text) returns boolean
language plpgsql security definer set search_path = public as $$
declare r public.program_registry;
begin
  if not pr.is_trial or pr.status <> 'active' then return false; end if;
  if pr.trial_app is not null then return pr.trial_app = p_app; end if;
  select * into r from public.program_registry where code = p_app and trial_ok and visible and not beta;
  if not found then return false; end if;
  update public.profiles set trial_app = p_app where id = pr.id and trial_app is null;
  if r.uses_access then   -- 성과 · 출입처럼 개인 권한을 보는 프로그램: 체험 기간 동안 본인 자료만
    insert into public.app_access (user_id, app, perm, expires_at, updated_at) values (pr.id, p_app, 'use', pr.expires_at, now())
    on conflict (user_id, app) do update set perm = 'use', expires_at = excluded.expires_at, updated_at = now();
  end if;
  return true;
end $$;
revoke all on function public._trial_pick(public.profiles, text) from public, anon, authenticated;

create or replace function public.trial_pick(p_app text) returns json
language plpgsql security definer set search_path = public as $$
declare pr public.profiles;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found or not pr.is_trial then raise exception '체험 계정이 아닙니다'; end if;
  if pr.trial_app is not null and pr.trial_app <> p_app then raise exception '체험은 프로그램 1개만 쓸 수 있습니다. 다른 프로그램은 가입 후 사용하세요'; end if;
  if not public._trial_pick(pr, p_app) then raise exception '이 프로그램은 체험할 수 없습니다'; end if;
  return json_build_object('ok', true, 'app', p_app);
end $$;

create or replace function public.app_check(p_app text) returns json
language plpgsql volatile security definer set search_path = public as $$
declare pr public.profiles; r public.program_registry; s jsonb;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'no_session'); end if;
  select * into pr from public.profiles where id = auth.uid();
  if not found then return json_build_object('ok', false, 'reason', 'no_profile'); end if;
  select * into r from public.program_registry where code = p_app;
  if not found then   -- 등록부에 없는 옛 코드: 예전 방식
    if pr.role in ('owner','admin') then return json_build_object('ok', true, 'perm', 'use', 'admin', true, 'branches', '{}'::text[]); end if;
    return json_build_object('ok', false, 'reason', 'no_app_access');
  end if;
  s := public._app_state(pr, r);
  if s->>'access' = 'trial_pick' and public._trial_pick(pr, p_app) then   -- 체험자가 이 프로그램을 처음 열면 이것을 체험 프로그램으로
    select * into pr from public.profiles where id = pr.id; s := public._app_state(pr, r);
  end if;
  if s is null then return json_build_object('ok', false, 'reason', 'org_closed',
    'org', (select name from public.org_units where id = pr.org_id)); end if;
  if s->>'access' = 'use' then
    return json_build_object('ok', true, 'perm', 'use', 'admin', pr.role in ('owner','admin'), 'extra', coalesce((s->>'extra')::boolean, false),
      'trial', coalesce((s->>'trial')::boolean, false),
      'expires_at', s->>'app_expires_at', 'branches', coalesce(s->'branches', '[]'::jsonb), 'features', s->'features');
  end if;
  if s->>'access' = 'trial_locked' then return json_build_object('ok', false, 'reason', 'trial_locked', 'trial_app', pr.trial_app); end if;
  if s->>'access' = 'expired' then return json_build_object('ok', false, 'reason', 'app_expired', 'expires_at', s->>'app_expires_at'); end if;
  if s->>'access' = 'account' then return json_build_object('ok', false, 'reason', 'account'); end if;
  return json_build_object('ok', false, 'reason', 'no_app_access');
end $$;

create or replace function public.my_programs() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; out json;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'no_session'); end if;
  select * into pr from public.profiles where id = auth.uid();
  if not found then return json_build_object('ok', false, 'reason', 'no_profile'); end if;
  select coalesce(json_agg(x order by x.sort, x.code), '[]'::json) into out from (
    select r.code, r.name, r.full_name, r.url, r.icon, r.color, r.sort, r.beta, r.uses_access, r.open_all, r.trial_ok, r.version, r.min_version, r.note,
           s->>'access' as access, (s->>'app_expires_at')::date as app_expires_at,
           coalesce(array(select jsonb_array_elements_text(coalesce(s->'branches','[]'::jsonb))), '{}') as branches,
           s->'features' as features, coalesce((s->>'extra')::boolean, false) as extra, r.features as feature_defs
      from public.program_registry r, lateral (select public._app_state(pr, r) s) z
     where z.s is not null
  ) x;
  return json_build_object('ok', true, 'admin', pr.role in ('owner','admin'), 'programs', out,
    'trial', case when pr.is_trial then json_build_object('app', pr.trial_app, 'until', pr.expires_at,
       'days_left', greatest(0, pr.expires_at - (now() at time zone 'Asia/Seoul')::date + 1)) end);
end $$;

-- ---------- 3. 접속 확인 (체험 다시 쓰기 막기 · 체험 표시) ----------
create or replace function public.client_checkin(p_device text, p_device_name text, p_ua text, p_event text, p_login_at timestamptz) returns json
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
  if is_new and not is_adm and not pr.is_trial then
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
  elsif pr.status = 'suspended' then reason := case when pr.is_trial and not coalesce(s.trial_open, true) then 'trial_closed' else 'suspended' end;
  elsif pr.is_trial and coalesce(p_device, '') <> '' and exists (
        select 1 from public.devices d2 join public.profiles p2 on p2.id = d2.user_id
         where d2.id = p_device and p2.id <> pr.id and p2.is_trial and p2.created_at < pr.created_at) then reason := 'trial_used';
  elsif pr.expires_at is not null and pr.expires_at < (now() at time zone 'Asia/Seoul')::date then reason := case when pr.is_trial then 'trial_ended' else 'expired' end;
  elsif d.blocked then reason := 'device_blocked';
  elsif not d.approved and not is_adm then reason := 'device_pending';
  elsif pr.force_logout_at is not null and p_login_at is not null and pr.force_logout_at > p_login_at then reason := 'forced';
  elsif s.global_lock and not is_adm then reason := 'locked';
  end if;

  if p_event = 'login' then
    insert into public.login_logs (user_id, email, event, device_id, device, ip, detail)
    values (pr.id, case when pr.is_trial then '(체험) ' || left(pr.id::text, 8) else pr.email end, case when reason = 'ok' then 'login' else 'blocked' end,
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
                                 'must_change_pw', pr.must_change_pw, 'is_trial', pr.is_trial, 'trial_app', pr.trial_app,
                                 'scope', case when pr.role = 'owner' then '{"level":"all"}'::jsonb else coalesce(pr.scope,'{}'::jsonb) end));
end $$;

-- ---------- 4. 체험자에게 회사 기준정보 · 소속 지정 숨김 ----------
create or replace function public.master_get() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found or pr.status <> 'active' or pr.is_trial then return json_build_object('ok', false); end if;
  return json_build_object('ok', true,
    'companies', coalesce((select v from public.master_data where k = 'companies'), '[]'::jsonb),
    'orgs',      coalesce((select v from public.master_data where k = 'orgs'), '[]'::jsonb),
    'sites',     coalesce((select v from public.master_data where k = 'sites'), '[]'::jsonb),
    'updated_at', (select max(updated_at) from public.master_data));
end $$;

create or replace function public.set_my_org(p_org text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.profiles where id = auth.uid() and is_trial) then raise exception '체험 중에는 소속을 정하지 않습니다. 가입 신청 때 고르세요'; end if;
  if not exists (select 1 from public.org_units where id = p_org and active) then raise exception '회사·조직을 고르세요'; end if;
  update public.profiles set org_id = p_org where id = auth.uid() and org_id is null;
  if not found then raise exception '소속은 이미 정해져 있습니다. 바꾸려면 조직 관리자나 제작자에게 요청하세요'; end if;
  perform public._admin_log(auth.uid(), 'org_self', public._ou_path(p_org));
end $$;

create or replace function public.my_org_info() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; m public.org_managers; pend int := 0;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found then return json_build_object('ok', false); end if;
  if pr.is_trial then return json_build_object('ok', true, 'org_id', null, 'org_path', '', 'need_org', false, 'trial', true, 'extra', '{}'::jsonb, 'manager', null, 'pending', 0); end if;
  m := public._mgr();
  if pr.role in ('owner','admin') then select count(*) into pend from public.profiles where status = 'pending';
  elsif m.user_id is not null and coalesce((m.perms->>'approve')::boolean, false) then
    select count(*) into pend from public.profiles p where p.status = 'pending' and public._ou_under(p.org_id, m.orgs);
  end if;
  return json_build_object('ok', true, 'org_id', pr.org_id, 'org_path', public._ou_path(pr.org_id),
    'need_org', pr.org_id is null and pr.role <> 'owner',
    'extra', pr.extra,
    'manager', case when m.user_id is null then null else json_build_object('orgs', m.orgs, 'perms', m.perms,
       'labels', (select coalesce(json_agg(public._ou_path(x)), '[]'::json) from unnest(m.orgs) x)) end,
    'pending', pend);
end $$;

-- 사용자 목록에서 체험 계정은 뺌 (체험 계정은 「사전 등록 · 체험」 탭에서)
create or replace function public.admin_list_users()
returns table(id uuid, email text, name text, phone text, dept text, role text, status text, expires_at date, must_change_pw boolean, memo text,
              created_at timestamptz, approved_at timestamptz, last_login_at timestamptz, last_seen_at timestamptz, device_count bigint, fail_7d bigint, scope jsonb)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '권한이 없습니다'; end if;
  return query
  select p.id, p.email, p.name, p.phone, p.dept, p.role, p.status, p.expires_at, p.must_change_pw, p.memo,
         p.created_at, p.approved_at, p.last_login_at, p.last_seen_at,
         (select count(*) from public.devices d where d.user_id = p.id),
         (select count(*) from public.login_logs l where l.email = p.email and l.event = 'login_fail'
            and l.created_at > now() - interval '7 days'),
         case when p.role = 'owner' then '{"level":"all"}'::jsonb else coalesce(p.scope,'{}'::jsonb) end
  from public.profiles p
  where not p.is_trial
  order by case p.status when 'pending' then 0 when 'active' then 1 else 2 end, p.created_at desc;
end $$;

-- ---------- 5. 체험 설정 · 체험 계정 관리 · 가입 전환 ----------
create or replace function public.public_settings() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('signup_open', signup_open, 'require_approval', require_approval,
                           'global_lock', global_lock, 'lock_message', lock_message,
                           'trial_open', trial_open, 'trial_days', trial_days,
                           'trial_apps', (select coalesce(json_agg(json_build_object('code', code, 'name', name) order by sort), '[]'::json)
                                            from public.program_registry where trial_ok and visible and not beta))
  from public.app_settings where id = 1
$$;

create or replace function public.owner_save_trial_settings(p_open boolean, p_days int) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception '체험 설정은 제작자만 바꿉니다'; end if;
  update public.app_settings set trial_open = coalesce(p_open, true), trial_days = least(greatest(coalesce(p_days, 7), 1), 90), updated_at = now() where id = 1;
  perform public._admin_log(null, 'settings', '체험 ' || case when p_open then '받기' else '중지' end || ' · ' || p_days || '일');
end $$;

create or replace function public.admin_list_trials() returns json
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '권한이 없습니다'; end if;
  return (select coalesce(json_agg(json_build_object('id', p.id, 'name', p.name, 'status', p.status, 'memo', p.memo,
            'trial_app', p.trial_app, 'app_name', (select r.name from public.program_registry r where r.code = p.trial_app),
            'created_at', p.created_at, 'until', p.expires_at, 'last_seen_at', p.last_seen_at,
            'devices', (select coalesce(json_agg(coalesce(nullif(d.name, ''), left(d.ua, 40))), '[]'::json) from public.devices d where d.user_id = p.id))
          order by p.created_at desc), '[]'::json)
    from (select * from public.profiles where is_trial order by created_at desc limit 500) p);
end $$;

create or replace function public.admin_trial_update(p_id uuid, p_add_days int, p_end boolean) returns void
language plpgsql security definer set search_path = public as $$
declare today date := (now() at time zone 'Asia/Seoul')::date;
begin
  if not public.is_admin() then raise exception '권한이 없습니다'; end if;
  if p_end then
    update public.profiles set expires_at = today - 1 where id = p_id and is_trial;
    perform public._admin_log(p_id, 'expires', '체험 종료');
  else
    update public.profiles set expires_at = greatest(coalesce(expires_at, today), today - 1) + greatest(coalesce(p_add_days, 7), 1), status = 'active'
     where id = p_id and is_trial;
    perform public._admin_log(p_id, 'expires', '체험 연장 +' || p_add_days || '일');
  end if;
end $$;

-- 체험자가 「가입 신청」 할 때: 자료를 넘길 표를 받음 (가입 신청 때 함께 보냄)
create or replace function public.trial_handoff() returns text
language plpgsql security definer set search_path = public as $$
declare t text := replace(gen_random_uuid()::text, '-', '');
begin
  update public.profiles set extra = coalesce(extra, '{}'::jsonb) || jsonb_build_object('handoff', t) where id = auth.uid() and is_trial;
  if not found then raise exception '체험 계정이 아닙니다'; end if;
  return t;
end $$;

-- ---------- 6. 사전 등록 (초대) ----------
create or replace function public._can_invite(p_org text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare m public.org_managers;
begin
  if public.is_admin() then return true; end if;
  m := public._mgr();
  return m.user_id is not null and coalesce((m.perms->>'approve')::boolean, false) and p_org is not null and public._ou_under(p_org, m.orgs);
end $$;

create or replace function public.invite_create(p jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare o text := nullif(p->>'org_id', ''); iv public.invites; apps text[] := '{}';
begin
  if not public._can_invite(o) then raise exception '이 조직에 사람을 등록할 권한이 없습니다(조직 관리자는 맡은 조직만)'; end if;
  if o is not null and not exists (select 1 from public.org_units where id = o and active) then raise exception '소속 조직을 다시 고르세요'; end if;
  if coalesce(trim(p->>'name'), '') = '' then raise exception '이름을 적으세요'; end if;
  if coalesce(p->>'email', '') <> '' and exists (select 1 from public.profiles where lower(email) = lower(p->>'email')) then
    raise exception '이미 가입한 이메일입니다: %', p->>'email'; end if;
  if jsonb_typeof(p->'apps') = 'array' then
    apps := array(select x from jsonb_array_elements_text(p->'apps') x where exists (select 1 from public.program_registry r where r.code = x));
    if not public.is_admin() then   -- 조직 관리자는 프로그램 권한을 줄 수 있을 때만
      if not coalesce((public._mgr()).perms->>'apps', 'false')::boolean then apps := '{}'; end if;
    end if;
  end if;
  insert into public.invites (email, name, phone, dept, org_id, apps, days, memo, created_by)
  values (lower(trim(coalesce(p->>'email', ''))), trim(p->>'name'), coalesce(p->>'phone', ''), coalesce(p->>'dept', ''), o, apps,
          least(greatest(coalesce((p->>'days')::int, 0), 0), 3650), coalesce(p->>'memo', ''), auth.uid())
  returning * into iv;
  perform public._admin_log(null, 'invite', iv.name || coalesce(' · ' || public._ou_path(o), ''));
  return json_build_object('ok', true, 'id', iv.id, 'token', iv.token, 'name', iv.name, 'org_path', public._ou_path(o));
end $$;

create or replace function public.invite_list() returns json
language plpgsql stable security definer set search_path = public as $$
declare m public.org_managers := public._mgr(); adm boolean := public.is_admin();
begin
  if not adm and m.user_id is null then raise exception '권한이 없습니다'; end if;
  return (select coalesce(json_agg(json_build_object('id', i.id, 'token', i.token, 'name', i.name, 'email', i.email, 'phone', i.phone, 'dept', i.dept,
            'org_id', i.org_id, 'org_path', public._ou_path(i.org_id), 'apps', i.apps, 'days', i.days, 'memo', i.memo,
            'created_at', i.created_at, 'by', (select coalesce(nullif(p.name, ''), p.email) from public.profiles p where p.id = i.created_by),
            'used_at', i.used_at, 'used_email', (select p.email from public.profiles p where p.id = i.used_by), 'revoked', i.revoked,
            'expired', i.used_at is null and i.created_at < now() - interval '30 days')
          order by i.created_at desc), '[]'::json)
    from (select * from public.invites x where adm or x.created_by = auth.uid() or (x.org_id is not null and public._ou_under(x.org_id, m.orgs))
          order by x.created_at desc limit 500) i);
end $$;

create or replace function public.invite_revoke(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare iv public.invites;
begin
  select * into iv from public.invites where id = p_id;
  if not found then raise exception '초대를 찾지 못했습니다'; end if;
  if not (public.is_admin() or iv.created_by = auth.uid() or public._can_invite(iv.org_id)) then raise exception '권한이 없습니다'; end if;
  update public.invites set revoked = true where id = p_id and used_at is null;
end $$;

-- 초대 링크를 연 사람에게 (로그인 전) 보여 줄 내용
create or replace function public.invite_info(p_token text) returns json
language plpgsql stable security definer set search_path = public as $$
declare iv public.invites;
begin
  select * into iv from public.invites where token = p_token;
  if not found then return json_build_object('ok', false, 'reason', 'none'); end if;
  if iv.revoked then return json_build_object('ok', false, 'reason', 'revoked'); end if;
  if iv.used_at is not null then return json_build_object('ok', false, 'reason', 'used'); end if;
  if iv.created_at < now() - interval '30 days' then return json_build_object('ok', false, 'reason', 'expired'); end if;
  return json_build_object('ok', true, 'name', iv.name, 'email', iv.email, 'phone', iv.phone, 'dept', iv.dept,
    'org_path', public._ou_path(iv.org_id), 'until', (iv.created_at + interval '30 days')::date);
end $$;

-- ---------- 7. 프로그램 등록: 「체험 허용」 ----------
create or replace function public.admin_save_program(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception '프로그램 공개·세부 기능은 제작자만 정합니다'; end if;
  insert into public.program_registry (code, name, full_name, url, icon, color, sort, visible, beta, uses_access, version, min_version, note, features, features_on, open_all, trial_ok)
  values (p->>'code', p->>'name', coalesce(p->>'full_name',''), coalesce(p->>'url',''), coalesce(p->>'icon',''), coalesce(p->>'color','#0B1F8A'),
          coalesce((p->>'sort')::int, 100), coalesce((p->>'visible')::boolean, true), coalesce((p->>'beta')::boolean, false),
          coalesce((p->>'uses_access')::boolean, true), coalesce(p->>'version',''), coalesce(p->>'min_version',''), coalesce(p->>'note',''),
          coalesce(p->'features', '[]'::jsonb), case when jsonb_typeof(p->'features_on') = 'array' then array(select jsonb_array_elements_text(p->'features_on')) end,
          coalesce((p->>'open_all')::boolean, false), coalesce((p->>'trial_ok')::boolean, false))
  on conflict (code) do update set name = excluded.name, full_name = excluded.full_name, url = excluded.url, icon = excluded.icon, color = excluded.color,
    sort = excluded.sort, visible = excluded.visible, beta = excluded.beta, uses_access = excluded.uses_access, version = excluded.version,
    min_version = excluded.min_version, note = excluded.note,
    features = case when p ? 'features' then excluded.features else public.program_registry.features end,
    features_on = case when p ? 'features_on' then excluded.features_on else public.program_registry.features_on end,
    open_all = case when p ? 'open_all' then excluded.open_all else public.program_registry.open_all end,
    trial_ok = case when p ? 'trial_ok' then excluded.trial_ok else public.program_registry.trial_ok end;
  perform public._admin_log(null, 'program', (p->>'code') || ' · ' || (p->>'name'));
end $$;

-- ---------- 8. 실행 권한 ----------
revoke all on function public.trial_pick(text) from public, anon;
revoke all on function public.trial_handoff() from public, anon;
revoke all on function public.owner_save_trial_settings(boolean, int) from public, anon;
revoke all on function public.admin_list_trials() from public, anon;
revoke all on function public.admin_trial_update(uuid, int, boolean) from public, anon;
revoke all on function public.invite_create(jsonb) from public, anon;
revoke all on function public.invite_list() from public, anon;
revoke all on function public.invite_revoke(uuid) from public, anon;
revoke all on function public._can_invite(text) from public, anon, authenticated;
grant execute on function public.trial_pick(text), public.trial_handoff(), public.owner_save_trial_settings(boolean, int),
  public.admin_list_trials(), public.admin_trial_update(uuid, int, boolean),
  public.invite_create(jsonb), public.invite_list(), public.invite_revoke(uuid) to authenticated;
grant execute on function public.invite_info(text), public.public_settings() to anon, authenticated;

select 'ok' as result, (select count(*) from public.invites) invites, (select trial_open from public.app_settings where id = 1) trial_open,
       (select trial_days from public.app_settings where id = 1) trial_days;
