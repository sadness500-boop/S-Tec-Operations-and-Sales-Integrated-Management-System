-- =====================================================================
--  회사·조직별 가입자 관리 v1.9.0 되돌리기 — Designed & Developed by Rat Rae Choi
--  my_programs · app_check · admin_save_program 을 v1.8 방식으로 되돌리고, 새 가입 트리거를 끕니다.
--  회사·조직표 · 조직 관리자 · 소속 · 추가 권한 자료는 지우지 않습니다(다시 시행하면 그대로 이어 씀).
-- =====================================================================
drop trigger if exists on_auth_user_org on auth.users;
create or replace function public.app_check(p_app text) returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; a public.app_access;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'no_session'); end if;
  select * into pr from public.profiles where id = auth.uid();
  if not found then return json_build_object('ok', false, 'reason', 'no_profile'); end if;
  if pr.role in ('owner','admin') then
    return json_build_object('ok', true, 'perm', 'use', 'admin', true, 'branches', '{}'::text[]);
  end if;
  select * into a from public.app_access where user_id = pr.id and app = p_app;
  if not found or a.perm = 'none' then
    return json_build_object('ok', false, 'reason', 'no_app_access');
  end if;
  if a.expires_at is not null and a.expires_at < (now() at time zone 'Asia/Seoul')::date then
    return json_build_object('ok', false, 'reason', 'app_expired', 'expires_at', a.expires_at);
  end if;
  return json_build_object('ok', true, 'perm', a.perm, 'expires_at', a.expires_at, 'branches', a.branches);
end $$;
create or replace function public.my_programs() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; adm boolean; out json;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'reason', 'no_session'); end if;
  select * into pr from public.profiles where id = auth.uid();
  if not found then return json_build_object('ok', false, 'reason', 'no_profile'); end if;
  adm := pr.role in ('owner','admin');
  select coalesce(json_agg(x order by x.sort, x.code), '[]'::json) into out from (
    select r.code, r.name, r.full_name, r.url, r.icon, r.color, r.sort, r.beta, r.uses_access, r.version, r.min_version, r.note,
           case
             when pr.status <> 'active' then 'account'
             when adm or not r.uses_access then 'use'
             when a.perm is null or a.perm = 'none' then 'none'
             when a.expires_at is not null and a.expires_at < (now() at time zone 'Asia/Seoul')::date then 'expired'
             else 'use' end as access,
           a.expires_at as app_expires_at,
           coalesce(a.branches, '{}'::text[]) as branches
      from public.program_registry r
      left join public.app_access a on a.user_id = pr.id and a.app = r.code
     where r.visible and (not r.beta or adm)
  ) x;
  return json_build_object('ok', true, 'admin', adm, 'programs', out);
end $$;
create or replace function public.admin_save_program(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare c text := lower(coalesce(p->>'code',''));
begin
  if not public.is_owner() then raise exception '프로그램 등록은 제작자만 할 수 있습니다'; end if;
  if c !~ '^[a-z][a-z0-9_]{1,19}$' then raise exception '프로그램 코드는 영문 소문자로 시작하는 2~20자(영문·숫자·_)입니다'; end if;
  if coalesce(p->>'name','') = '' then raise exception '프로그램 이름을 입력하세요'; end if;
  insert into public.program_registry as r (code, name, full_name, url, icon, color, sort, visible, beta, uses_access, version, min_version, note, updated_at, updated_by)
  values (c, p->>'name', coalesce(p->>'full_name',''), coalesce(p->>'url',''), coalesce(p->>'icon',''),
          coalesce(nullif(p->>'color',''),'#0B1F8A'), coalesce((p->>'sort')::int, 100),
          coalesce((p->>'visible')::boolean, true), coalesce((p->>'beta')::boolean, false),
          coalesce((p->>'uses_access')::boolean, true), coalesce(p->>'version',''), coalesce(p->>'min_version',''),
          coalesce(p->>'note',''), now(), auth.uid())
  on conflict (code) do update set
    name = excluded.name, full_name = excluded.full_name, url = excluded.url, icon = excluded.icon, color = excluded.color,
    sort = excluded.sort, visible = excluded.visible, beta = excluded.beta, uses_access = excluded.uses_access,
    version = excluded.version, min_version = excluded.min_version, note = excluded.note,
    updated_at = now(), updated_by = auth.uid();
  perform public._admin_log(auth.uid(), 'program', c || ' · ' || (p->>'name')
    || case when coalesce((p->>'beta')::boolean,false) then ' · 시험 공개' else '' end
    || case when not coalesce((p->>'visible')::boolean,true) then ' · 숨김' else '' end);
end $$;
grant execute on function public.app_check(text), public.my_programs(), public.admin_save_program(jsonb) to authenticated;
