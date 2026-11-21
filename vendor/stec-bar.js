/* =====================================================================
 * 에스텍 통합관리시스템 공통 상단 버튼 (stec-bar) v1.0
 * 메인 프로그램 + 11개 프로그램이 똑같이 씁니다.
 *  📘 사용자 매뉴얼 · 👤 내 정보 · QR · 친구추천 · − 100% + · 주간/야간/시스템 · 관리 콘솔 · 계정
 *  ● 관리 콘솔: 제작자 → 「제작자 관리 콘솔」, 조직 관리자 → 「조직관리자 관리콘솔」(맡은 조직 · 받은 권한만), 그 밖에는 보이지 않음
 *  ● 각 프로그램의 QR · 친구추천 · 테마 · 계정 · 담당 카드 기능은 그대로 쓰고 모양만 통일합니다.
 * 사용법: 이 스크립트 앞에 window.STEC_BAR_CFG = { app, auth, before|into, hide:[...], qr, share, acct, mine, theme:{attr, scope}, zoomKey } 를 둡니다.
 * Designed & Developed by Rat Rae Choi
 * ===================================================================== */
(function () {
  'use strict';
  const CFG = window.STEC_BAR_CFG || {};
  if (window.STEC_BAR) return;
  const MAIN = 'https://sadness500-boop.github.io/S-Tec-Operations-and-Sales-Integrated-Management-System/';
  const MAN = {
    user: { docx: MAIN + 'manuals/stec-user-manual.docx', pptx: MAIN + 'manuals/stec-user-manual.pptx', name: '에스텍_통합관리시스템_사용자매뉴얼' }
  };
  /* 제작자 관리매뉴얼은 공개 주소에 두지 않습니다 — 서버의 제작자 전용 보관함(owner-docs)에서 제작자 계정에게만 내려줍니다 */
  const OWNER_BUCKET = 'owner-docs';
  const APP_NAMES = { stim: '통합관리 시스템(메인)', stso: '사업장 현황 지도', ams: '근태관리', stcr: '고객 불만처리', stlr: '법률 대응 시스템', stqs: '용역인력 견적', wbe: '업무량 기반 산정', stse: '단기인력 견적', stpp: '제안서 제작시스템', stos: '업무표준화 · 매뉴얼', stpm: '성과 관리 시스템', stac: '통합 출입관리 시스템' };
  const H = CFG.hooks || {};
  const $ = s => { try { return s ? document.querySelector(s) : null; } catch (e) { return null; } };
  const E = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const tip = m => { try { (window.toast || window.tip || alert)(m); } catch (e) { } };
  const AU = () => (CFG.auth && window[CFG.auth]) || window.APP_AUTH || null;
  const prof = () => { try { return H.profile ? H.profile() : (AU() && AU().profile) || null; } catch (e) { return null; } };
  const cli = () => { try { return H.client ? H.client() : (AU() && AU().client) || null; } catch (e) { return null; } };

  /* ---------- 아이콘 (선 아이콘 한 벌) ---------- */
  const P = {
    book: '<path d="M2 4.5h6a4 4 0 0 1 4 4V21a3 3 0 0 0-3-3H2z"/><path d="M22 4.5h-6a4 4 0 0 0-4 4V21a3 3 0 0 1 3-3h7z"/>',
    me: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="11" r="2.6"/><path d="M5.6 17a3.6 3.6 0 0 1 6.8 0"/><path d="M14.5 10h4M14.5 14h3"/>',
    qr: '<rect x="3" y="3" width="7" height="7" rx="1.2"/><rect x="14" y="3" width="7" height="7" rx="1.2"/><rect x="3" y="14" width="7" height="7" rx="1.2"/><path d="M14 14h3v3h-3zM20 14v.01M14 20.5h.01M17.5 17.5H21V21h-3.5z"/>',
    share: '<circle cx="9" cy="8" r="3.6"/><path d="M2.5 20.5a6.5 6.5 0 0 1 13 0"/><path d="M19 7.5v6M16 10.5h6"/>',
    minus: '<path d="M5 12h14"/>', plus: '<path d="M12 5v14M5 12h14"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>',
    moon: '<path d="M20.5 13.4A8.5 8.5 0 1 1 10.6 3.5a6.6 6.6 0 0 0 9.9 9.9z"/>',
    sys: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    shield: '<path d="M12 2.8l7.6 2.9v5.9c0 4.8-3.3 8.2-7.6 9.6-4.3-1.4-7.6-4.8-7.6-9.6V5.7z"/><path d="M8.8 12l2.2 2.2 4.3-4.4"/>',
    org: '<rect x="9" y="2.8" width="6" height="4.6" rx="1"/><rect x="2.8" y="16.6" width="6" height="4.6" rx="1"/><rect x="15.2" y="16.6" width="6" height="4.6" rx="1"/><path d="M12 7.4v4.6M5.8 16.6V12h12.4v4.6"/>',
    acct: '<circle cx="12" cy="12" r="9.2"/><circle cx="12" cy="10" r="3.2"/><path d="M6.6 18.6a6.2 6.2 0 0 1 10.8 0"/>',
    down: '<path d="M12 3.5v11M7.5 10l4.5 4.5 4.5-4.5M4.5 20.5h15"/>',
    eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>'
  };
  const I = (k, s) => `<svg class="sb-i" viewBox="0 0 24 24" width="${s || 18}" height="${s || 18}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k]}</svg>`;

  /* ---------- 스타일 ---------- */
  const hide = (CFG.hide || []).join(',');
  const css = `
${hide ? hide + '{display:none!important}' : ''}
.sb-bar{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;font-family:inherit;margin-left:auto}
.sb-bar *{box-sizing:border-box}
.sb-c{display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 12px;border-radius:999px;border:1px solid rgba(15,23,60,.14);background:rgba(255,255,255,.92);color:#16204a;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;white-space:nowrap;transition:background .15s,transform .1s,border-color .15s;line-height:1;text-decoration:none;position:relative}
.sb-c:hover{background:#fff;border-color:rgba(15,23,60,.3)}
.sb-c:active{transform:scale(.96)}
.sb-c.ic{width:38px;padding:0;justify-content:center}
.sb-c .sb-i{flex:0 0 auto}
.sb-c.man{background:linear-gradient(135deg,#1b7a34,#1f9a45);border-color:transparent;color:#fff}
.sb-c.con{background:#eef2ff;color:#1530a0;border-color:rgba(21,48,160,.25)}
.sb-c.con.mg{background:#eaf7ef;color:#17552f;border-color:rgba(23,85,47,.3)}
.sb-c.acc{background:#0f1a4d;color:#fff;border-color:#0f1a4d}
.sb-c .nb{position:absolute;top:-6px;right:-6px;min-width:19px;height:19px;padding:0 5px;border-radius:999px;background:#e34234;color:#fff;font-size:11px;font-weight:800;display:grid;place-items:center}
.sb-g{display:inline-flex;align-items:center;height:38px;padding:3px;border-radius:999px;border:1px solid rgba(15,23,60,.14);background:rgba(255,255,255,.92)}
.sb-g button{height:30px;min-width:30px;padding:0 8px;border:0;border-radius:999px;background:none;color:#16204a;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font:inherit;font-size:12.5px;font-weight:800;opacity:.6}
.sb-g button:hover{opacity:1}
.sb-g button.on{background:#16204a;color:#fff;opacity:1}
.sb-g .zv{min-width:48px;opacity:1}
.sb-bar.dk .sb-c,.sb-bar.dk .sb-g{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.2);color:#fff}
.sb-bar.dk .sb-c:hover{background:rgba(255,255,255,.2)}
.sb-bar.dk .sb-g button{color:#fff}
.sb-bar.dk .sb-g button.on{background:#fff;color:#0f1a4d}
.sb-bar.dk .sb-c.man{background:linear-gradient(135deg,#1b7a34,#22a04a);border-color:transparent}
.sb-bar.dk .sb-c.con{background:rgba(120,150,255,.22);border-color:rgba(160,180,255,.45);color:#fff}
.sb-bar.dk .sb-c.con.mg{background:rgba(60,190,110,.22);border-color:rgba(120,220,160,.45)}
.sb-bar.dk .sb-c.acc{background:#fff;color:#0f1a4d;border-color:#fff}
@media (max-width:1500px){ .sb-c .sb-t.opt{display:none} .sb-c.opt-ic{width:38px;padding:0;justify-content:center} }
@media (max-width:900px){ .sb-c .sb-t{display:none} .sb-c{width:38px;padding:0;justify-content:center} .sb-g .zv{min-width:40px} }
#sbPop{position:fixed;inset:0;z-index:99995;background:rgba(6,10,40,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit}
#sbPop.hidden,#sbMan.hidden{display:none}
.sb-box{width:100%;max-width:440px;max-height:92vh;overflow:auto;background:#fff;color:#141a3a;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.35);padding:22px 22px 14px}
.sb-box h3{margin:0 0 6px;font-size:18px;display:flex;align-items:center;gap:8px}
.sb-box p{margin:0 0 12px;color:#59617f;font-size:13px;line-height:1.6}
.sb-kv{display:grid;grid-template-columns:92px 1fr;gap:7px 10px;margin:8px 0 12px;font-size:13.5px}
.sb-kv dt{color:#6b7391;font-weight:700}.sb-kv dd{margin:0;font-weight:600;word-break:break-all}
.sb-f{display:block;margin:9px 0}.sb-f>span{display:block;font-size:12.5px;font-weight:700;color:#59617f;margin-bottom:5px}
.sb-f input,.sb-f select{width:100%;padding:10px 11px;border:1px solid #d3d9ea;border-radius:10px;font:inherit;font-size:14px;background:#fff;color:#141a3a}
.sb-row{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap}
.sb-btn{flex:1;min-width:120px;border:0;border-radius:12px;padding:11px;font:inherit;font-weight:800;font-size:14px;cursor:pointer;background:#1530a0;color:#fff;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none}
.sb-btn.sec{background:#e3e8fa;color:#1530a0}.sb-btn.gr{background:#1b7a34}
.sb-note{margin:0 0 10px;padding:9px 12px;border-radius:10px;background:#eef3ff;color:#26357a;font-size:12.5px;line-height:1.6}
.sb-sign{margin-top:12px;font-size:11px;color:#8a1c34;font-style:italic;text-align:right;font-family:'Brush Script MT','Segoe Script',cursive}
#sbMan{position:fixed;inset:0;z-index:99980;background:#0b1440;display:flex;flex-direction:column;font-family:inherit}
#sbMan .mh{display:flex;align-items:center;gap:8px;padding:10px 14px;color:#fff;background:linear-gradient(90deg,#0b1757,#1530a0);flex-wrap:wrap}
#sbMan .mh b{font-size:16px;margin-right:auto;display:flex;align-items:center;gap:8px}
#sbMan .mh a,#sbMan .mh button{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 13px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.12);color:#fff;font:inherit;font-size:13px;font-weight:700;cursor:pointer;text-decoration:none}
#sbMan .mh .x{background:#fff;color:#0b1757}
#sbMan iframe{flex:1;border:0;width:100%;background:#fff}
`;
  const st = document.createElement('style'); st.id = 'sbCss'; st.textContent = css; document.head.appendChild(st);

  /* ---------- 상태 ---------- */
  const S = { org: null, orgAt: 0, orgUser: null };
  async function loadOrg(force) {
    const p = prof(), c = cli();
    if (!p || !c) { S.org = null; S.orgUser = null; return; }
    if (!force && S.orgUser === p.id && Date.now() - S.orgAt < 60000) return;
    S.orgUser = p.id; S.orgAt = Date.now();
    try { const { data, error } = await c.rpc('my_org_info'); S.org = !error && data && data.ok ? data : null; } catch (e) { S.org = null; }
    render();
  }
  const isOwner = () => { const p = prof(); return !!(p && p.role === 'owner'); };
  const isMgr = () => !!(S.org && S.org.manager);
  function consoleKind() {
    const p = prof(); if (!p) return null;
    if (p.role === 'owner') return 'owner';
    if (isMgr()) return 'mgr';
    if (p.role === 'admin') return 'admin';
    return null;
  }
  const CON_LABEL = { owner: '제작자 관리 콘솔', mgr: '조직관리자 관리콘솔', admin: '관리자 관리콘솔' };
  function consoleLabel() { const k = consoleKind(); return k ? CON_LABEL[k] : ''; }

  /* ---------- 화면 크기 ---------- */
  const ZK = CFG.zoomKey || ('stec_zoom_' + (CFG.app || 'app'));
  const zGet = () => { try { return parseFloat(localStorage.getItem(ZK)) || 1; } catch (e) { return 1; } };
  function zSet(z, quiet) {
    z = Math.round(Math.min(1.6, Math.max(0.5, z)) * 100) / 100;
    document.documentElement.style.zoom = z === 1 ? '' : String(z);
    try { localStorage.setItem(ZK, String(z)); } catch (e) { }
    if (H.zoom) try { H.zoom(z); } catch (e) { }
    const v = document.querySelector('.sb-bar .zv'); if (v) v.textContent = Math.round(z * 100) + '%';
    if (!quiet) tip('화면 크기 ' + Math.round(z * 100) + '%');
  }
  if (!CFG.noZoomInit) { const z0 = zGet(); if (z0 !== 1) document.documentElement.style.zoom = String(z0); }

  /* ---------- 테마 ---------- */
  const TH = CFG.theme || { attr: 'data-theme-set' };
  const thBtn = t => $((TH.scope ? TH.scope + ' ' : '') + `[${TH.attr}="${t}"]`);
  function thCur() {
    for (const t of ['light', 'dark', 'system']) { const b = thBtn(t); if (b && (b.classList.contains('on') || b.classList.contains('active') || b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-checked') === 'true')) return t; }
    return null;
  }

  /* ---------- 상단 막대 ---------- */
  let bar = null;
  function host() {
    let el = null;
    if (CFG.before) { const b = $(CFG.before); if (b && b.parentNode) { el = document.createElement('div'); b.parentNode.insertBefore(el, b); } }
    else if (CFG.into) { const p = $(CFG.into); if (p) { el = document.createElement('div'); p.appendChild(el); } }
    return el;
  }
  function darkBg(el) {
    let n = el && el.parentElement;
    while (n && n !== document.documentElement) {
      const cs = getComputedStyle(n), m = cs.backgroundColor.match(/[\d.]+/g);
      if (m && (m.length < 4 || +m[3] > 0.5)) { const [r, g, b] = m.map(Number); return (0.299 * r + 0.587 * g + 0.114 * b) < 140; }
      if (cs.backgroundImage && cs.backgroundImage !== 'none') { const c = getComputedStyle(n).color.match(/[\d.]+/g); if (c) { const [r, g, b] = c.map(Number); return (0.299 * r + 0.587 * g + 0.114 * b) > 150; } }
      n = n.parentElement;
    }
    return false;
  }
  function render() {
    if (!bar) { bar = host(); if (!bar) return; bar.className = 'sb-bar'; bar.id = 'stecBar'; bar.addEventListener('click', onClick); }
    const p = prof(), k = consoleKind(), th = thCur(), pend = S.org && S.org.pending;
    const has = s => !!(s && $(s));
    bar.classList.toggle('dk', darkBg(bar));
    bar.innerHTML =
      `<button type="button" class="sb-c man" data-a="manual" title="사용자 매뉴얼 — 보기 · Word · PPT 내려받기">${I('book')}<span class="sb-t">사용자 매뉴얼</span></button>` +
      `<button type="button" class="sb-c ic" data-a="me" title="내 정보 — 이름 · 연락처 · 소속 조직 · 관리범위">${I('me')}</button>` +
      (has(CFG.qr) ? `<button type="button" class="sb-c ic" data-a="qr" title="다운로드 QR — 사이트 주소 · 북마크">${I('qr')}</button>` : '') +
      (has(CFG.share) ? `<button type="button" class="sb-c ic" data-a="share" title="친구추천 — 주소 · QR 보내기">${I('share')}</button>` : '') +
      `<span class="sb-g" title="프로그램 화면 크기"><button type="button" data-a="z-" title="화면 줄이기">${I('minus', 16)}</button><button type="button" class="zv" data-a="z0" title="100%로">${Math.round(zGet() * 100)}%</button><button type="button" data-a="z+" title="화면 키우기">${I('plus', 16)}</button></span>` +
      (thBtn('light') ? `<span class="sb-g" title="화면 밝기"><button type="button" data-a="th" data-t="light" class="${th === 'light' ? 'on' : ''}" title="주간">${I('sun', 17)}</button><button type="button" data-a="th" data-t="dark" class="${th === 'dark' ? 'on' : ''}" title="야간">${I('moon', 16)}</button><button type="button" data-a="th" data-t="system" class="${th === 'system' ? 'on' : ''}" title="시스템">${I('sys', 17)}</button></span>` : '') +
      (k ? `<button type="button" class="sb-c con${k === 'mgr' ? ' mg' : ''}" data-a="console" title="${E(CON_LABEL[k])}">${I(k === 'mgr' ? 'org' : 'shield')}<span class="sb-t">${E(CON_LABEL[k])}</span>${pend ? `<span class="nb">${pend > 99 ? '99+' : pend}</span>` : ''}</button>` : '') +
      `<button type="button" class="sb-c acc" data-a="acct" title="내 계정 — 로그인 · 비밀번호 · 로그아웃">${I('acct')}<span class="sb-t">${E(p ? (p.name || p.email || '내 계정') : '로그인')}</span></button>`;
  }
  function clickSel(s) { const el = $(s); if (el) { el.click(); return true; } return false; }
  function onClick(e) {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'manual') return openManual();
    if (a === 'me') return openMe();
    if (a === 'qr') return H.qr ? H.qr() : clickSel(CFG.qr);
    if (a === 'share') return H.share ? H.share() : clickSel(CFG.share);
    if (a === 'z-' || a === 'z+') return zSet(zGet() + (a === 'z+' ? 0.1 : -0.1));
    if (a === 'z0') return zSet(1);
    if (a === 'th') { const t = b.dataset.t; if (H.theme) H.theme(t); else clickSel((TH.scope ? TH.scope + ' ' : '') + `[${TH.attr}="${t}"]`); setTimeout(render, 60); return; }
    if (a === 'console') return openConsole();
    if (a === 'acct') return H.acct ? H.acct() : clickSel(CFG.acct);
  }

  /* ---------- 팝업 ---------- */
  function pop(html) {
    let d = document.getElementById('sbPop');
    if (!d) { d = document.createElement('div'); d.id = 'sbPop'; d.addEventListener('click', e => { if (e.target === d) closePop(); }); document.body.appendChild(d); }
    d.className = ''; d.innerHTML = `<div class="sb-box">${html}<div class="sb-sign">Designed &amp; Developed by Rat Rae Choi</div></div>`;
    return d;
  }
  function closePop() { const d = document.getElementById('sbPop'); if (d) { d.className = 'hidden'; d.innerHTML = ''; } }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closePop(); closeManual(); } });

  /* ---------- 관리 콘솔 ---------- */
  function openConsole() {
    const k = consoleKind(); if (!k) { tip('관리 콘솔은 제작자와 조직 관리자만 씁니다'); return; }
    if (H.console) return H.console(k);
    window.open(MAIN + '?open=console', '_blank');
  }

  /* ---------- 사용자 매뉴얼 ---------- */
  const dl = (doc, kind) => `<a class="sb-btn${kind === 'pptx' ? ' sec' : ''}" href="${MAN[doc][kind]}" download="${MAN[doc].name}.${kind}" target="_blank" rel="noopener">${I('down', 16)} ${kind === 'docx' ? 'Word' : 'PPT'} 내려받기</a>`;
  function openManual() {
    if (H.manual) return H.manual();
    let m = document.getElementById('sbMan');
    if (!m) { m = document.createElement('div'); m.id = 'sbMan'; document.body.appendChild(m); }
    m.className = '';
    m.innerHTML = `<div class="mh"><b>${I('book', 20)} 사용자 매뉴얼 <small style="font-weight:500;opacity:.75">에스텍 통합관리시스템 · 11개 프로그램 공통</small></b>
      <a href="${MAN.user.docx}" download="${MAN.user.name}.docx" target="_blank" rel="noopener">${I('down', 16)} Word</a>
      <a href="${MAN.user.pptx}" download="${MAN.user.name}.pptx" target="_blank" rel="noopener">${I('down', 16)} PPT</a>
      ${isOwner() ? `<button type="button" id="sbManA">${I('shield', 16)} 제작자 관리매뉴얼</button>` : ''}
      <button type="button" class="x" id="sbManX">${I('x', 16)} 닫기</button></div>
      <iframe src="${MAIN}manual.html?doc=user&embed=1" title="사용자 매뉴얼"></iframe>`;
    document.getElementById('sbManX').onclick = closeManual;
    if (document.getElementById('sbManA')) document.getElementById('sbManA').onclick = () => ownerDocs(CFG.app);
    document.body.style.overflow = 'hidden';
  }
  function closeManual() { const m = document.getElementById('sbMan'); if (m && m.className !== 'hidden') { m.className = 'hidden'; m.innerHTML = ''; document.body.style.overflow = ''; } }

  /* ---------- 제작자 관리매뉴얼 (제작자만 · 서버 비공개 보관함) ---------- */
  async function ownerGet(path) {
    const c = cli(); if (!c || !c.storage) throw new Error('로그인이 필요합니다');
    if (!isOwner()) throw new Error('제작자만 열 수 있습니다');
    const { data, error } = await c.storage.from(OWNER_BUCKET).download(path);
    if (error || !data) throw new Error((error && (error.message || error.error)) || '내려받지 못했습니다');
    return data;
  }
  async function ownerJson(path) { const b = await ownerGet(path); return JSON.parse(await b.text()); }
  async function ownerSave(path, name) {
    try { const b = await ownerGet(path), u = URL.createObjectURL(b), a = document.createElement('a');
      a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); tip('내려받았습니다: ' + name); }
    catch (e) { tip('제작자 관리매뉴얼: ' + (e.message || e)); }
  }
  async function ownerDocs(app) {
    if (!isOwner()) { tip('제작자 관리매뉴얼은 제작자만 볼 수 있습니다'); return; }
    pop(`<h3>${I('shield', 22)} 제작자 관리매뉴얼</h3><p>제작자 계정에서만 보이고 내려받을 수 있습니다(서버 비공개 보관함). 다른 사람은 주소를 알아도 열 수 없습니다.</p><div id="sbOd" class="sb-note">불러오는 중…</div>
      <div class="sb-row"><button type="button" class="sb-btn sec" id="sbOdX">닫기</button></div>`);
    document.getElementById('sbOdX').onclick = closePop;
    let list = [];
    try { list = await ownerJson('index.json'); } catch (e) { const el = document.getElementById('sbOd'); if (el) el.textContent = '불러오지 못했습니다: ' + (e.message || e); return; }
    const rows = list.filter(x => !app || app === 'all' || x.app === app || x.app === 'stim');
    const by = {}; rows.forEach(x => (by[x.app] = by[x.app] || []).push(x));
    const el = document.getElementById('sbOd'); if (!el) return;
    el.className = ''; el.style.cssText = 'max-height:52vh;overflow:auto';
    el.innerHTML = Object.keys(by).map(a => `<div style="margin:10px 0 4px;font-weight:800;color:#1530a0">${E(APP_NAMES[a] || a)}</div>` +
      by[a].map((x, i) => `<div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid #eceff6;font-size:13px"><span style="flex:1;word-break:break-all">${E(x.name)}</span><button type="button" class="sb-btn" style="flex:0 0 auto;min-width:0;padding:7px 12px;font-size:12.5px" data-od="${E(x.path)}" data-nm="${E(x.name)}">${I('down', 15)} 받기</button></div>`).join('')).join('') || '<div class="sb-note">등록된 파일이 없습니다</div>';
    el.querySelectorAll('[data-od]').forEach(b => b.onclick = () => ownerSave(b.dataset.od, b.dataset.nm));
  }

  /* ---------- 내 정보 ---------- */
  async function openMe() {
    const p = prof();
    if (!p) { tip('로그인한 뒤에 볼 수 있습니다'); return H.acct ? H.acct() : clickSel(CFG.acct); }
    await loadOrg(true);
    const o = S.org || {}, sc = p.scope || {};
    const scope = p.role === 'owner' ? '에스텍 그룹 전체 (제작자)' : !sc.level ? '정하지 않음' : sc.level === 'all' ? '전체' + (sc.perm === 'view' ? ' · 보기만' : '') : (sc.label || sc.org || '지정됨') + (sc.perm === 'view' ? ' · 보기만' : '');
    const ROLE = { owner: '제작자', admin: '관리자', user: '사용자' };
    const mine = CFG.mine && $(CFG.mine);
    pop(`<h3>${I('me', 22)} 내 정보</h3>
      <dl class="sb-kv"><dt>아이디</dt><dd>${E(p.email || '-')}</dd><dt>역할</dt><dd>${E(ROLE[p.role] || p.role || '-')}</dd>
        <dt>소속 조직</dt><dd>${E(o.org_path || (p.role === 'owner' ? '에스텍 그룹' : '정하지 않음'))}</dd>
        <dt>관리범위</dt><dd>${E(scope)}</dd>
        ${o.manager ? `<dt>조직 관리자</dt><dd>${E((o.manager.labels || []).join(', ') || '-')}</dd>` : ''}
        <dt>사용기한</dt><dd>${E(p.expires_at || '무기한')}</dd></dl>
      <label class="sb-f"><span>이름</span><input id="sbMeN" value="${E(p.name || '')}" maxlength="40"></label>
      <label class="sb-f"><span>연락처</span><input id="sbMeP" value="${E(p.phone || '')}" maxlength="40" inputmode="tel"></label>
      ${o.need_org ? `<label class="sb-f"><span>소속 조직 고르기 (처음 한 번)</span><select id="sbMeO"><option value="">불러오는 중…</option></select></label>` :
        `<div class="sb-note">${p.role === 'owner' ? '사람마다 소속 조직 · 관리범위는 「제작자 관리 콘솔 → 👥 사용자」에서 바꿉니다.' : '소속 조직 · 관리범위를 바꾸려면 소속 조직 관리자나 제작자에게 요청하세요.'}</div>`}
      ${mine ? `<div class="sb-row"><button type="button" class="sb-btn sec" id="sbMeMine">📝 이 프로그램의 담당자 표기 (견적서 · 보고서 등)</button></div>` : ''}
      <div class="sb-row"><button type="button" class="sb-btn sec" id="sbMeX">닫기</button><button type="button" class="sb-btn" id="sbMeS">저장</button></div>`);
    document.getElementById('sbMeX').onclick = closePop;
    if (mine) document.getElementById('sbMeMine').onclick = () => { closePop(); mine.click(); };
    if (o.need_org) fillOrgs();
    document.getElementById('sbMeS').onclick = async () => {
      const c = cli(); if (!c) return;
      const name = document.getElementById('sbMeN').value.trim(), phone = document.getElementById('sbMeP').value.trim();
      const og = document.getElementById('sbMeO') ? document.getElementById('sbMeO').value : '';
      if (!name) { tip('이름을 적어 주세요'); return; }
      try {
        const r = await c.rpc('update_my_profile', { p_name: name, p_phone: phone, p_dept: null }); if (r.error) throw r.error;
        if (og) { const r2 = await c.rpc('set_my_org', { p_org: og }); if (r2.error) throw r2.error; }
        try { p.name = name; p.phone = phone; } catch (e) { }
        closePop(); tip('내 정보를 저장했습니다'); S.orgAt = 0; loadOrg(true);
        if (H.saved) try { H.saved(); } catch (e) { }
      } catch (e) { tip('저장하지 못했습니다: ' + (e.message || e)); }
    };
  }
  async function fillOrgs() {
    const sel = document.getElementById('sbMeO'); if (!sel) return;
    try {
      const { data, error } = await cli().rpc('public_org_list'); if (error) throw error;
      const by = {}; (data || []).forEach(o => (by[o.parent || ''] = by[o.parent || ''] || []).push(o));
      const out = []; const walk = (pid, d) => (by[pid] || []).forEach(o => { out.push(`<option value="${E(o.id)}" ${o.kind === '그룹' ? 'disabled' : ''}>${'　'.repeat(d)}${E(o.name)}</option>`); walk(o.id, d + 1); });
      walk('', 0);
      sel.innerHTML = '<option value="">— 소속 조직을 고르세요 —</option>' + out.join('');
    } catch (e) { sel.innerHTML = '<option value="">목록을 불러오지 못했습니다</option>'; }
  }

  /* ---------- 시작 ---------- */
  function start() {
    render(); loadOrg(true);
    let last = '';
    setInterval(() => {
      const p = prof(), key = (p ? p.id + p.role + (p.name || '') : '') + '|' + thCur() + '|' + (S.org ? S.org.pending : '') + '|' + darkBg(bar);
      if (key !== last) { last = key; render(); }
      loadOrg(false);
    }, 1200);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

  window.STEC_BAR = { ownerDocs, ownerGet, ownerJson, ownerSave, isOwner, openConsole, consoleLabel, consoleKind, openManual, closeManual, openMe, refresh: () => { S.orgAt = 0; loadOrg(true); }, render, MAIN, MAN, zSet };
})();
