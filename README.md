# S-Tec Operations and Sales Integrated Management System
### 에스텍 운영 및 영업 통합관리 시스템 · v1.9.3

하나의 아이디로 에스텍 11개 프로그램을 쓰는 **메인 프로그램**입니다.
메인 화면에는 11개 프로그램 메뉴가 있고, 제작자는 **관리 콘솔** 한 곳에서 모든 사용자를 관리합니다.

| 순서 | 프로그램 (English) | 한글 | 저장소 |
|---|---|---|---|
| 1 | Attendance Management Software | 근태관리 | Attendance-Management-Software |
| 2 | S-Tec-Business-Site-Overview | 사업장 현황 지도 | S-Tec-Business-Site-Overview |
| 3 | S-Tec-Quotation-System | 용역인력 견적 | S-Tec-Quotation-System |
| 4 | Workload-Based Cost and Labor Estimation Method | 업무량 기반 산정 | Workload-Based-Cost-and-Labor-Estimation-Method |
| 5 | S-Tec short estimate | 단기인력 견적 | S-Ttec-short-estimate |
| 6 | S-Tec-Complaint-Response-System | 고객 불만처리 | S-Tec-Complaint-Response-System |
| 7 | Program for Process Standardization and Manual Creation | 업무표준화·매뉴얼 | Program-for-Process-Standardization-and-Manual-Creation |
| 8 | Legal Response System | 법률 대응 시스템 | S-Tec-Legal-Response-System |
| 9 | S-Tec Proposal Production System | 제안서 제작시스템 | S-Tec-Proposal-Production-System |
| 10 | S-Tec Performance Management System | 성과 관리 시스템 | S-Tec-Performance-Management-System |
| 11 | S-Tec Integrated Access Control System | 통합 출입관리 시스템 | S-Tec-Integrated-Access-Control-System |

- 웹 주소: https://sadness500-boop.github.io/S-Tec-Operations-and-Sales-Integrated-Management-System/
- 미리보기(데모 모드, 서버 연결 없음): 위 주소 끝에 `?demo=1` (일반 사용자 화면은 `?demo=1&as=user`)
- 파일 하나로 여는 배포본: `releases/S-Tec-Operations-and-Sales-Integrated-Management-System_v1.2.0.html`

### 기능
- **통합 로그인** — 11개 프로그램과 같은 Supabase 서버·같은 아이디 · 가입 신청 · 비밀번호 찾기 · 임시 비밀번호 후 변경 강제
- **메인 화면** — 담당 카드 · 다운로드 QR · 친구추천 · 주간/야간/시스템 테마 · 관리범위·사용기한·이 기기 · 프로그램 카드(권한별 표시)
- **제작자 관리 콘솔**
  - 👥 사용자: 가입 승인 · 차단/해제 · 계정 사용기한 · 임시 비밀번호 · 강제 로그아웃 · 역할 · 메모 · 삭제 · 엑셀(CSV)
  - 🔐 프로그램별 권한: 사람 × 프로그램 표 — 사용/사용 안 함 · 프로그램별 사용기한 · 담당 지사
  - 📱 기기: 기기 목록 · 기기 차단/해제
  - 📜 접속기록 · 🧾 관리 작업 기록: 검색 · 엑셀(CSV)
  - ⚙️ 전체 설정: 가입 신청 · 승인 필요 · 기본 사용기간 · 앱 전체 잠금
  - 🧩 프로그램 등록: 새 프로그램 추가 · 시험 공개(제작자·관리자만 보기) · 숨김 · 순서
- **S-Tec Media Wall** — 메인 화면 가운데: 왼쪽 사진(서서히 바뀜) · 오른쪽 영상(재생/정지 · 이전/다음 · 소리 · 음량) · 아래 파노라마 띠 · 분류(근무 영상 · Complaint 사례 · 직원 디오라마 · 3D 피규어)
- **새 버전 안내** — version.json 이 바뀌면 화면 위에 「새로고침」 안내

