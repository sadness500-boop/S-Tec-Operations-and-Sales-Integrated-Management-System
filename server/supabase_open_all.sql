-- v1.9.11 「전체 공개」 프로그램 — 오늘의 뽑기판 · 팔도 제철맛길 · 팔도 축제길
-- 로그인한 모든 계정이 관리범위 · 회사·조직 공개 · 개인 권한 지정 없이 사용 (시스템 비공개 · 시험 공개 · 승인 대기 계정은 그대로 제외)
-- Supabase → SQL Editor에서 한 번 실행 (여러 번 실행해도 같은 결과)   Designed & Developed by Rat Rae Choi
alter table public.program_registry add column if not exists open_all boolean not null default false;
update public.program_registry set open_all = true, uses_access = false where code in ('ppopgi', 'matgil', 'festa');

create or replace function public._app_state(pr public.profiles, r public.program_registry) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare adm boolean := pr.role in ('owner','admin'); a public.app_access; x jsonb; ox jsonb; feats text[]; orgapps text[];
  allf text[] := array(select jsonb_array_elements(r.features)->>'key');
  sysf text[] := coalesce(r.features_on, array(select jsonb_array_elements(r.features)->>'key'));
begin
  if not r.visible and pr.role <> 'owner' then return null; end if;              -- ① 시스템 비공개
  if r.beta and not adm then return null; end if;
  if pr.status <> 'active' then return jsonb_build_object('access', 'account'); end if;
  if r.open_all then return jsonb_build_object('access', 'use', 'features', to_jsonb(sysf)); end if;   -- ⓪ 전체 공개: 관리범위 · 조직 공개 · 개인 권한 없이 모두
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

create or replace function public.my_programs() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; out json;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'no_session'); end if;
  select * into pr from public.profiles where id = auth.uid();
  if not found then return json_build_object('ok', false, 'reason', 'no_profile'); end if;
  select coalesce(json_agg(x order by x.sort, x.code), '[]'::json) into out from (
    select r.code, r.name, r.full_name, r.url, r.icon, r.color, r.sort, r.beta, r.uses_access, r.open_all, r.version, r.min_version, r.note,
           s->>'access' as access, (s->>'app_expires_at')::date as app_expires_at,
           coalesce(array(select jsonb_array_elements_text(coalesce(s->'branches','[]'::jsonb))), '{}') as branches,
           s->'features' as features, coalesce((s->>'extra')::boolean, false) as extra, r.features as feature_defs
      from public.program_registry r, lateral (select public._app_state(pr, r) s) z
     where z.s is not null
  ) x;
  return json_build_object('ok', true, 'admin', pr.role in ('owner','admin'), 'programs', out);
end $$;

create or replace function public.admin_save_program(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception '프로그램 공개·세부 기능은 제작자만 정합니다'; end if;
  insert into public.program_registry (code, name, full_name, url, icon, color, sort, visible, beta, uses_access, version, min_version, note, features, features_on, open_all)
  values (p->>'code', p->>'name', coalesce(p->>'full_name',''), coalesce(p->>'url',''), coalesce(p->>'icon',''), coalesce(p->>'color','#0B1F8A'),
          coalesce((p->>'sort')::int, 100), coalesce((p->>'visible')::boolean, true), coalesce((p->>'beta')::boolean, false),
          coalesce((p->>'uses_access')::boolean, true), coalesce(p->>'version',''), coalesce(p->>'min_version',''), coalesce(p->>'note',''),
          coalesce(p->'features', '[]'::jsonb), case when jsonb_typeof(p->'features_on') = 'array' then array(select jsonb_array_elements_text(p->'features_on')) end,
          coalesce((p->>'open_all')::boolean, false))
  on conflict (code) do update set name = excluded.name, full_name = excluded.full_name, url = excluded.url, icon = excluded.icon, color = excluded.color,
    sort = excluded.sort, visible = excluded.visible, beta = excluded.beta, uses_access = excluded.uses_access, version = excluded.version,
    min_version = excluded.min_version, note = excluded.note,
    features = case when p ? 'features' then excluded.features else public.program_registry.features end,
    features_on = case when p ? 'features_on' then excluded.features_on else public.program_registry.features_on end,
    open_all = case when p ? 'open_all' then excluded.open_all else public.program_registry.open_all end;
  perform public._admin_log(null, 'program', (p->>'code') || ' · ' || (p->>'name'));
end $$;

select code, name, sort, visible, beta, uses_access, open_all from public.program_registry order by sort;
