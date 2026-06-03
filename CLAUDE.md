# CLAUDE.md — DASMOLabs 홈페이지 개발 가이드

> 동아대학교 도시공학과 교통공학연구실(DASMOLabs) 공식 홈페이지.
> Claude(및 사람)가 구조와 콘텐츠를 빠르게 파악하도록 정리한 문서입니다.

---

## 1. 한 줄 요약 / 기술 스택

- **정적 사이트, 빌드 단계 없음**(no build). 순수 HTML + CSS + 바닐라 JS.
- 콘텐츠 데이터는 **`data/*.json`** 에 있고, `assets/js/app.js`가 클라이언트에서 읽어 렌더링.
- 헤더/푸터는 `data/site.json` 기반으로 JS가 주입(연구실명·연락처를 한 곳에서 관리).
- 호스팅: **GitHub Pages**, repo `dasmolab/dasmolab.github.io`, 공개 URL **https://dasmolab.github.io/** (기본 브랜치 `main` 루트 서빙).
- 편집(CMS): `/admin` Sveltia CMS, GitHub OAuth(Cloudflare Worker). → `EDIT-LOGIN-GUIDE.md`.

---

## 2. 파일 구조

```
/ (repo 루트 = 사이트 루트)
├─ index.html              data-page="home"
├─ news.html               data-page="news"
├─ people.html             data-page="people"
├─ research.html           data-page="research"
├─ publications.html       data-page="publications"
├─ achievements.html       data-page="achievements"
├─ (professor/members/projects/conferences/patents/awards).html   ← 구 URL(6탭 nav에는 없음, 옛 북마크 보존용)
├─ assets/
│  ├─ css/styles.css       디자인 토큰(:root) + 전체 스타일(플레인 CSS)
│  ├─ js/app.js            ★ 모든 로직(헤더/푸터 + 페이지별 렌더 + 빌더)
│  ├─ img/                 로고 등 정적 이미지
│  └─ uploads/             CMS 업로드 이미지(교수·구성원 사진 등)
├─ data/*.json             ★ 콘텐츠 데이터(아래 5장 스키마)
├─ admin/                  Sveltia CMS (config.yml = 편집 메뉴 정의)
└─ *.md                    README, SETUP-GUIDE, EDIT-LOGIN-GUIDE, (이 파일)
```

**각 HTML 페이지는 얇은 껍데기다.** `<div data-header></div>` + 콘텐츠 컨테이너(`#xxx-root`, `#xxx-subnav`) + `<div data-footer></div>` + `app.js` 로드가 전부. `<body data-page="...">` 값으로 어떤 렌더 함수가 실행될지 결정된다.

---

## 3. 네비게이션 (6탭 + 소탭/호버 드롭다운)

상단 메인탭 6개. 각 탭에 **마우스를 올리면 소탭 드롭다운**이 내려오고, **소탭 클릭 = URL 해시로 해당 소탭 딥링크**, **메인탭 클릭 = 그 페이지 기본 화면**.

| 메인탭 | data-page | 소탭 (URL 해시 key) | 소탭 동작 | 데이터 소스 |
|---|---|---|---|---|
| **Home** | home | 연구실 소개(`about`) / 연구 분야(`research`) / 강의 과목(`classes`) | 페이지 내 **섹션 스크롤** | `site.json` |
| **News** | news | 전체(`all`) / 학술대회 / 세미나 / 랩미팅 | **분류 필터** | `news.json` |
| **People** | people | 지도교수(`professor`) / 현재 구성원(`current`) / 졸업생(`alumni`) / 지원(`apply`) | **탭 전환**(한 번에 하나) | `professor.json`, `members.json` |
| **Research** | research | 연구 분야(`areas`) / 연구 과제(`projects`) | **탭 전환** | `site.research_topics`, `projects.json` |
| **Publications** | publications | 논문(`papers`) / 학술대회(`conferences`) | **탭 전환** | `publications.json`, `conferences.json` |
| **Achievements** | achievements | 특허(`patents`) / 수상(`awards`) | **탭 전환** | `patents.json`, `awards.json` |

- 드롭다운과 페이지 내 소탭은 **`SUBNAV` 맵 하나**로 정의되어 동기화된다. 소탭을 추가/수정하려면 `SUBNAV`와 해당 `render*` 함수의 탭 배열 **둘 다** 같은 `key`로 맞춰야 한다.
- "탭 전환" 페이지는 `mountSubnav()`가 처리(아래 4장). "섹션 스크롤"(Home/Research 진입)·"분류 필터"(News)는 각자 처리.

---

## 4. `assets/js/app.js` 아키텍처 (전부 한 IIFE 안)

> 멀티페이지 사이트라 **페이지를 이동할 때마다 문서가 새로 로드**되고 IIFE가 다시 실행된다(SPA 아님 → 이벤트 리스너가 페이지 이동으로 누적되지 않음).

