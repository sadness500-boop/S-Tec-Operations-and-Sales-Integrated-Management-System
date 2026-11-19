-- =====================================================================
--  S-Tec Operations and Sales Integrated Management System
--  (에스텍 운영 및 영업 통합관리 시스템) — 서버 보완 SQL v1.0.0
--  Designed & Developed by Rat Rae Choi
--
--  ● 어디에 실행하나요?
--    9개 프로그램이 함께 쓰는 Supabase 프로젝트(mnsuebexlzhvomxhrear)
--    → 왼쪽 메뉴 SQL Editor → 이 파일 전체를 붙여넣고 Run.  한 번만 실행하면 됩니다.
--  ● 먼저 실행되어 있어야 하는 것
--    · Attendance-Management-Software 저장소의 server/supabase_setup.sql (계정·기기·접속기록)
--    · S-Tec-Complaint-Response-System 저장소의 server/supabase_app_access.sql (프로그램별 권한)
--    · Program-for-Process-Standardization-and-Manual-Creation 저장소의 server/supabase_app_access_stos.sql
--  ● 무엇을 하나요?
--    1) 「프로그램 등록부」(program_registry) 표를 만들고 9개 프로그램을 등록합니다.
--       메인 프로그램은 이 표를 읽어 메뉴 카드를 그립니다. 새 프로그램은 관리 콘솔 「🧩 프로그램 등록」에서 추가합니다.
--    2) 프로그램별 권한(app_access)이 등록부에 있는 프로그램이면 무엇이든 받도록 바꿉니다
--       (지금은 6개 코드만 허용 → 새 프로그램을 추가해도 SQL을 다시 고칠 필요 없음).
--    3) 메인 화면이 한 번에 "내가 쓸 수 있는 프로그램"을 받아 오는 함수(my_programs)를 만듭니다.
--  ● 기존 표·자료는 지우지 않습니다. 다시 실행해도 안전합니다.
-- =====================================================================

-- 1) 프로그램 등록부 ----------------------------------------------------------------
create table if not exists public.program_registry (
  code         text primary key check (code ~ '^[a-z][a-z0-9_]{1,19}$'),
  name         text not null,                         -- 짧은 이름(카드 제목)  예: 근태관리
  full_name    text not null default '',              -- 영문 정식 이름
  url          text not null default '',              -- 실행 주소(GitHub Pages)
  icon         text not null default '',              -- 아이콘 그림 주소(비우면 기본 아이콘)
  color        text not null default '#0B1F8A',       -- 카드 색
  sort         int  not null default 100,             -- 표시 순서(작을수록 앞)
  visible      boolean not null default true,         -- false = 메뉴에서 숨김
  beta         boolean not null default false,        -- true = 제작자·관리자에게만 보임(시험 공개)
  uses_access  boolean not null default true,         -- true = 「프로그램별 권한」으로 사용자마다 허용 / false = 승인된 계정 모두 사용
  version      text not null default '',              -- 현재 공개 버전(표시용)
  min_version  text not null default '',              -- 이보다 낮은 버전은 새로고침 안내
  note         text not null default '',              -- 카드 아래 한 줄 설명
  updated_at   timestamptz not null default now(),
  updated_by   uuid
);
alter table public.program_registry enable row level security;
drop policy if exists program_registry_read on public.program_registry;
create policy program_registry_read on public.program_registry for select
  using (auth.uid() is not null and (not beta or public.is_admin()));
-- 쓰기는 아래 관리자 함수로만

