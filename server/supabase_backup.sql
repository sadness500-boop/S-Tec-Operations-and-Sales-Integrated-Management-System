-- =====================================================================
--  S-Tec Operations and Sales Integrated Management System
--  전체 백업 함수 — 관리 콘솔 「💾 전체 백업(엑셀)」이 부릅니다.
--  Designed & Developed by Rat Rae Choi
--
--  ● 제작자(owner)만 부를 수 있습니다. 읽기만 하고 아무것도 바꾸지 않습니다.
--  ● 비밀번호는 백업에 들어가지 않습니다(서버에 암호화된 값만 있고, 내보내지 않음).
--  ● 여러 번 실행해도 안전합니다.
-- =====================================================================
create or replace function public.admin_backup_export() returns json
language plpgsql volatile security definer set search_path = public as $$
declare out jsonb := '{}'::jsonb; t text; rows jsonb;
begin
  if not public.is_owner() then raise exception '전체 백업은 제작자만 할 수 있습니다'; end if;
  foreach t in array array['app_settings','program_registry','profiles','app_access','devices','shared_data','user_data','login_logs','admin_logs'] loop
    if to_regclass('public.' || t) is null then continue; end if;
    if t = 'user_data' then
      select coalesce(jsonb_agg(jsonb_build_object('user_id', d.user_id, 'email', p.email, 'name', p.name, 'k', d.k, 'v', d.v,
                                                   'updated_at', d.updated_at, 'device_id', d.device_id) order by d.k, p.email), '[]')
        into rows from public.user_data d left join public.profiles p on p.id = d.user_id;
    elsif t = 'login_logs' or t = 'admin_logs' then
      execute format('select coalesce(jsonb_agg(to_jsonb(x) order by x.id desc), ''[]'') from public.%I x', t) into rows;
    else
      execute format('select coalesce(jsonb_agg(to_jsonb(x)), ''[]'') from public.%I x', t) into rows;
    end if;
    out := out || jsonb_build_object(t, rows);
  end loop;
  perform public._admin_log(null, 'backup', '전체 백업 내려받기');
  return json_build_object('generated_at', now(), 'project', 'mnsuebexlzhvomxhrear', 'by', (select email from public.profiles where id = auth.uid()), 'tables', out);
end $$;
revoke all on function public.admin_backup_export() from public, anon;
grant execute on function public.admin_backup_export() to authenticated;
