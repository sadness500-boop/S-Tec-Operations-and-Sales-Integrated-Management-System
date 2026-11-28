/* =====================================================================
   데모 모드(?demo=1) — 실제 서버 없이 예시 자료로 화면을 보여 주는 가짜 서버
   주소 끝에 ?demo=1 을 붙이면 제작자 화면, ?demo=1&as=user 를 붙이면 일반 사용자 화면을 봅니다.
   여기서 바꾼 내용은 저장되지 않습니다(새로고침하면 처음으로).
   Designed & Developed by Rat Rae Choi
   ===================================================================== */
(function(){
'use strict';
const AS = (location.search.match(/[?&]as=(\w+)/) || [])[1] || 'owner';
const today = new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
const ago = (m) => new Date(Date.now() - m*60000).toISOString();
const plusDays = (d) => { const t = new Date(today+'T00:00:00Z'); t.setUTCDate(t.getUTCDate()+d); return t.toISOString().slice(0,10); };
const U = [
  {id:'u0', email:'owner@stec.example', name:'최민영', phone:'010-0000-0000', dept:'에스텍베스트 동부지사', role:'owner', status:'active', expires_at:null, must_change_pw:false, memo:'', created_at:ago(90000), approved_at:ago(90000), last_login_at:ago(3), last_seen_at:ago(1), device_count:3, fail_7d:0, scope:{level:'all'}, org_id:'G000'},
  {id:'u1', email:'kim.east@stec.example', name:'김동부', phone:'010-1111-2222', dept:'동부지사 지사장', role:'admin', status:'active', expires_at:'2027-12-31', must_change_pw:false, memo:'', created_at:ago(60000), approved_at:ago(60000), last_login_at:ago(70), last_seen_at:ago(40), device_count:2, fail_7d:0, scope:{level:'org', org:'O02', label:'에스텍베스트 › 동부지사'}, org_id:'O02'},
  {id:'u2', email:'lee.site@stec.example', name:'이현장', phone:'010-3333-4444', dept:'동부지사 관리직원', role:'user', status:'active', expires_at:'2027-06-30', must_change_pw:false, memo:'12개 사업장 담당', created_at:ago(40000), approved_at:ago(40000), last_login_at:ago(150), last_seen_at:ago(120), device_count:2, fail_7d:1, scope:{level:'site', sites:['s1','s2'], label:'동부지사 12개 사업장'}, org_id:'O02'},
  {id:'u3', email:'park.sales@stec.example', name:'박영업', phone:'010-5555-6666', dept:'영업팀', role:'user', status:'active', expires_at:plusDays(20), must_change_pw:false, memo:'', created_at:ago(30000), approved_at:ago(30000), last_login_at:ago(1500), last_seen_at:ago(1400), device_count:1, fail_7d:0, scope:{}, org_id:'G077', extra:{apps:{stlr:{perm:'use'}}}},
  {id:'u4', email:'jung.west@stec.example', name:'정서부', phone:'010-7777-8888', dept:'서부지사 관리직원', role:'user', status:'pending', expires_at:null, must_change_pw:false, memo:'', created_at:ago(200), approved_at:null, last_login_at:null, last_seen_at:null, device_count:0, fail_7d:0, scope:{}, org_id:'O06'},
  {id:'u5', email:'han.old@stec.example', name:'한퇴사', phone:'', dept:'남부지사', role:'user', status:'suspended', expires_at:'2026-10-31', must_change_pw:false, memo:'10월 퇴사', created_at:ago(100000), approved_at:ago(100000), last_login_at:ago(30000), last_seen_at:ago(30000), device_count:1, fail_7d:3, scope:{}, org_id:'O07'},
  {id:'u6', email:'jung.mgr@stec.example', name:'정관리', phone:'010-9999-0000', dept:'경영지원팀', role:'user', status:'active', expires_at:null, must_change_pw:false, memo:'에스텍베스트 조직 관리자', created_at:ago(50000), approved_at:ago(50000), last_login_at:ago(30), last_seen_at:ago(20), device_count:1, fail_7d:0, scope:{level:'org', org:'O01', label:'에스텍베스트'}, org_id:'G124'},
  {id:'u7', email:'new.sys@stec.example', name:'신시스템', phone:'', dept:'에스텍시스템', role:'user', status:'active', expires_at:null, must_change_pw:false, memo:'소속 없음 예시', created_at:ago(900), approved_at:ago(800), last_login_at:ago(500), last_seen_at:ago(500), device_count:0, fail_7d:0, scope:{}, org_id:null}
];
const ACC = {
  u2:{stso:{perm:'use', expires_at:null, branches:['동부']}, stcr:{perm:'use', expires_at:null, branches:['동부']}, stos:{perm:'use', expires_at:null, branches:[]}},
  u3:{stqs:{perm:'use', expires_at:null, branches:[]}, wbe:{perm:'use', expires_at:null, branches:[]}, stse:{perm:'use', expires_at:'2026-10-31', branches:[]}, stso:{perm:'use', expires_at:null, branches:[]}},
  u5:{stcr:{perm:'use', expires_at:'2026-10-31', branches:['남부']}}
};
const PROGS = [
  {code:'ams', name:'근태관리', full_name:'Attendance Management Software', url:'https://sadness500-boop.github.io/Attendance-Management-Software/', icon:'assets/apps/ams.png', color:'#1B7A34', sort:20, visible:true, beta:false, uses_access:false, version:'2.20.0', min_version:'', note:'근무조 코드 기반 월 근태 자동 생성'},
  {code:'stsh', name:'안전보건 관리 시스템', full_name:'S-Tec Safety & Health Management System', url:'https://sadness500-boop.github.io/S-Tec-Safety-and-Health-Management-System/', icon:'assets/apps/stsh.png', color:'#C2410C', sort:25, visible:true, beta:false, uses_access:true, version:'1.0.0', min_version:'', note:'중대재해처벌법 대응 · 위험성평가 · TBM · 안전점검 · 아차사고'},
  {code:'stso', name:'사업장 현황 지도', full_name:'S-Tec-Business-Site-Overview', url:'https://sadness500-boop.github.io/S-Tec-Business-Site-Overview/', icon:'assets/apps/stso.png', color:'#0E7C86', sort:10, visible:true, beta:false, uses_access:true, version:'', min_version:'', note:'사업장 위치·현황 지도'},
  {code:'stqs', features:[{key:'new',name:'신규 견적'},{key:'renew',name:'갱신 견적'}], features_on:null, name:'용역인력 견적', full_name:'S-Tec-Quotation-System', url:'https://sadness500-boop.github.io/S-Tec-Quotation-System/', icon:'assets/apps/stqs.png', color:'#0B1F8A', sort:50, visible:true, beta:false, uses_access:true, version:'7.9', min_version:'', note:'업종별 용역인력·부대비용 견적'},
  {code:'wbe', name:'업무량 기반 산정', full_name:'Workload-Based Cost and Labor Estimation Method', url:'https://sadness500-boop.github.io/Workload-Based-Cost-and-Labor-Estimation-Method/', icon:'assets/apps/wbe.png', color:'#E8750A', sort:60, visible:true, beta:false, uses_access:true, version:'1.26', min_version:'', note:'업무량 기준 인력·비용 산정'},
  {code:'stse', name:'단기인력 견적', full_name:'S-Tec short estimate', url:'https://sadness500-boop.github.io/S-Ttec-short-estimate/', icon:'assets/apps/stse.png', color:'#7A2E8E', sort:70, visible:true, beta:false, uses_access:true, version:'1.5.0', min_version:'', note:'단기·행사 인력 견적'},
  {code:'stcr', name:'고객 불만처리', full_name:'S-Tec-Complaint-Response-System', url:'https://sadness500-boop.github.io/S-Tec-Complaint-Response-System/', icon:'assets/apps/stcr.png', color:'#C0392B', sort:30, visible:true, beta:false, uses_access:true, version:'1.5.4', min_version:'', note:'Complaint 대응방안 Word·PPT·PDF'},
  {code:'stos', features:[{key:'std',name:'업무표준화 제작'},{key:'manual',name:'매뉴얼 제작'}], features_on:null, name:'업무표준화·매뉴얼', full_name:'Program for Process Standardization and Manual Creation', url:'https://sadness500-boop.github.io/Program-for-Process-Standardization-and-Manual-Creation/', icon:'assets/apps/stos.png', color:'#2F6FD0', sort:90, visible:true, beta:false, uses_access:true, version:'1.3.2', min_version:'', note:'업무표준·업무매뉴얼 제작'},
  {code:'stlr', name:'법률 대응 시스템', full_name:'Legal Response System', url:'https://sadness500-boop.github.io/S-Tec-Legal-Response-System/', icon:'assets/apps/stlr.png', color:'#1F3A73', sort:40, visible:true, beta:false, uses_access:true, version:'1.0.0', min_version:'', note:'부당 클레임·근무자 사안 법률 검토 Word·PPT·PDF'},
  {code:'stpp', name:'제안서 제작시스템', full_name:'S-Tec Proposal Production System', url:'https://sadness500-boop.github.io/S-Tec-Proposal-Production-System/', icon:'assets/apps/stpp.png', color:'#0E5C4A', sort:80, visible:true, beta:false, uses_access:true, version:'1.0.0', min_version:'', note:'견적 3종 연동 · 업종·산업별 제안서 Word·PPT·PDF'},
  {code:'stpm', name:'성과 관리 시스템', full_name:'S-Tec Performance Management System', url:'https://sadness500-boop.github.io/S-Tec-Performance-Management-System/', icon:'assets/apps/stpm.png', color:'#17552F', sort:100, visible:true, beta:false, uses_access:true, version:'1.0.0', min_version:'', note:'업종·산업별 성과 계수화 · 운영실태·품질점검'},
  {code:'rdx', name:'데이터 추출 프로그램', full_name:'S-Tec Remote Data Extraction Program', url:'https://sadness500-boop.github.io/Remote-data-extraction-program/', icon:'assets/apps/rdx.png', color:'#1D4ED8', sort:105, visible:true, beta:false, uses_access:true, version:'2.1.0', min_version:'', note:'PC·외장하드 자료 전체 분석·통합 검색 · 고객사 요청자료 순번별 정리 · 연도 부족 알림'},
  {code:'stac', name:'통합 출입관리 시스템', full_name:'S-Tec Integrated Access Control System', url:'https://sadness500-boop.github.io/S-Tec-Integrated-Access-Control-System/', icon:'assets/apps/stac.png', color:'#0C2350', sort:110, visible:true, beta:false, uses_access:true, version:'1.0.0', min_version:'', note:'방문자 · 방문차량 출입 등록 · 통합 검색 · 누적 DATA'}
];
const DEV = [
  {id:'d-1', user_id:'u0', email:'owner@stec.example', user_name:'최민영', name:'동부지사 PC', ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131', blocked:false, first_seen:ago(90000), last_seen:ago(1), last_ip:'211.234.10.21', approved:true, readonly:false},
  {id:'d-2', user_id:'u0', email:'owner@stec.example', user_name:'최민영', name:'휴대폰', ua:'Mozilla/5.0 (Linux; Android 15; SM-S921N) Mobile', blocked:false, first_seen:ago(80000), last_seen:ago(300), last_ip:'223.38.1.5', approved:true, readonly:false},
  {id:'d-3', user_id:'u1', email:'kim.east@stec.example', user_name:'김동부', name:'PC-동부-02', ua:'Mozilla/5.0 (Windows NT 10.0) Edge/131', blocked:false, first_seen:ago(60000), last_seen:ago(40), last_ip:'211.234.10.22', approved:true, readonly:false},
  {id:'d-4', user_id:'u2', email:'lee.site@stec.example', user_name:'이현장', name:'Galaxy S24', ua:'Mozilla/5.0 (Linux; Android 14; SM-S921N) Mobile', blocked:false, first_seen:ago(40000), last_seen:ago(120), last_ip:'223.38.7.80', approved:true, readonly:true},
  {id:'d-5', user_id:'u2', email:'lee.site@stec.example', user_name:'이현장', name:'분실 휴대폰', ua:'Mozilla/5.0 (Linux; Android 13) Mobile', blocked:true, first_seen:ago(39000), last_seen:ago(9000), last_ip:'223.38.7.11', approved:true, readonly:false},
  {id:'d-6', user_id:'u3', email:'park.sales@stec.example', user_name:'박영업', name:'iPhone 15', ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1) Safari', blocked:false, first_seen:ago(30000), last_seen:ago(1400), last_ip:'118.235.2.9', approved:false, readonly:false}
];
let LID = 100;
const LOGS = [
  ['owner@stec.example','u0','login','동부지사 PC','211.234.10.21','',3],
  ['kim.east@stec.example','u1','login','PC-동부-02','211.234.10.22','',70],
  ['lee.site@stec.example','u2','login','Galaxy S24','223.38.7.80','',150],
  ['lee.site@stec.example','u2','login_fail','Galaxy S24','223.38.7.80','',160],
  ['unknown@test.com',null,'login_fail','Chrome/Windows','175.200.1.3','',200],
  ['lee.site@stec.example','u2','blocked','분실 휴대폰','223.38.7.11','device_blocked',260],
  ['park.sales@stec.example','u3','login','iPhone 15','118.235.2.9','',1500],
  ['park.sales@stec.example','u3','logout','iPhone 15','118.235.2.9','',1560],
  ['han.old@stec.example','u5','forced','PC','211.1.1.1','관리자 강제 로그아웃',30000]
].map(r => ({id:LID++, email:r[0], user_id:r[1], event:r[2], device:r[3], device_id:'', ip:r[4], detail:r[5], created_at:ago(r[6])}));
const ALOGS = [
  {id:1, admin_email:'owner@stec.example', target_email:'kim.east@stec.example', action:'role', detail:'admin', created_at:ago(50000)},
  {id:2, admin_email:'owner@stec.example', target_email:'lee.site@stec.example', action:'app_access', detail:'stcr → 사용 · 지사 동부', created_at:ago(4000)},
  {id:3, admin_email:'owner@stec.example', target_email:'lee.site@stec.example', action:'device_block', detail:'d-5', created_at:ago(9000)},
  {id:4, admin_email:'owner@stec.example', target_email:'han.old@stec.example', action:'suspend', detail:'', created_at:ago(30000)}
];
const SET = {id:1, owner_email:'owner@stec.example', signup_open:true, require_approval:true, global_lock:false, lock_message:'현재 프로그램 점검 중입니다. 잠시 후 이용해 주세요.', default_days:365, updated_at:ago(20000)};
const me = () => AS === 'mgr' ? U.find(u => u.id === 'u6') : AS === 'nonorg' ? U.find(u => u.id === 'u7') : AS === 'sales' ? U.find(u => u.id === 'u3') : U.find(u => u.role === (AS === 'user' ? 'user' : 'owner') && u.status === 'active' && (AS !== 'user' || u.id === 'u2'));
let session = null;
const ok = data => Promise.resolve({data, error:null});
const fail = msg => Promise.resolve({data:null, error:{message:msg}});
const log = (u, action, detail) => ALOGS.unshift({id:ALOGS.length+1, admin_email:me().email, target_email:u ? u.email : '', action, detail:detail || '', created_at:new Date().toISOString()});
const access = (u, code) => {
  const p = PROGS.find(x => x.code === code);
  if(u.role !== 'user' || !p.uses_access) return {access:'use'};
  const a = (ACC[u.id] || {})[code];
  if(!a || a.perm !== 'use') return {access:'none'};
  if(a.expires_at && a.expires_at < today) return {access:'expired', app_expires_at:a.expires_at};
  return {access:'use', app_expires_at:a.expires_at, branches:a.branches};
};
const RPC = {
  public_settings: () => ok({signup_open:SET.signup_open, require_approval:SET.require_approval, global_lock:SET.global_lock, lock_message:SET.lock_message}),
  client_checkin: () => { const u = me(); return ok({ok:true, reason:'ok', lock_message:SET.lock_message, device:{approved:true, readonly:false}, profile:{id:u.id, email:u.email, name:u.name, phone:u.phone, dept:u.dept, role:u.role, status:u.status, expires_at:u.expires_at, must_change_pw:false, scope:u.scope}}); },
  my_programs: () => { const u = me(); return ok({ok:true, admin:u.role !== 'user', programs:PROGS.filter(p => p.visible && (!p.beta || u.role !== 'user')).sort((a,b) => a.sort-b.sort).map(p => Object.assign({}, p, access(u, p.code)))}); },
  app_check: a => { const r = access(me(), a.p_app); return ok(r.access === 'use' ? {ok:true, perm:'use', expires_at:r.app_expires_at, branches:r.branches||[]} : {ok:false, reason:r.access === 'expired' ? 'app_expired' : 'no_app_access', expires_at:r.app_expires_at}); },
  log_logout: () => ok(null), log_login_fail: () => ok(null), mark_pw_changed: () => ok(null),
  update_my_profile: a => { const u = me(); Object.assign(u, {name:a.p_name, phone:a.p_phone, dept:a.p_dept}); return ok(null); },
  admin_list_users: () => ok(U.map(u => Object.assign({}, u))),
  admin_update_user: a => { const u = U.find(x => x.id === a.p_user); if(!u) return fail('사용자를 찾을 수 없습니다');
    if(u.role === 'owner') return fail('제작자(owner) 계정은 변경할 수 없습니다');
    const v = a.p_value;
    if(a.p_action === 'approve'){ u.status = 'active'; u.approved_at = new Date().toISOString(); if(!u.expires_at && SET.default_days) u.expires_at = plusDays(SET.default_days); }
    else if(a.p_action === 'suspend') u.status = 'suspended';
    else if(a.p_action === 'activate') u.status = 'active';
    else if(a.p_action === 'expires') u.expires_at = v || null;
    else if(a.p_action === 'role') u.role = v;
    else if(a.p_action === 'memo') u.memo = v || '';
    else if(a.p_action === 'delete'){ U.splice(U.indexOf(u), 1); }
    log(u, a.p_action, v); return ok(null); },
  admin_set_temp_password: a => { const u = U.find(x => x.id === a.p_user); u.must_change_pw = true; log(u, 'temp_password', ''); return ok(null); },
  admin_list_app_access: () => ok(U.map(u => ({id:u.id, email:u.email, name:u.name, dept:u.dept, role:u.role, status:u.status, expires_at:u.expires_at, apps:JSON.parse(JSON.stringify(ACC[u.id] || {}))}))),
  admin_set_app_access: a => { ACC[a.p_user] = ACC[a.p_user] || {}; ACC[a.p_user][a.p_app] = {perm:a.p_perm, expires_at:a.p_expires, branches:a.p_branches || []};
    log(U.find(x => x.id === a.p_user), 'app_access', `${a.p_app} → ${a.p_perm === 'use' ? '사용' : '사용 안 함'}`); return ok(null); },
  admin_list_devices: a => ok(DEV.filter(d => !a.p_user || d.user_id === a.p_user).map(d => Object.assign({}, d))),
  admin_set_device_block: a => { const d = DEV.find(x => x.user_id === a.p_user && x.id === a.p_device); d.blocked = a.p_blocked; log(U.find(x => x.id === a.p_user), a.p_blocked ? 'device_block' : 'device_unblock', d.name); return ok(null); },
  admin_list_logs: a => ok(LOGS.filter(l => !a.p_user || l.user_id === a.p_user)),
  admin_list_admin_logs: () => ok(ALOGS.slice()),
  admin_get_settings: () => ok(Object.assign({}, SET)),
  admin_get_device_policy: () => ok({device_approval:!!SET.device_approval, max_devices:SET.max_devices||0}),
  admin_save_device_policy: a => { SET.device_approval = a.p_approval; SET.max_devices = a.p_max; return ok(null); },
  admin_set_device: a => { const d = DEV.find(x => x.user_id === a.p_user && x.id === a.p_device); if(a.p_action==='approve') d.approved = true; if(a.p_action==='readonly') d.readonly = true; if(a.p_action==='edit') d.readonly = false; log(U.find(x => x.id === a.p_user), 'device_' + a.p_action, d.name); return ok(null); },
  log_app_open: () => ok(null),
  admin_backup_export: () => ok({generated_at:new Date().toISOString(), project:'demo', by:'owner@stec.example', tables:{app_settings:[SET], program_registry:PROGS, profiles:U, app_access:[], devices:DEV,
    shared_data:[{k:'base', v:{orgs:[{id:'O01',name:'에스텍베스트',type:'회사',parent:''},{id:'O02',name:'동부지사',type:'지사',parent:'O01'}], codes:[{id:'SEC-W5-01',name:'보안 주5일제',job:'SEC',seq:'AAAAADD'}], holidays:[{d:'2026-12-25',n:'성탄절'}]}, updated_at:new Date().toISOString()},
      {k:'site:S1', v:{site:{id:'S1',name:'데모 사업장',br:'동부',org:'O02',info:{type:'공장',work:'보안',shift:'격일',to:2}}, emps:[{id:'E1',name:'홍길동',br:'동부',post:'보안요원',hist:[{code:'SEC-W5-01',from:'2026-01'}]}]}, updated_at:new Date().toISOString()}],
    user_data:[{user_id:'u0', email:'owner@stec.example', name:'최민영', k:'ams_v1_ui', v:{theme:'light'}, updated_at:new Date().toISOString(), device_id:'d-1'}], login_logs:LOGS, admin_logs:ALOGS}}),
  my_device: () => ok({approved:true, blocked:false, readonly:false}),
  admin_save_settings: a => { Object.assign(SET, {signup_open:a.p_signup_open, require_approval:a.p_require_approval, global_lock:a.p_global_lock, lock_message:a.p_lock_message || SET.lock_message, default_days:a.p_default_days, updated_at:new Date().toISOString()}); log(null, 'settings', ''); return ok(null); },
  admin_list_programs: () => ok(PROGS.slice().sort((a,b) => a.sort-b.sort).map(p => Object.assign({}, p))),
  admin_save_program: a => { const p = a.p, i = PROGS.findIndex(x => x.code === p.code); if(i >= 0) PROGS[i] = Object.assign({}, PROGS[i], p); else PROGS.push(p); log(null, 'program', p.code + ' · ' + p.name); return ok(null); },
  admin_delete_program: a => { const i = PROGS.findIndex(x => x.code === a.p_code); if(i >= 0) PROGS.splice(i, 1); log(null, 'program_delete', a.p_code); return ok(null); }
};

/* ---------- v1.9.0 회사·조직별 가입자 관리 (서버 SQL supabase_org_delegation.sql 과 같은 규칙) ---------- */
const OU = [["G000","에스텍 그룹","그룹","",0],["G001","에스텍시스템","회사","G000",10],["G002","시큐리티사업부문","부문","G001",10],["G003","지원팀","팀","G002",10],["G004","서울본부","본부","G002",20],["G005","서초지사","지사","G004",10],["G006","강동지사","지사","G004",20],["G007","롯데지사","지사","G004",30],["G008","동대문지사","지사","G004",40],["G009","경인본부","본부","G002",30],["G010","중앙지사","지사","G009",10],["G011","강서지사","지사","G009",20],["G012","인천지사","지사","G009",30],["G013","메디칼본부","본부","G002",40],["G014","동부의료지사","지사","G013",10],["G015","서부의료지사","지사","G013",20],["G016","남부의료지사","지사","G013",30],["G017","중앙의료지사","지사","G013",40],["G018","성빈센트지사","지사","G013",50],["G019","경원본부","본부","G002",50],["G020","동경기지사","지사","G019",10],["G021","용인지사","지사","G019",20],["G022","서경기지사","지사","G019",30],["G023","남경기지사","지사","G019",40],["G024","부경본부","본부","G002",60],["G025","부산지사","지사","G024",10],["G026","사천지사","지사","G024",20],["G027","창원지사","지사","G024",30],["G028","거제지사","지사","G024",40],["G029","경울본부","본부","G002",70],["G030","구미지사","지사","G029",10],["G031","경북지사","지사","G029",20],["G032","대구지사","지사","G029",30],["G033","울산지사","지사","G029",40],["G034","서부본부","본부","G002",80],["G035","천안지사","지사","G034",10],["G036","충청지사","지사","G034",20],["G037","탕정지사","지사","G034",30],["G038","호남지사","지사","G034",40],["G039","HS본부","본부","G002",90],["G040","도곡지사","지사","G039",10],["G041","메트로지사","지사","G039",20],["G042","센트럴지사","지사","G039",30],["G043","경기지사","지사","G039",40],["G044","서부지사","지사","G039",50],["G045","인프라사업부문","부문","G001",20],["G046","지원팀","팀","G045",10],["G047","자산관리1본부","본부","G045",20],["G048","KT&G지사","지사","G047",10],["G049","멀티지사","지사","G047",20],["G050","자산관리2본부","본부","G045",30],["G051","메디칼지사","지사","G050",10],["G052","방제사업본부","본부","G045",40],["G053","수도권센터","센터","G052",10],["G054","경기남부센터","센터","G052",20],["G055","경남센터","센터","G052",30],["G056","경북센터","센터","G052",40],["G057","서부센터","센터","G052",50],["G058","환경사업부문","부문","G001",30],["G059","PM사업부","사업부","G058",10],["G060","PM운영사업본부","본부","G059",10],["G061","자산운영팀","팀","G060",10],["G062","PM지원팀","팀","G060",20],["G063","PFM마케팅사업본부","본부","G059",20],["G064","LM팀","팀","G063",10],["G065","투자자문팀","팀","G063",20],["G066","RS사업부","사업부","G058",20],["G067","RS사업팀","팀","G066",10],["G068","중앙센터","센터","G067",10],["G069","영남센터","센터","G067",20],["G070","소방사업부문","부문","G001",40],["G071","소방사업본부","본부","G070",10],["G072","마케팅팀","팀","G071",10],["G073","SCM센터","센터","G071",20],["G074","마케팅부문","부문","G001",50],["G075","지원팀","팀","G074",10],["G076","마케팅1본부","본부","G074",20],["G077","마케팅2본부","본부","G074",30],["G078","마케팅3본부","본부","G074",40],["G079","시스템사업그룹","그룹","G074",50],["G080","융합솔루션1본부","본부","G079",10],["G081","융합솔루션2본부","본부","G079",20],["G082","특화영업본부","본부","G079",30],["G083","경영지원실","실","G001",60],["G084","인사팀","팀","G083",10],["G085","커뮤니케이션팀","팀","G083",20],["G086","인사지원팀","팀","G083",30],["G087","법무팀","팀","G083",40],["G088","공시·IR파트","파트","G087",10],["G089","법무·총무파트","파트","G087",20],["G090","인재채용팀","팀","G083",50],["G091","재무팀","팀","G083",60],["G092","회계파트","파트","G091",10],["G093","자금파트","파트","G091",20],["G094","경영진단팀","팀","G083",70],["G095","안전환경팀","팀","G083",80],["G096","서울/경기파트","파트","G095",10],["G097","충청/호남파트","파트","G095",20],["G098","영남파트","파트","G095",30],["G099","경영정보팀","팀","G083",90],["G100","경영관리팀","팀","G083",100],["G101","전략기획팀","팀","G083",110],["G102","에스텍R&D연구센터","센터","G083",120],["G103","방제연구소","연구소","G102",10],["G104","소방연구소","연구소","G102",20],["G105","시스템개발연구소","연구소","G102",30],["G106","해외사업부","사업부","G083",130],["G107","에스텍에이스","회사","G000",20],["G108","경영지원팀","팀","G107",10],["G109","미화지원팀","팀","G107",20],["G110","자산관리사업1본부","본부","G107",30],["G111","메트로지사","지사","G110",10],["G112","중앙지사","지사","G110",20],["G113","성빈센트지사","지사","G110",30],["G114","자산관리사업2본부","본부","G107",40],["G115","서울지사","지사","G114",10],["G116","중부지사","지사","G114",20],["G117","대구지사","지사","G114",30],["G118","에스텍퍼스트","회사","G000",30],["G119","경영지원팀","팀","G118",10],["G120","중앙지사","지사","G118",20],["G121","동부지사","지사","G118",30],["G122","서부지사","지사","G118",40],["G123","남부지사","지사","G118",50],["O01","에스텍베스트","회사","G000",40],["G124","경영지원팀","팀","O01",10],["O02","동부지사","지사","O01",20],["O06","서부지사","지사","O01",30],["O07","남부지사","지사","O01",40],["O08","중부지사","지사","O01",50],["G125","에스텍세이프","회사","G000",50],["G126","경영지원팀","팀","G125",10],["G127","중앙지사","지사","G125",20],["G128","서부지사","지사","G125",30],["G129","동부지사","지사","G125",40],["G130","북부지사","지사","G125",50],["G131","남부지사","지사","G125",60],["G132","HS지사","지사","G125",70],["G133","에스텍플러스","회사","G000",60],["G134","경영지원팀","팀","G133",10],["G135","TS사업본부","본부","G133",20],["G136","동부지사","지사","G135",10],["G137","서부지사","지사","G135",20],["G138","HS지사","지사","G135",30],["G139","북부지사","지사","G135",40],["G140","HR팀","팀","G133",30],["G141","에스텍프라임","회사","G000",70],["G142","경영지원팀","팀","G141",10],["G143","중앙지사","지사","G141",20],["G144","에스텍에코","회사","G000",80],["G145","경영지원팀","팀","G144",10],["G146","자원순환사업본부","본부","G144",20],["G147","영업1팀","팀","G146",10],["G148","영업2팀","팀","G146",20],["G149","운영팀","팀","G146",30],["G150","재활용사업본부","본부","G144",30],["G151","영업팀","팀","G150",10],["G152","생산팀","팀","G150",20],["G153","어울림에프","회사","G000",90],["G154","지원팀","팀","G153",10],["G155","사회공헌사업본부","본부","G153",20]].map(a => ({id:a[0], name:a[1], kind:a[2], parent:a[3], sort:a[4], active:true, join_open:true, join_code:'', programs:null, features:null, defaults:{}}));
OU.find(o => o.id === 'G074').programs = ['stqs','wbe','stse','stpp','stpm','stso'];          // 예시: 마케팅부문
OU.find(o => o.id === 'G074').features = {stqs:['new']};
const MGRS = {u6:{orgs:['O01'], perms:{approve:true, suspend:true, expires:true, max_days:365, scope:true, move:true, apps:true, device:true, logs:true, create_sub:true, create_company:false, import:true}}};
const ouBy = id => OU.find(o => o.id === id);
const chain = id => { const out = []; let c = ouBy(id), n = 0; while(c && n++ < 30){ out.push(c.id); c = ouBy(c.parent); } return out; };
const under = (id, roots) => !!id && chain(id).some(x => (roots || []).includes(x));
const opath = id => chain(id).reverse().map(x => ouBy(x)).filter(o => o.kind !== '그룹').map(o => o.name).join(' › ');
const oApps = id => { for(const x of chain(id)){ const o = ouBy(x); if(o.programs) return o.programs; } return null; };
const oFeats = (id, app) => { for(const x of chain(id)){ const o = ouBy(x); if(o.features && o.features[app]) return o.features[app]; } return null; };
const andA = (a, b) => a == null ? b : b == null ? a : a.filter(x => b.includes(x));
const mgrOf = u => u && MGRS[u.id] && MGRS[u.id].orgs.length && u.status === 'active' ? MGRS[u.id] : null;
const can = (t, perm) => { const m = me(); if(m.role !== 'user') return true; const g = mgrOf(m); if(!g || !g.perms[perm]) return false; if(!t) return true;
  return t.id !== m.id && t.role === 'user' && !mgrOf(t) && under(t.org_id, g.orgs); };
const appState = (u, p) => {
  const allf = (p.features || []).map(f => f.key), sysf = p.features_on || allf, adm = u.role !== 'user';
  if(!p.visible && u.role !== 'owner') return null; if(p.beta && !adm) return null;
  if(u.status !== 'active') return {access:'account'};
  if(adm) return {access:'use', features: u.role === 'owner' ? allf : sysf};
  const ox = ((u.extra || {}).apps || {})[p.code];
  if(ox && (!ox.expires_at || ox.expires_at >= today)) return {access:'use', extra:true, app_expires_at:ox.expires_at || null, features:andA(sysf, ox.features || null), branches:[]};
  const oa = oApps(u.org_id); if(oa && !oa.includes(p.code)) return null;
  const feats = andA(sysf, oFeats(u.org_id, p.code));
  if(!p.uses_access) return {access:'use', features:feats};
  const a = (ACC[u.id] || {})[p.code];
  if(!a || a.perm !== 'use') return {access:'none'};
  if(a.expires_at && a.expires_at < today) return {access:'expired', app_expires_at:a.expires_at};
  return {access:'use', app_expires_at:a.expires_at, branches:a.branches || [], features:andA(feats, a.features || null)};
};
const listFor = m => U.filter(p => m.role !== 'user' || (p.role === 'user' && p.id !== m.id && !mgrOf(p) && under(p.org_id, (mgrOf(m) || {}).orgs)));
Object.assign(RPC, {
  my_programs: () => { const u = me(); return ok({ok:true, admin:u.role !== 'user', programs:PROGS.slice().sort((a,b) => a.sort-b.sort).map(p => { const s = appState(u, p); return s ? Object.assign({}, p, {feature_defs:p.features || []}, s, {features:s.features || []}) : null; }).filter(Boolean)}); },
  app_check: a => { const u = me(), p = PROGS.find(x => x.code === a.p_app); const s = p && appState(u, p);
    if(!s) return ok({ok:false, reason:'org_closed', org:(ouBy(u.org_id)||{}).name});
    return ok(s.access === 'use' ? {ok:true, perm:'use', admin:u.role !== 'user', extra:!!s.extra, expires_at:s.app_expires_at, branches:s.branches || [], features:s.features || []} : {ok:false, reason:s.access === 'expired' ? 'app_expired' : 'no_app_access', expires_at:s.app_expires_at}); },
  public_org_list: () => ok(OU.filter(o => o.active && o.join_open).map(o => ({id:o.id, name:o.name, kind:o.kind, parent:o.parent, code:!!o.join_code}))),
  check_join_code: a => { const o = ouBy(a.p_org); return ok(!!o && (!o.join_code || o.join_code === a.p_code)); },
  my_org_info: () => { const u = me(), g = mgrOf(u);
    const pend = u.role !== 'user' ? U.filter(x => x.status === 'pending').length : g && g.perms.approve ? U.filter(x => x.status === 'pending' && under(x.org_id, g.orgs)).length : 0;
    return ok({ok:true, org_id:u.org_id || null, org_path:opath(u.org_id), need_org:!u.org_id && u.role !== 'owner', extra:u.extra || {},
      manager: g ? {orgs:g.orgs, perms:g.perms, labels:g.orgs.map(opath)} : null, pending:pend}); },
  set_my_org: a => { const u = me(); if(u.org_id) return fail('소속은 이미 정해져 있습니다'); u.org_id = a.p_org; u.org_path = opath(a.p_org); return ok(null); },
  org_admin_list: () => { const m = me(), g = mgrOf(m); if(m.role === 'user' && !g) return fail('권한이 없습니다');
    return ok({orgs:OU.map(o => Object.assign({}, o, {members:U.filter(u => u.org_id === o.id).length, mine:m.role !== 'user' || under(o.id, g.orgs)})).sort((a,b) => a.sort-b.sort),
      managers:Object.keys(MGRS).filter(k => MGRS[k].orgs.length).map(k => { const u = U.find(x => x.id === k); return {user_id:k, orgs:MGRS[k].orgs, perms:MGRS[k].perms, name:u.name, email:u.email}; })}); },
  org_save: a => { const p = a.p, m = me(), g = mgrOf(m), own = m.role === 'owner'; let o = p.id ? ouBy(p.id) : null; const par = ouBy(p.parent);
    if(!p.name) return fail('이름을 입력하세요');
    if(m.role === 'user'){ if(!g) return fail('권한이 없습니다');
      if(o && (!under(o.id, g.orgs) || g.orgs.includes(o.id))) return fail('맡은 조직 아래의 조직만 고칠 수 있습니다');
      if(!par || par.kind === '그룹'){ if(!g.perms.create_company) return fail('새 회사를 만들 권한이 없습니다'); }
      else { if(!g.perms.create_sub) return fail('하위 조직을 만들 권한이 없습니다'); if(!under(par.id, g.orgs)) return fail('맡은 조직 아래에만 만들 수 있습니다'); } }
    if(!o){ const n = Math.max(...OU.filter(x => /^G\d+$/.test(x.id)).map(x => +x.id.slice(1))) + 1; o = {id:'G' + String(n).padStart(3, '0'), programs:null, features:null, active:true}; OU.push(o); log(null, 'org_new', p.name); }
    else log(null, 'org_edit', p.name);
    Object.assign(o, {name:p.name, kind:p.kind || o.kind || '팀', parent:p.parent || '', sort:p.sort || 100, join_open:p.join_open !== false, join_code:p.join_code || '', active:p.active !== false, defaults:p.defaults || {}});
    if(own && 'programs' in p) o.programs = p.programs; if(own && 'features' in p) o.features = p.features;
    return ok(o.id); },
  org_import: a => { const m = me(), g = mgrOf(m); if(m.role === 'user' && !(g && g.perms.import)) return fail('파일로 등록할 권한이 없습니다');
    const made = {}, out = [];
    a.p_rows.forEach((r, i) => { let st = 'new', msg = '', par = '';
      const nm = (r.name || '').trim(), pn = (r.parent || '').trim();
      if(!nm){ st = 'error'; msg = '이름이 비어 있음'; }
      if(st !== 'error'){ if(pn){ par = made[pn] || (OU.find(o => o.name === pn || opath(o.id) === pn) || {}).id; if(!par){ st = 'error'; msg = `상위 조직 「${pn}」을 찾지 못함`; } } else par = 'G000'; }
      if(st !== 'error' && OU.some(o => o.name === nm && o.parent === par)){ st = 'exists'; msg = '이미 있음 (덮어쓰지 않음)'; }
      if(st === 'new' && m.role === 'user'){ if(par === 'G000' && !g.perms.create_company){ st = 'error'; msg = '새 회사를 만들 권한 없음'; } else if(par !== 'G000' && !String(par).startsWith('NEW') && !under(par, g.orgs)){ st = 'error'; msg = '맡은 조직 밖'; } }
      if(st === 'new'){ if(a.p_apply){ const id = RPC.org_save({p:{name:nm, kind:r.kind || '팀', parent:par, join_open:r.join_open !== 'false', join_code:r.join_code || ''}}); made[nm] = OU[OU.length - 1].id; } else made[nm] = 'NEW' + i; }
      out.push({row:i + 1, name:r.name, kind:r.kind, parent:r.parent, status:st, message:msg}); });
    return ok(out); },
  mgr_save: a => { if(me().role !== 'owner') return fail('조직 관리자는 제작자만 지정합니다'); const t = U.find(x => x.id === a.p_user);
    if(!a.p_orgs || !a.p_orgs.length){ delete MGRS[a.p_user]; log(t, 'manager_off', ''); } else { MGRS[a.p_user] = {orgs:a.p_orgs, perms:a.p_perms}; log(t, 'manager', a.p_orgs.map(opath).join(', ')); } return ok(null); },
  org_list_users: () => { const m = me(); if(m.role === 'user' && !mgrOf(m)) return fail('권한이 없습니다');
    return ok(listFor(m).map(u => Object.assign({}, u, {org_path:opath(u.org_id), scope:u.role === 'owner' ? {level:'all'} : u.scope,
      extra: m.role === 'owner' ? (u.extra || {}) : (u.extra && Object.keys(u.extra).length ? {has:true} : {}), manager: mgrOf(u) ? {orgs:MGRS[u.id].orgs, perms:MGRS[u.id].perms} : null}))); },
  org_update_user: a => { const m = me(), t = U.find(x => x.id === a.p_user), v = a.p_value; if(!t) return fail('사용자를 찾을 수 없습니다');
    if(a.p_action === 'extra'){ if(m.role !== 'owner') return fail('추가 권한은 제작자만 줄 수 있습니다'); t.extra = JSON.parse(v || '{}'); log(t, 'extra', v); return ok(null); }
    if(m.role !== 'user'){ if(t.role === 'owner' && m.role !== 'owner') return fail('제작자 계정은 바꿀 수 없습니다'); }
    else { const perm = {approve:'approve', activate:'suspend', suspend:'suspend', expires:'expires', scope:'scope', org:'move', memo:'approve'}[a.p_action];
      if(!can(t, perm)) return fail('이 사람에 대한 권한이 없습니다'); if(a.p_action === 'scope' && t.extra && t.extra.scope_lock) return fail('제작자가 정한 관리범위라 바꿀 수 없습니다'); }
    const g = mgrOf(m);
    if(a.p_action === 'approve'){ t.status = 'active'; const dd = (ouBy(t.org_id) || {}).defaults || {}; const days = dd.days != null ? dd.days : SET.default_days; if(!t.expires_at && days) t.expires_at = plusDays(days); }
    else if(a.p_action === 'suspend') t.status = 'suspended';
    else if(a.p_action === 'activate') t.status = 'active';
    else if(a.p_action === 'expires'){ if(m.role === 'user' && (!v || v > plusDays(g.perms.max_days || 365))) return fail(`사용기한은 오늘부터 ${g.perms.max_days || 365}일 안에서만 정할 수 있습니다`); t.expires_at = v || null; }
    else if(a.p_action === 'scope'){ const sc = JSON.parse(v || '{}');
      if(m.role === 'user'){ if(sc.level === 'all') return fail('「전체」 관리범위는 제작자만 줄 수 있습니다'); if(sc.level === 'org' && !under(sc.org, g.orgs)) return fail('맡은 조직 안에서만 정할 수 있습니다'); }
      t.scope = sc; if(m.role === 'owner'){ t.extra = Object.assign({}, t.extra, {scope_lock:!!sc.lock}); } }
    else if(a.p_action === 'org'){ if(m.role === 'user' && !under(v, g.orgs)) return fail('맡은 조직 안으로만 옮길 수 있습니다'); t.org_id = v; }
    else if(a.p_action === 'memo') t.memo = v || '';
    log(t, a.p_action, v); return ok(null); },
  org_list_app_access: () => { const m = me(); if(m.role === 'user' && !(mgrOf(m) && mgrOf(m).perms.apps)) return fail('권한이 없습니다');
    return ok(listFor(m).map(u => ({id:u.id, email:u.email, name:u.name, dept:u.dept, role:u.role, status:u.status, expires_at:u.expires_at, org_id:u.org_id, org_path:opath(u.org_id), org_apps:oApps(u.org_id),
      extra_apps: m.role === 'owner' ? ((u.extra || {}).apps || {}) : Object.fromEntries(Object.keys((u.extra || {}).apps || {}).map(k => [k, true])), apps:JSON.parse(JSON.stringify(ACC[u.id] || {}))}))); },
  org_set_app_access: a => { const m = me(), t = U.find(x => x.id === a.p_user); let f = a.p_features;
    if(m.role === 'user'){ if(!can(t, 'apps')) return fail('이 사람에 대한 권한이 없습니다'); const oa = oApps(t.org_id); if(oa && !oa.includes(a.p_app)) return fail('이 조직에 열리지 않은 프로그램입니다'); f = andA(f, oFeats(t.org_id, a.p_app)); }
    ACC[a.p_user] = ACC[a.p_user] || {}; ACC[a.p_user][a.p_app] = {perm:a.p_perm, expires_at:a.p_expires, branches:a.p_branches || [], features:f};
    log(t, 'app_access', `${a.p_app} → ${a.p_perm === 'use' ? '사용' : '사용 안 함'}`); return ok(null); },
  org_list_devices: () => { const m = me(); if(!(mgrOf(m) && mgrOf(m).perms.device)) return fail('권한이 없습니다'); return ok(DEV.filter(d => can(U.find(u => u.id === d.user_id), 'device')).map(d => Object.assign({}, d))); },
  org_set_device: a => { const t = U.find(x => x.id === a.p_user); if(!can(t, 'device')) return fail('권한이 없습니다'); const d = DEV.find(x => x.user_id === a.p_user && x.id === a.p_device);
    if(a.p_action === 'block') d.blocked = true; else if(a.p_action === 'unblock') d.blocked = false; else if(a.p_action === 'approve') d.approved = true; else if(a.p_action === 'readonly') d.readonly = true; else if(a.p_action === 'edit') d.readonly = false;
    log(t, 'device_' + a.p_action, d.name); return ok(null); },
  org_list_logs: () => { const m = me(); if(!(mgrOf(m) && mgrOf(m).perms.logs)) return fail('권한이 없습니다'); return ok(LOGS.filter(l => l.user_id && can(U.find(u => u.id === l.user_id), 'logs'))); }
});

/* 제작자 전용 보관함(owner-docs) 흉내 — 서버처럼 제작자(owner)에게만 내려줍니다 */
const OWNER_DOCS = {
  'index.json': JSON.stringify([{app:'stim', path:'stim/stec-admin-manual.docx', name:'에스텍_통합관리시스템_제작자관리매뉴얼.docx'},
    {app:'ams', path:'ams/admin-manual-v2.20.0.docx', name:'에스텍_근태관리시스템_제작자관리매뉴얼_v2.20.0.docx'}]),
  'stim/admin-guide.json': JSON.stringify({id:'admin', title:'제작자 관리매뉴얼', en:'Administrator Guide', sub:'(체험용 예시)', audience:'제작자', sections:[{h:'체험용 예시', key:['실제 내용은 서버 비공개 보관함'], blocks:[{p:'체험용 화면에서는 예시 내용만 보입니다.'}]}]}),
  'stim/stec-admin-manual.docx': 'demo', 'ams/admin-manual-v2.20.0.docx': 'demo' };
const storage = { from: () => ({ download: async path => me().role !== 'owner' ? {data:null, error:{message:'Object not found'}} :
  (OWNER_DOCS[path] != null ? {data:new Blob([OWNER_DOCS[path]]), error:null} : {data:null, error:{message:'Object not found'}}) }) };
window.STIM_DEMO = { client: () => ({
  storage,
  rpc: (name, args) => RPC[name] ? RPC[name](args || {}) : fail('Could not find the function ' + name),
  auth: {
    getSession: () => Promise.resolve({data:{session}}),
    signInWithPassword: () => { session = {user:{id:me().id}}; return Promise.resolve({error:null}); },
    signUp: () => Promise.resolve({data:{session:null}, error:null}),
    signOut: () => { session = null; return Promise.resolve({error:null}); },
    updateUser: () => Promise.resolve({error:null}),
    resetPasswordForEmail: () => Promise.resolve({error:null}),
    onAuthStateChange: () => ({data:{subscription:{unsubscribe(){}}}})
  }
}) };
})();
