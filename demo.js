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
  {id:'u0', email:'owner@stec.example', name:'최민영', phone:'010-0000-0000', dept:'에스텍베스트 동부지사', role:'owner', status:'active', expires_at:null, must_change_pw:false, memo:'', created_at:ago(90000), approved_at:ago(90000), last_login_at:ago(3), last_seen_at:ago(1), device_count:3, fail_7d:0, scope:{level:'all'}},
  {id:'u1', email:'kim.east@stec.example', name:'김동부', phone:'010-1111-2222', dept:'동부지사 지사장', role:'admin', status:'active', expires_at:'2027-12-31', must_change_pw:false, memo:'', created_at:ago(60000), approved_at:ago(60000), last_login_at:ago(70), last_seen_at:ago(40), device_count:2, fail_7d:0, scope:{level:'org', org:'east', label:'동부지사'}},
  {id:'u2', email:'lee.site@stec.example', name:'이현장', phone:'010-3333-4444', dept:'동부지사 관리직원', role:'user', status:'active', expires_at:'2027-06-30', must_change_pw:false, memo:'12개 사업장 담당', created_at:ago(40000), approved_at:ago(40000), last_login_at:ago(150), last_seen_at:ago(120), device_count:2, fail_7d:1, scope:{level:'site', sites:['s1','s2'], label:'동부지사 12개 사업장'}},
  {id:'u3', email:'park.sales@stec.example', name:'박영업', phone:'010-5555-6666', dept:'영업팀', role:'user', status:'active', expires_at:plusDays(20), must_change_pw:false, memo:'', created_at:ago(30000), approved_at:ago(30000), last_login_at:ago(1500), last_seen_at:ago(1400), device_count:1, fail_7d:0, scope:{}},
  {id:'u4', email:'jung.west@stec.example', name:'정서부', phone:'010-7777-8888', dept:'서부지사 관리직원', role:'user', status:'pending', expires_at:null, must_change_pw:false, memo:'', created_at:ago(200), approved_at:null, last_login_at:null, last_seen_at:null, device_count:0, fail_7d:0, scope:{}},
  {id:'u5', email:'han.old@stec.example', name:'한퇴사', phone:'', dept:'남부지사', role:'user', status:'suspended', expires_at:'2026-10-31', must_change_pw:false, memo:'10월 퇴사', created_at:ago(100000), approved_at:ago(100000), last_login_at:ago(30000), last_seen_at:ago(30000), device_count:1, fail_7d:3, scope:{}}
];
const ACC = {
  u2:{stso:{perm:'use', expires_at:null, branches:['동부']}, stcr:{perm:'use', expires_at:null, branches:['동부']}, stos:{perm:'use', expires_at:null, branches:[]}},
  u3:{stqs:{perm:'use', expires_at:null, branches:[]}, wbe:{perm:'use', expires_at:null, branches:[]}, stse:{perm:'use', expires_at:'2026-10-31', branches:[]}, stso:{perm:'use', expires_at:null, branches:[]}},
  u5:{stcr:{perm:'use', expires_at:'2026-10-31', branches:['남부']}}
};
const PROGS = [
  {code:'ams', name:'근태관리', full_name:'Attendance Management Software', url:'https://sadness500-boop.github.io/Attendance-Management-Software/', icon:'assets/apps/ams.png', color:'#1B7A34', sort:10, visible:true, beta:false, uses_access:false, version:'2.20.0', min_version:'', note:'근무조 코드 기반 월 근태 자동 생성'},
  {code:'stso', name:'사업장 현황 지도', full_name:'S-Tec-Business-Site-Overview', url:'https://sadness500-boop.github.io/S-Tec-Business-Site-Overview/', icon:'assets/apps/stso.png', color:'#0E7C86', sort:20, visible:true, beta:false, uses_access:true, version:'', min_version:'', note:'사업장 위치·현황 지도'},
  {code:'stqs', name:'용역인력 견적', full_name:'S-Tec-Quotation-System', url:'https://sadness500-boop.github.io/S-Tec-Quotation-System/', icon:'assets/apps/stqs.png', color:'#0B1F8A', sort:30, visible:true, beta:false, uses_access:true, version:'7.9', min_version:'', note:'업종별 용역인력·부대비용 견적'},
  {code:'wbe', name:'업무량 기반 산정', full_name:'Workload-Based Cost and Labor Estimation Method', url:'https://sadness500-boop.github.io/Workload-Based-Cost-and-Labor-Estimation-Method/', icon:'assets/apps/wbe.png', color:'#E8750A', sort:40, visible:true, beta:false, uses_access:true, version:'1.26', min_version:'', note:'업무량 기준 인력·비용 산정'},
  {code:'stse', name:'단기인력 견적', full_name:'S-Tec short estimate', url:'https://sadness500-boop.github.io/S-Ttec-short-estimate/', icon:'assets/apps/stse.png', color:'#7A2E8E', sort:50, visible:true, beta:false, uses_access:true, version:'1.5.0', min_version:'', note:'단기·행사 인력 견적'},
  {code:'stcr', name:'고객 불만처리', full_name:'S-Tec-Complaint-Response-System', url:'https://sadness500-boop.github.io/S-Tec-Complaint-Response-System/', icon:'assets/apps/stcr.png', color:'#C0392B', sort:60, visible:true, beta:false, uses_access:true, version:'1.5.4', min_version:'', note:'Complaint 대응방안 Word·PPT·PDF'},
  {code:'stos', name:'업무표준화·매뉴얼', full_name:'Program for Process Standardization and Manual Creation', url:'https://sadness500-boop.github.io/Program-for-Process-Standardization-and-Manual-Creation/', icon:'assets/apps/stos.png', color:'#2F6FD0', sort:70, visible:true, beta:false, uses_access:true, version:'1.3.2', min_version:'', note:'업무표준·업무매뉴얼 제작'},
  {code:'stlr', name:'법률 대응 시스템', full_name:'Legal Response System', url:'https://sadness500-boop.github.io/S-Tec-Legal-Response-System/', icon:'assets/apps/stlr.png', color:'#1F3A73', sort:80, visible:true, beta:false, uses_access:true, version:'1.0.0', min_version:'', note:'부당 클레임·근무자 사안 법률 검토 Word·PPT·PDF'},
  {code:'stpp', name:'제안서 제작시스템', full_name:'S-Tec Proposal Production System', url:'https://sadness500-boop.github.io/S-Tec-Proposal-Production-System/', icon:'assets/apps/stpp.png', color:'#0E5C4A', sort:90, visible:true, beta:false, uses_access:true, version:'1.0.0', min_version:'', note:'견적 3종 연동 · 업종·산업별 제안서 Word·PPT·PDF'}
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
const me = () => U.find(u => u.role === (AS === 'user' ? 'user' : 'owner') && u.status === 'active' && (AS !== 'user' || u.id === 'u2'));
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
window.STIM_DEMO = { client: () => ({
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
