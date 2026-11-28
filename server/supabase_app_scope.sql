-- =====================================================================
-- v1.11.0  프로그램마다 관리범위 따로 — 모든 프로그램 공통 규칙
--   · 통합관리 콘솔 「🔐 프로그램별 권한」에서 그 프로그램만 조직별 ✏️수정('e:조직id') / 👁보기('v:조직id') 를 정하면 그 범위,
--     아무것도 정하지 않았으면(「관리범위 그대로」) 그 사람의 공통 관리범위(근태관리 칸)를 그대로 씁니다.
--   · app_check 가 각 프로그램에 계산된 범위를 넘깁니다:
--       rules {조직id: 'edit'|'view'} · rest · all · src('app'|'common'|'none')
--       branches      = 볼 수 있는 에스텍베스트 지사 이름(예전 방식 프로그램용, 범위가 없으면 빈 목록 = 제한 없음)
--       edit_branches = 고칠 수 있는 지사 이름
--   · 성과 관리(stpm) · 출입관리(stac) 서버 함수도 같은 범위를 씁니다.
--   Supabase › SQL Editor 에서 한 번 실행하세요.   Designed & Developed by Rat Rae Choi
-- =====================================================================

-- 에스텍베스트 지사 이름 ↔ 조직 번호
create or replace function public._best_branch_ou(p_br text) returns text
language sql immutable as $$
  select case p_br when '동부' then 'O02' when '서부' then 'O06' when '남부' then 'O07' when '중부' then 'O08' else null end;
$$;

-- 조직에서 맨 위까지 (자기 자신 먼저)
create or replace function public._ou_up(p_ou text) returns text[]
language sql stable security definer set search_path = public as $$
  with recursive c(id, parent, n) as (
    select id, parent, 0 from public.org_units where id = p_ou
    union all select o.id, o.parent, c.n + 1 from public.org_units o join c on o.id = c.parent where c.n < 20)
  select coalesce(array_agg(id order by n), '{}') from c;
$$;

-- 그 사람 · 그 프로그램의 범위
create or replace function public._eff_app_rules(p_user uuid, p_app text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; br text[] := '{}'; x text; rules jsonb := '{}'; sc jsonb; r jsonb; pv text;
begin
  select * into pr from public.profiles where id = p_user;
  if not found then return jsonb_build_object('all', false, 'rules', '{}'::jsonb, 'rest', 'none', 'src', 'none'); end if;
  if pr.role in ('owner','admin') then return jsonb_build_object('all', true, 'perm', 'edit', 'rules', '{}'::jsonb, 'rest', 'edit', 'src', 'admin'); end if;
  select coalesce(a.branches, '{}') into br from public.app_access a where a.user_id = p_user and a.app = p_app;
  br := coalesce(br, '{}');
  -- 1) 프로그램만 따로 정한 범위
  foreach x in array br loop
    if x ~ '^[ev]:' then rules := rules || jsonb_build_object(substr(x, 3), case when left(x, 1) = 'v' then 'view' else 'edit' end); end if;
  end loop;
  if rules <> '{}'::jsonb then return jsonb_build_object('all', false, 'rules', rules, 'rest', 'none', 'src', 'app'); end if;
  -- 예전 방식(지사 이름)
  foreach x in array br loop
    if public._best_branch_ou(x) is not null then rules := rules || jsonb_build_object(public._best_branch_ou(x), 'edit'); end if;
  end loop;
  if rules <> '{}'::jsonb then return jsonb_build_object('all', false, 'rules', rules, 'rest', 'none', 'src', 'app'); end if;
  -- 2) 공통 관리범위
  sc := coalesce(pr.scope::jsonb, '{}'::jsonb);
  pv := case when sc->>'perm' = 'view' then 'view' else 'edit' end;
  if sc->>'level' = 'all' then return jsonb_build_object('all', true, 'perm', pv, 'rules', '{}'::jsonb, 'rest', pv, 'src', 'common'); end if;
  if sc->>'level' = 'org' and coalesce(sc->>'org', '') <> '' then
    return jsonb_build_object('all', false, 'rules', jsonb_build_object(sc->>'org', pv), 'rest', 'none', 'src', 'common'); end if;
  if sc->>'level' = 'multi' then
    for r in select * from jsonb_array_elements(coalesce(sc->'rules', '[]'::jsonb)) loop
      if r->>'t' = 'org' then rules := rules || jsonb_build_object(r->>'id', case when r->>'perm' = 'view' then 'view' else 'edit' end); end if;
    end loop;
    return jsonb_build_object('all', false, 'rules', rules, 'rest', case when sc->>'rest' = 'view' then 'view' else 'none' end, 'src', 'common');
  end if;
  return jsonb_build_object('all', false, 'rules', '{}'::jsonb, 'rest', 'none', 'src', 'none');
end $$;

-- 조직 하나에 대한 권한: 'edit' | 'view' | null
create or replace function public._eff_perm(e jsonb, p_ou text) returns text
language plpgsql stable security definer set search_path = public as $$
declare c text;
begin
  if coalesce((e->>'all')::boolean, false) then return coalesce(e->>'perm', 'edit'); end if;
  foreach c in array public._ou_up(p_ou) loop
    if e->'rules' ? c then return e->'rules'->>c; end if;
  end loop;
  return case when e->>'rest' in ('view','edit') then e->>'rest' else null end;
end $$;

