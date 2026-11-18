-- =====================================================================
--  S-Tec Operations and Sales Integrated Management System
--  공통 기준정보(회사 · 조직 · 사업장) — 8개 프로그램이 함께 씁니다.
--  Designed & Developed by Rat Rae Choi
--
--  ● 같은 Supabase 프로젝트 → SQL Editor → 전체 붙여넣고 Run. 여러 번 실행해도 안전합니다.
--  ● 읽기: 로그인한 승인된 사용자 모두 (master_get)
--    쓰기: 제작자 · 관리자만 (admin_master_put) — 관리 작업 기록에 남습니다.
--  ● 처음에는 비어 있습니다. 비어 있으면 각 프로그램은 지금까지의 에스텍베스트 자료를 그대로 씁니다.
-- =====================================================================
create table if not exists public.master_data (
  k          text primary key check (k in ('companies','orgs','sites')),
  v          jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.master_data enable row level security;
-- 표에 직접 접근하는 정책은 두지 않고, 아래 함수로만 읽고 씁니다.

create or replace function public.master_get() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found or pr.status <> 'active' then return json_build_object('ok', false); end if;
  return json_build_object('ok', true,
    'companies', coalesce((select v from public.master_data where k = 'companies'), '[]'::jsonb),
    'orgs',      coalesce((select v from public.master_data where k = 'orgs'), '[]'::jsonb),
    'sites',     coalesce((select v from public.master_data where k = 'sites'), '[]'::jsonb),
    'updated_at', (select max(updated_at) from public.master_data));
end $$;

create or replace function public.admin_master_put(p_k text, p_v jsonb, p_note text default '') returns json
language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not public.is_admin() then raise exception '기준정보는 제작자 · 관리자만 바꿀 수 있습니다'; end if;
  if p_k not in ('companies','orgs','sites') then raise exception '알 수 없는 기준정보: %', p_k; end if;
  if jsonb_typeof(p_v) <> 'array' then raise exception '목록 형식이 아닙니다'; end if;
  if octet_length(p_v::text) > 5000000 then raise exception '자료가 너무 큽니다(5MB 초과)'; end if;
  n := jsonb_array_length(p_v);
  insert into public.master_data(k, v, updated_at, updated_by) values (p_k, p_v, now(), auth.uid())
  on conflict (k) do update set v = excluded.v, updated_at = now(), updated_by = auth.uid();
  perform public._admin_log(null, 'master_' || p_k,
    (case p_k when 'companies' then '회사' when 'orgs' then '조직' else '사업장' end) || ' ' || n || '건' ||
    case when coalesce(p_note,'') <> '' then ' · ' || left(p_note, 120) else '' end);
  return json_build_object('ok', true, 'count', n, 'updated_at', now());
end $$;

revoke all on function public.master_get() from public, anon;
revoke all on function public.admin_master_put(text, jsonb, text) from public, anon;
grant execute on function public.master_get() to authenticated;
grant execute on function public.admin_master_put(text, jsonb, text) to authenticated;
