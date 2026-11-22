-- v1.9.7 「함께 쓰는 사이트」 3개를 메인 화면 프로그램 카드로 등록 (프로그램 등록부)
-- 로그인 없이 쓰는 공개 사이트라 「승인된 계정 모두」(uses_access = false), 바로 공개(beta = false)
-- Supabase → SQL Editor에서 한 번 실행 (여러 번 실행해도 같은 결과)   Designed & Developed by Rat Rae Choi
insert into public.program_registry (code, name, full_name, url, icon, color, sort, visible, beta, uses_access, version, min_version, note, features, features_on) values
  ('ppopgi', '오늘의 뽑기판', '', 'https://sadness500-boop.github.io/ppopgi/', 'https://sadness500-boop.github.io/ppopgi/icons/icon-192.png', '#E0452B', 120, true, false, false, '', '', '모임용 뽑기·사다리·미니게임', '[]'::jsonb, null),
  ('matgil', '팔도 제철맛길', '', 'https://sadness500-boop.github.io/jecheolmatgil/', 'https://sadness500-boop.github.io/jecheolmatgil/icons/icon-192.png', '#17552F', 130, true, false, false, '', '', '달마다 제철 음식과 지역 맛집 지도', '[]'::jsonb, null),
  ('festa', '팔도 축제길', '', 'https://sadness500-boop.github.io/Festival/', 'https://sadness500-boop.github.io/Festival/icons/icon-192.png', '#1F4E79', 140, true, false, false, '', '', '전국 지역·계절·월별 축제 지도', '[]'::jsonb, null)
on conflict (code) do update set name = excluded.name, full_name = excluded.full_name, url = excluded.url, icon = excluded.icon, color = excluded.color,
  sort = excluded.sort, visible = excluded.visible, beta = excluded.beta, uses_access = excluded.uses_access, note = excluded.note;

select code, name, sort, visible, beta, uses_access from public.program_registry order by sort;
