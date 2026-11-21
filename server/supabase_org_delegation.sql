-- =====================================================================
--  S-Tec Operations and Sales Integrated Management System
--  회사·조직별 가입자 관리 (검토안 v3) — 서버 SQL v1.9.0
--  Designed & Developed by Rat Rae Choi
--
--  ● 어디에 실행하나요?  11개 프로그램이 함께 쓰는 Supabase 프로젝트(mnsuebexlzhvomxhrear)
--    → SQL Editor → 이 파일 전체를 붙여넣고 Run.  여러 번 실행해도 안전합니다.
--  ● 먼저 실행되어 있어야 하는 것: supabase_integrated.sql(프로그램 등록부), 각 저장소의 app_access SQL
--  ● 무엇을 하나요?
--    1) 회사·조직표(org_units) — 251128 전사 조직도(변경 후) 161개(그룹·회사 포함), 개인 이름 없음
--    2) 조직 관리자(org_managers) — 사람마다 맡은 조직 + 권한을 따로 지정 (제작자만)
--    3) 프로그램 시스템 공개 · 세부 기능 · 회사·조직별 공개 (제작자만)
--    4) 개인별 추가 권한(profiles.extra) — 조직·조직 관리자 범위를 넘는 프로그램·관리범위 (제작자만)
--    5) 가입 신청 때 회사·조직 선택, 소속(profiles.org_id), 기존 가입자 7명 연결
--    6) my_programs · app_check 를 바꿔 11개 프로그램이 같은 규칙으로 동작
--  ● 기존 표·자료는 지우지 않습니다.  되돌리기: supabase_org_delegation_rollback.sql
-- =====================================================================