### 서버 (한 번만)
Supabase → SQL Editor → `server/supabase_integrated.sql` 전체를 붙여넣고 Run.
(프로그램 등록부 · 새 프로그램 권한 · 메인 화면용 함수를 추가합니다. 기존 자료는 지우지 않습니다.)
실행 전에도 메인 프로그램은 기본 10개 프로그램 목록으로 동작합니다.

**회사·조직별 가입자 관리(v1.9.0)** — 이어서 `server/supabase_org_delegation.sql` 전체를 Run.
(조직표 161개 · 조직 관리자 · 조직별 프로그램 공개 · 세부 기능 · ⭐ 개인 추가 권한. 기존 사용자는 소속(부서) 글자로 조직에 연결되고 권한은 그대로 유지됩니다.)
되돌리려면 `server/supabase_org_delegation_rollback.sql` (자료는 남기고 예전 동작으로)

### 폴더
```
index.html            메인 프로그램
demo.js               데모 모드(예시 자료)
auth-config.json      서버 주소·공개키 (secret 키는 절대 넣지 않음)
version.json          현재 버전 — 올리면 사용자 화면에 새 버전 안내
server/               서버 SQL
assets/ icons/        앱 아이콘 · 로고 · 3D 피규어 · 프로그램 아이콘
media/                Media Wall 사진(photo) · 영상(video) · 미리보기(thumb) · media.json
vendor/               supabase-js · QR 만들기
releases/             버전별 배포본(HTML · APK)
build.py              releases 배포본 만들기
```

Designed & Developed by Rat Rae Choi

#### v1.2.0 (5·6단계)
- `install.html` — 기기별 설치 안내(PC · 안드로이드 · 아이폰), 개별 앱 병행 일정(2026-12-18까지)
- `sw.js` — PC·휴대폰 홈 화면에 앱으로 설치(화면은 저장하지 않고 늘 최신)
- `server/supabase_devices_v2.sql` — 새 기기 승인 · 기기별 조회 전용 · 프로그램 열기 기록 (기본값은 꺼짐 → 지금 동작 그대로)
- `server/tests/test_10_scenarios.py` — 계획서 10가지 시험 (로컬 Postgres에서 실제 서버와 같은 SQL로 실행)

#### v1.3.0 (전체 백업)
- 관리 콘솔 「💾 전체 백업」(제작자) — 10개 프로그램 서버 자료 + 이 기기에만 있는 자료를 엑셀 한 파일로 (`vendor/stec-backup.js`, `vendor/exceljs.min.js`)
- `server/supabase_backup.sql` — `admin_backup_export()` (제작자만 · 읽기 전용 · 비밀번호 제외)
- 엑셀 「원본_복원용」 시트: 같은 키의 조각을 순서대로 이어 붙이면 원래 자료(JSON)

#### v1.4.0 (디자인 새 단장)
- 히어로를 에스텍 디오라마 그림(`assets/hero-diorama.webp`)으로 교체, Pretendard 글꼴, 유리 효과 상단 바, 새 프로그램 카드, 어두운 Media Wall
- Media Wall 사진 42장(직원 디오라마 27 · 3D 피규어 15) · 영상 28편(근무 영상 17 · Complaint 사례 11)으로 교체

#### v1.4.2 (프로그램 8개)
- 프로그램 메뉴에 8번째 「Legal Response System(법률 대응 시스템)」 추가 — `stlr`, https://sadness500-boop.github.io/S-Tec-Legal-Response-System/
- 서버 등록부에도 추가: `server/supabase_integrated.sql`(다시 실행해도 안전) 또는 관리 콘솔 「🧩 프로그램 등록」

#### v1.5.0 (공통 기준정보 · 자료 양식)
- `server/supabase_master.sql` — 공통 기준정보 표(master_data) · `master_get()` · `admin_master_put()` (제작자·관리자)
- `vendor/stec-master.js` — 10개 프로그램이 함께 쓰는 기준정보 도구: 엑셀 양식 만들기 · 불러오기(미리보기·검사) · 지사·사업장·회사 목록에 더하기
- 관리 콘솔 「🏢 기준정보」 탭, 각 프로그램 왼쪽 아래 「📂 자료」 버튼
- `forms/` — 프로그램별 자료 입력 양식(엑셀)과 작성 안내서(PDF)

