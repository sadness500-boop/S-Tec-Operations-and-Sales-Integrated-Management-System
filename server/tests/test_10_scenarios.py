"""6단계 — 계획서 14쪽 10가지 시험을 실제 서버와 같은 스키마(로컬 Postgres)에서 실행."""
import json, sys, datetime, psycopg2

db = psycopg2.connect(host='localhost', dbname='stec', user='postgres', password='pg')
db.autocommit = True
cur = db.cursor()
RESULTS = []

def q(sql, args=(), uid=None, one=True):
    """uid 가 있으면 그 사용자로 로그인한 상태(authenticated)로 실행."""
    c = db.cursor()
    try:
        c.execute('begin')
        if uid:
            c.execute("select set_config('request.jwt.claim.sub', %s, true)", (uid,))
            c.execute('set local role authenticated')
        c.execute(sql, args)
        r = c.fetchone() if c.description else None
        c.execute('commit')
        return r[0] if (r and one) else r
    except Exception as e:
        c.execute('rollback')
        raise

def err(sql, args=(), uid=None):
    try:
        q(sql, args, uid); return None
    except Exception as e:
        return str(e).split('\n')[0]

def checkin(uid, dev, event='check', login_at=None):
    r = q("select public.client_checkin(%s,%s,%s,%s,%s)", (dev, dev + ' 이름', 'UA', event, login_at), uid)
    return r if isinstance(r, dict) else json.loads(r)

def user(email, name):
    q("insert into auth.users(email, raw_user_meta_data, encrypted_password) values (%s, %s, extensions.crypt('Pass1234!', extensions.gen_salt('bf')))",
      (email, json.dumps({'name': name})))
    return str(q("select id from auth.users where email=%s", (email,)))

def rec(no, title, expect, ok, detail):
    RESULTS.append({'no': no, 'title': title, 'expect': expect, 'ok': bool(ok), 'detail': detail})
    print(('PASS' if ok else 'FAIL'), no, title, '|', detail)

# ---------- 준비: 제작자 · 시험 계정 ----------
q("update public.app_settings set require_approval = true, default_days = 0, device_approval=false, max_devices=0 where id=1")
OWN = user('owner@stec.test', '제작자')
A = user('t.east@stec.test', '시험-동부')       # 동부지사 담당
B = user('t.west@stec.test', '시험-서부')
now = datetime.datetime.now(datetime.timezone.utc)

# 1) 승인 전 계정 로그인 → 승인 대기 안내
r = checkin(A, 'pc-a', 'login', now)
rec(1, '승인 전 계정 로그인', '승인 대기 안내', r['reason'] == 'pending' and not r['ok'], f"결과 reason={r['reason']}")
q("select public.admin_update_user(%s,'approve',null)", (A,), OWN)
q("select public.admin_update_user(%s,'approve',null)", (B,), OWN)

# 2) 권한 없는 메뉴 → 보이지 않음(사용 불가)
q("select public.admin_set_app_access(%s,'stcr','use',null,'{동부}')", (A,), OWN)
mp = q("select public.my_programs()", (), A); mp = mp if isinstance(mp, dict) else json.loads(mp)
acc = {p['code']: p['access'] for p in mp['programs']}
chk = q("select public.app_check('stqs')", (), A)
ok2 = acc.get('stcr') == 'use' and acc.get('stqs') == 'none' and chk['reason'] == 'no_app_access'
rec(2, '권한 없는 메뉴', '보이지 않음', ok2, f"stcr={acc.get('stcr')}, stqs={acc.get('stqs')}, 견적 직접 열기={chk['reason']}")

# 3) 다른 지사 데이터 조회 → 보이지 않음
q("insert into public.shared_data(k,v) values ('base', %s), ('site:S1', %s), ('site:S2', %s) on conflict (k) do update set v=excluded.v",
  (json.dumps({'orgs': [{'id': 'O-E', 'name': '동부지사'}, {'id': 'O-W', 'name': '서부지사'}]}),
   json.dumps({'site': {'id': 'S1', 'name': '동부 사업장', 'org': 'O-E'}}),
   json.dumps({'site': {'id': 'S2', 'name': '서부 사업장', 'org': 'O-W'}})))
q("select public.admin_update_user(%s,'scope',%s)", (A, json.dumps({'level': 'org', 'org': 'O-E', 'label': '동부지사'})), OWN)
import time; time.sleep(0.05); login_a = datetime.datetime.now(datetime.timezone.utc)   # 범위가 바뀌면 다시 로그인
pull = json.dumps(q("select public.shared_pull()", (), A), ensure_ascii=False)
stcr = q("select public.app_check('stcr')", (), A)
ok3 = 'site:S1' in pull and 'site:S2' not in pull and stcr['branches'] == ['동부']
rec(3, '다른 지사 데이터 조회', '보이지 않음', ok3,
    f"근태: 동부 사업장 {'보임' if 'site:S1' in pull else '안 보임'} · 서부 사업장 {'보임' if 'site:S2' in pull else '안 보임'} / Complaint 담당 지사={stcr['branches']}")

# 4) 사용기한 만료 → 즉시 만료 안내 (계정 기한 · 프로그램 기한)
pass
r_ok = checkin(A, 'pc-a', 'login', login_a)
yday = (datetime.date.today() - datetime.timedelta(days=1)).isoformat()
q("select public.admin_update_user(%s,'expires',%s)", (B, yday), OWN)
r = checkin(B, 'pc-b', 'check', now)
q("select public.admin_set_app_access(%s,'stse','use',%s,'{}')", (A, yday), OWN)
ap = q("select public.app_check('stse')", (), A)
rec(4, '사용기한 만료', '즉시 만료 안내', r['reason'] == 'expired' and ap['reason'] == 'app_expired',
    f"계정 기한 지남 → {r['reason']} / 프로그램 기한 지남 → {ap['reason']}")