-- 1) 표 -------------------------------------------------------------------------------
create table if not exists public.org_units (
  id         text primary key,
  name       text not null,
  kind       text not null default '팀',
  parent     text not null default '',
  sort       int  not null default 100,
  active     boolean not null default true,      -- 닫으면 새 가입 목록에서만 빠짐(기록은 남음)
  join_open  boolean not null default true,      -- 가입 화면 목록에 보이기
  join_code  text not null default '',           -- 가입 코드(비우면 없음)
  programs   text[],                             -- 이 조직에 열 프로그램(null = 위 조직을 물려받음, 맨 위 null = 모두)
  features   jsonb,                              -- {"stqs":["new"]} 처럼 조직별로 더 좁힌 세부 기능(null = 물려받음)
  defaults   jsonb not null default '{}'::jsonb, -- 승인 기본값 {"days":365,"scope":"edit","apps":["stso",...]}
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.org_units enable row level security;   -- 직접 접근 없음 → 함수로만

create table if not exists public.org_managers (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  orgs       text[] not null default '{}',       -- 맡은 조직(하위 포함)
  perms      jsonb  not null default '{}'::jsonb, -- 4장 권한 표
  updated_at timestamptz not null default now(),
  updated_by uuid
);
alter table public.org_managers enable row level security;

alter table public.profiles add column if not exists org_id text;
alter table public.profiles add column if not exists extra  jsonb not null default '{}'::jsonb;  -- ⭐ 제작자 추가 권한
alter table public.program_registry add column if not exists features    jsonb not null default '[]'::jsonb; -- [{"key":"new","name":"신규 견적"}]
alter table public.program_registry add column if not exists features_on text[];                            -- null = 모두 공개
alter table public.app_access add column if not exists features text[];                                      -- null = 열린 것 모두

-- 2) 251128 전사 조직도(변경 후) — 조직 이름·상하관계만 ------------------------------------
insert into public.org_units (id, name, kind, parent, sort) values
  ('G000','에스텍 그룹','그룹','',0),
  ('G001','에스텍시스템','회사','G000',10),
  ('G002','시큐리티사업부문','부문','G001',10),
  ('G003','지원팀','팀','G002',10),
  ('G004','서울본부','본부','G002',20),
  ('G005','서초지사','지사','G004',10),
  ('G006','강동지사','지사','G004',20),
  ('G007','롯데지사','지사','G004',30),
  ('G008','동대문지사','지사','G004',40),
  ('G009','경인본부','본부','G002',30),
  ('G010','중앙지사','지사','G009',10),
  ('G011','강서지사','지사','G009',20),
  ('G012','인천지사','지사','G009',30),
  ('G013','메디칼본부','본부','G002',40),
  ('G014','동부의료지사','지사','G013',10),
  ('G015','서부의료지사','지사','G013',20),
  ('G016','남부의료지사','지사','G013',30),
  ('G017','중앙의료지사','지사','G013',40),
  ('G018','성빈센트지사','지사','G013',50),
  ('G019','경원본부','본부','G002',50),
  ('G020','동경기지사','지사','G019',10),
  ('G021','용인지사','지사','G019',20),
  ('G022','서경기지사','지사','G019',30),
  ('G023','남경기지사','지사','G019',40),
  ('G024','부경본부','본부','G002',60),
  ('G025','부산지사','지사','G024',10),
  ('G026','사천지사','지사','G024',20),
  ('G027','창원지사','지사','G024',30),
  ('G028','거제지사','지사','G024',40),
  ('G029','경울본부','본부','G002',70),
  ('G030','구미지사','지사','G029',10),
  ('G031','경북지사','지사','G029',20),
  ('G032','대구지사','지사','G029',30),
  ('G033','울산지사','지사','G029',40),
  ('G034','서부본부','본부','G002',80),
  ('G035','천안지사','지사','G034',10),
  ('G036','충청지사','지사','G034',20),
  ('G037','탕정지사','지사','G034',30),
  ('G038','호남지사','지사','G034',40),
  ('G039','HS본부','본부','G002',90),
  ('G040','도곡지사','지사','G039',10),
  ('G041','메트로지사','지사','G039',20),
  ('G042','센트럴지사','지사','G039',30),
  ('G043','경기지사','지사','G039',40),
  ('G044','서부지사','지사','G039',50),
  ('G045','인프라사업부문','부문','G001',20),
  ('G046','지원팀','팀','G045',10),
  ('G047','자산관리1본부','본부','G045',20),
  ('G048','KT&G지사','지사','G047',10),
  ('G049','멀티지사','지사','G047',20),
  ('G050','자산관리2본부','본부','G045',30),
  ('G051','메디칼지사','지사','G050',10),
  ('G052','방제사업본부','본부','G045',40),
  ('G053','수도권센터','센터','G052',10),
  ('G054','경기남부센터','센터','G052',20),
  ('G055','경남센터','센터','G052',30),
  ('G056','경북센터','센터','G052',40),
  ('G057','서부센터','센터','G052',50),
  ('G058','환경사업부문','부문','G001',30),
  ('G059','PM사업부','사업부','G058',10),
  ('G060','PM운영사업본부','본부','G059',10),
  ('G061','자산운영팀','팀','G060',10),
  ('G062','PM지원팀','팀','G060',20),
  ('G063','PFM마케팅사업본부','본부','G059',20),
  ('G064','LM팀','팀','G063',10),
  ('G065','투자자문팀','팀','G063',20),
  ('G066','RS사업부','사업부','G058',20),
  ('G067','RS사업팀','팀','G066',10),
  ('G068','중앙센터','센터','G067',10),
  ('G069','영남센터','센터','G067',20),
  ('G070','소방사업부문','부문','G001',40),
  ('G071','소방사업본부','본부','G070',10),
  ('G072','마케팅팀','팀','G071',10),
  ('G073','SCM센터','센터','G071',20),
  ('G074','마케팅부문','부문','G001',50),
  ('G075','지원팀','팀','G074',10),
  ('G076','마케팅1본부','본부','G074',20),
  ('G077','마케팅2본부','본부','G074',30),
  ('G078','마케팅3본부','본부','G074',40),
  ('G079','시스템사업그룹','그룹','G074',50),
  ('G080','융합솔루션1본부','본부','G079',10),
  ('G081','융합솔루션2본부','본부','G079',20),
  ('G082','특화영업본부','본부','G079',30),
  ('G083','경영지원실','실','G001',60),
  ('G084','인사팀','팀','G083',10),
  ('G085','커뮤니케이션팀','팀','G083',20),
  ('G086','인사지원팀','팀','G083',30),
  ('G087','법무팀','팀','G083',40),
  ('G088','공시·IR파트','파트','G087',10),
  ('G089','법무·총무파트','파트','G087',20),
  ('G090','인재채용팀','팀','G083',50),
  ('G091','재무팀','팀','G083',60),
  ('G092','회계파트','파트','G091',10),
  ('G093','자금파트','파트','G091',20),
  ('G094','경영진단팀','팀','G083',70),
  ('G095','안전환경팀','팀','G083',80),
  ('G096','서울/경기파트','파트','G095',10),
  ('G097','충청/호남파트','파트','G095',20),
  ('G098','영남파트','파트','G095',30),
  ('G099','경영정보팀','팀','G083',90),
  ('G100','경영관리팀','팀','G083',100),
  ('G101','전략기획팀','팀','G083',110),
  ('G102','에스텍R&D연구센터','센터','G083',120),
  ('G103','방제연구소','연구소','G102',10),
  ('G104','소방연구소','연구소','G102',20),
  ('G105','시스템개발연구소','연구소','G102',30),
  ('G106','해외사업부','사업부','G083',130),
  ('G107','에스텍에이스','회사','G000',20),
  ('G108','경영지원팀','팀','G107',10),
  ('G109','미화지원팀','팀','G107',20),
  ('G110','자산관리사업1본부','본부','G107',30),
  ('G111','메트로지사','지사','G110',10),
  ('G112','중앙지사','지사','G110',20),
  ('G113','성빈센트지사','지사','G110',30),
  ('G114','자산관리사업2본부','본부','G107',40),
  ('G115','서울지사','지사','G114',10),
  ('G116','중부지사','지사','G114',20),
  ('G117','대구지사','지사','G114',30),
  ('G118','에스텍퍼스트','회사','G000',30),
  ('G119','경영지원팀','팀','G118',10),
  ('G120','중앙지사','지사','G118',20),
  ('G121','동부지사','지사','G118',30),
  ('G122','서부지사','지사','G118',40),
  ('G123','남부지사','지사','G118',50),
  ('O01','에스텍베스트','회사','G000',40),
  ('G124','경영지원팀','팀','O01',10),
  ('O02','동부지사','지사','O01',20),
  ('O06','서부지사','지사','O01',30),
  ('O07','남부지사','지사','O01',40),
  ('O08','중부지사','지사','O01',50),
  ('G125','에스텍세이프','회사','G000',50),
  ('G126','경영지원팀','팀','G125',10),
  ('G127','중앙지사','지사','G125',20),
  ('G128','서부지사','지사','G125',30),
  ('G129','동부지사','지사','G125',40),
  ('G130','북부지사','지사','G125',50),
  ('G131','남부지사','지사','G125',60),
  ('G132','HS지사','지사','G125',70),
  ('G133','에스텍플러스','회사','G000',60),
  ('G134','경영지원팀','팀','G133',10),
  ('G135','TS사업본부','본부','G133',20),
  ('G136','동부지사','지사','G135',10),
  ('G137','서부지사','지사','G135',20),
  ('G138','HS지사','지사','G135',30),
  ('G139','북부지사','지사','G135',40),
  ('G140','HR팀','팀','G133',30),
  ('G141','에스텍프라임','회사','G000',70),
  ('G142','경영지원팀','팀','G141',10),
  ('G143','중앙지사','지사','G141',20),
  ('G144','에스텍에코','회사','G000',80),
  ('G145','경영지원팀','팀','G144',10),
  ('G146','자원순환사업본부','본부','G144',20),
  ('G147','영업1팀','팀','G146',10),
  ('G148','영업2팀','팀','G146',20),
  ('G149','운영팀','팀','G146',30),
  ('G150','재활용사업본부','본부','G144',30),
  ('G151','영업팀','팀','G150',10),
  ('G152','생산팀','팀','G150',20),
  ('G153','어울림에프','회사','G000',90),
  ('G154','지원팀','팀','G153',10),
  ('G155','사회공헌사업본부','본부','G153',20)