**상수**
- `NAV` — 메인탭 6개 `{href, label}`.
- `SUBNAV` — `{ "people.html": [{label, key}, ...], ... }` 탭별 소탭 정의(드롭다운 + 페이지 내 소탭 공용).

**공통 크롬(헤더/푸터)**
- `currentPage()` — 현재 파일명.
- `buildHeader(site)` — 로고 + nav. 각 탭을 `<li class="nav__item">`로, 소탭이 있으면 `<ul class="nav__sub">` 드롭다운 + `▾` 캐럿. 자식 링크 = `page.html#key`.
- `buildFooter(site)` / `mountChrome(site)` / `initNav()`(모바일 햄버거 토글 + 링크 클릭 시 드로어 닫기).

**소탭 엔진**
- `mountSubnav(nav, root, tabs, defaultKey)` — 탭 버튼 렌더 + 한 번에 한 view 표시. `location.hash`로 초기 탭 결정, 클릭 시 `history.replaceState`로 해시 갱신, `hashchange`로 드롭다운 딥링크에 반응. People/Research/Publications/Achievements가 사용.
- `scrollToHash()` — 헤더 높이 보정해 해시 요소로 스무스 스크롤. Home/Research(JS 렌더 뒤) 진입 시 사용.

**페이지별 렌더 함수** (`PAGES` 맵 → `DOMContentLoaded`에서 `body[data-page]`로 디스패치)
- `renderHome` — hero/통계(`#home-stats`)/모집 배너(`#home-recruit`)/최신소식 카드(`#home-news`)/소개·연구·강의 채움.
- `renderNews` — 모집 제외 피드를 **간략 카드**(`newsCard`)로, 분류 필터(`#news-subnav`). **모집(category "모집")은 News에 표시 안 함**.
- `renderPeople` — 4개 소탭(지도교수/현재구성원/졸업생/지원), 기본 `professor`.
- `renderResearch` / `renderPublications` / `renderAchievements` — 각 2개 소탭.

**순수 빌더(데이터 → HTML 문자열)** — 병합 페이지들이 재사용
- `buildResearchTopics(site)`, `buildProfessor(p)`, `buildMembers(M, which)`(`which`="current"|"alumni"), `buildApply(prof)`(지원 안내 + 지도교수 mailto), `buildProjects`, `buildPublications`, `buildConferences`, `buildPatents`, `buildAwards`.

**News 카드 + 상세 모달**
- `newsCard(n, idx)` — `<button class="news-card" data-idx>` 썸네일+메타+제목+미리보기. `idx`는 `posts` 배열 인덱스.
- `openNewsModal(n)` / `closeNewsModal()` / `newsModalKey` — 카드 클릭 시 제목·사진 갤러리·본문·링크를 모달로. ESC/배경/✕ 닫기, body 스크롤 잠금.
- `catEmoji`, `newsPhotos`, `newsExcerpt`, `newsThumb` 보조.

**유틸** — `$`,`$$`,`esc`,`escMultiline`,`imgSrc`,`linkify`,`richText`,`fmtDate`,`photoSrc`,`firstPhoto`,`fetchData(name)`,`setState`.

---

## 5. 데이터 스키마 (`data/*.json`)

- **`site.json`** — `lab_abbr`, `lab_name_ko/en`, `tagline_en`, `intro1`, `intro2`, `research_topics[]`{`icon`,`title`,`desc`,`tags[]`}, `classes_undergrad[]`, `classes_grad[]`, `address`, `phone`, `email`, `office`, `logo`.
- **`professor.json`** — `name_ko`, `name_en`, `title`, `photo`, `fields`, `phone`, `email`(쉼표구분 다중), `office`, `education[]`{`period`,`place`,`degree`,`thesis`}, `careers[]`, `societies[]`{`name`,`position`,`note`}, `media[]`{`date`,`title`,`url`}, `committees[]`.
- **`members.json`** — `members[]`{`name_ko`,`name_en`,`group`("current"|"alumni"),`level`("ph"/"master"/"under"/"bach"…로 시작),`affiliation`,`period`,`degree`,`grad_year`,`thesis`,`email`,`photo`}.
- **`news.json`** — `news[]`{`date`(YYYY-MM-DD),`category`("학술대회"|"세미나"|"랩미팅"|"모집"|"기타"),`title`,`body`(줄바꿈·URL 허용),`photos[]`(경로 또는 {image}),`link`}.
- **`projects.json`** — `projects[]`{`period`,`title`,`org`}.
- **`publications.json`** — `publications[]`{`category`("International"|"Domestic"|"Other"|"Books"),`citation`,`venue`,`sci`(bool),`link`}.
- **`conferences.json`** — `conferences[]`{`category`("International"|"Domestic"),`title`,`conference`,`date`}.
- **`patents.json`** — `patents[]`{`category`("Application"|"Registration"|"Software"),`name`,`scope`,`type`,`date`,`number`,`inventors`}.
- **`awards.json`** — `awards[]`{`date`,`title_ko`,`title_en`,`venue`}.

