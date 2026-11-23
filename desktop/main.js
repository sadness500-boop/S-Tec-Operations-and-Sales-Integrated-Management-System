/* 에스텍 운영 및 영업 통합관리 시스템 — 윈도우 PC 프로그램 (Electron)
 * 화면은 GitHub Pages 의 최신 웹을 그대로 불러오므로, 화면만 바뀔 때는 다시 설치할 필요가 없습니다.
 * Designed & Developed by Rat Rae Choi */
const { app, BrowserWindow, Menu, shell, dialog, session, net } = require('electron');
const path = require('path');

const HOME = 'https://sadness500-boop.github.io/S-Tec-Operations-and-Sales-Integrated-Management-System/';
const REPO = 'sadness500-boop/S-Tec-Operations-and-Sales-Integrated-Management-System';
const SETUP_URL = `https://github.com/${REPO}/releases/download/pc-latest/S-Tec-Operations-PC-Setup.exe`;
// 프로그램 안에서 열어도 되는 주소(12개 프로그램 · 로그인 서버) — 나머지는 기본 브라우저로
const INSIDE = [/^https:\/\/sadness500-boop\.github\.io\//i, /^https:\/\/[a-z0-9-]+\.supabase\.co\//i];
const inside = u => INSIDE.some(r => r.test(u));
// 💻 PC 프로그램 사용 스위치 — 제작자가 관리 콘솔에서 켜면 PC 프로그램만 멈춤 (웹 · 안드로이드 앱은 그대로)
const SB_URL = 'https://mnsuebexlzhvomxhrear.supabase.co', SB_KEY = 'sb_publishable_QAD9rHyR_zI8Oyl30VuXqw_tDof_Ctx';
let BLOCK = { blocked: false, message: '' }, onBlockPage = false;
async function pcStatus() {
  try {
    const r = await net.fetch(SB_URL + '/rest/v1/rpc/pc_status', { method: 'POST', cache: 'no-store',
      headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY, 'Content-Type': 'application/json' }, body: '{}' });
    if (r.ok) { const j = await r.json(); if (j && typeof j.blocked === 'boolean') BLOCK = j; }
  } catch (e) { /* 확인을 못 하면 지난 상태 그대로 (인터넷이 없으면 어차피 화면이 안 열림) */ }
  return BLOCK;
}
function showBlock() {
  onBlockPage = true;
  win.loadFile(path.join(__dirname, 'blocked.html'), { query: { m: BLOCK.message || '' } });
}
async function guard(url) {   // 화면을 열기 전에 확인
  await pcStatus();
  if (BLOCK.blocked) showBlock(); else { onBlockPage = false; win.loadURL(url || HOME); }
}

app.setAppUserModelId('kr.stecbest.operations.pc');
if (!app.requestSingleInstanceLock()) { app.quit(); }
let win = null;

function newer(a, b) {   // a > b ?
  const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d > 0; }
  return false;
}
async function checkUpdate() {
  try {
    const r = await net.fetch(HOME + 'version.json?ts=' + Date.now(), { cache: 'no-store' });
    const v = await r.json();
    if (v && v.pc_min && newer(v.pc_min, app.getVersion())) {   // 화면은 늘 최신 — 설치 파일은 꼭 필요할 때만 새로
      const { response } = await dialog.showMessageBox(win, { type: 'info', buttons: ['새 설치 파일 받기', '나중에'], defaultId: 0, cancelId: 1,
        title: '새 PC 프로그램', message: `PC 프로그램 새 버전(v${v.version})이 있습니다.`, detail: '설치 파일을 받아 실행하면 지금 프로그램 위에 그대로 덮어 설치됩니다.' });
      if (response === 0) shell.openExternal(SETUP_URL);
    }
  } catch (e) { /* 인터넷이 없으면 넘어감 */ }
}