on conflict (id) do nothing;

-- 세부 기능 정의(신규/갱신 견적, 업무표준화/매뉴얼) — 이미 정한 값은 건드리지 않음
update public.program_registry set features = '[{"key":"new","name":"신규 견적"},{"key":"renew","name":"갱신 견적"}]'::jsonb
 where code = 'stqs' and features = '[]'::jsonb;
update public.program_registry set features = '[{"key":"std","name":"업무표준화 제작"},{"key":"manual","name":"매뉴얼 제작"}]'::jsonb
 where code = 'stos' and features = '[]'::jsonb;

-- 3) 계산 도우미 ------------------------------------------------------------------------
create or replace function public._ou_chain(p_org text) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare cur text := p_org; out text[] := '{}'; n int := 0;
begin
  while cur is not null and cur <> '' and n < 30 loop
    if cur = any(out) then exit; end if;
    out := out || cur;
    select parent into cur from public.org_units where id = cur;
    if not found then exit; end if;
    n := n + 1;
  end loop;
  return out;
end $$;

create or replace function public._ou_under(p_org text, p_roots text[]) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(p_org, '') <> '' and public._ou_chain(p_org) && coalesce(p_roots, '{}')
$$;

create or replace function public._ou_path(p_org text) returns text
language sql stable security definer set search_path = public as $$
  select coalesce(string_agg(o.name, ' › ' order by c.i desc), '')
    from unnest(public._ou_chain(p_org)) with ordinality c(id, i)
    join public.org_units o on o.id = c.id
   where o.kind <> '그룹'
$$;

-- 이 조직에 열린 프로그램 (null = 모두)
create or replace function public._ou_apps(p_org text) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare c text; a text[];
begin
  foreach c in array public._ou_chain(p_org) loop
    select programs into a from public.org_units where id = c;
    if a is not null then return a; end if;
  end loop;
  return null;
end $$;

-- 이 조직에서 이 프로그램의 세부 기능 (null = 모두)
create or replace function public._ou_feats(p_org text, p_app text) returns text[]
language plpgsql stable security definer set search_path = public as $$
declare c text; f jsonb;
begin
  foreach c in array public._ou_chain(p_org) loop
    select features into f from public.org_units where id = c;
    if f is not null and f ? p_app then return array(select jsonb_array_elements_text(f->p_app)); end if;
  end loop;
  return null;
end $$;

create or replace function public._arr_and(a text[], b text[]) returns text[]
language sql immutable as $$
  select case when a is null then b when b is null then a else array(select unnest(a) intersect select unnest(b)) end
$$;

-- 지금 로그인한 사람의 조직 관리자 정보 (아니면 null)
create or replace function public._mgr() returns public.org_managers
language sql stable security definer set search_path = public as $$
  select m.* from public.org_managers m join public.profiles p on p.id = m.user_id
   where m.user_id = auth.uid() and p.status = 'active' and coalesce(array_length(m.orgs, 1), 0) > 0
$$;

-- 이 사람(대상)을 내가 p_perm 으로 다룰 수 있는지 — 제작자·관리자는 항상, 조직 관리자는 받은 권한 + 맡은 조직 안 + 일반 사용자만
create or replace function public._can(p_target uuid, p_perm text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare me public.profiles; t public.profiles; m public.org_managers;
begin
  select * into me from public.profiles where id = auth.uid();
  if not found or me.status <> 'active' then return false; end if;
  if me.role in ('owner','admin') then return true; end if;
  m := public._mgr(); if m.user_id is null then return false; end if;
  if coalesce((m.perms->>p_perm)::boolean, false) is not true then return false; end if;
  if p_target is null then return true; end if;
  select * into t from public.profiles where id = p_target;
  if not found or t.id = me.id or t.role <> 'user' then return false; end if;
  if exists (select 1 from public.org_managers x where x.user_id = t.id and coalesce(array_length(x.orgs,1),0) > 0) then return false; end if;
  return public._ou_under(t.org_id, m.orgs);
end $$;

-- 4) 가입 화면(로그인 전) ---------------------------------------------------------------
create or replace function public.public_org_list() returns json
language sql stable security definer set search_path = public as $$
  select coalesce(json_agg(json_build_object('id', id, 'name', name, 'kind', kind, 'parent', parent, 'code', join_code <> '') order by sort, name), '[]'::json)
    from public.org_units where active and join_open
$$;
create or replace function public.check_join_code(p_org text, p_code text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.org_units where id = p_org and active and join_open and (join_code = '' or join_code = coalesce(p_code, '')))
$$;

-- 가입하면 소속을 넣는 트리거 (기존 on_auth_user_created 다음에 실행)
create or replace function public.handle_new_user_org() returns trigger
language plpgsql security definer set search_path = public as $$
declare o text := new.raw_user_meta_data->>'org_id'; c text := coalesce(new.raw_user_meta_data->>'join_code', '');
begin
  if o is not null and public.check_join_code(o, c) then
    update public.profiles set org_id = o where id = new.id and org_id is null;
  end if;
  return new;
end $$;
drop trigger if exists on_auth_user_org on auth.users;
create trigger on_auth_user_org after insert on auth.users for each row execute function public.handle_new_user_org();

