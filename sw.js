/* S-Tec Operations and Sales Integrated Management System — 앱 설치용 서비스 워커
   화면은 저장해 두지 않고 늘 최신 버전을 서버에서 받습니다(업데이트 즉시 반영).
   Designed & Developed by Rat Rae Choi */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
