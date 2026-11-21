-- =====================================================================
--  S-Tec Operations and Sales Integrated Management System
--  제작자 전용 문서 보관함 (owner-docs) — 서버 SQL v1.9.2
--  Designed & Developed by Rat Rae Choi
--
--  ● 무엇을 하나요?
--    「제작자 관리매뉴얼」(메인 + 11개 프로그램의 Word · PPT · PDF 와 프로그램 안 보기 내용)을
--    공개 웹 주소가 아닌 비공개 보관함(Supabase Storage 'owner-docs')에 둡니다.
--    서버가 로그인한 계정이 「사용 중인 제작자(owner)」인지 확인한 뒤에만 보여 주고 내려받게 합니다.
--    제작자가 아니면 주소를 알아도 열 수 없습니다(보기 · 내려받기 · 목록 · 올리기 모두 거부).
--  ● 여러 번 실행해도 안전합니다.
-- =====================================================================

create or replace function public._is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner' and status = 'active');
$$;
revoke all on function public._is_owner() from public;
grant execute on function public._is_owner() to authenticated;

insert into storage.buckets (id, name, public)
values ('owner-docs', 'owner-docs', false)
on conflict (id) do update set public = false;

drop policy if exists "owner_docs_select" on storage.objects;
drop policy if exists "owner_docs_insert" on storage.objects;
drop policy if exists "owner_docs_update" on storage.objects;
drop policy if exists "owner_docs_delete" on storage.objects;
create policy "owner_docs_select" on storage.objects for select to authenticated
  using (bucket_id = 'owner-docs' and public._is_owner());
create policy "owner_docs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'owner-docs' and public._is_owner());
create policy "owner_docs_update" on storage.objects for update to authenticated
  using (bucket_id = 'owner-docs' and public._is_owner()) with check (bucket_id = 'owner-docs' and public._is_owner());
create policy "owner_docs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'owner-docs' and public._is_owner());