-- 5) 내 정보 · 소속 고르기 --------------------------------------------------------------
create or replace function public.my_org_info() returns json
language plpgsql stable security definer set search_path = public as $$
declare pr public.profiles; m public.org_managers; pend int := 0;
begin
  select * into pr from public.profiles where id = auth.uid();
  if not found then return json_build_object('ok', false); end if;
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
create or replace function public.set_my_org(p_org text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.org_units where id = p_org and active) then raise exception '회사·조직을 고르세요'; end if;
  update public.profiles set org_id = p_org where id = auth.uid() and org_id is null;
  if not found then raise exception '소속은 이미 정해져 있습니다. 바꾸려면 조직 관리자나 제작자에게 요청하세요'; end if;
  perform public._admin_log(auth.uid(), 'org_self', public._ou_path(p_org));
end $$;

-- 6) 프로그램 목록 · 권한 확인 (11개 프로그램 공통) -----------------------------------------
create or replace function public._app_state(pr public.profiles, r public.program_registry) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare adm boolean := pr.role in ('owner','admin'); a public.app_access; x jsonb; ox jsonb; feats text[]; orgapps text[];
  allf text[] := array(select jsonb_array_elements(r.features)->>'key');
  sysf text[] := coalesce(r.features_on, array(select jsonb_array_elements(r.features)->>'key'));
begin
  if not r.visible and pr.role <> 'owner' then return null; end if;              -- ① 시스템 비공개
  if r.beta and not adm then return null; end if;
  if pr.status <> 'active' then return jsonb_build_object('access', 'account'); end if;
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
    select r.code, r.name, r.full_name, r.url, r.icon, r.color, r.sort, r.beta, r.uses_access, r.version, r.min_version, r.note,
           s->>'access' as access, (s->>'app_expires_at')::date as app_expires_at,
           coalesce(array(select jsonb_array_elements_text(coalesce(s->'branches','[]'::jsonb))), '{}') as branches,
           s->'features' as features, coalesce((s->>'extra')::boolean, false) as extra, r.features as feature_defs
      from public.program_registry r, lateral (select public._app_state(pr, r) s) z
     where z.s is not null
  ) x;
  return json_build_object('ok', true, 'admin', pr.role in ('owner','admin'), 'programs', out);
end $$;

create or replace function public.app_check(p_app text) returns json
language plpgsql stable security definer set search_path = public as $$
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
  if s is null then return json_build_object('ok', false, 'reason', 'org_closed',
    'org', (select name from public.org_units where id = pr.org_id)); end if;
  if s->>'access' = 'use' then
    return json_build_object('ok', true, 'perm', 'use', 'admin', pr.role in ('owner','admin'), 'extra', coalesce((s->>'extra')::boolean, false),
      'expires_at', s->>'app_expires_at', 'branches', coalesce(s->'branches', '[]'::jsonb), 'features', s->'features');
  end if;
  if s->>'access' = 'expired' then return json_build_object('ok', false, 'reason', 'app_expired', 'expires_at', s->>'app_expires_at'); end if;
  if s->>'access' = 'account' then return json_build_object('ok', false, 'reason', 'account'); end if;
  return json_build_object('ok', false, 'reason', 'no_app_access');
end $$;

-- 7) 회사·조직 관리 ---------------------------------------------------------------------
create or replace function public.org_admin_list() returns json
language plpgsql stable security definer set search_path = public as $$
declare me public.profiles; m public.org_managers;
begin
  select * into me from public.profiles where id = auth.uid();
  m := public._mgr();
  if not (me.role in ('owner','admin') or m.user_id is not null) then raise exception '권한이 없습니다'; end if;
  return json_build_object(
    'orgs', (select coalesce(json_agg(json_build_object('id', o.id, 'name', o.name, 'kind', o.kind, 'parent', o.parent, 'sort', o.sort, 'active', o.active,
        'join_open', o.join_open, 'join_code', case when me.role in ('owner','admin') or public._ou_under(o.id, m.orgs) then o.join_code else '' end,
        'programs', o.programs, 'features', o.features, 'defaults', o.defaults,
        'members', (select count(*) from public.profiles p where p.org_id = o.id),
        'mine', me.role in ('owner','admin') or public._ou_under(o.id, m.orgs)) order by o.sort, o.name), '[]'::json) from public.org_units o),
    'managers', (select coalesce(json_agg(json_build_object('user_id', x.user_id, 'orgs', x.orgs, 'perms', x.perms, 'name', p.name, 'email', p.email)), '[]'::json)
        from public.org_managers x join public.profiles p on p.id = x.user_id where coalesce(array_length(x.orgs,1),0) > 0));
end $$;

-- 근태관리 조직표(shared_data 'base'.orgs)에도 같은 번호로 맞춤
create or replace function public._ou_sync_ams(p_id text) returns void
language plpgsql security definer set search_path = public as $$
declare o public.org_units; b jsonb; arr jsonb; item jsonb;
begin
  select * into o from public.org_units where id = p_id; if not found then return; end if;
  select v into b from public.shared_data where k = 'base'; if b is null then return; end if;
  item := jsonb_build_object('id', o.id, 'name', o.name, 'type', o.kind, 'parent', o.parent);
  arr := coalesce(b->'orgs', '[]'::jsonb);
  if exists (select 1 from jsonb_array_elements(arr) e where e->>'id' = o.id) then
    arr := (select jsonb_agg(case when e->>'id' = o.id then e || item else e end) from jsonb_array_elements(arr) e);
  else arr := arr || jsonb_build_array(item); end if;
  update public.shared_data set v = jsonb_set(b, '{orgs}', arr), updated_at = now(), updated_by = auth.uid() where k = 'base';
end $$;

