/* =====================================================================
   S-Tec 공통 기준정보 · 자료 양식 / 불러오기  (stec-master.js)
   — 회사 · 조직(본부 · 지사 · 지점 · 기타) · 사업장을 한 번 넣으면 9개 프로그램이 함께 씁니다.
   — 프로그램마다 「📂 자료」 버튼: 입력 양식(엑셀) 받기 · 작성 안내서(PDF) · 엑셀 불러오기
   S-Tec Operations and Sales Integrated Management System · Designed & Developed by Rat Rae Choi
   ===================================================================== */
(function (root) {
  'use strict';
  var MAIN = 'https://sadness500-boop.github.io/S-Tec-Operations-and-Sales-Integrated-Management-System/';
  var SB_URL = 'https://mnsuebexlzhvomxhrear.supabase.co', SB_KEY = 'sb_publishable_QAD9rHyR_zI8Oyl30VuXqw_tDof_Ctx';
  var CACHE = 'stec_master_v1';
  var ORG_TYPES = ['본부', '지역본부', '지사', '지점', '사업소', '영업소', '센터', '팀', '기타'];
  var PALETTE = ['#0E7490', '#B45309', '#7C3AED', '#BE123C', '#15803D', '#1D4ED8', '#A16207', '#9D174D', '#0F766E', '#4338CA', '#C2410C', '#4D7C0F'];

  /* ---------------- 양식 항목 정의 (엑셀 · PDF 공통) ---------------- */
  // k: 저장 키, h: 엑셀 머리글(* = 꼭 적기), d: 설명, ex: 예시, t: 'num'|'date'|'list', list: 고를 값
  var C = {
    companies: { sheet: '회사', title: '회사(계열사)', desc: '에스텍 그룹의 회사. 견적서 · 보고서의 발행 회사, 본사 위치로 쓰입니다.', cols: [
      { k: 'name', h: '회사명 *', d: '짧은 회사 이름(다른 시트에서 이 이름으로 연결)', ex: '에스텍플러스' },
      { k: 'full', h: '정식 상호', d: '등기상 상호', ex: '㈜에스텍플러스' },
      { k: 'ceo', h: '대표자', d: '대표이사 이름', ex: '홍길동' },
      { k: 'bizNo', h: '사업자등록번호', d: '000-00-00000', ex: '123-45-67890' },
      { k: 'corpNo', h: '법인등록번호', d: '000000-0000000', ex: '110111-3359000' },
      { k: 'bizType', h: '업태', d: '사업자등록증의 업태', ex: '서비스' },
      { k: 'bizItem', h: '종목', d: '사업자등록증의 종목', ex: '경비용역, 시설관리' },
      { k: 'lic', h: '허가 · 신고번호', d: '경비업 허가 등', ex: '경찰청 허가 제000호' },
      { k: 'addr', h: '본사 주소', d: '도로명 주소', ex: '서울시 강남구 테헤란로52길 21' },
      { k: 'tel', h: '대표 전화', d: '', ex: '02-000-0000' },
      { k: 'fax', h: '팩스', d: '', ex: '02-000-0001' },
      { k: 'email', h: '이메일', d: '', ex: 'info@example.com' },
      { k: 'lat', h: '위도', d: '지도 표시용(비우면 지도에 본사 표시 안 함)', ex: 37.5045, t: 'num' },
      { k: 'lng', h: '경도', d: '지도 표시용', ex: 127.0489, t: 'num' },
      { k: 'note', h: '메모', d: '', ex: '' }] },
    orgs: { sheet: '조직', title: '조직(본부 · 지사 · 지점 · 기타)', desc: '회사 아래의 본부 · 지사 · 지점 등. 프로그램의 「지사」 목록 · 담당 지사 · 지도 라벨로 쓰입니다.', cols: [
      { k: 'name', h: '조직명 *', d: '전체 이름', ex: '울산지점' },
      { k: 'type', h: '구분(회사·본부·지사·지점 등)', d: '본부 · 지역본부 · 지사 · 지점 · 사업소 · 영업소 · 센터 · 팀 · 기타 (「회사」로 적으면 회사로 등록)', ex: '지점', t: 'list', list: ['회사'].concat(ORG_TYPES) },
      { k: 'parent', h: '상위 조직명', d: '바로 위 조직(본부 등) 또는 회사명', ex: '영남본부' },
      { k: 'company', h: '회사명 *', d: '「회사」 시트의 회사명(에스텍베스트 포함)', ex: '에스텍플러스' },
      { k: 'key', h: '약칭(프로그램 표시용)', d: '목록 · 버튼에 나오는 짧은 이름. 비우면 조직명에서 「지사·지점」을 뺀 이름. 다른 조직과 겹치면 안 됨', ex: '울산' },
      { k: 'addr', h: '주소', d: '사무실 주소', ex: '울산시 남구 삼산로 000' },
      { k: 'head', h: '책임자', d: '지사장 · 지점장 등', ex: '김철수' },
      { k: 'title', h: '책임자 직책', d: '', ex: '지점장' },
      { k: 'tel', h: '연락처', d: '', ex: '052-000-0000' },
      { k: 'lat', h: '위도', d: '지도 표시용', ex: 35.5384, t: 'num' },
      { k: 'lng', h: '경도', d: '지도 표시용', ex: 129.3114, t: 'num' },
      { k: 'color', h: '표시 색(#RRGGBB)', d: '지도 · 목록 색(비우면 자동)', ex: '#0E7490' },
      { k: 'note', h: '메모', d: '', ex: '' }] },
    sites: { sheet: '사업장', title: '사업장(고객사 현장)', desc: '용역을 수행하는 고객사 현장. 사업장 지도 · 견적 · 불만처리 · 법률 대응 · 근태관리에서 쓰입니다.', cols: [
      { k: 'name', h: '사업장명 *', d: '고객사(현장) 이름', ex: '○○화학 울산공장' },
      { k: 'org', h: '소속 조직명', d: '담당 조직(「조직」 시트의 조직명 또는 약칭)', ex: '울산지점' },
      { k: 'type', h: '형태(공장·대학·빌딩 등)', d: '공장 · 대학 · 빌딩 · 병원 · 아파트 · 관공서 · 기타', ex: '공장' },
      { k: 'work', h: '업무(보안·미화 등)', d: '보안 · 미화 · 보안/미화 · 시설 · 주차 등', ex: '보안/미화' },
      { k: 'shift', h: '근무형태(주5일·3조2교대 등)', d: '격일제 · 3조2교대 · 주5일 등', ex: '3조2교대' },
      { k: 'to', h: '계약 T/O', d: '계약 인원', ex: 6, t: 'num' },
      { k: 'company', h: '회사명', d: '계약 회사(비우면 소속 조직의 회사)', ex: '에스텍플러스' },
      { k: 'addr', h: '주소', d: '현장 주소(지도 · 거리 계산)', ex: '울산시 남구 사평로 000' },
      { k: 'since', h: '계약 시작일', d: 'YYYY-MM-DD 또는 YYYY.MM.DD', ex: '2026-01-01', t: 'date' },
      { k: 'total', h: '현재 인원', d: '배치 인원 합계', ex: 6, t: 'num' },
      { k: 'm', h: '남', d: '', ex: 4, t: 'num' }, { k: 'f', h: '여', d: '', ex: 2, t: 'num' },
      { k: 'sec', h: '보안 인원', d: '', ex: 4, t: 'num' }, { k: 'cln', h: '미화 인원', d: '', ex: 2, t: 'num' }, { k: 'etc', h: '기타 인원', d: '', ex: 0, t: 'num' },
      { k: 'mgr', h: '현장 관리자', d: '', ex: '이영희' }, { k: 'pos', h: '관리자 직책', d: '', ex: '반장' },
      { k: 'mtel', h: '관리자 연락처', d: '', ex: '010-0000-0000' }, { k: 'stel', h: '사업장 전화', d: '', ex: '052-000-0000' },
      { k: 'lat', h: '위도', d: '지도 표시용(비우면 주소만 표시)', ex: 35.5123, t: 'num' }, { k: 'lng', h: '경도', d: '', ex: 129.3456, t: 'num' },
      { k: 'note', h: '메모', d: '', ex: '' }] }
  };
  var ALL = ['companies', 'orgs', 'sites'];
  function pick(kind, keys) { var s = C[kind]; return { sheet: s.sheet, title: s.title, desc: s.desc, cols: keys ? s.cols.filter(function (c) { return keys.indexOf(c.k) >= 0; }) : s.cols }; }
  var CO_BASIC = ['name', 'full', 'ceo', 'addr', 'tel', 'lat', 'lng', 'note'];
  var SITE_MAP = ['name', 'org', 'type', 'work', 'shift', 'to', 'company', 'addr', 'since', 'total', 'm', 'f', 'sec', 'cln', 'etc', 'mgr', 'pos', 'mtel', 'stel', 'lat', 'lng', 'note'];
  var PROGRAMS = {
    stim: { en: 'S-Tec Operations and Sales Integrated Management System', ko: '메인(통합관리)', uses: { companies: null, orgs: null, sites: null },
      what: '메인 관리 콘솔 「🏢 기준정보」에서 9개 프로그램 공통 회사 · 조직 · 사업장을 한 번에 넣습니다.' },
    ams: { en: 'Attendance Management Software', ko: '근태관리', uses: { orgs: ['name', 'type', 'parent', 'company', 'key', 'addr', 'head', 'tel'], sites: ['name', 'org', 'type', 'work', 'shift', 'to', 'company', 'addr'] }, own: true,
      what: '조직 · 사업장 · 인원(근무조 · 근로형태 · 출퇴근 · 휴게) · 급여를 한 번에 등록합니다. 근태관리 「엑셀 자료 반영하기」와 같은 양식입니다.',
      extra: [{ sheet: '인원·급여', title: '인원 · 급여(근로계약서)', desc: '한 줄 = 한 사람. 사업장명 + 성명(또는 사번)으로 기존 인원을 찾아 바꾸고, 없으면 새로 추가합니다.', cols: [
        { k: 'site', h: '사업장명 *', d: '「사업장」 시트의 사업장명', ex: '○○화학 울산공장' }, { k: 'name', h: '성명 *', d: '', ex: '홍길동' },
        { k: 'post', h: 'POST(직책·근무형태)', d: '', ex: '보안요원 (3조2교대)' }, { k: 'part', h: '파트', d: '', ex: '정문' },
        { k: 'code', h: '근무조 코드 *', d: '「근무조 코드」 시트의 코드', ex: 'SEC-3J2G-01' }, { k: 'jo', h: '조(순번)', d: '1부터', ex: 1, t: 'num' },
        { k: 'lt', h: '근로형태(일반/감시단속)', d: '비우면 근무조 코드의 근로형태', ex: '감시단속' }, { k: 'hire', h: '입사(배치)일', d: 'YYYY-MM-DD', ex: '2026-01-01', t: 'date' },
        { k: 'aS', h: 'A 출근 · A 퇴근 · A 휴게(h)', d: '주간 근무 시간(비우면 근무조 시간표)', ex: '07:00 / 19:00 / 2' }, { k: 'bS', h: 'B 출근 · B 퇴근 · B 휴게(h)', d: '야간 근무 시간', ex: '19:00 / 07:00 / 3' },
        { k: 'no', h: '사번 · 직책/직급 · 부서', d: '', ex: '2601001 · 보안요원' },
        { k: 'wage', h: '시급 · 통상시급 · 기본급(월)', d: '근로계약서 금액', ex: '10,320 · 10,320 · 2,156,880', t: 'num' },
        { k: 'ot', h: '연장근무수당 · 식대 · 기타수당1~3', d: '비과세는 O 표시', ex: '식대 200,000 (O)' },
        { k: 'd1n', h: '고정공제1~2 · 4대보험 월액 · 부양가족', d: '비우면 자동 계산', ex: '' },
        { k: 'memo', h: '메모', d: '', ex: '' }] },
        { sheet: '근무조 코드', title: '근무조 코드(참고)', desc: '근태관리에 등록된 근무조 코드 목록입니다. 「인원·급여」의 근무조 코드는 이 목록에서 고릅니다(읽기 전용).', ref: true, cols: [
        { k: 'id', h: '코드', d: '', ex: 'SEC-3J2G-01' }, { k: 'name', h: '이름', d: '', ex: '보안 3조2교대' }, { k: 'job', h: '직종', d: '', ex: '보안' }, { k: 'lt', h: '근로형태', d: '', ex: '감시단속' }] }] },
    stso: { en: 'S-Tec-Business-Site-Overview', ko: '사업장 현황 지도', uses: { companies: CO_BASIC, orgs: null, sites: SITE_MAP },
      what: '새 회사 · 지사 · 사업장을 지도에 표시합니다. 위도 · 경도가 있으면 지도에 핀이 꽂힙니다.' },
    stqs: { en: 'S-Tec-Quotation-System', ko: '용역인력 견적', uses: { companies: null, orgs: null, sites: ['name', 'org', 'company', 'addr', 'type', 'work', 'shift', 'to', 'total', 'lat', 'lng', 'note'] },
      what: '견적서 발행 회사(상호 · 대표 · 사업자번호 · 업태 · 종목 · 허가번호 · 주소)와 관할 조직 · 기존 사업장을 넣습니다.' },
    wbe: { en: 'Workload-Based Cost and Labor Estimation Method', ko: '업무량 기반 산정', uses: { companies: CO_BASIC, orgs: null, sites: ['name', 'org', 'company', 'addr', 'type', 'work', 'shift', 'total', 'lat', 'lng'] },
      what: '견적 대상 근처의 조직(관할 지사) · 기존 사업장을 지도에서 보여 줄 때 씁니다.' },
    stse: { en: 'S-Tec short estimate', ko: '단기인력 견적', uses: { companies: ['name', 'full', 'ceo', 'bizNo', 'addr', 'tel', 'fax', 'email', 'note'], orgs: null },
      what: '견적서 「발신 회사 정보」(상호 · 대표 · 사업자번호 · 주소 · 전화 · 팩스)를 회사 이름만 골라 채우고, 담당 조직(지사 · 지점) 목록에 씁니다.' },
    stcr: { en: 'S-Tec Complaint Response System', ko: '고객 불만처리', uses: { companies: CO_BASIC, orgs: null, sites: SITE_MAP },
      what: '불만이 들어온 고객사(사업장)와 담당 조직(책임자 · 연락처)을 고를 수 있게 넣습니다.' },
    stos: { en: 'Program for Process Standardization and Manual Creation', ko: '업무표준화 · 매뉴얼', uses: { companies: CO_BASIC, orgs: null, sites: SITE_MAP },
      what: '업무표준 · 매뉴얼을 만들 사업장(고객사)과 담당 조직(지사 · 지점 · 책임자)을 고를 수 있게 넣습니다.' },
    stlr: { en: 'S-Tec Legal Response System', ko: '법률 대응 시스템', uses: { companies: CO_BASIC, orgs: null, sites: SITE_MAP },
      what: '사안이 발생한 고객사(사업장)와 담당 조직을 고를 수 있게 넣습니다.' },
    stpm: { en: 'S-Tec Performance Management System', ko: '성과 관리 시스템', uses: { companies: CO_BASIC, orgs: null, sites: SITE_MAP },
      what: '성과를 기록·집계할 사업장(고객사)과 담당 조직(지사 · 본부)을 고를 수 있게 넣습니다.' },
    stac: { en: 'S-Tec Integrated Access Control System', ko: '통합 출입관리 시스템', uses: { companies: CO_BASIC, orgs: null, sites: SITE_MAP },
      what: '출입관리를 운영할 사업장(고객사)과 담당 조직(지사)을 고를 수 있게 넣습니다.' }
  };
  function programSpec(code) {
    var p = PROGRAMS[code] || PROGRAMS.stim, sheets = [];
    ALL.forEach(function (k) { if (k in p.uses) { var s = pick(k, p.uses[k]); s.kind = k; sheets.push(s); } });
    (p.extra || []).forEach(function (s) { sheets.push(s); });
    return { code: code, en: p.en, ko: p.ko, what: p.what, own: !!p.own, sheets: sheets };
  }

  /* ---------------- 캐시 · 서버 ---------------- */
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }
  function cache() { try { return JSON.parse(lsGet(CACHE) || 'null') || { companies: [], orgs: [], sites: [], at: '' }; } catch (e) { return { companies: [], orgs: [], sites: [], at: '' }; } }
  function token() { try { var s = JSON.parse(lsGet('stec_auth_session') || 'null'); return s && (s.access_token || (s.currentSession && s.currentSession.access_token)); } catch (e) { return null; } }
  function rpc(fn, body) {
    var t = token(); if (!t || !root.fetch) return Promise.reject(new Error('로그인이 필요합니다'));
    return fetch(SB_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: SB_KEY, Authorization: 'Bearer ' + t, 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) })
      .then(function (r) { return r.text().then(function (x) { var j = null; try { j = x ? JSON.parse(x) : null; } catch (e) { } if (!r.ok) throw new Error((j && (j.message || j.hint)) || ('서버 오류 ' + r.status)); return j; }); });
  }
  function refresh() {
    return rpc('master_get').then(function (d) {
      if (!d || !d.ok) return false;
      var old = lsGet(CACHE), nv = { companies: d.companies || [], orgs: d.orgs || [], sites: d.sites || [], at: d.updated_at || '' };
      var s = JSON.stringify(nv); if (old !== s) { lsSet(CACHE, s); return true; } return false;
    });
  }
  function save(kind, list, note) {
    return rpc('admin_master_put', { p_k: kind, p_v: list, p_note: note || '' }).then(function (r) {
      var c = cache(); c[kind] = list; c.at = (r && r.updated_at) || new Date().toISOString(); lsSet(CACHE, JSON.stringify(c)); return r;
    });
  }

  /* ---------------- 프로그램이 쓰는 도우미 (자료를 기존 목록에 더하기) ---------------- */
  var norm = function (v) { return String(v == null ? '' : v).replace(/[\s()㈜（）·.\-]/g, '').replace(/^주식회사|주식회사$/g, '').toLowerCase(); };
  function orgKey(o) { if (o.key) return String(o.key).trim(); return String(o.name || '').replace(/(지역본부|본부|지사|지점|사업소|영업소|센터)$/, '').trim() || o.name; }
  function orgs() { return cache().orgs.filter(function (o) { return o && o.name; }); }
  function companies() { return cache().companies.filter(function (o) { return o && o.name; }); }
  function sites() { return cache().sites.filter(function (o) { return o && o.name; }); }
  function orgOf(nameOrKey) { var n = norm(nameOrKey); var L = orgs(); for (var i = 0; i < L.length; i++) if (norm(L[i].name) === n || norm(orgKey(L[i])) === n) return L[i]; return null; }
  function siteBranch(s) { var o = orgOf(s.org); return o ? orgKey(o) : (s.org ? String(s.org).replace(/(지사|지점)$/, '') : ''); }
  var colorMap = {};
  function color(key, i) {
    var o = orgOf(key); if (o && o.color) return o.color;
    if (!colorMap[key]) { var n = Object.keys(colorMap).length + (i || 0); colorMap[key] = PALETTE[n % PALETTE.length]; }
    return colorMap[key];
  }
  // 지사 키 배열(['동부','서부'...])에 새 조직 약칭을 더함 (배열을 직접 바꿈)
  function branchKeys(arr) { if (!Array.isArray(arr)) return arr; orgs().forEach(function (o) { var k = orgKey(o); if (k && arr.indexOf(k) < 0) arr.push(k); }); return arr; }
  // {동부:'#..'} 같은 색 표에 새 조직 색을 더함
  function colors(map) { if (!map || typeof map !== 'object') return map; orgs().forEach(function (o, i) { var k = orgKey(o); if (!(k in map)) map[k] = o.color || PALETTE[i % PALETTE.length]; }); return map; }
  // [{key,name,addr,head,title,tel,lat,lng}] 형태의 지사 목록에 더함/고침
  function mergeBranchObjs(arr, mapFn) {
    if (!Array.isArray(arr)) return arr;
    orgs().forEach(function (o) {
      var k = orgKey(o), obj = { key: k, name: o.name, addr: o.addr || '', head: o.head || '', title: o.title || '', tel: o.tel || '', lat: num(o.lat), lng: num(o.lng), company: o.company || '', type: o.type || '', color: o.color || '' };
      if (mapFn) obj = mapFn(obj, o) || obj;
      var ex = null; for (var i = 0; i < arr.length; i++) if (arr[i] && (arr[i].key === k || norm(arr[i].name) === norm(o.name))) { ex = arr[i]; break; }
      if (ex) { Object.keys(obj).forEach(function (f) { if (obj[f] !== '' && obj[f] != null && f !== 'key') ex[f] = obj[f]; }); } else arr.push(obj);
    });
    return arr;
  }
  // SITES 형태의 사업장 목록에 더함/고침 — 같은 이름이면 빈 칸이 아닌 항목만 바꿈, 새 사업장은 id 100001부터
  function mergeSites(arr, mapFn) {
    if (!Array.isArray(arr)) return arr;
    var maxId = 100000; arr.forEach(function (s) { if (s && +s.id > maxId) maxId = +s.id; });
    sites().forEach(function (m) {
      var o = { br: siteBranch(m), name: m.name, since: m.since || '', addr: m.addr || '', type: m.type || '', work: m.work || '', shift: m.shift || '', total: num(m.total, 0), m: num(m.m, 0), f: num(m.f, 0), sec: num(m.sec, 0), cln: num(m.cln, 0), etc: num(m.etc, 0), note: m.note || '', mgr: m.mgr || '', pos: m.pos || '', mtel: m.mtel || '', stel: m.stel || '', lat: num(m.lat), lng: num(m.lng), company: m.company || ((orgOf(m.org) || {}).company) || '', to: num(m.to) };
      if (mapFn) o = mapFn(o, m) || o;
      var ex = null; for (var i = 0; i < arr.length; i++) if (arr[i] && norm(arr[i].name) === norm(m.name)) { ex = arr[i]; break; }
      if (ex) { Object.keys(o).forEach(function (f) { var v = o[f]; if (v !== '' && v != null && !(typeof v === 'number' && v === 0 && !(f in m))) ex[f] = v; }); }
      else { o.id = ++maxId; o._master = true; if (o.lat == null) delete o.lat; if (o.lng == null) delete o.lng; arr.push(o); }
    });
    return arr;
  }
  function num(v, d) { if (v === '' || v == null) return d === undefined ? null : d; var n = Number(String(v).replace(/,/g, '')); return isFinite(n) ? n : (d === undefined ? null : d); }
  function companyInfo(name) { var n = norm(name), L = companies(); for (var i = 0; i < L.length; i++) if (norm(L[i].name) === n || norm(L[i].full) === n) return L[i]; return null; }

  /* ---------------- 엑셀 양식 만들기 ---------------- */
  var EXJ = MAIN + 'vendor/exceljs.min.js';
  function loadExcel() {
    if (root.ExcelJS) return Promise.resolve(root.ExcelJS);
    return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = EXJ; s.onload = function () { res(root.ExcelJS); }; s.onerror = function () { rej(new Error('엑셀 도구를 불러오지 못했습니다(인터넷 연결 확인)')); }; document.head.appendChild(s); });
  }
  var NAVY = 'FF0B1F8A', GREEN = 'FF1B7A34';
  function rowsOf(kind, keys) {
    var L = kind === 'companies' ? companies() : kind === 'orgs' ? orgs() : sites();
    return L.map(function (r) { var o = {}; keys.forEach(function (k) { o[k] = r[k] == null ? '' : r[k]; }); if (kind === 'orgs' && !r.key) o.key = r.key || ''; return o; });
  }
  function buildWorkbook(ExcelJS, code, opt) {
    opt = opt || {}; var P = programSpec(code), wb = new ExcelJS.Workbook();
    wb.creator = 'S-Tec Operations and Sales Integrated Management System · Rat Rae Choi'; wb.created = new Date();
    var g = wb.addWorksheet('작성 안내', { properties: { tabColor: { argb: 'FFE34234' } }, views: [{ showGridLines: false }] });
    g.columns = [{ width: 3 }, { width: 22 }, { width: 96 }];
    var r = 2; var put = function (c, v, f) { var x = g.getCell(r, c); x.value = v; if (f) x.font = f; x.alignment = { wrapText: true, vertical: 'top' }; return x; };
    g.mergeCells(r, 2, r, 3); put(2, P.en + ' — 자료 입력 양식', { bold: true, size: 15, color: { argb: NAVY } }); r++;
    g.mergeCells(r, 2, r, 3); put(2, P.ko + ' · S-Tec Operations and Sales Integrated Management System', { color: { argb: 'FF5D6678' } }); r += 2;
    [['하는 일', P.what], ['작성 방법', '① 각 시트의 3번째 줄부터 한 줄에 하나씩 적습니다(1줄 = 항목 이름, 2줄 = 설명).  ② 머리글에 * 가 있는 칸은 꼭 적습니다.  ③ 「(예시)」로 시작하는 줄은 읽지 않습니다 — 지우거나 그대로 두세요.  ④ 빈 칸은 「바꾸지 않음」입니다.'],
     ['불러오기', '프로그램 화면 왼쪽 아래 「📂 자료」 → 「엑셀 불러오기」 → 이 파일 선택 → 미리보기 확인 → 「적용」.'],
     ['함께 쓰는 자료', '「회사」 · 「조직」 · 「사업장」 시트는 9개 프로그램이 함께 쓰는 공통 기준정보로 저장됩니다(제작자 · 관리자만). 같은 이름이 이미 있으면 적은 칸만 바뀌고, 없으면 새로 추가됩니다.'],
     ['주의', '회사명 · 조직명 · 사업장명은 시트끼리 같은 글자로 적어야 연결됩니다. 개인정보(연락처 등)가 들어가므로 파일 보관에 주의하세요.']].forEach(function (x) {
      put(2, x[0], { bold: true, color: { argb: GREEN } }); put(3, x[1]); g.getRow(r).height = Math.max(20, Math.ceil(x[1].length / 60) * 16); r++; });
    r++; put(2, '시트', { bold: true, color: { argb: 'FFFFFFFF' } }).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; put(3, '내용', { bold: true, color: { argb: 'FFFFFFFF' } }).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; r++;
    P.sheets.forEach(function (s) { put(2, s.sheet, { bold: true }); put(3, s.title + ' — ' + s.desc); g.getRow(r).height = 30; r++; });
    r++; g.mergeCells(r, 2, r, 3); put(2, 'Designed & Developed by Rat Rae Choi', { italic: true, color: { argb: 'FF8A1C34' } }).alignment = { horizontal: 'right' };
    var lists = {};
    P.sheets.forEach(function (s) {
      if (P.own && !s.kind) return;     // 근태관리 전용 시트는 근태관리 양식에서 만듦
      var ws = wb.addWorksheet(s.sheet, { views: [{ state: 'frozen', ySplit: 2, xSplit: 1 }], properties: { tabColor: { argb: s.kind ? NAVY : GREEN } } });
      ws.columns = s.cols.map(function (c) { return { width: Math.max(10, Math.min(30, c.h.length * 1.5 + 2)) }; });
      var h = ws.getRow(1); h.values = s.cols.map(function (c) { return c.h; }); h.height = 32;
      h.eachCell(function (c, i) { var req = /\*/.test(s.cols[i - 1].h); c.font = { bold: true, color: { argb: 'FFFFFFFF' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: req ? 'FFB3261E' : NAVY } }; c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }; });
      var d = ws.getRow(2); d.values = s.cols.map(function (c) { return c.d || ''; }); d.height = 42;
      d.eachCell(function (c) { c.font = { italic: true, size: 9, color: { argb: 'FF5D6678' } }; c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F4FA' } }; c.alignment = { vertical: 'top', wrapText: true }; });
      var data = opt.fill && s.kind ? rowsOf(s.kind, s.cols.map(function (c) { return c.k; })) : [];
      if (!opt.fill || !data.length) { var ex = s.cols.map(function (c, i) { var v = c.ex == null ? '' : c.ex; return i === 0 ? '(예시) ' + v : v; }); var er = ws.addRow(ex); er.font = { color: { argb: 'FF8A93A6' }, italic: true }; }
      data.forEach(function (o) { ws.addRow(s.cols.map(function (c) { return o[c.k]; })); });
      var last = Math.max(ws.rowCount + 300, 400);
      s.cols.forEach(function (c, i) {
        var L = ws.getColumn(i + 1).letter;
        if (c.t === 'list' && c.list) for (var rr = 3; rr <= last; rr++) ws.getCell(L + rr).dataValidation = { type: 'list', allowBlank: true, formulae: ['"' + c.list.join(',') + '"'] };
        if (c.t === 'num') ws.getColumn(i + 1).numFmt = /위도|경도/.test(c.h) ? '0.000000' : '#,##0';
      });
      lists[s.sheet] = ws;
      ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: s.cols.length } };
    });
    return wb;
  }
  function download(name, buf) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }
  function fileName(code, fill) { var P = programSpec(code); return P.en.replace(/[^\w가-힣]+/g, '_') + (fill ? '_자료입력_현재자료.xlsx' : '_자료입력양식.xlsx'); }
  function pdfUrl(code) { return MAIN + 'forms/' + code + '_작성안내서.pdf'; }

  /* ---------------- 엑셀 읽기 → 미리보기 → 적용 ---------------- */
  var hn = function (v) { return String(v == null ? '' : v).replace(/\*|\s/g, '').replace(/\(.*$/, '').toLowerCase(); };
  function cellVal(v) { if (v == null) return ''; if (v instanceof Date) return v.toISOString().slice(0, 10); if (typeof v === 'object') { if (v.result != null) return v.result; if (v.text != null) return v.text; if (v.richText) return v.richText.map(function (x) { return x.text; }).join(''); if (v.hyperlink) return v.text || v.hyperlink; } return v; }
  function readSheet(ws, spec) {
    var hr = -1, map = {};
    for (var r = 1; r <= Math.min(ws.rowCount, 10) && hr < 0; r++) {
      var row = ws.getRow(r), m = {}, used = {}, heads = [];
      row.eachCell(function (c, ci) { heads.push([ci, hn(cellVal(c.value))]); });
      spec.cols.forEach(function (col) { var h = hn(col.h); heads.forEach(function (x) { if (!m[col.k] && !used[x[0]] && x[1] && x[1] === h) { m[col.k] = x[0]; used[x[0]] = 1; } }); });
      spec.cols.forEach(function (col) { var h = hn(col.h); if (m[col.k] || h.length < 2) return; heads.forEach(function (x) { if (!m[col.k] && !used[x[0]] && x[1] && x[1].indexOf(h) === 0) { m[col.k] = x[0]; used[x[0]] = 1; } }); });
      if (m[spec.cols[0].k]) { hr = r; map = m; }
    }
    if (hr < 0) return null;
    var out = [];
    for (var rr = hr + 1; rr <= ws.rowCount; rr++) {
      var rw = ws.getRow(rr), o = { _r: rr }, any = false;
      Object.keys(map).forEach(function (k) { var v = cellVal(rw.getCell(map[k]).value); if (v !== '' && v != null && String(v).trim() !== '') { o[k] = typeof v === 'string' ? v.trim() : v; any = true; } });
      if (!any) continue;
      var first = String(o[spec.cols[0].k] || '');
      if (/^\(예시\)|^예시/.test(first)) continue;
      if (rr === hr + 1 && !o[spec.cols[0].k]) continue;   // 설명 줄
      if (rr === hr + 1 && spec.cols[0].d && first === spec.cols[0].d) continue;
      out.push(o);
    }
    return out;
  }
  function plan(wb, code) {
    var P = programSpec(code), res = { sheets: {}, err: [], warn: [], extra: {} };
    var allSheets = [C.companies, C.orgs, C.sites].map(function (s, i) { var x = pick(ALL[i]); x.kind = ALL[i]; return x; });
    allSheets.forEach(function (s) { var ws = wb.getWorksheet(s.sheet); if (!ws) return; var rows = readSheet(ws, s); if (rows) res.sheets[s.kind] = rows; });
    (P.sheets.filter(function (s) { return !s.kind && !s.ref; })).forEach(function (s) { var ws = wb.getWorksheet(s.sheet); if (ws) { var rows = readSheet(ws, s); if (rows) res.extra[s.sheet] = rows; } });
    // 조직 시트의 「회사」 구분 줄은 회사로
    var org = res.sheets.orgs || [];
    var coRows = (res.sheets.companies || []).slice();
    res.sheets.orgs = org.filter(function (o) { if (String(o.type || '').trim() === '회사') { coRows.push({ name: o.name, addr: o.addr, tel: o.tel, lat: o.lat, lng: o.lng, note: o.note, _r: o._r }); return false; } return true; });
    if (coRows.length) res.sheets.companies = coRows;
    // 확인
    var coNames = {}; companies().concat(coRows).forEach(function (c) { coNames[norm(c.name)] = 1; if (c.full) coNames[norm(c.full)] = 1; });
    coNames[norm('에스텍베스트')] = 1;
    var keys = {}; orgs().forEach(function (o) { keys[orgKey(o)] = o.name; });
    var orgNames = {}; orgs().forEach(function (o) { orgNames[norm(o.name)] = 1; orgNames[norm(orgKey(o))] = 1; });
    ['동부', '서부', '남부', '중부'].forEach(function (k) { orgNames[norm(k)] = 1; orgNames[norm(k + '지사')] = 1; });
    // 회사명이 빈 조직: 상위 조직을 따라 올라가 회사를 찾음 (근태관리 양식 호환)
    var byName = {}; orgs().concat(res.sheets.orgs || []).forEach(function (o) { byName[norm(o.name)] = o; });
    (res.sheets.orgs || []).forEach(function (o) {
      if (o.company) return; var p = o.parent, n = 0;
      while (p && n++ < 20) { if (coNames[norm(p)]) { o.company = p; break; } var q = byName[norm(p)]; if (!q) break; if (q.company) { o.company = q.company; break; } p = q.parent; }
      if (!o.company) { o.company = '에스텍베스트'; res.warn.push('조직 ' + o._r + '행 「' + o.name + '」: 회사명이 없어 「에스텍베스트」로 저장합니다'); }
    });
    (res.sheets.orgs || []).forEach(function (o) {
      if (!coNames[norm(o.company)]) res.warn.push('조직 ' + o._r + '행 「' + o.name + '」: 회사 「' + o.company + '」이 「회사」 시트에 없습니다(그대로 저장)');
      if (o.type && ORG_TYPES.indexOf(String(o.type).trim()) < 0) res.warn.push('조직 ' + o._r + '행 「' + o.name + '」: 구분 「' + o.type + '」은 목록에 없는 값입니다(그대로 저장)');
      var k = orgKey(o); if (keys[k] && norm(keys[k]) !== norm(o.name)) res.err.push('조직 ' + o._r + '행 「' + o.name + '」: 약칭 「' + k + '」이 다른 조직(' + keys[k] + ')과 겹칩니다 — 「약칭」 칸에 다른 이름을 적으세요');
      keys[k] = o.name; orgNames[norm(o.name)] = 1; orgNames[norm(k)] = 1;
    });
    (res.sheets.sites || []).forEach(function (s) {
      if (s.org && !orgNames[norm(s.org)]) res.warn.push('사업장 ' + s._r + '행 「' + s.name + '」: 소속 조직 「' + s.org + '」이 없습니다(그대로 저장)');
      ['lat', 'lng', 'to', 'total', 'm', 'f', 'sec', 'cln', 'etc'].forEach(function (k) { if (s[k] != null && num(s[k]) == null) res.err.push('사업장 ' + s._r + '행 「' + s.name + '」: 「' + C.sites.cols.filter(function (c) { return c.k === k; })[0].h + '」 칸은 숫자여야 합니다'); });
    });
    (res.sheets.companies || []).forEach(function (c) { if (!c.name) res.err.push('회사 ' + c._r + '행: 회사명이 비었습니다'); });
    return res;
  }
  function mergeList(kind, rows) {
    var cur = (kind === 'companies' ? companies() : kind === 'orgs' ? orgs() : sites()).map(function (x) { return Object.assign({}, x); });
    var add = 0, upd = 0;
    rows.forEach(function (r) {
      var o = {}; Object.keys(r).forEach(function (k) { if (k !== '_r') o[k] = (C[kind].cols.filter(function (c) { return c.k === k; })[0] || {}).t === 'num' ? num(r[k]) : r[k]; });
      if (o.since && /^\d{5}$/.test(String(o.since))) o.since = new Date(Date.UTC(1899, 11, 30) + o.since * 864e5).toISOString().slice(0, 10);
      var ex = null; for (var i = 0; i < cur.length; i++) if (norm(cur[i].name) === norm(o.name)) { ex = cur[i]; break; }
      if (ex) { var ch = false; Object.keys(o).forEach(function (k) { if (o[k] !== '' && o[k] != null && String(ex[k]) !== String(o[k])) { ex[k] = o[k]; ch = true; } }); if (ch) upd++; }
      else { cur.push(o); add++; }
    });
    return { list: cur, add: add, upd: upd };
  }

  /* ---------------- 「📂 자료」 창 ---------------- */
  var CFG = null;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function css() {
    if (document.getElementById('smCss')) return;
    var st = document.createElement('style'); st.id = 'smCss';
    st.textContent = '#smBtn{position:fixed;left:104px;bottom:12px;z-index:8500;display:flex;align-items:center;gap:6px;padding:7px 13px;border-radius:999px;border:0;cursor:pointer;background:#1B7A34;color:#fff;font:700 12.5px/1 "Pretendard Variable","Malgun Gothic",sans-serif;box-shadow:0 4px 14px rgba(0,0,0,.3);opacity:.9}#smBtn:hover{opacity:1}'
      + '#smPop{position:fixed;inset:0;z-index:9600;background:rgba(6,10,30,.55);display:flex;align-items:center;justify-content:center;padding:16px;font:14px/1.6 "Pretendard Variable","Malgun Gothic","Apple SD Gothic Neo",sans-serif;color:#141A33}'
      + '#smPop .box{background:#fff;border-radius:20px;max-width:720px;width:100%;max-height:92vh;overflow:auto;box-shadow:0 30px 80px -10px rgba(0,0,0,.5)}'
      + '#smPop .hd{background:linear-gradient(100deg,#071463,#0B1F8A 60%,#1E36B8);color:#fff;padding:18px 22px;border-radius:20px 20px 0 0}#smPop .hd b{font-size:17px;display:block}#smPop .hd small{opacity:.8}'
      + '#smPop .bd{padding:18px 22px}#smPop h4{margin:14px 0 8px;font-size:14.5px;color:#0B1F8A}#smPop .row{display:flex;gap:8px;flex-wrap:wrap}'
      + '#smPop button.b{border:1px solid #D5DAE6;background:#fff;border-radius:12px;padding:10px 14px;font:inherit;font-weight:700;cursor:pointer;color:#141A33}#smPop button.b:hover{border-color:#0B1F8A}'
      + '#smPop button.p{background:#0B1F8A;color:#fff;border-color:#0B1F8A}#smPop button.g{background:#1B7A34;color:#fff;border-color:#1B7A34}#smPop button:disabled{opacity:.5;cursor:not-allowed}'
      + '#smPop .note{background:#F1F4FA;border-radius:12px;padding:10px 12px;font-size:13px;color:#2C3554}#smPop .sh{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0}#smPop .sh span{background:#EEF1FA;border-radius:999px;padding:3px 10px;font-size:12px;font-weight:600}'
      + '#smPop .k{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}#smPop .k div{background:#F5F7FB;border-radius:12px;padding:8px 10px}#smPop .k b{display:block;font-size:20px;color:#0B1F8A}#smPop .k small{color:#5D6678}'
      + '#smPop .err{background:#FDECEC;color:#8A1C1C;border-radius:10px;padding:8px 12px;font-size:12.5px;margin:6px 0}#smPop .warn{background:#FFF6E5;color:#7A4A00;border-radius:10px;padding:8px 12px;font-size:12.5px;margin:6px 0}'
      + '#smPop ul{margin:4px 0;padding-left:18px}#smPop .ft{display:flex;justify-content:space-between;align-items:center;padding:12px 22px 18px;color:#8A1C34;font:italic 13px "Great Vibes",Georgia,serif}'
      + '@media print{#smBtn,#smPop{display:none!important}}';
    document.head.appendChild(st);
  }
  function close() { var p = document.getElementById('smPop'); if (p) p.remove(); }
  function open() {
    if (!CFG) return; css(); close(); var P = programSpec(CFG.code);
    var el = document.createElement('div'); el.id = 'smPop';
    el.innerHTML = '<div class="box" role="dialog" aria-modal="true"><div class="hd"><b>📂 자료 입력 · 불러오기</b><small>' + esc(P.en) + ' · ' + esc(P.ko) + '</small></div><div class="bd">'
      + '<div class="note">' + esc(P.what) + '<div class="sh">' + P.sheets.map(function (s) { return '<span>' + esc(s.sheet) + '</span>'; }).join('') + '</div>'
      + '회사 · 조직 · 사업장은 <b>9개 프로그램 공통 기준정보</b>로 저장되어 다른 프로그램에도 함께 반영됩니다(제작자 · 관리자만 저장).</div>'
      + '<h4>① 입력 양식 받기</h4><div class="row"><button class="b p" data-a="tpl">📥 빈 양식(엑셀)</button><button class="b" data-a="cur">📥 지금 자료 채운 양식</button><button class="b" data-a="pdf">📄 작성 안내서(PDF)</button></div>'
      + '<h4>② 작성한 엑셀 불러오기</h4><div class="row"><button class="b g" data-a="pick">📤 엑셀 파일 고르기</button><input type="file" accept=".xlsx" hidden id="smFile"></div><div id="smPrev"></div>'
      + '<p id="smMsg" style="color:#5D6678;font-size:12.5px;margin:10px 0 0">' + (cache().at ? '공통 기준정보: 회사 ' + companies().length + ' · 조직 ' + orgs().length + ' · 사업장 ' + sites().length + '건 (마지막 변경 ' + String(cache().at).slice(0, 16).replace('T', ' ') + ')' : '공통 기준정보가 아직 비어 있습니다 — 지금은 기존 에스텍베스트 자료로 동작합니다.') + '</p>'
      + '</div><div class="ft"><button class="b" data-a="x" style="font-style:normal;font-family:inherit">닫기</button><span>Designed &amp; Developed by Rat Rae Choi</span></div></div>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) { if (e.target === el) close(); });
    var msg = function (t) { el.querySelector('#smMsg').innerHTML = t; };
    el.querySelectorAll('button[data-a]').forEach(function (b) {
      b.onclick = function () {
        var a = b.dataset.a;
        if (a === 'x') return close();
        if (a === 'pdf') return root.open(pdfUrl(CFG.code), '_blank');
        if (a === 'pick') return el.querySelector('#smFile').click();
        if ((a === 'tpl' || a === 'cur') && CFG.template) { CFG.template(a === 'cur'); return; }
        b.disabled = true; msg('양식을 만드는 중…');
        loadExcel().then(function (X) { var wb = buildWorkbook(X, CFG.code, { fill: a === 'cur' }); return wb.xlsx.writeBuffer(); })
          .then(function (buf) { download(fileName(CFG.code, a === 'cur'), buf); msg('양식을 내려받았습니다. 엑셀에 작성한 뒤 「② 엑셀 파일 고르기」로 불러오세요.'); })
          .catch(function (e) { msg('⚠️ ' + esc(e.message || e)); }).then(function () { b.disabled = false; });
      };
    });
    el.querySelector('#smFile').onchange = function (ev) {
      var f = ev.target.files[0]; ev.target.value = ''; if (!f) return; var box = el.querySelector('#smPrev'); box.innerHTML = '<p>읽는 중…</p>';
      loadExcel().then(function (X) { return f.arrayBuffer().then(function (ab) { var wb = new X.Workbook(); return wb.xlsx.load(ab).then(function () { return wb; }); }); })
        .then(function (wb) { preview(box, f, plan(wb, CFG.code)); })
        .catch(function (e) { box.innerHTML = '<div class="err">⛔ ' + esc(e.message || e) + '</div>'; });
    };
  }
  function preview(box, f, R) {
    var S = R.sheets, M = {};
    ALL.forEach(function (k) { if (S[k] && S[k].length) M[k] = mergeList(k, S[k]); });
    var exN = Object.keys(R.extra).reduce(function (a, k) { return a + R.extra[k].length; }, 0);
    var kpi = function (k, t) { var m = M[k]; return '<div><small>' + t + '</small><b>' + (m ? '+' + m.add + ' / ✎' + m.upd : '-') + '</b><small>새로 · 바뀜</small></div>'; };
    var li = function (a) { return '<ul>' + a.slice(0, 30).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + (a.length > 30 ? '<li>… 외 ' + (a.length - 30) + '건</li>' : '') + '</ul>'; };
    var nothing = !Object.keys(M).length && !exN;
    box.innerHTML = '<h4>미리보기 — ' + esc(f.name) + '</h4><div class="k">' + kpi('companies', '회사') + kpi('orgs', '조직') + kpi('sites', '사업장') + '</div>'
      + (exN ? '<div class="note">이 프로그램 전용 자료: ' + Object.keys(R.extra).map(function (k) { return esc(k) + ' ' + R.extra[k].length + '줄'; }).join(' · ') + '</div>' : '')
      + (R.err.length ? '<div class="err"><b>⛔ 고쳐야 적용할 수 있습니다 ' + R.err.length + '건</b>' + li(R.err) + '</div>' : '')
      + (R.warn.length ? '<div class="warn"><b>⚠ 확인 ' + R.warn.length + '건</b>' + li(R.warn) + '</div>' : '')
      + (nothing ? '<div class="warn">읽을 자료가 없습니다. 양식의 시트 이름 · 머리글을 바꾸지 않았는지 확인하세요.</div>' : '')
      + '<div class="row" style="margin-top:10px"><button class="b p" id="smGo" ' + (R.err.length || nothing ? 'disabled' : '') + '>✔ 적용하기</button></div>';
    var go = box.querySelector('#smGo');
    go.onclick = function () {
      go.disabled = true; var done = [], tasks = Object.keys(M);
      var step = function (i) {
        if (i >= tasks.length) return Promise.resolve();
        var k = tasks[i]; if (!M[k].add && !M[k].upd) return step(i + 1);
        return save(k, M[k].list, f.name).then(function () { done.push({ companies: '회사', orgs: '조직', sites: '사업장' }[k] + ' +' + M[k].add + ' ✎' + M[k].upd); return step(i + 1); });
      };
      var soft = '';
      step(0).catch(function (e) { if (!CFG.softCommon) throw e; soft = ' (공통 기준정보는 저장하지 못했습니다: ' + (e.message || e) + ')'; }).then(function () {
        var t = (done.length ? '공통 기준정보 저장: ' + done.join(' · ') + '.' : '') + soft;
        return Promise.resolve(CFG.apply ? CFG.apply(R, f) : null).then(function (m) {
          box.innerHTML = '<div class="note">✅ 적용했습니다. ' + esc(t) + ' ' + esc(m || '') + '<br>바뀐 회사 · 조직 · 사업장은 화면을 새로고침하면 이 프로그램과 다른 프로그램에 나타납니다.</div><div class="row" style="margin-top:8px"><button class="b p" onclick="location.reload()">🔄 지금 새로고침</button></div>';
        });
      }).catch(function (e) {
        go.disabled = false;
        var m = String(e.message || e); if (/제작자|관리자|권한/.test(m)) m += ' — 회사 · 조직 · 사업장은 제작자 · 관리자 계정으로 불러와 주세요.';
        if (/master_get|admin_master_put|function/.test(m)) m = '서버에 기준정보 기능이 아직 없습니다(supabase_master.sql 실행 필요).';
        box.insertAdjacentHTML('beforeend', '<div class="err">⛔ ' + esc(m) + '</div>');
      });
    };
  }
  function register(cfg) {
    CFG = cfg || {}; if (!CFG.code) return;
    var add = function () {
      if (document.getElementById('smBtn') || CFG.button === false) return; css();
      var b = document.createElement('button'); b.id = 'smBtn'; b.type = 'button'; b.title = '자료 입력 양식(엑셀) · 작성 안내서(PDF) · 엑셀 불러오기'; b.textContent = '📂 자료';
      if (CFG.btnStyle) b.setAttribute('style', CFG.btnStyle);
      b.onclick = open; document.body.appendChild(b);
    };
    if (document.body) add(); else document.addEventListener('DOMContentLoaded', add);
  }

  /* ---------------- 시작: 서버에서 최신 기준정보 받기 ---------------- */
  var started = false;
  function start() {
    if (started) return; started = true;
    setTimeout(function () {
      refresh().then(function (ch) {
        if (!ch || !document.body) return;
        var n = document.createElement('div');
        n.setAttribute('style', 'position:fixed;left:50%;transform:translateX(-50%);bottom:64px;z-index:9500;background:#0B1F8A;color:#fff;padding:9px 16px;border-radius:999px;font:600 13px "Pretendard Variable","Malgun Gothic",sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.3)');
        n.innerHTML = '🏢 회사 · 조직 · 사업장 기준정보가 바뀌었습니다 <button style="margin-left:8px;border:0;border-radius:999px;padding:3px 10px;font-weight:700;cursor:pointer" onclick="location.reload()">새로고침</button>';
        document.body.appendChild(n); setTimeout(function () { n.remove(); }, 15000);
      }).catch(function () { });
    }, 1200);
  }
  if (typeof document !== 'undefined') start();

  var api = { MAIN: MAIN, SPEC: C, PROGRAMS: PROGRAMS, ORG_TYPES: ORG_TYPES, programSpec: programSpec, cache: cache, refresh: refresh, save: save,
    companies: companies, orgs: orgs, sites: sites, orgKey: orgKey, orgOf: orgOf, companyInfo: companyInfo, color: color,
    branchKeys: branchKeys, colors: colors, mergeBranchObjs: mergeBranchObjs, mergeSites: mergeSites,
    buildWorkbook: buildWorkbook, loadExcel: loadExcel, plan: plan, mergeList: mergeList, readSheet: readSheet,
    register: register, open: open, pdfUrl: pdfUrl, fileName: fileName, norm: norm };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.StecMaster = api;
})(typeof window !== 'undefined' ? window : this);