insert into public.program_registry (code, name, full_name, url, icon, color, sort, uses_access, note) values
 ('ams',  '근태관리',        'Attendance Management Software',
          'https://sadness500-boop.github.io/Attendance-Management-Software/', 'assets/apps/ams.png',  '#1B7A34', 20, false, '근무조 코드 기반 월 근태 자동 생성'),
 ('stso', '사업장 현황 지도', 'S-Tec-Business-Site-Overview',
          'https://sadness500-boop.github.io/S-Tec-Business-Site-Overview/', 'assets/apps/stso.png', '#0E7C86', 10, true,  '사업장 위치·현황 지도'),
 ('stqs', '용역인력 견적',    'S-Tec-Quotation-System',
          'https://sadness500-boop.github.io/S-Tec-Quotation-System/', 'assets/apps/stqs.png', '#0B1F8A', 50, true,  '업종별 용역인력·부대비용 견적'),
 ('wbe',  '업무량 기반 산정', 'Workload-Based Cost and Labor Estimation Method',
          'https://sadness500-boop.github.io/Workload-Based-Cost-and-Labor-Estimation-Method/', 'assets/apps/wbe.png', '#E8750A', 60, true, '업무량 기준 인력·비용 산정'),
 ('stse', '단기인력 견적',    'S-Tec short estimate',
          'https://sadness500-boop.github.io/S-Ttec-short-estimate/', 'assets/apps/stse.png', '#7A2E8E', 70, true,  '단기·행사 인력 견적'),
 ('stcr', '고객 불만처리',    'S-Tec-Complaint-Response-System',
          'https://sadness500-boop.github.io/S-Tec-Complaint-Response-System/', 'assets/apps/stcr.png', '#C0392B', 30, true, 'Complaint 대응방안 Word·PPT·PDF'),
 ('stos', '업무표준화·매뉴얼', 'Program for Process Standardization and Manual Creation',
          'https://sadness500-boop.github.io/Program-for-Process-Standardization-and-Manual-Creation/', 'assets/apps/stos.png', '#2F6FD0', 90, true, '업무표준·업무매뉴얼 제작'),
 ('stlr', '법률 대응 시스템', 'Legal Response System',
          'https://sadness500-boop.github.io/S-Tec-Legal-Response-System/', 'assets/apps/stlr.png', '#1F3A73', 40, true, '부당 클레임·근무자 사안 법률 검토 Word·PPT·PDF'),
 ('stpp', '제안서 제작시스템', 'S-Tec Proposal Production System',
          'https://sadness500-boop.github.io/S-Tec-Proposal-Production-System/', 'assets/apps/stpp.png', '#0E5C4A', 80, true, '견적 3종 연동 · 업종·산업별 제안서 Word·PPT·PDF')
on conflict (code) do nothing;

-- 2) 프로그램별 권한: 등록부에 있는 프로그램이면 모두 허용 ---------------------------------
do $$ begin
  if to_regclass('public.app_access') is not null then
    alter table public.app_access drop constraint if exists app_access_app_check;
    if not exists (select 1 from pg_constraint where conname = 'app_access_app_fk') then
      alter table public.app_access add constraint app_access_app_fk
        foreign key (app) references public.program_registry(code) on update cascade on delete cascade;
    end if;
  end if;
end $$;

-- 3) 메인 화면: 내가 쓸 수 있는 프로그램 목록 -------------------------------------------
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

-- 4) 관리자: 등록부 목록 · 저장 · 삭제 ----------------------------------------------------
create or replace function public.admin_list_programs() returns setof public.program_registry
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception '관리자만 볼 수 있습니다'; end if;
  return query select * from public.program_registry order by sort, code;
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

create or replace function public.admin_delete_program(p_code text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception '프로그램 삭제는 제작자만 할 수 있습니다'; end if;
  delete from public.program_registry where code = p_code;
  perform public._admin_log(auth.uid(), 'program_delete', p_code);
end $$;

revoke all on function public.my_programs() from public, anon;
revoke all on function public.admin_list_programs() from public, anon;
revoke all on function public.admin_save_program(jsonb) from public, anon;
revoke all on function public.admin_delete_program(text) from public, anon;
grant execute on function public.my_programs() to authenticated;
grant execute on function public.admin_list_programs() to authenticated;
grant execute on function public.admin_save_program(jsonb) to authenticated;
grant execute on function public.admin_delete_program(text) to authenticated;