create or replace function public.org_save(p jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare me public.profiles; m public.org_managers; own boolean; cur public.org_units; nid text := p->>'id'; par text := coalesce(p->>'parent', ''); par_kind text;
begin
  select * into me from public.profiles where id = auth.uid();
  own := me.role = 'owner'; m := public._mgr();
  if coalesce(trim(p->>'name'), '') = '' then raise exception '이름을 입력하세요'; end if;
  if par <> '' and not exists (select 1 from public.org_units where id = par) then raise exception '상위 조직이 없습니다'; end if;
  select kind into par_kind from public.org_units where id = par;
  if nid is not null and nid <> '' then select * into cur from public.org_units where id = nid; end if;
  -- 권한 확인
  if me.role not in ('owner','admin') then
    if m.user_id is null then raise exception '권한이 없습니다'; end if;
    if cur.id is not null then
      if not public._ou_under(cur.id, m.orgs) or cur.id = any(m.orgs) then raise exception '맡은 조직 아래의 조직만 고칠 수 있습니다'; end if;
    end if;
    if par = '' or par_kind = '그룹' then
      if not coalesce((m.perms->>'create_company')::boolean, false) then raise exception '새 회사를 만들 권한이 없습니다'; end if;
    else
      if not coalesce((m.perms->>'create_sub')::boolean, false) then raise exception '하위 조직을 만들 권한이 없습니다'; end if;
      if not public._ou_under(par, m.orgs) then raise exception '맡은 조직 아래에만 만들 수 있습니다'; end if;
    end if;
  end if;
  if cur.id is not null and cur.id = any(public._ou_chain(par)) then raise exception '자기 아래 조직으로는 옮길 수 없습니다'; end if;
  if cur.id is null then
    nid := 'G' || lpad((coalesce((select max(substr(id, 2)::int) from public.org_units where id ~ '^G[0-9]+$'), 0) + 1)::text, 3, '0');
    insert into public.org_units (id, name, kind, parent, sort, join_open, join_code, defaults, created_by)
    values (nid, trim(p->>'name'), coalesce(nullif(p->>'kind',''), '팀'), par, coalesce((p->>'sort')::int, 100),
            coalesce((p->>'join_open')::boolean, true), coalesce(p->>'join_code', ''), coalesce(p->'defaults', '{}'::jsonb), auth.uid());
    perform public._admin_log(null, 'org_new', public._ou_path(nid));
  else
    update public.org_units set name = trim(p->>'name'), kind = coalesce(nullif(p->>'kind',''), kind), parent = par,
      sort = coalesce((p->>'sort')::int, sort), active = coalesce((p->>'active')::boolean, active),
      join_open = coalesce((p->>'join_open')::boolean, join_open), join_code = coalesce(p->>'join_code', join_code),
      defaults = coalesce(p->'defaults', defaults), updated_at = now()
     where id = nid;
    perform public._admin_log(null, 'org_edit', public._ou_path(nid));
  end if;
  -- 프로그램 · 세부 기능 공개는 제작자만
  if own and p ? 'programs' then
    update public.org_units set programs = case when jsonb_typeof(p->'programs') = 'array' then array(select jsonb_array_elements_text(p->'programs')) end where id = nid;
  end if;
  if own and p ? 'features' then
    update public.org_units set features = case when jsonb_typeof(p->'features') = 'object' then p->'features' end where id = nid;
  end if;
  perform public._ou_sync_ams(nid);
  return nid;
end $$;

-- 파일(엑셀·CSV·PDF) 일괄 등록: p_apply=false 면 미리보기만
create or replace function public.org_import(p_rows jsonb, p_apply boolean) returns json
language plpgsql security definer set search_path = public as $$
declare r jsonb; out jsonb := '[]'::jsonb; par text; ex text; st text; msg text; nid text; i int := 0; made jsonb := '{}'::jsonb; me public.profiles; m public.org_managers;
begin
  select * into me from public.profiles where id = auth.uid(); m := public._mgr();
  if me.role not in ('owner','admin') and (m.user_id is null or not coalesce((m.perms->>'import')::boolean, false)) then raise exception '파일로 등록할 권한이 없습니다'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    i := i + 1; st := 'new'; msg := ''; par := '';
    if coalesce(trim(r->>'name'), '') = '' then st := 'error'; msg := '이름이 비어 있음'; end if;
    if st <> 'error' and coalesce(trim(r->>'parent'), '') <> '' then
      par := coalesce(made->>trim(r->>'parent'),
        (select id from public.org_units o where o.name = trim(r->>'parent') or public._ou_path(o.id) = trim(r->>'parent') order by length(public._ou_path(o.id)) limit 1));
      if par is null then st := 'error'; msg := '상위 조직 「' || trim(r->>'parent') || '」을 찾지 못함'; par := ''; end if;
    elsif st <> 'error' then par := 'G000';
    end if;
    if st <> 'error' then
      select id into ex from public.org_units where name = trim(r->>'name') and parent = par limit 1;
      if ex is not null then st := 'exists'; msg := '이미 있음 (덮어쓰지 않음)'; end if;
    end if;
    if st = 'new' and me.role not in ('owner','admin') then
      if par = 'G000' and not coalesce((m.perms->>'create_company')::boolean, false) then st := 'error'; msg := '새 회사를 만들 권한 없음';
      elsif par <> 'G000' and not public._ou_under(par, m.orgs) then st := 'error'; msg := '맡은 조직 밖'; end if;
    end if;
    if p_apply and st = 'new' then
      nid := public.org_save(jsonb_build_object('name', trim(r->>'name'), 'kind', coalesce(nullif(trim(r->>'kind'),''), '팀'), 'parent', par,
        'join_open', coalesce(nullif(r->>'join_open','')::boolean, true), 'join_code', coalesce(r->>'join_code', '')));
      made := made || jsonb_build_object(trim(r->>'name'), nid);
      if me.role = 'owner' and coalesce(r->>'manager_email', '') <> '' then
        perform public.mgr_add_org((select id from public.profiles where email = lower(trim(r->>'manager_email'))), nid);
      end if;
    elsif not p_apply and st = 'new' then
      made := made || jsonb_build_object(trim(r->>'name'), 'NEW' || i);
    end if;
    out := out || jsonb_build_array(jsonb_build_object('row', i, 'name', r->>'name', 'kind', r->>'kind', 'parent', r->>'parent', 'status', st, 'message', msg));
  end loop;
  if p_apply then perform public._admin_log(null, 'org_import', jsonb_array_length(p_rows)::text || '행'); end if;
  return out::json;
end $$;

-- 8) 조직 관리자 (제작자만) --------------------------------------------------------------
create or replace function public.mgr_save(p_user uuid, p_orgs text[], p_perms jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception '조직 관리자는 제작자만 지정합니다'; end if;
  if exists (select 1 from public.profiles where id = p_user and role <> 'user') then raise exception '일반 사용자만 조직 관리자로 지정합니다'; end if;
  if coalesce(array_length(p_orgs, 1), 0) = 0 then
    delete from public.org_managers where user_id = p_user;
    perform public._admin_log(p_user, 'manager_off', '');
  else
    insert into public.org_managers (user_id, orgs, perms, updated_at, updated_by) values (p_user, p_orgs, coalesce(p_perms, '{}'), now(), auth.uid())
    on conflict (user_id) do update set orgs = excluded.orgs, perms = excluded.perms, updated_at = now(), updated_by = auth.uid();
    perform public._admin_log(p_user, 'manager', (select string_agg(public._ou_path(x), ', ') from unnest(p_orgs) x));
  end if;
end $$;
create or replace function public.mgr_add_org(p_user uuid, p_org text) returns void
language plpgsql security definer set search_path = public as $$
declare d jsonb := '{"approve":true,"suspend":true,"expires":true,"max_days":365,"scope":true,"move":false,"apps":true,"device":false,"logs":true,"create_sub":false,"create_company":false,"import":false}';
begin
  if p_user is null or not public.is_owner() then return; end if;
  insert into public.org_managers (user_id, orgs, perms, updated_by) values (p_user, array[p_org], d, auth.uid())
  on conflict (user_id) do update set orgs = (select array(select distinct unnest(public.org_managers.orgs || p_org))), updated_at = now();
end $$;

-- 9) 사용자 (제작자·관리자는 전체, 조직 관리자는 맡은 조직) ----------------------------------------
create or replace function public.org_list_users() returns json
language plpgsql stable security definer set search_path = public as $$
declare me public.profiles; m public.org_managers;
begin
  select * into me from public.profiles where id = auth.uid(); m := public._mgr();
  if not (me.role in ('owner','admin') or m.user_id is not null) then raise exception '권한이 없습니다'; end if;
  return (select coalesce(json_agg(json_build_object('id', p.id, 'email', p.email, 'name', p.name, 'phone', p.phone, 'dept', p.dept, 'role', p.role, 'status', p.status,
      'expires_at', p.expires_at, 'must_change_pw', p.must_change_pw, 'memo', p.memo, 'created_at', p.created_at, 'approved_at', p.approved_at,
      'last_login_at', p.last_login_at, 'last_seen_at', p.last_seen_at,
      'device_count', (select count(*) from public.devices d where d.user_id = p.id),
      'fail_7d', (select count(*) from public.login_logs l where l.email = p.email and l.event = 'login_fail' and l.created_at > now() - interval '7 days'),
      'scope', case when p.role = 'owner' then '{"level":"all"}'::jsonb else coalesce(p.scope, '{}'::jsonb) end,
      'org_id', p.org_id, 'org_path', public._ou_path(p.org_id),
      'extra', case when me.role = 'owner' then p.extra else case when p.extra <> '{}'::jsonb then '{"has":true}'::jsonb else '{}'::jsonb end end,
      'manager', (select json_build_object('orgs', x.orgs, 'perms', x.perms) from public.org_managers x where x.user_id = p.id and coalesce(array_length(x.orgs,1),0) > 0))
      order by case p.status when 'pending' then 0 when 'active' then 1 else 2 end, p.created_at desc), '[]'::json)
    from public.profiles p
   where me.role in ('owner','admin') or (p.role = 'user' and p.id <> me.id and public._ou_under(p.org_id, m.orgs)
          and not exists (select 1 from public.org_managers x where x.user_id = p.id and coalesce(array_length(x.orgs,1),0) > 0)));
