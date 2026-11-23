-- v1.9.13 「PC 프로그램 사용 스위치」 — 웹 · 안드로이드 앱은 그대로 두고 윈도우 PC 프로그램만 멈춤
-- 켜고 끄는 것은 제작자만 (제작자 관리 콘솔 › ⚙️ 전체 설정 › 💻 PC 프로그램). PC 프로그램은 켤 때와 2분마다 pc_status()를 확인합니다.
-- Supabase → SQL Editor에서 한 번 실행 (여러 번 실행해도 같은 결과)   Designed & Developed by Rat Rae Choi
create table if not exists public.app_switches (
  key        text primary key,
  blocked    boolean not null default false,
  message    text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.app_switches enable row level security;   -- 정책 없음: 아래 함수로만 읽고 씀
insert into public.app_switches (key) values ('pc') on conflict (key) do nothing;

-- PC 프로그램이 로그인 전에 확인 (누구나 읽기 — 멈춤 여부와 안내 문구만)
create or replace function public.pc_status() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object('blocked', coalesce(s.blocked, false), 'message', coalesce(s.message, ''), 'updated_at', s.updated_at)
    from (select 1) d left join public.app_switches s on s.key = 'pc';
$$;

-- 제작자만 켜고 끔
create or replace function public.owner_set_pc_switch(p_blocked boolean, p_message text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception 'PC 프로그램 사용 스위치는 제작자만 바꿀 수 있습니다'; end if;
  insert into public.app_switches (key, blocked, message, updated_at, updated_by)
  values ('pc', coalesce(p_blocked, false), left(coalesce(p_message, ''), 300), now(), auth.uid())
  on conflict (key) do update set blocked = excluded.blocked, message = excluded.message, updated_at = now(), updated_by = auth.uid();
  perform public._admin_log(null, 'pc_switch', case when p_blocked then 'PC 프로그램 사용 중지' else 'PC 프로그램 사용 재개' end);
end $$;

revoke all on function public.owner_set_pc_switch(boolean, text) from public, anon;
grant execute on function public.pc_status() to anon, authenticated;
grant execute on function public.owner_set_pc_switch(boolean, text) to authenticated;

select * from public.app_switches;