#### v1.9.3 (12개 프로그램 상단 · 하단 · 매뉴얼 통일)
- 상단: 아이콘 · 「에스텍 그룹 + 버전」 · 영문 프로그램명 · 한글 프로그램명, 오른쪽 기능 버튼 위 「The Best Choice」 — 12개 프로그램 같은 모양
- 하단: 왼쪽 「© 에스텍 그룹 · 영문명(한글명)」, 오른쪽 반짝이는 제작자 서명 + 오늘 날짜(흰 배경 없음), 「Program & Design by」 문구 삭제
- 「함께 쓰는 사이트」(오늘의 뽑기판 · 팔도 제철맛길 · 팔도 축제길)를 12개 프로그램 모두에 넣음
- 「📘 사용자 매뉴얼」: 11개 프로그램은 각자 자기 프로그램 매뉴얼을 보고 Word · PPT(· PDF)로 내려받음, 메인은 통합 매뉴얼 유지

#### v1.9.2 (제작자 관리매뉴얼 — 제작자만)
- 제작자 관리매뉴얼(메인 · 근태관리 · 고객 불만처리 · 법률 대응 · 업무표준화 · 성과관리 · 출입관리의 Word · PPT · PDF와 프로그램 안 보기 내용)을 공개 저장소 · 웹 주소에서 모두 빼고, Supabase의 비공개 보관함 `owner-docs`로 옮김 (`server/supabase_owner_docs.sql`)
- 서버가 「사용 중인 제작자(owner)」 계정인지 확인한 뒤에만 보기 · 내려받기 허용 — 다른 사람은 주소를 알아도 열 수 없음
- 제작자: 관리 콘솔 「📘 매뉴얼 → 🛡️ 제작자 관리매뉴얼 · 📂 프로그램별 제작자 관리매뉴얼」, 각 프로그램 상단 「📘 사용자 매뉴얼 → 🛡 제작자 관리매뉴얼」
- 제작자 관리매뉴얼이 들어 있던 예전 배포 파일(HTML · APK v1.6.2~v1.9.1) 정리

#### v1.9.1 (상단 버튼 통일 · 매뉴얼)
- 메인 프로그램과 11개 프로그램의 상단 버튼을 같은 모양 · 같은 순서 · 새 선 아이콘으로 통일 (`vendor/stec-bar.js`, 각 프로그램에는 STEC-BAR 표시 사이에 같은 코드)
  📘 사용자 매뉴얼 · 🪪 내 정보 · QR · 친구추천 · − 100% + · 주간/야간/시스템 · 관리 콘솔 · 계정
- 「👤 담당 카드」 삭제 → 「🪪 내 정보」(아이디 · 역할 · 소속 조직 · 관리범위 · 사용기한 확인, 이름 · 연락처 수정 — 서버 저장). 프로그램별 담당자 표기는 내 정보 안에서
- 관리 콘솔: 제작자에게만 「🛡 제작자 관리 콘솔」, 조직 관리자에게는 「조직관리자 관리콘솔」(맡은 조직 · 받은 권한만). 11개 프로그램에서 누르면 메인의 콘솔이 새 창으로(같은 로그인) — 옛 프로그램별 관리자 페이지 대신
- 📘 사용자 매뉴얼: 누구나 상단 버튼으로 보기 · Word · PPT 내려받기 (`manual.html`, `manuals/`)
- 콘솔 「📘 매뉴얼」과 제작자 관리매뉴얼은 제작자만 — 두 매뉴얼 모두 Word · PPT 내려받기
- 매뉴얼 내용 v1.9.0 반영(가입 때 소속 고르기 · 내 정보 · 회사·조직 · 조직 관리자 · ⭐ 추가 권한 · 세부 기능)
- 고침: 사용자 「🏢 소속」 · 「📅 기한」 저장이 반영되지 않던 문제