end $$;

create or replace function public.org_update_user(p_user uuid, p_action text, p_value text default null) returns void
language plpgsql security definer set search_path = public as $$
declare me public.profiles; t public.profiles; m public.org_managers; s public.app_settings; d date; maxd int; sc jsonb; lv text;
begin
  select * into me from public.profiles where id = auth.uid(); m := public._mgr();
  select * into t from public.profiles where id = p_user; if not found then raise exception '사용자를 찾을 수 없습니다'; end if;
  select * into s from public.app_settings where id = 1;
  -- 제작자만: 추가 권한, 조직 관리자의 모든 항목
  if p_action = 'extra' then
    if me.role <> 'owner' then raise exception '추가 권한은 제작자만 줄 수 있습니다'; end if;
    update public.profiles set extra = coalesce(nullif(p_value, ''), '{}')::jsonb where id = p_user;
    perform public._admin_log(p_user, 'extra', coalesce(p_value, '')); return;
  end if;
  if me.role in ('owner','admin') then
    if t.role = 'owner' and me.role <> 'owner' then raise exception '제작자 계정은 바꿀 수 없습니다'; end if;
    if me.role = 'admin' and exists (select 1 from public.org_managers x where x.user_id = t.id) then raise exception '조직 관리자는 제작자만 바꿀 수 있습니다'; end if;
  else
    if not public._can(p_user, case p_action when 'approve' then 'approve' when 'activate' then 'suspend' when 'suspend' then 'suspend'
        when 'expires' then 'expires' when 'scope' then 'scope' when 'org' then 'move' when 'memo' then 'approve' else '-' end) then
      raise exception '이 사람에 대한 권한이 없습니다'; end if;
    if p_action = 'scope' and coalesce((t.extra->>'scope_lock')::boolean, false) then raise exception '제작자가 정한 관리범위라 바꿀 수 없습니다'; end if;
  end if;
  if p_action = 'approve' then
    update public.profiles set status = 'active', approved_at = now(),
      expires_at = coalesce(expires_at, case when coalesce((select (defaults->>'days')::int from public.org_units where id = t.org_id), s.default_days) > 0
        then (now() at time zone 'Asia/Seoul')::date + coalesce((select (defaults->>'days')::int from public.org_units where id = t.org_id), s.default_days) end)
     where id = p_user;
  elsif p_action = 'suspend' then update public.profiles set status = 'suspended', force_logout_at = now() where id = p_user;
  elsif p_action = 'activate' then update public.profiles set status = 'active', approved_at = coalesce(approved_at, now()) where id = p_user;
  elsif p_action = 'expires' then
    d := nullif(p_value, '')::date;
    if me.role not in ('owner','admin') then
      maxd := coalesce((m.perms->>'max_days')::int, 365);
      if d is null or d > (now() at time zone 'Asia/Seoul')::date + maxd then raise exception '사용기한은 오늘부터 %일 안에서만 정할 수 있습니다', maxd; end if;
    end if;
    update public.profiles set expires_at = d where id = p_user;
  elsif p_action = 'scope' then
    sc := coalesce(nullif(p_value, ''), '{}')::jsonb; lv := coalesce(sc->>'level', '');
    if me.role not in ('owner','admin') then
      if lv = 'all' then raise exception '「전체」 관리범위는 제작자만 줄 수 있습니다'; end if;
      if lv = 'org' and not public._ou_under(sc->>'org', m.orgs) then raise exception '맡은 조직 안에서만 정할 수 있습니다'; end if;
      if lv = 'multi' and (coalesce(sc->>'rest','none') <> 'none' or exists (select 1 from jsonb_array_elements(coalesce(sc->'rules','[]'::jsonb)) x
          where x->>'t' = 'org' and not public._ou_under(x->>'id', m.orgs))) then raise exception '맡은 조직 안에서만 정할 수 있습니다'; end if;
    end if;
    update public.profiles set scope = sc, force_logout_at = case when t.status = 'active' then now() else force_logout_at end where id = p_user;
    if me.role = 'owner' then update public.profiles set extra = extra || jsonb_build_object('scope_lock', coalesce((sc->>'lock')::boolean, false)) where id = p_user; end if;
  elsif p_action = 'org' then
    if not exists (select 1 from public.org_units where id = p_value) then raise exception '회사·조직을 고르세요'; end if;
    if me.role not in ('owner','admin') and not public._ou_under(p_value, m.orgs) then raise exception '맡은 조직 안으로만 옮길 수 있습니다'; end if;
    update public.profiles set org_id = p_value where id = p_user;
    perform public._admin_log(p_user, 'org', public._ou_path(p_value)); return;
  elsif p_action = 'memo' then update public.profiles set memo = coalesce(p_value, '') where id = p_user;
  else raise exception '알 수 없는 작업: %', p_action;
  end if;
  perform public._admin_log(p_user, p_action, coalesce(p_value, ''));