function buildMenu() {
  const t = [
    { label: '프로그램', submenu: [
      { label: '처음 화면', accelerator: 'Alt+Home', click: () => win && guard(HOME) },
      { label: '뒤로', accelerator: 'Alt+Left', click: () => win && win.webContents.navigationHistory.canGoBack() && win.webContents.navigationHistory.goBack() },
      { label: '앞으로', accelerator: 'Alt+Right', click: () => win && win.webContents.navigationHistory.canGoForward() && win.webContents.navigationHistory.goForward() },
      { label: '새로고침', accelerator: 'F5', click: () => win && (onBlockPage ? guard(HOME) : win.webContents.reload()) },
      { label: '새로고침(저장된 화면 무시)', accelerator: 'Ctrl+F5', click: () => win && win.webContents.reloadIgnoringCache() },
      { type: 'separator' },
      { label: '인쇄', accelerator: 'Ctrl+P', click: () => win && win.webContents.print() },
      { type: 'separator' },
      { label: '끝내기', role: 'quit' } ] },
    { label: '보기', submenu: [
      { label: '크게', accelerator: 'Ctrl+=', role: 'zoomIn' }, { label: '작게', accelerator: 'Ctrl+-', role: 'zoomOut' },
      { label: '원래 크기', accelerator: 'Ctrl+0', role: 'resetZoom' }, { type: 'separator' },
      { label: '전체 화면', accelerator: 'F11', role: 'togglefullscreen' } ] },
    { label: '도움말', submenu: [
      { label: '사용자 매뉴얼', click: () => win && guard(HOME + 'manual.html') },
      { label: '새 설치 파일 받기', click: () => shell.openExternal(SETUP_URL) },
      { label: `버전 정보 (v${app.getVersion()})`, click: () => dialog.showMessageBox(win, { type: 'info', title: '버전 정보',
          message: '에스텍 운영 및 영업 통합관리 시스템 — PC 프로그램', detail: `v${app.getVersion()}\n화면은 인터넷의 최신 버전을 불러옵니다.\n\nDesigned & Developed by Rat Rae Choi` }) } ] }
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(t));
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 900, minWidth: 900, minHeight: 600, show: false,
    title: '에스텍 운영 및 영업 통합관리 시스템', icon: path.join(__dirname, 'build', 'icon.png'), backgroundColor: '#0d1b3e',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true, spellcheck: false }
  });
  win.once('ready-to-show', () => { win.maximize(); win.show(); });

  // 새 창 · 링크: 우리 프로그램이면 새 창으로, 그 밖(지도 · 외부 사이트 등)은 기본 브라우저로
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (inside(url)) return { action: 'allow', overrideBrowserWindowOptions: { autoHideMenuBar: true, icon: path.join(__dirname, 'build', 'icon.png') } };
    if (/^(https?:|mailto:|tel:)/i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e, url) => {
    if (!inside(url) && /^https?:/i.test(url)) { e.preventDefault(); shell.openExternal(url); return; }
    if (onBlockPage || BLOCK.blocked) { e.preventDefault(); guard(url); }   // 멈춤 화면의 「다시 확인」 · 멈춤 중 이동
  });

  // 인터넷이 끊겼을 때 안내 화면
  win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => {
    if (isMain && code !== -3 && !onBlockPage) win.loadFile(path.join(__dirname, 'offline.html'), { query: { u: url || HOME } });
  });
  win.on('page-title-updated', (e) => { e.preventDefault(); });
  guard(HOME);
  setInterval(async () => {   // 2분마다 스위치 확인
    const was = BLOCK.blocked; await pcStatus();
    if (BLOCK.blocked && !onBlockPage) { BrowserWindow.getAllWindows().forEach(w => { if (w !== win) w.close(); }); showBlock(); }
    else if (!BLOCK.blocked && was && onBlockPage) guard(HOME);
  }, 120000);
}

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => {
  // 파일 내려받기: 「다른 이름으로 저장」 창
  session.defaultSession.on('will-download', (e, item) => { item.setSaveDialogOptions({ title: '파일 저장' }); });
  buildMenu(); createWindow(); setTimeout(checkUpdate, 4000);
});
app.on('window-all-closed', () => app.quit());