#### v1.9.0 (회사·조직별 가입자 관리)
- 가입할 때 회사 → 부문 → 본부 → 팀 순서로 소속 조직을 고름(가입 코드가 있는 조직은 코드 입력), 기존 사용자 중 소속이 없는 사람은 접속 때 한 번 소속을 고름
- 「251128 전사 조직도(변경 後)」의 조직만(개인 이름 제외) 161개 조직표로 반영 — 에스텍시스템은 이사회·대표이사를 빼고 부문 이하, 해외 법인 4곳 제외
- 조직 관리자: 제작자가 지정하고 할 수 있는 일(가입 승인·중지, 관리범위, 사용기한 상한, 프로그램 권한, 조직 만들기, 기기·접속기록)을 하나씩 정함 — 자기 조직과 그 아래 조직만
- 조직별 프로그램 공개 — 상위 조직 설정을 물려받고, 하위 조직은 더 좁힐 수만 있음
- 세부 기능: 견적시스템 「신규 견적 / 갱신 견적」, 업무표준화 「업무표준화 제작 / 매뉴얼 제작」을 조직·사람별로 열고 닫음
- 제작자만: ⭐ 개인 추가 권한 — 조직·관리자 한도를 넘어 특정인에게 프로그램·세부 기능·관리범위를 더 줌
- 조직 만들기: 화면에서 직접 또는 엑셀·CSV·PDF 파일로(미리보기 → 확인 후 반영)
- 11개 프로그램 공통: 소속 조직에 공개되지 않은 프로그램은 「소속 조직에 공개되지 않은 프로그램입니다」 화면으로 잠김, 조직표는 각 프로그램의 조직 목록에도 반영

#### v1.8.4 (새 디오라마)
- 메인 화면 디오라마를 새 움직이는 디오라마로 교체 — 명판(S-Tec Operations and Sales Integrated Management System / 에스텍 운영 및 영업 통합관리 시스템)까지 전체가 보임
- 원본 GIF(2400×1792 · 72장 · 6초 · 17MB)를 고화질 영상(`assets/hero-diorama.mp4`, 1280×956 · 0.8MB)으로 변환 — 화면 배율이 높아도 선명, 소리 없이 자동 반복
- 오른쪽 아래 모서리의 작은 별 표시는 지움, 가장자리는 배경에 부드럽게 스며들도록 유지
- v1.8.3에서 덧붙였던 명판(HTML)은 이제 영상 안에 들어 있어 뺌, 이전 GIF 파일 삭제

#### v1.8.3 (디오라마 가장자리 · 명판)
- 움직이는 디오라마의 네모 테두리를 없애고 가장자리가 배경으로 부드럽게 스며들도록 처리(뒤쪽에 은은한 빛)
- GIF 원본은 아래쪽 명판 글자가 잘려 있어, 디오라마 아래에 같은 모양의 명판(나무 받침 + 금속판)을 붙여 「S-Tec Operations and Sales Integrated Management System / 에스텍 운영 및 영업 통합관리 시스템」 전체를 표시

#### v1.8.2 (움직이는 디오라마)
- 메인 화면 위쪽 디오라마 그림을 GIF 애니메이션(`assets/hero-diorama.gif`, 640×360 · 30장 · 3초 반복)으로 교체
- 원본 크기(640×360)보다 크게 늘리지 않고 둥근 액자 모양으로 표시 — 화질 저하 없음(좁은 화면에서는 줄여서 표시)
- 로그인 화면 배경은 기존 정지 그림(`hero-diorama.webp`) 그대로

#### v1.8.1 (우수근무 영상)
- Media Wall 영상 분류에 「우수근무 영상」 탭 추가(근무 영상과 Complaint 사례 사이)
- 영상 5편: 근무중 도둑잡는 영상 · 근무중 화재소화 영상 · 화재현장 구조하는 영상 · 응급환자 CPR 영상 · 노약자 도와주는 영상 (`media/video/v31~v35.mp4`, 960×540 H.264)
- 영상 합계 35편(근무 영상 18 · 우수근무 영상 5 · Complaint 사례 12)

