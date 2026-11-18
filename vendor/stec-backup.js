/* S-Tec Operations and Sales Integrated Management System — 전체 백업 엑셀 만들기
   브라우저(관리 콘솔 「💾 전체 백업」)와 Node(제작자용 스크립트) 모두에서 같은 모양의 엑셀을 만듭니다.
   stecBackupWorkbook(ExcelJS, {server, local, logo, appVersion}) → ExcelJS.Workbook
     server : admin_backup_export() 결과  {generated_at, by, project, tables:{...}}
     local  : 이 기기(브라우저)에 저장된 자료 {device, items:[{k, v}], files:[{db, store, key, name, size}]}  (없으면 null)
   Designed & Developed by Rat Rae Choi */
(function(root){
  'use strict';
  var NAVY = 'FF0B1F8A', RED = 'FFE34234', GREEN = 'FF17552F', PALE = 'FFEEF1FA', LINE = 'FFD5DAE6';
  var MAX = 32000;   // 엑셀 한 칸 최대 글자 수(32,767)보다 조금 작게
  var PROGRAMS = [
    {code:'ams',  en:'Attendance Management Software', ko:'근태관리', pfx:['ams_', 'ams.']},
    {code:'stso', en:'S-Tec-Business-Site-Overview', ko:'사업장 현황 지도', pfx:['stso_', 'stec.']},
    {code:'stqs', en:'S-Tec-Quotation-System', ko:'용역인력 견적시스템', pfx:['stqs_', 'stec_quotes', 'stec_gd_', 'stec_step', 'stec_profile', 'stec_theme', 'stec_vid']},
    {code:'wbe',  en:'Workload-Based Cost and Labor Estimation Method', ko:'업무량 기반 산정', pfx:['wbe_', 'wbe-']},
    {code:'stse', en:'S-Tec short estimate', ko:'단기인력 견적', pfx:['stse_']},
    {code:'stcr', en:'S-Tec Complaint Response System', ko:'고객사 Complaint 대응', pfx:['stcr_']},
    {code:'stos', en:'Program for Process Standardization and Manual Creation', ko:'업무표준화 · 매뉴얼', pfx:['stos_']},
    {code:'stim', en:'S-Tec Operations and Sales Integrated Management System', ko:'메인(통합관리)', pfx:['stim_', 'stec_device', 'stec_login', 'stec_last', 'stec_shell']}
  ];
  var SECRET = /auth_session|access_token|refresh_token|^sb-|_auth_cfg$|password/i;   // 로그인 증표 등은 백업하지 않음
  var ROLE = {owner:'제작자', admin:'관리자', user:'사용자'}, STATUS = {pending:'승인 대기', active:'사용 중', suspended:'차단'};
  var EV = {login:'로그인', login_fail:'로그인 실패', logout:'로그아웃', blocked:'접속 거부', forced:'강제 로그아웃', app_open:'프로그램 열기'};
  var UKEY = {ams_v1_state:'근태 전체 자료(작업 중 상태)', ams_v1_ui:'화면 설정', ams_bak_a:'자동 백업 A', ams_bak_b:'자동 백업 B'};

  function kst(s){ if(!s) return ''; var d = new Date(s); if(isNaN(d)) return String(s);
    var k = new Date(d.getTime() + 9*3600e3).toISOString(); return k.slice(0,10) + ' ' + k.slice(11,16); }
  function progOf(k){ for(var i = 0; i < PROGRAMS.length; i++) for(var j = 0; j < PROGRAMS[i].pfx.length; j++) if(k.indexOf(PROGRAMS[i].pfx[j]) === 0) return PROGRAMS[i]; return null; }
  function json(v){ return typeof v === 'string' ? v : JSON.stringify(v); }
  function chunks(s){ var a = []; s = s == null ? '' : String(s); for(var i = 0; i < s.length || i === 0; i += MAX) a.push(s.slice(i, i + MAX)); return a; }
  function scopeLabel(sc){ sc = sc || {}; if(!sc.level) return '개인 자료'; if(sc.level === 'all') return '전체'; return sc.label || sc.org || ((sc.sites || []).length + '개 사업장'); }

  function sheet(wb, name, cols, rows, opt){
    opt = opt || {};
    var ws = wb.addWorksheet(name, {views:[{state:'frozen', ySplit:1}], properties:{tabColor:{argb: opt.tab || NAVY}}});
    ws.columns = cols.map(function(c){ return {header:c.h, key:c.k, width:c.w || 14}; });
    var hr = ws.getRow(1); hr.height = 22;
    hr.eachCell(function(cell){ cell.font = {bold:true, color:{argb:'FFFFFFFF'}}; cell.fill = {type:'pattern', pattern:'solid', fgColor:{argb: opt.tab || NAVY}};
      cell.alignment = {vertical:'middle', horizontal:'center', wrapText:true}; });
    rows.forEach(function(r){ ws.addRow(r); });
    if(rows.length) ws.autoFilter = {from:{row:1, column:1}, to:{row:1, column:cols.length}};
    cols.forEach(function(c, i){ if(c.wrap) ws.getColumn(i + 1).alignment = {wrapText:true, vertical:'top'}; });
    return ws;
  }

  function build(ExcelJS, data){
    var S = (data && data.server) || {tables:{}}, T = S.tables || {}, L = data && data.local, wb = new ExcelJS.Workbook();
    wb.creator = 'S-Tec Operations and Sales Integrated Management System · Rat Rae Choi'; wb.created = new Date();
    var pick = function(n){ return T[n] || []; };
    var prof = pick('profiles'), pmap = {}; prof.forEach(function(p){ pmap[p.id] = p; });
    var who = function(id){ var p = pmap[id]; return p ? (p.name ? p.name + ' (' + p.email + ')' : p.email) : (id || ''); };
    var shared = pick('shared_data'), base = (shared.filter(function(r){ return r.k === 'base'; })[0] || {}).v || {};
    var sites = shared.filter(function(r){ return /^site:/.test(r.k); });
    var orgName = {}; (base.orgs || []).forEach(function(o){ orgName[o.id] = o.name; });
    var raw = [];   // 원본(복원용)
    var addRaw = function(src, key, owner, v, at){ var cs = chunks(json(v)); cs.forEach(function(c, i){ raw.push([src, key, owner || '', i + 1, cs.length, at || '', c]); }); };
    var list = [];  // 안내 시트 목차

    /* 1. 안내 — 표지는 마지막에 맨 앞으로 옮김 */
    var cover = wb.addWorksheet('안내', {properties:{tabColor:{argb:RED}}, views:[{showGridLines:false}]});

    /* 2. 프로그램 목록 */
    var reg = pick('program_registry').slice().sort(function(a, b){ return (a.sort || 0) - (b.sort || 0); });
    sheet(wb, '프로그램 목록', [{h:'코드',k:'code',w:8},{h:'프로그램(영문)',k:'full',w:44},{h:'한글 이름',k:'name',w:20},{h:'주소',k:'url',w:60},{h:'표시',k:'vis',w:7},{h:'권한 사용',k:'ua',w:9},{h:'버전',k:'ver',w:9},{h:'최소 버전',k:'min',w:9},{h:'메모',k:'note',w:30},{h:'수정일',k:'at',w:17}],
      reg.map(function(r){ return {code:r.code, full:r.full_name, name:r.name, url:r.url, vis:r.visible ? '예' : '아니오', ua:r.uses_access ? '예' : '아니오', ver:r.version || '', min:r.min_version || '', note:r.note || '', at:kst(r.updated_at)}; }));
    list.push(['프로그램 목록', '메인 화면에 나오는 7개 프로그램 등록 정보', reg.length]);
    reg.forEach(function(r){ addRaw('program_registry', r.code, '', r, r.updated_at); });

    /* 3. 사용자 */
    sheet(wb, '사용자', [{h:'이메일',k:'email',w:28},{h:'이름',k:'name',w:12},{h:'연락처',k:'phone',w:15},{h:'부서',k:'dept',w:20},{h:'역할',k:'role',w:8},{h:'상태',k:'st',w:9},{h:'사용기한',k:'exp',w:11},{h:'관리 범위(근태)',k:'scope',w:20},{h:'임시비번 변경 필요',k:'pw',w:10},{h:'가입일',k:'c',w:17},{h:'승인일',k:'a',w:17},{h:'최근 로그인',k:'l',w:17},{h:'메모',k:'memo',w:24},{h:'사용자 ID',k:'id',w:38}],
      prof.map(function(p){ return {email:p.email, name:p.name, phone:p.phone, dept:p.dept, role:ROLE[p.role] || p.role, st:STATUS[p.status] || p.status, exp:p.expires_at || '무기한', scope:scopeLabel(p.scope), pw:p.must_change_pw ? '예' : '', c:kst(p.created_at), a:kst(p.approved_at), l:kst(p.last_login_at), memo:p.memo || '', id:p.id}; }));
    list.push(['사용자', '계정 · 역할 · 상태 · 사용기한 · 관리 범위 (비밀번호는 들어 있지 않음)', prof.length]);
    prof.forEach(function(p){ addRaw('profiles', p.email, '', p, p.created_at); });

    /* 4. 프로그램별 권한 */
    var acc = pick('app_access'), pname = {}; reg.forEach(function(r){ pname[r.code] = r.full_name || r.name; });
    sheet(wb, '프로그램별 권한', [{h:'사용자',k:'u',w:34},{h:'프로그램',k:'p',w:44},{h:'권한',k:'perm',w:10},{h:'프로그램 사용기한',k:'exp',w:14},{h:'담당 지사',k:'br',w:20},{h:'변경일',k:'at',w:17}],
      acc.map(function(a){ return {u:who(a.user_id), p:pname[a.app] || a.app, perm:a.perm === 'use' ? '사용' : '사용 안 함', exp:a.expires_at || '', br:(a.branches || []).join(', ') || '전체', at:kst(a.updated_at)}; }));
    list.push(['프로그램별 권한', '사용자 × 프로그램 사용 권한 · 기한 · 담당 지사 (제작자·관리자는 모든 프로그램 사용)', acc.length]);
    acc.forEach(function(a){ addRaw('app_access', a.app, (pmap[a.user_id] || {}).email, a, a.updated_at); });

    /* 5. 기기 */
    var dev = pick('devices');
    sheet(wb, '기기', [{h:'사용자',k:'u',w:34},{h:'기기 이름',k:'n',w:16},{h:'상태',k:'s',w:9},{h:'승인',k:'ap',w:8},{h:'권한',k:'ro',w:10},{h:'처음 접속',k:'f',w:17},{h:'최근 접속',k:'l',w:17},{h:'IP',k:'ip',w:15},{h:'브라우저',k:'ua',w:50},{h:'기기 번호',k:'id',w:40}],
      dev.map(function(d){ return {u:who(d.user_id), n:d.name, s:d.blocked ? '차단' : '허용', ap:d.approved === false ? '대기' : '승인', ro:d.readonly ? '조회 전용' : '수정 가능', f:kst(d.first_seen), l:kst(d.last_seen), ip:d.last_ip, ua:d.ua, id:d.id}; }));
    list.push(['기기', '사용자별 로그인 기기 · 차단 · 승인 · 조회 전용', dev.length]);

    /* 6~11. 근태관리(공유 자료) — 읽기 쉬운 표 */
    var A = PROGRAMS[0];
    sheet(wb, '근태_조직', [{h:'조직 ID',k:'id',w:9},{h:'이름',k:'name',w:20},{h:'종류',k:'type',w:9},{h:'상위 조직',k:'p',w:20}],
      (base.orgs || []).map(function(o){ return {id:o.id, name:o.name, type:o.type, p:orgName[o.parent] || o.parent || ''}; }), {tab:GREEN});
    list.push(['근태_조직', A.en + ' — 회사 · 지사 조직', (base.orgs || []).length]);
    var siteRows = [], empRows = [];
    sites.forEach(function(r){
      var s = (r.v && r.v.site) || {}, inf = s.info || {}, emps = (r.v && r.v.emps) || [];
      siteRows.push({id:s.id || r.k.slice(5), name:s.name, br:s.br, org:orgName[s.org] || s.org || '', type:inf.type || '', work:inf.work || '', shift:inf.shift || '', to:inf.to == null ? '' : inf.to, n:emps.length, addr:s.addr || '', lat:s.lat || '', lng:s.lng || '', at:kst(r.updated_at), by:who(r.updated_by)});
      emps.forEach(function(e){ var h = (e.hist || []).slice(-1)[0] || {};
        empRows.push({site:s.name || e.site, br:e.br || s.br, id:e.id, name:e.name, post:e.post, code:h.code || '', from:h.from || '', hire:e.hire || '', leave:e.leave || '', part:e.part || '', memo:e.memo || ''}); });
    });
    sheet(wb, '근태_사업장', [{h:'사업장 ID',k:'id',w:10},{h:'사업장',k:'name',w:28},{h:'지사',k:'br',w:8},{h:'조직',k:'org',w:14},{h:'종류',k:'type',w:9},{h:'업무',k:'work',w:12},{h:'근무 형태',k:'shift',w:12},{h:'정원',k:'to',w:7},{h:'등록 인원',k:'n',w:9},{h:'주소',k:'addr',w:46},{h:'위도',k:'lat',w:11},{h:'경도',k:'lng',w:11},{h:'수정일',k:'at',w:17},{h:'수정한 사람',k:'by',w:30}], siteRows, {tab:GREEN});
    list.push(['근태_사업장', A.en + ' — 사업장 정보 (공유 근태)', siteRows.length]);
    sheet(wb, '근태_직원', [{h:'사업장',k:'site',w:28},{h:'지사',k:'br',w:8},{h:'직원 ID',k:'id',w:9},{h:'이름',k:'name',w:12},{h:'직책 · 근무',k:'post',w:24},{h:'근무조 코드',k:'code',w:14},{h:'적용 시작',k:'from',w:10},{h:'입사일',k:'hire',w:11},{h:'퇴사일',k:'leave',w:11},{h:'구분',k:'part',w:9},{h:'메모',k:'memo',w:24}], empRows, {tab:GREEN});
    list.push(['근태_직원', A.en + ' — 사업장별 배치 인원', empRows.length]);
    sheet(wb, '근태_근무조코드', [{h:'코드',k:'id',w:14},{h:'이름',k:'name',w:44},{h:'직종',k:'job',w:7},{h:'순서',k:'seq',w:12},{h:'근로 유형',k:'lt',w:10},{h:'공휴일 휴무',k:'hol',w:10},{h:'기준일',k:'an',w:11}],
      (base.codes || []).map(function(c){ return {id:c.id, name:c.name, job:c.job, seq:c.seq, lt:c.ltype || '', hol:c.hol ? '예' : '', an:c.anchor || ''}; }), {tab:GREEN});
    list.push(['근태_근무조코드', A.en + ' — 근무조 코드', (base.codes || []).length]);
    var hol = (base.holidays || []).map(function(h){ return typeof h === 'string' ? {d:h, n:''} : {d:h.d || h.date || '', n:h.n || h.name || ''}; });
    sheet(wb, '근태_공휴일', [{h:'날짜',k:'d',w:12},{h:'이름',k:'n',w:20}], hol, {tab:GREEN});
    list.push(['근태_공휴일', A.en + ' — 공휴일', hol.length]);
    shared.forEach(function(r){ addRaw('shared_data', r.k, '', r.v, r.updated_at); });

    /* 12. 프로그램별 서버 저장 자료(개인) */
    var ud = pick('user_data');
    sheet(wb, '개인 저장자료', [{h:'프로그램',k:'p',w:30},{h:'사용자',k:'u',w:34},{h:'항목',k:'k',w:18},{h:'설명',k:'d',w:26},{h:'크기(글자)',k:'n',w:11},{h:'저장일',k:'at',w:17},{h:'저장한 기기',k:'dev',w:38}],
      ud.map(function(r){ var pg = progOf(r.k); return {p:pg ? pg.en : '기타', u:(r.name ? r.name + ' (' + r.email + ')' : r.email), k:r.k, d:UKEY[r.k] || '', n:json(r.v).length, at:kst(r.updated_at), dev:r.device_id || ''}; }));
    list.push(['개인 저장자료', '사용자별로 서버에 저장된 자료(근태 작업 상태 · 자동 백업 등) — 내용은 「원본_복원용」', ud.length]);
    ud.forEach(function(r){ addRaw('user_data', r.k, r.email, r.v, r.updated_at); });

    /* 13. 이 기기 자료 */
    if(L){
      var li = (L.items || []).filter(function(x){ return !SECRET.test(x.k); });
      sheet(wb, '이 기기 자료', [{h:'프로그램',k:'p',w:44},{h:'항목',k:'k',w:34},{h:'크기(글자)',k:'n',w:11}],
        li.map(function(x){ var pg = progOf(x.k); return {p:pg ? pg.en + ' · ' + pg.ko : '기타', k:x.k, n:String(x.v || '').length}; }), {tab:'FF8A5A00'});
      list.push(['이 기기 자료', '이 브라우저(기기)에만 저장된 자료 — ' + (L.device || '') + ' (로그인 증표는 제외)', li.length]);
      li.forEach(function(x){ addRaw('local', x.k, L.device || '', x.v, ''); });
      if((L.files || []).length){
        sheet(wb, '이 기기 첨부파일', [{h:'저장소',k:'db',w:16},{h:'이름',k:'name',w:40},{h:'크기(byte)',k:'size',w:12},{h:'키',k:'key',w:30}], L.files, {tab:'FF8A5A00'});
        list.push(['이 기기 첨부파일', '견적시스템 첨부파일 목록 (파일 내용은 엑셀에 넣지 않음)', L.files.length]);
      }
    }

    /* 14~16. 기록 · 설정 */
    var lg = pick('login_logs');
    sheet(wb, '접속기록', [{h:'일시',k:'t',w:17},{h:'이메일',k:'e',w:28},{h:'동작',k:'ev',w:12},{h:'기기',k:'d',w:30},{h:'IP',k:'ip',w:15},{h:'내용',k:'x',w:24}],
      lg.map(function(l){ return {t:kst(l.created_at), e:l.email, ev:EV[l.event] || l.event, d:l.device, ip:l.ip, x:l.detail}; }));
    list.push(['접속기록', '로그인 · 로그아웃 · 접속 거부 · 프로그램 열기', lg.length]);
    var al = pick('admin_logs');
    sheet(wb, '관리작업기록', [{h:'일시',k:'t',w:17},{h:'작업자',k:'a',w:28},{h:'대상',k:'g',w:28},{h:'작업',k:'ac',w:18},{h:'내용',k:'x',w:40}],
      al.map(function(l){ return {t:kst(l.created_at), a:l.admin_email, g:l.target_email, ac:l.action, x:l.detail}; }));
    list.push(['관리작업기록', '승인 · 권한 · 기한 · 차단 등 관리자가 한 일', al.length]);
    var st = pick('app_settings')[0] || {}, SK = {owner_email:'제작자 이메일', signup_open:'가입 신청 받기', require_approval:'가입 승인 필요', global_lock:'앱 전체 잠금', lock_message:'잠금 안내 문구',
      default_days:'승인 시 기본 사용기간(일)', device_approval:'새 기기 승인 필요', max_devices:'1인당 기기 수(0=제한 없음)', updated_at:'마지막 변경'};
    sheet(wb, '전체 설정', [{h:'항목',k:'k',w:28},{h:'값',k:'v',w:50}],
      Object.keys(SK).filter(function(k){ return k in st; }).map(function(k){ var v = st[k]; return {k:SK[k], v:k === 'updated_at' ? kst(v) : typeof v === 'boolean' ? (v ? '예' : '아니오') : v}; }));
    list.push(['전체 설정', '7개 프로그램 공통 설정', 1]);
    addRaw('app_settings', 'settings', '', st, st.updated_at);

    /* 17. 원본(복원용) */
    var rw = sheet(wb, '원본_복원용', [{h:'자료 종류',k:'s',w:15},{h:'키',k:'k',w:22},{h:'사용자 · 기기',k:'u',w:28},{h:'조각',k:'i',w:6},{h:'전체 조각',k:'n',w:8},{h:'저장일',k:'at',w:17},{h:'원본(JSON) — 고치지 마세요',k:'j',w:100}],
      raw.map(function(r){ return {s:r[0], k:r[1], u:r[2], i:r[3], n:r[4], at:kst(r[5]), j:r[6]}; }), {tab:'FF5D6678'});
    rw.eachRow(function(row, i){ if(i > 1) row.height = 15; });
    list.push(['원본_복원용', '모든 서버 자료의 원본. 긴 자료는 여러 조각(32,000자씩)으로 나눠 순서대로 들어 있습니다', raw.length]);

    /* 표지 채우기 */
    var gen = S.generated_at || new Date().toISOString();
    cover.columns = [{width:3},{width:24},{width:78},{width:12}];
    var put = function(r, c, v, f){ var cell = cover.getCell(r, c); cell.value = v; if(f) cell.font = f; return cell; };
    cover.mergeCells('B2:D2'); put(2, 2, 'S-Tec Operations and Sales Integrated Management System', {bold:true, size:16, color:{argb:NAVY}});
    cover.mergeCells('B3:D3'); put(3, 2, '에스텍 운영 및 영업 통합관리 시스템 — 전체 자료 백업', {size:12, color:{argb:'FF5D6678'}});
    var info = [['백업 일시', kst(gen) + ' (한국 시간)'], ['백업한 사람', S.by || ''], ['서버', 'Supabase · ' + (S.project || '')], ['프로그램 버전', data.appVersion || ''],
      ['이 기기 자료', L ? '포함 — ' + (L.device || '') : '미포함 (서버 자료만) — 휴대폰·PC에만 있는 자료는 그 기기에서 「💾 전체 백업」을 누르세요']];
    info.forEach(function(x, i){ var r = 5 + i; put(r, 2, x[0], {bold:true}); put(r, 3, x[1]).alignment = {wrapText:true};
      [2,3].forEach(function(c){ cover.getCell(r, c).fill = {type:'pattern', pattern:'solid', fgColor:{argb:PALE}}; cover.getCell(r, c).border = {bottom:{style:'thin', color:{argb:LINE}}}; }); });
    var r0 = 11; put(r0, 2, '시트', {bold:true, color:{argb:'FFFFFFFF'}}); put(r0, 3, '내용', {bold:true, color:{argb:'FFFFFFFF'}}); put(r0, 4, '건수', {bold:true, color:{argb:'FFFFFFFF'}});
    [2,3,4].forEach(function(c){ cover.getCell(r0, c).fill = {type:'pattern', pattern:'solid', fgColor:{argb:NAVY}}; });
    list.forEach(function(x, i){ var r = r0 + 1 + i, c = put(r, 2, {text:x[0], hyperlink:"#'" + x[0] + "'!A1"}, {color:{argb:'FF1F4E79'}, underline:true});
      put(r, 3, x[1]).alignment = {wrapText:true}; put(r, 4, x[2]); [2,3,4].forEach(function(cc){ cover.getCell(r, cc).border = {bottom:{style:'hair', color:{argb:LINE}}}; }); });
    var rn = r0 + list.length + 2;
    var notes = ['⚠️ 직원 이름 · 연락처 · 이메일 등 개인정보가 들어 있습니다. 회사 보안 폴더에 보관하고 외부로 보내지 마세요.',
      '🔒 비밀번호와 로그인 증표는 들어 있지 않습니다. 복원 후에도 각자 기존 비밀번호로 로그인합니다.',
      '♻️ 복원은 「원본_복원용」 시트를 씁니다. 같은 키의 조각을 1번부터 순서대로 이어 붙이면 원래 자료가 됩니다. 이 시트는 고치지 마세요.',
      '📌 견적 · 불만처리 · 업무표준화 등은 자료 일부가 각 기기(브라우저)에만 저장됩니다. 기기마다 관리 콘솔 「💾 전체 백업」으로 「이 기기 자료」까지 받아 두세요.'];
    notes.forEach(function(n, i){ cover.mergeCells(rn + i, 2, rn + i, 4); var c = put(rn + i, 2, n); c.alignment = {wrapText:true, vertical:'top'}; cover.getRow(rn + i).height = 30; });
    cover.mergeCells(rn + notes.length + 1, 2, rn + notes.length + 1, 4);
    put(rn + notes.length + 1, 2, 'Designed & Developed by Rat Rae Choi', {italic:true, color:{argb:'FF9B2C2C'}}).alignment = {horizontal:'right'};
    if(data.logo){ try{ var id = wb.addImage({base64:data.logo, extension:'png'}); cover.addImage(id, {tl:{col:3.15, row:0.3}, ext:{width:84, height:84}}); cover.getRow(2).height = 34; cover.getRow(3).height = 30; }catch(e){} }
    cover.pageSetup = {paperSize:9, orientation:'portrait', fitToPage:true, fitToWidth:1, fitToHeight:0};
    wb.views = [{activeTab:0}];
    return wb;
  }

  /* 브라우저: 이 기기(같은 주소의 모든 프로그램)에 저장된 자료 모으기 */
  async function collectLocal(deviceName){
    var items = [];
    for(var i = 0; i < localStorage.length; i++){ var k = localStorage.key(i); if(!SECRET.test(k)) items.push({k:k, v:localStorage.getItem(k)}); }
    var files = [];
    try{
      var dbs = indexedDB.databases ? await indexedDB.databases() : [{name:'stec_files'}];
      for(var d = 0; d < dbs.length; d++){
        var name = dbs[d].name; if(!name) continue;
        var db = await new Promise(function(res){ var q = indexedDB.open(name); q.onsuccess = function(){ res(q.result); }; q.onerror = function(){ res(null); }; q.onupgradeneeded = function(){ try{ q.transaction.abort(); }catch(e){} res(null); }; });
        if(!db) continue;
        for(var s = 0; s < db.objectStoreNames.length; s++){
          var sn = db.objectStoreNames[s];
          var all = await new Promise(function(res){ try{ var tx = db.transaction(sn, 'readonly'), st = tx.objectStore(sn), out = [], cur = st.openCursor();
            cur.onsuccess = function(){ var c = cur.result; if(!c){ res(out); return; } var v = c.value || {};
              var size = v.size || (v.blob && v.blob.size) || (v.data && (v.data.size || v.data.length)) || 0;
              out.push({db:name + '/' + sn, name:v.name || v.filename || String(c.key), size:size, key:String(c.key)}); c.continue(); };
            cur.onerror = function(){ res(out); }; }catch(e){ res([]); } });
          files = files.concat(all);
        }
        db.close();
      }
    }catch(e){}
    return {device:deviceName || '', items:items, files:files};
  }

  var api = {build:build, collectLocal:collectLocal, PROGRAMS:PROGRAMS};
  if(typeof module !== 'undefined' && module.exports) module.exports = api; else root.StecBackup = api;
})(typeof window !== 'undefined' ? window : this);
