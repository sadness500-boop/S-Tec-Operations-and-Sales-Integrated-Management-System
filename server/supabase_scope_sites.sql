-- =====================================================================
-- v1.10.2  관리범위 창에 사업장까지 보이기 — 근태관리 사업장 목록(이름·소속 조직만)
--   · 제작자·관리자: 모든 사업장 / 조직 관리자: 맡은 조직 아래 사업장만
--   · 근무자·근태 자료는 돌려주지 않습니다(id · 이름 · 소속 조직 번호만)
--   Supabase › SQL Editor 에서 한 번 실행하세요.
--   Designed & Developed by Rat Rae Choi
-- =====================================================================
create or replace function public.scope_site_list() returns json
language plpgsql stable security definer set search_path = public as $$
declare me public.profiles; m public.org_managers;
begin
  select * into me from public.profiles where id = auth.uid();
  if me.id is null then raise exception '로그인이 필요합니다'; end if;
  m := public._mgr();
  if not (me.role in ('owner','admin') or m.user_id is not null) then raise exception '권한이 없습니다'; end if;
  return coalesce((
    select json_agg(json_build_object('id', substr(d.k, 6), 'name', coalesce(d.v->'site'->>'name', substr(d.k, 6)), 'org', coalesce(d.v->'site'->>'org', ''))
                    order by d.v->'site'->>'name')
    from public.shared_data d
    where d.k like 'site:%'
      and (me.role in ('owner','admin') or public._ou_under(coalesce(d.v->'site'->>'org', ''), m.orgs))
  ), '[]'::json);
end $$;

revoke all on function public.scope_site_list() from public, anon;
grant execute on function public.scope_site_list() to authenticated;