#### v1.8.0 (프로그램 11개)
- 메인 화면 맨 아래 11번째 카드 「S-Tec Integrated Access Control System(통합 출입관리 시스템)」 추가 — `stac`, https://sadness500-boop.github.io/S-Tec-Integrated-Access-Control-System/ (sort 110)
- 서버 등록부에도 추가: `server/supabase_integrated.sql`(다시 실행해도 안전) 또는 출입관리 저장소의 `server/supabase_stac.sql`(공유 출입 DATA 표 `ac_records` · 기존 장비 수신 `ac_ingest` 포함)
- 공통 기준정보(`stec-master.js`) · 사용자 매뉴얼(`stec-guide.js`)에 통합 출입관리 시스템 반영 · 안내 문구 「11개 프로그램」

#### v1.7.0 (프로그램 10개)
- 메인 화면 맨 아래 10번째 카드 「S-Tec Performance Management System(에스텍 성과 관리 시스템)」 추가 — `stpm`, https://sadness500-boop.github.io/S-Tec-Performance-Management-System/ (sort 100)
- 서버 등록부에도 추가: `server/supabase_integrated.sql`(다시 실행해도 안전) 또는 성과 관리 저장소의 `server/supabase_stpm.sql`(공유 성과 기록 표 `pm_records` 포함)
- 공통 기준정보(`stec-master.js`) · 사용자 매뉴얼에 성과 관리 시스템 반영

#### v1.6.2 (프로그램 안 사용 안내)
- 메인 화면 맨 아래 「사용 안내」가 GitHub 페이지 대신 **프로그램 안 매뉴얼 창**을 엽니다 — 일반 사용자는 GitHub 화면을 볼 일이 없음
- 「👤 사용자 매뉴얼」은 모든 사용자, 「🛡️ 제작자 관리매뉴얼」은 제작자에게만 보임(v1.9.2부터 서버 비공개 보관함) (관리 콘솔 위쪽 「📘 매뉴얼」로도 열림)
- 왼쪽 목차 · 🔎 찾기(찾은 말 노란색 표시) · 🖨️ 인쇄(PDF 저장) · Esc로 닫기
- 내용: `vendor/stec-guide.js` (10개 프로그램 · 새 배치 순서 · 화면 크기 조절 반영)

#### v1.6.1 (화면 크기 · 배치 순서)
- 관리 콘솔 「🔐 프로그램별 권한」: 10개 프로그램 칸이 가로 스크롤 없이 한 화면에 들어오도록 표를 촘촘하게 정리
- 상단 머리줄에 「－ 100% ＋」 화면 크기 조절(50%~160%, 가운데 숫자를 누르면 100%) — 프로그램 전체 화면이 확대·축소되고, 고른 크기는 기억됨
- 메인 화면 프로그램 순서: 사업장 현황 지도 → 근태관리 → 고객 불만처리 → 법률 대응 → 용역인력 견적 → 업무량 기반 산정 → 단기인력 견적 → 제안서 제작 → 업무표준화 (서버 `program_registry.sort` 10~90)

#### v1.6.0 (프로그램 9개)
- 프로그램 메뉴에 9번째 「S-Tec Proposal Production System(에스텍 제안서 제작시스템)」 추가 — `stpp`, https://sadness500-boop.github.io/S-Tec-Proposal-Production-System/
- 서버 등록부에도 추가: `server/supabase_integrated.sql`(다시 실행해도 안전) 또는 제안서 저장소의 `server/supabase_app_access_stpp.sql`, 또는 관리 콘솔 「🧩 프로그램 등록」
- 견적 3종(용역인력 견적·업무량 기반 산정·단기인력 견적)에 「📑 제안서로 보내기」 연동 추가 — 같은 계정 서버(`stec_proposal_inbox`)로 여러 기기 동기화