end $$;

create or replace function public.org_set_app_access(p_user uuid, p_app text, p_perm text, p_expires date default null, p_branches text[] default '{}', p_features text[] default null) returns void
language plpgsql security definer set search_path = public as $$
declare me public.profiles; t public.profiles; oa text[];
begin
  select * into me from public.profiles where id = auth.uid(); select * into t from public.profiles where id = p_user;
  if me.role not in ('owner','admin') then
    if not public._can(p_user, 'apps') then raise exception '이 사람에 대한 권한이 없습니다'; end if;
    oa := public._ou_apps(t.org_id);
    if oa is not null and not (p_app = any(oa)) then raise exception '이 조직에 열리지 않은 프로그램입니다'; end if;
    p_features := public._arr_and(p_features, public._ou_feats(t.org_id, p_app));
  end if;
  insert into public.app_access (user_id, app, perm, expires_at, branches, features, updated_at, updated_by)
  values (p_user, p_app, p_perm, p_expires, coalesce(p_branches, '{}'), p_features, now(), auth.uid())
  on conflict (user_id, app) do update set perm = excluded.perm, expires_at = excluded.expires_at, branches = excluded.branches,
    features = excluded.features, updated_at = now(), updated_by = auth.uid();
  perform public._admin_log(p_user, 'app_access', p_app || ' → ' || case p_perm when 'use' then '사용' else '사용 안 함' end
    || case when p_features is not null then ' · 기능 ' || array_to_string(p_features, ',') else '' end);
end $$;

create or replace function public.org_list_app_access() returns json
language plpgsql stable security definer set search_path = public as $$
declare me public.profiles; m public.org_managers;
begin
  select * into me from public.profiles where id = auth.uid(); m := public._mgr();
  if not (me.role in ('owner','admin') or (m.user_id is not null and coalesce((m.perms->>'apps')::boolean, false))) then raise exception '권한이 없습니다'; end if;
  return (select coalesce(json_agg(json_build_object('id', p.id, 'email', p.email, 'name', p.name, 'dept', p.dept, 'role', p.role, 'status', p.status,
      'expires_at', p.expires_at, 'org_id', p.org_id, 'org_path', public._ou_path(p.org_id), 'org_apps', public._ou_apps(p.org_id),
      'extra_apps', case when me.role = 'owner' then coalesce(p.extra->'apps', '{}'::jsonb) else (select coalesce(jsonb_object_agg(k, true), '{}'::jsonb) from jsonb_object_keys(coalesce(p.extra->'apps','{}'::jsonb)) k) end,
      'apps', (select coalesce(jsonb_object_agg(a.app, jsonb_build_object('perm', a.perm, 'expires_at', a.expires_at, 'branches', a.branches, 'features', a.features)), '{}'::jsonb)
               from public.app_access a where a.user_id = p.id)) order by p.created_at desc), '[]'::json)
    from public.profiles p
   where me.role in ('owner','admin') or (p.role = 'user' and p.id <> me.id and public._ou_under(p.org_id, m.orgs)
          and not exists (select 1 from public.org_managers x where x.user_id = p.id and coalesce(array_length(x.orgs,1),0) > 0)));