---

## 6. 페이지별 콘텐츠 요약

- **Home** — 히어로(연구실 슬로건) → 실시간 통계(논문·학회발표·과제·구성원 수, 다른 json에서 집계) → **모집 배너**(news.json에 "모집" 항목 있을 때만; "자세히 보기"→`people.html#apply`) → 최신소식 카드 3개 → 연구실 소개 → 연구 분야 → 강의 과목.
- **News** — 학술대회·세미나·랩미팅 등 활동 일지(간략 카드, 클릭 시 모달). 모집 공고는 여기 노출 안 함.
- **People** — 지도교수 프로필 / 재학생 / 졸업생 / **지원**(필수 기재항목 + 지도교수 이메일로 작성양식 미리채운 메일 버튼).
- **Research** — 연구 분야 카드 / 수행 연구 과제 목록.
- **Publications** — 논문(국제·국내·기타·저서) / 학술대회 발표.
- **Achievements** — 특허·프로그램 등록 / 수상 실적.

---

## 7. CSS (`assets/css/styles.css`)

- 디자인 토큰은 `:root`(네이비 베이스 `--navy` + 틸 액센트 `--teal`, Pretendard 폰트, `--header-h`, `--radius` 등).
- 주요 컴포넌트: `.site-header/.nav/.nav__sub`(드롭다운), `.subnav`(소탭 버튼), `.hero`, `.section`, `.card/.grid`, `.people-grid/.person`, `.prof-*`, `.ref-list`(논문), `table.data`(특허), `.news-card`(피드 카드)·`.news-modal`(상세 모달), `.recruit-bar`(홈 모집 배너), `.apply-cta`(지원 버튼 박스).
- 반응형 분기: `max-width: 860px`(모바일 nav 햄버거 + 드롭다운을 정적 목록으로), `560px`(카드 세로 쌓기).

---

## 8. 빌드 · 로컬 미리보기 · 배포

- **빌드 없음.** 파일 수정 = 즉시 반영.
- **로컬 미리보기**(JSON `fetch` 때문에 `file://` 불가 → 반드시 HTTP 서버):
  ```bash
  python -m http.server 8000 --bind 127.0.0.1
  # http://localhost:8000/
  ```
- **배포**: 작업 브랜치 → `main` 병합 → `git push origin main` → GitHub Pages 자동 배포(약 1분). 기본 브랜치 `main` 루트가 그대로 공개됨.
- **캐시 무효화(중요)**: 6개 HTML이 `app.js`/`styles.css`를 `?v=YYYYMMDD` 쿼리로 참조한다. **`app.js` 또는 `styles.css`를 수정하면 이 `?v=` 값을 반드시 올릴 것** — 안 그러면 재방문자 브라우저가 옛 파일을 캐시한 채로 새 HTML을 돌려 "불러오는 중"에서 멈춘다(2026-06-03 실제 발생). 데이터(`data/*.json`)만 바꿀 땐 `fetch(..., {cache:"no-store"})`라 버전 불필요.
- **편집(CMS)**: `/admin`(Sveltia) — GitHub OAuth는 Cloudflare Worker가 처리하며 `dasmolab.github.io`(실제 사이트)에서만 동작(localhost 불가). 멤버 추가 등은 `EDIT-LOGIN-GUIDE.md` 참고.

---

## 9. 자주 하는 수정 (How-to)

- **구성원 추가/이동(재학↔졸업)** → `data/members.json`(`group`/`level` 조정, 사진은 `assets/uploads/`).
- **소식 추가** → `data/news.json`에 항목 추가(`category`로 분류, `photos[]`에 이미지).
- **교수 정보** → `data/professor.json`.
- **연구 분야 카드/강의/소개문** → `data/site.json`(`research_topics`, `classes_*`, `intro*`).
- **새 소탭 추가** → ① `app.js`의 `SUBNAV[해당페이지]`에 `{label, key}` 추가 ② 같은 페이지 `render*`의 `mountSubnav(...)` 탭 배열에 같은 `key`로 view 추가. (탭 전환 페이지 기준)
- **메인탭 추가/순서 변경** → `app.js`의 `NAV` 배열(헤더·푸터 공용).

---

## 10. 주의점 / 함정

- `SUBNAV`의 `key`와 `render*` 탭의 `key`가 **반드시 일치**해야 드롭다운 딥링크가 작동.
- 모든 사용자 데이터는 출력 시 `esc()`(또는 `richText`/`linkify`) 처리 — XSS 방지. 새 빌더 작성 시 동일하게.
- 이미지 경로는 `imgSrc()`로 정규화(앞 `/` 제거)해야 서브경로 배포에서도 안전.
- News 모달은 `posts` 배열 인덱스(`data-idx`)로 항목을 찾음 — 분류 필터가 걸려도 인덱스는 항상 전체 `posts` 기준.