q("select public.admin_update_user(%s,'expires','')", (B,), OWN)

# 5) 임시비번 첫 로그인 → 비밀번호 변경 화면
q("select public.admin_set_temp_password(%s,'Temp-2026!')", (B,), OWN)
pw_ok = q("select encrypted_password = extensions.crypt('Temp-2026!', encrypted_password) from auth.users where id=%s", (B,))
old = checkin(B, 'pc-b', 'check', now)
new_login = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=1)
r = checkin(B, 'pc-b', 'login', new_login)
must = r['profile']['must_change_pw']
q("select public.mark_pw_changed()", (), B)
after = checkin(B, 'pc-b', 'check', new_login)['profile']['must_change_pw']
rec(5, '임시비번 첫 로그인', '비밀번호 변경 화면', pw_ok and old['reason'] == 'forced' and must and not after,
    f"임시비번 적용={pw_ok}, 기존 접속={old['reason']}, 새 로그인 must_change_pw={must}, 변경 후={after}")

# 6) 사용 중 강제 로그아웃 → 로그인 화면으로
before = checkin(A, 'pc-a', 'check', login_a)['reason']
time.sleep(0.05); q("select public.admin_update_user(%s,'force_logout',null)", (A,), OWN)
r = checkin(A, 'pc-a', 'check', login_a)
logged = q("select count(*) from public.login_logs where user_id=%s and event='forced'", (A,))
rec(6, '사용 중 강제 로그아웃', '로그인 화면으로', before == 'ok' and r['reason'] == 'forced' and logged >= 1,
    f"강제 전={before} → 강제 후={r['reason']}, 기록 {logged}건")
login_a = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=1)
checkin(A, 'pc-a', 'login', login_a)

# 7) 미등록 기기 로그인 → 기기 승인 요청
default_new = checkin(A, 'tablet-a', 'login', login_a)['reason']          # 정책 끔 = 지금과 같음
q("select public.admin_save_device_policy(true, 3)", (), OWN)
r = checkin(A, 'phone-a', 'login', login_a)
lst = q("select json_agg(x) from public.admin_list_devices(%s) x", (A,), OWN)
pend = [d for d in lst if d['id'] == 'phone-a'][0]['approved'] is False
q("select public.admin_set_device(%s,'phone-a','approve')", (A,), OWN)
r2 = checkin(A, 'phone-a', 'login', login_a)
rec(7, '미등록 기기 로그인', '기기 승인 요청', default_new == 'ok' and r['reason'] == 'device_pending' and pend and r2['ok'],
    f"정책 끔: 새 기기={default_new} / 정책 켬: 새 휴대폰={r['reason']} → 관리자 승인 후={r2['reason']}")

# 8) 휴대폰 조회만 권한 → 저장 버튼 비활성 (서버도 저장 거부)
q("select public.admin_set_device(%s,'phone-a','readonly')", (A,), OWN)
md = q("select public.my_device('phone-a')", (), A)
ck = checkin(A, 'phone-a', 'check', login_a)
e1 = err("select public.sync_push('ams_note', '{\"a\":1}', 'phone-a')", (), A)
e2 = err("select public.shared_put('site:S1', %s, null, 'phone-a')", (json.dumps({'site': {'id': 'S1', 'org': 'O-E'}}),), A)
pc = err("select public.sync_push('ams_note', '{\"a\":1}', 'pc-a')", (), A)
ok8 = md['readonly'] and ck['device']['readonly'] and ck['ok'] and e1 and '조회 전용' in e1 and e2 and '조회 전용' in e2 and pc is None
rec(8, '휴대폰 조회만 권한', '저장 버튼 비활성', ok8,
    f"휴대폰: 열기={ck['reason']}·조회 전용={md['readonly']}·저장 거부={'예' if e1 else '아니오'} / 같은 계정 PC 저장={'정상' if pc is None else pc}")

# 9) 메뉴 이동 → 재로그인 없음 · 기록 저장
for app in ('ams', 'stcr'):
    q("select public.log_app_open(%s,'pc-a','pc-a 이름')", (app,), A)
r = checkin(A, 'pc-a', 'check', login_a)
opens = q("select string_agg(detail, ',' order by id) from public.login_logs where user_id=%s and event='app_open'", (A,))
rec(9, '메뉴 이동', '재로그인 없음 · 기록 저장', r['ok'] and opens == 'ams,stcr',
    f"이동 후 로그인 상태={r['reason']}(같은 로그인 증표 사용), 접속 기록=「프로그램 열기」 {opens}")

# 10) 복사된 APK(만료 계정) → 사용 불가
q("select public.admin_update_user(%s,'expires',%s)", (B, yday), OWN)
r = checkin(B, 'copied-apk-' + 'x1', 'login', datetime.datetime.now(datetime.timezone.utc))
mp = q("select public.my_programs()", (), B)
rec(10, '복사된 APK(만료 계정)', '사용 불가', r['reason'] == 'expired' and not r['ok'],
    f"다른 휴대폰에 복사한 앱으로 로그인 → {r['reason']} (서버가 판단하므로 앱 파일을 복사해도 쓸 수 없음)")

json.dump(RESULTS, open('/home/claude/p6/results.json', 'w'), ensure_ascii=False, indent=1)
print('\n합계', sum(r['ok'] for r in RESULTS), '/', len(RESULTS))