end $$;

-- 기기 · 접속기록 (조직 관리자용)
create or replace function public.org_list_devices() returns json
language plpgsql stable security definer set search_path = public as $$
declare m public.org_managers := public._mgr();
begin
  if m.user_id is null or not coalesce((m.perms->>'device')::boolean, false) then raise exception '권한이 없습니다'; end if;
  return (select coalesce(json_agg(json_build_object('id', d.device_id, 'user_id', d.user_id, 'email', p.email, 'user_name', p.name, 'name', d.device_name, 'ua', d.ua,
     'blocked', d.blocked, 'first_seen', d.first_seen, 'last_seen', d.last_seen, 'last_ip', d.last_ip,
     'approved', (to_jsonb(d)->>'approved')::boolean, 'readonly', (to_jsonb(d)->>'readonly')::boolean) order by d.last_seen desc), '[]'::json)
    from public.devices d join public.profiles p on p.id = d.user_id where public._can(p.id, 'device'));
end $$;
create or replace function public.org_set_device(p_user uuid, p_device text, p_action text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public._can(p_user, 'device') then raise exception '권한이 없습니다'; end if;
  if p_action = 'block' then update public.devices set blocked = true where user_id = p_user and device_id = p_device;
  elsif p_action = 'unblock' then update public.devices set blocked = false where user_id = p_user and device_id = p_device;
  else perform public.admin_set_device(p_user, p_device, p_action); end if;
  perform public._admin_log(p_user, 'device_' || p_action, p_device);
end $$;
create or replace function public.org_list_logs() returns json
language plpgsql stable security definer set search_path = public as $$
declare m public.org_managers := public._mgr();
begin
  if m.user_id is null or not coalesce((m.perms->>'logs')::boolean, false) then raise exception '권한이 없습니다'; end if;
  return (select coalesce(json_agg(row_to_json(l) order by l.created_at desc), '[]'::json) from (
    select l.* from public.login_logs l join public.profiles p on p.id = l.user_id
     where public._can(p.id, 'logs') and l.created_at > now() - interval '90 days' order by l.created_at desc limit 500) l);
end $$;

-- 10) 프로그램 등록부: 저장은 제작자만 + 세부 기능 ----------------------------------------------
create or replace function public.admin_save_program(p jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then raise exception '프로그램 공개·세부 기능은 제작자만 정합니다'; end if;
  insert into public.program_registry (code, name, full_name, url, icon, color, sort, visible, beta, uses_access, version, min_version, note, features, features_on)
  values (p->>'code', p->>'name', coalesce(p->>'full_name',''), coalesce(p->>'url',''), coalesce(p->>'icon',''), coalesce(p->>'color','#0B1F8A'),
          coalesce((p->>'sort')::int, 100), coalesce((p->>'visible')::boolean, true), coalesce((p->>'beta')::boolean, false),
          coalesce((p->>'uses_access')::boolean, true), coalesce(p->>'version',''), coalesce(p->>'min_version',''), coalesce(p->>'note',''),
          coalesce(p->'features', '[]'::jsonb), case when jsonb_typeof(p->'features_on') = 'array' then array(select jsonb_array_elements_text(p->'features_on')) end)
  on conflict (code) do update set name = excluded.name, full_name = excluded.full_name, url = excluded.url, icon = excluded.icon, color = excluded.color,
    sort = excluded.sort, visible = excluded.visible, beta = excluded.beta, uses_access = excluded.uses_access, version = excluded.version,
    min_version = excluded.min_version, note = excluded.note,
    features = case when p ? 'features' then excluded.features else public.program_registry.features end,
    features_on = case when p ? 'features_on' then excluded.features_on else public.program_registry.features_on end;
  perform public._admin_log(null, 'program', (p->>'code') || ' · ' || (p->>'name'));
end $$;

-- 11) 기존 가입자 7명 연결 (소속이 비어 있는 사람만, 가입 때 적은 소속으로) ---------------------------
update public.profiles set org_id = 'G000' where role = 'owner' and org_id is null;
update public.profiles set org_id = case trim(dept)
    when '경영지원팀'             then (select id from public.org_units where name = '경영지원팀' and parent = 'O01')
    when '에스텍베스트 중부지사'   then 'O08'
    when '베스트 서부지사'         then 'O06'
    when '에스텍시스템'            then 'G001'
    when '에스텍시스템 서울지사'   then (select id from public.org_units where name = '방제사업본부' limit 1)
    when '마케팅2본부'            then (select id from public.org_units where name = '마케팅2본부' limit 1)
    when '마케팅 2본부'           then (select id from public.org_units where name = '마케팅2본부' limit 1)
  end
 where org_id is null and role <> 'owner';

-- 근태관리 조직표에 맞춤 (같은 번호 · 없으면 추가)
do $$ declare r record; begin for r in select id from public.org_units order by sort loop perform public._ou_sync_ams(r.id); end loop; end $$;

-- 권한 -------------------------------------------------------------------------------
revoke all on function public._ou_chain(text), public._ou_under(text, text[]), public._ou_path(text), public._ou_apps(text), public._ou_feats(text, text),
  public._mgr(), public._can(uuid, text), public._app_state(public.profiles, public.program_registry), public._ou_sync_ams(text), public.mgr_add_org(uuid, text) from public, anon, authenticated;
grant execute on function public.public_org_list(), public.check_join_code(text, text) to anon, authenticated;
grant execute on function public.my_org_info(), public.set_my_org(text), public.my_programs(), public.app_check(text),
  public.org_admin_list(), public.org_save(jsonb), public.org_import(jsonb, boolean), public.mgr_save(uuid, text[], jsonb),
  public.org_list_users(), public.org_update_user(uuid, text, text), public.org_set_app_access(uuid, text, text, date, text[], text[]),
  public.org_list_app_access(), public.org_list_devices(), public.org_set_device(uuid, text, text), public.org_list_logs(),
  public.admin_save_program(jsonb) to authenticated;