-- 예전 방식 프로그램용 지사 이름 목록 (p_edit=true 면 고칠 수 있는 지사만). 범위가 없으면 빈 목록(제한 없음)
create or replace function public._eff_branches(e jsonb, p_edit boolean) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare b text; out text[] := '{}'; p text;
begin
  if coalesce((e->>'all')::boolean, false) then
    if p_edit and e->>'perm' = 'view' then return array['-']; end if;
    return '{}';
  end if;
  if e->>'src' = 'none' then return '{}'; end if;
  foreach b in array array['동부','서부','남부','중부'] loop
    p := public._eff_perm(e, public._best_branch_ou(b));
    if p = 'edit' or (not p_edit and p = 'view') then out := out || b; end if;
  end loop;
  if array_length(out, 1) is null then return array['-']; end if;   -- 범위는 있는데 에스텍베스트 지사는 없음
  return out;
end $$;

-- 각 프로그램에 넘기는 권한 확인 (v1.10.0 체험 처리 그대로 + 범위)
create or replace function public.app_check(p_app text) returns json
language plpgsql security definer set search_path = public as $$
declare pr public.profiles; r public.program_registry; s jsonb; e jsonb;
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
    e := public._eff_app_rules(pr.id, p_app);
    return json_build_object('ok', true, 'perm', 'use', 'admin', pr.role in ('owner','admin'), 'extra', coalesce((s->>'extra')::boolean, false),
      'trial', coalesce((s->>'trial')::boolean, false), 'expires_at', s->>'app_expires_at',
      'branches', public._eff_branches(e, false), 'edit_branches', public._eff_branches(e, true), 'scope', e, 'features', s->'features');
  end if;
  if s->>'access' = 'trial_locked' then return json_build_object('ok', false, 'reason', 'trial_locked', 'trial_app', pr.trial_app); end if;
  if s->>'access' = 'expired' then return json_build_object('ok', false, 'reason', 'app_expired', 'expires_at', s->>'app_expires_at'); end if;
  if s->>'access' = 'account' then return json_build_object('ok', false, 'reason', 'account'); end if;
  return json_build_object('ok', false, 'reason', 'no_app_access');
end $$;

-- 성과 관리(stpm): 같은 범위
create or replace function public._pm_scope() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; e jsonb;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found or pr.status <> 'active' then return json_build_object('ok', false); end if;
  if pr.role in ('owner','admin') then return json_build_object('ok', true, 'all', true); end if;
  e := public._eff_app_rules(pr.id, 'stpm');
  if coalesce((e->>'all')::boolean, false) then return json_build_object('ok', true, 'all', false, 'branches', array['동부','서부','남부','중부']); end if;
  return json_build_object('ok', true, 'all', false, 'branches', public._eff_branches(e, false));
end $$;

-- 출입관리(stac): 같은 범위 (보기 지사는 목록만, 고치기는 ✏️수정 지사만)
create or replace function public._ac_scope() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; ok boolean := false; e jsonb;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found or pr.status <> 'active' then return json_build_object('ok', false); end if;
  if pr.role in ('owner','admin') then return json_build_object('ok', true, 'all', true); end if;
  select true into ok from public.app_access where user_id = pr.id and app = 'stac' and perm = 'use';
  if not coalesce(ok, false) then return json_build_object('ok', false); end if;
  e := public._eff_app_rules(pr.id, 'stac');
  if coalesce((e->>'all')::boolean, false) then
    return json_build_object('ok', true, 'all', false, 'branches', array['동부','서부','남부','중부'],
      'edit_branches', case when e->>'perm' = 'view' then '{}'::text[] else array['동부','서부','남부','중부'] end); end if;
  return json_build_object('ok', true, 'all', false, 'branches', public._eff_branches(e, false), 'edit_branches', public._eff_branches(e, true));
end $$;

create or replace function public.ac_put(p_kind text, p_rows jsonb) returns json
language plpgsql security definer set search_path = public as $$
declare r jsonb; n int := 0; sc json := public._ac_scope(); cur public.ac_records; mine text[] := public._ac_sites(); brs text[];
begin
  if not (sc->>'ok')::boolean then raise exception '출입관리(stac) 사용 권한이 있는 승인된 계정만 저장할 수 있습니다'; end if;
  if p_kind not in ('people','cars','cos','visits') then raise exception '종류가 올바르지 않습니다'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception '목록 형식이 아닙니다'; end if;
  if jsonb_array_length(p_rows) > 1000 or octet_length(p_rows::text) > 6000000 then raise exception '한 번에 올리는 자료가 너무 큽니다'; end if;
  select coalesce(array_agg(x), '{}') into brs from json_array_elements_text(coalesce(sc->'edit_branches', '[]'::json)) x;
  for r in select * from jsonb_array_elements(p_rows) loop
    select * into cur from public.ac_records where kind = p_kind and id = r->>'id';
    if found and cur.owner <> auth.uid() and not coalesce((sc->>'all')::boolean, false)
       and not (cur.site = any(mine)) and not (cur.br = any(brs)) then continue; end if;
    insert into public.ac_records (kind, id, owner, site, br, d, data, updated_at)
    values (p_kind, r->>'id', coalesce(cur.owner, auth.uid()), coalesce(r->>'site',''), coalesce(r->>'br',''),
            nullif(r->>'d','')::date, r->'data', now())
    on conflict (kind, id) do update set site = excluded.site, br = excluded.br, d = excluded.d, data = excluded.data, updated_at = now();
    n := n + 1;
  end loop;
  return json_build_object('ok', true, 'count', n);
end $$;

revoke all on function public._eff_app_rules(uuid, text) from public, anon, authenticated;
revoke all on function public._eff_perm(jsonb, text) from public, anon, authenticated;
revoke all on function public._eff_branches(jsonb, boolean) from public, anon, authenticated;
revoke all on function public._ou_up(text) from public, anon, authenticated;
revoke all on function public._pm_scope() from public, anon;
revoke all on function public._ac_scope() from public, anon, authenticated;
