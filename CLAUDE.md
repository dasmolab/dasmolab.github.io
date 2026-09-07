# CLAUDE.md — DASMOLabs 홈페이지 개발 가이드

> 동아대학교 도시공학과 교통공학연구실(DASMOLabs) 공식 홈페이지.
> Claude(및 사람)가 구조와 콘텐츠를 빠르게 파악하도록 정리한 문서입니다.

---

## 1. 한 줄 요약 / 기술 스택

- **정적 사이트, 빌드 단계 없음**(no build). 순수 HTML + CSS + 바닐라 JS.
- 콘텐츠 데이터는 **`data/*.json`**(국문) / **`data/en/*.json`**(영문 번역본)에 있고,
  **단일 `assets/js/app.js`가 한/영 페이지를 모두** 렌더링한다(`<html lang>`으로 언어 감지).
- 헤더/푸터는 `data/site.json` 기반으로 JS가 주입(연구실명·연락처를 한 곳에서 관리).
- 호스팅: **GitHub Pages**, repo `dasmolabs/dasmolabs.github.io`, 공개 URL **https://dasmolabs.github.io/** (기본 브랜치 `main` 루트 서빙).
- 편집(CMS): `/admin` Sveltia CMS(버전 고정 로드), GitHub OAuth(Cloudflare Worker). → `EDIT-LOGIN-GUIDE.md`.

---

## 2. 파일 구조

```
/ (repo 루트 = 사이트 루트)
├─ index.html              data-page="home"   (KO)
├─ people/projects/publications/conferences/photos/patents/awards.html   (KO — Home 포함 8탭)
├─ en/                     영문 페이지 8개 — 같은 껍데기, lang="en", ../assets 참조
│                          + 구 URL 리다이렉트 4개(professor/members/research/achievements)
├─ (professor/members/research/achievements).html  ← 구 URL 리다이렉트(noindex)
├─ 404.html                크롬만 마운트되는 404 (base href="/")
├─ sitemap.xml / robots.txt
├─ assets/
│  ├─ css/styles.css       디자인 토큰(:root) + 전체 스타일(플레인 CSS)
│  ├─ js/app.js            ★ 유일한 스크립트 — KO/EN 공용(언어 감지 + I18N 테이블)
│  ├─ img/                 로고·파비콘(favicon-32/192, apple-touch-icon)·og-image.png
│  └─ uploads/             CMS 업로드 이미지 (신규 업로드는 members/ · news/ · photos/ 하위 폴더로 분리)
├─ data/*.json             ★ 국문 콘텐츠 데이터(아래 5장 스키마)
├─ data/en/*.json          영문 번역 데이터: site·news·professor·members·projects·apply 6종만.
│                          없는 파일(publications 등)은 국문으로 자동 폴백.
├─ admin/                  Sveltia CMS (config.yml = 편집 메뉴 정의, 국문+영문 컬렉션)
├─ scripts/bump-version.ps1  ?v= 캐시버전 일괄 갱신 스크립트 (배포 전 필수)
├─ scripts/check-i18n-parity.js  국/영문 데이터 정합성 점검 (node로 실행 · CI에서도 자동 실행)
├─ scripts/sync-i18n-structure.js  국문→영문 데이터 구조 자동 동기화 (배포 워크플로가 push마다 실행)
└─ *.md                    README, SETUP-GUIDE, EDIT-LOGIN-GUIDE, (이 파일)
```

**각 HTML 페이지는 얇은 껍데기다.** `<div data-header></div>` + 콘텐츠 컨테이너(`#xxx-root`, `#xxx-subnav`) + `<div data-footer></div>` + `app.js` 로드가 전부. `<body data-page="...">` 값으로 렌더 함수가 결정된다. `<head>`에는 페이지별 OG 메타·canonical·hreflang(ko/en/x-default)이 정적으로 들어 있다.

---

## 3. 네비게이션 (8탭 — 앞 2개만 소탭 전환, 나머지는 필터 딥링크)

헤더는 **메인탭 한 줄뿐**이다(브랜드 줄은 2026-07 삭제, 메뉴 줄은 `.nav`의 `padding-left: clamp(0px, calc(100vw - 60rem), 10.5rem)`으로 약 4.4cm 들여씀 — 좁은 데스크톱에서는 자동으로 줄어 탭이 눌리지 않는다). **8개 탭 모두 ▾ + 호버 드롭다운**을 갖는다(모바일은 ▾ 아코디언), 소탭 클릭 = URL 해시 딥링크.

- Home/People: 소탭 = 섹션 스크롤 / 탭 전환.
- Papers/Conferences/Patents: 단일 페이지지만 소탭이 **페이지 필터를 딥링크**한다 — `publications.html#Domestic` → Domestic 칩 자동 선택(`applyHashToFilters`).
- **Projects는 데이터에 분류 필드가 없어**, `period`의 **끝 월로 진행 중 / 완료를 계산**해 칩으로 쓴다(`projStatus`). 완료를 고르면 **연도 드롭다운이 완료 과제의 연도만** 다시 채운다(`filterBlock`의 `yearsFollowCat`).
- **Awards는 분류 축이 없어**, 데이터에 **실제로 있는 연도**로 소탭을 만든다(`yearSubnav()` — 빈 연도가 메뉴에 안 뜨게. 최대 6개).
- **Photos는 행사 유형**(학술대회·세미나·현장조사·연구실 활동)이 소탭이다(2026-09-07 — 그전에는 Awards처럼 연도였다). 연도는 페이지 안 드롭다운이 계속 맡으므로 `photos.html#2026` 같은 옛 링크도 그대로 작동한다(`applyHashToFilters`가 칩 → 연도 순으로 해시를 찾는다).

KO⇄EN 토글은 현재 페이지·현재 소탭(해시)을 유지한 채 전환된다.

| 메인탭 | data-page | 소탭 (URL 해시 key) | 소탭 동작 | 데이터 소스 |
|---|---|---|---|---|
| **Home** | home | 소개(`about` — **히어로 자체**) / 연구 분야(`research`) / 강의(`classes`) / **오시는 길(`location`)** | 섹션 스크롤 | `site.json` |
| **People** | people | 지도교수(`professor`) / 현재 구성원(`current`) / 졸업생(`alumni`) / 지원(`apply`) | 탭 전환 | `professor.json`, `members.json`, `apply.json` |
| **Projects** | projects | 전체(`all`) / 진행 중(`ongoing`) / 완료(`completed`) | 구분 칩 자동 선택 → 연도 드롭다운이 그 칩의 연도로 갱신 | `projects.json` |
| **Papers** | publications | 전체(`all`) / `International` / `Domestic` / 기타(`Other`) / 저서(`Books`) | 구분 칩 자동 선택 | `publications.json` |
| **Conferences** | conferences | 전체(`all`) / `International` / `Domestic` | 구분 칩 자동 선택 | `conferences.json` |
| **Photos** | photos | 전체(`all`) / 학술대회(`Conference`) / 세미나(`Seminar`) / 현장조사(`Fieldwork`) / 연구실 활동(`Lab`) | 구분 칩 자동 선택 → 행사별 앨범(라이트박스) | `photos.json` |
| **Patents** | patents | 전체(`all`) / 출원(`Application`) / 등록(`Registration`) / 프로그램(`Software`) | 구분 칩 자동 선택 | `patents.json` |
| **Awards** | awards | 전체(`all`) / 연도(`2026`·`2025`… 데이터 기준 최대 6개) | 연도 드롭다운 자동 선택 | `awards.json` |

- 드롭다운과 페이지 내 소탭은 **`SUBNAV` 맵 하나**(언어별 2벌)로 정의. 소탭 추가 시 `SUBNAV`와 해당 `render*`의 탭 배열 **둘 다** 같은 `key`로 맞출 것.
- **News 탭은 2026-07 폐지** — `news.html`·`en/news.html` 삭제, 홈 최신소식·모집 배너·통계 스트립도 제거. `data/news.json`은 남아 있고 **`category:"모집"`(EN `Recruiting`) 항목만** People→지원 탭 콜아웃으로 쓰인다(그 외 분류는 사이트에 표시되지 않음).
- **탭 이름은 2026-09-07 `Research` → `Projects`로 변경**(지도교수님 요청) — 페이지 URL도 `research.html` → **`projects.html`**(KO/EN 모두)이고, 구 `research.html`은 해시를 유지한 채 넘겨주는 리다이렉트 스텁으로 남겼다. 렌더 함수는 `renderProjects`, 컨테이너는 `#projects-root`, `data-page="projects"`. **홈의 “연구 분야”(`index.html#research`)는 그대로** — 이제 연구 *분야*(홈)와 연구 *과제*(Projects 탭)가 이름으로도 갈린다.
- **Research 탭의 “연구 분야” 소탭은 2026-07-27 폐지** — 홈(`index.html#research`)과 내용이 똑같아 중복이라는 지도교수님 지적. 이 페이지는 이제 **연구 과제 목록만** 바로 띄운다(소탭 바 자체가 없음). 구 링크 `#areas`는 `renderProjects` 첫 줄에서 `index.html#research`로 리다이렉트.
- 구 URL 호환: `achievements.html(#patents|#awards)` → `patents.html`/`awards.html` 스텁 리다이렉트, `publications.html#conferences` → `conferences.html`(renderPublications 안에서 처리).

---

## 4. `assets/js/app.js` 아키텍처 (전부 한 IIFE 안)

> 멀티페이지 사이트라 페이지 이동마다 문서가 새로 로드되고 IIFE가 다시 실행된다(SPA 아님).

**언어 계층 (파일 상단)**
- `EN` — `<html lang>`이 en으로 시작하면 true. `BASE` — EN이면 `"../"`.
- `T` — **모든 UI 문자열의 I18N 테이블**(KO/EN 2벌). 새 UI 문자열은 반드시 T에 추가.
- `EN_DATA` — 영문 번역 파일이 존재하는 데이터 이름 화이트리스트(`site, news, professor, members, projects, apply`).
  `fetchData()`는 EN에서 이 목록에 있으면 `data/en/`을 먼저, 아니면 바로 국문 `data/`를 읽는다(불필요한 404 없음).
- `SUBNAV`, `RECRUIT_CAT`("모집"/"Recruiting") — 언어별 상수. Papers/Conferences/Patents의 `SUBNAV` 항목은 `T.pubChips`·`T.confLabels`·`T.patChips`를 그대로 쓰고 **key는 데이터의 category 코드와 반드시 같아야 한다**(딥링크가 칩을 찾는 기준).
- `fetchData`는 **페이지당 파일별 1회만** 요청(`_dataCache`) — 헤더의 Awards·Photos 연도 메뉴(`yearSubnav`)와 해당 페이지가 같은 파일을 두 번 받지 않도록.

**공통 크롬** — `buildHeader`(**브랜드 줄 없음 — 메뉴 한 줄**, 전 탭 ▾ + 드롭다운 + 모바일 아코디언 토글 버튼 + 언어 전환), `buildFooter`(연도 자동, 주소는 지도 링크), `mountChrome`, `initNav`(햄버거 + 아코디언 + Esc 닫기 + 언어 전환 시 해시 유지).

**소탭 엔진** — `mountSubnav`(해시 딥링크·hashchange 반응 — **이제 People 페이지 전용**), `scrollToHash`.

**필터 엔진** — `filterBlock(cfg)`: 구분 칩 + 연도 드롭다운(`yearOptions`) + **텍스트 검색(`getText`)**. `cfg.yearsFollowCat`(Projects 전용)이면 칩을 바꿀 때마다 `applyFilter`가 **연도 옵션을 그 칩의 항목들로 다시 그린다**(사라진 연도가 선택돼 있었다면 '전체 연도'로 되돌림). `applyFilter`/`wireFilters`(위임 핸들러) + **`applyHashToFilters`**(URL 해시 → 칩/연도 자동 선택 — 헤더 드롭다운 딥링크의 핵심. `wireFilters`는 호출될 때마다 이걸 다시 적용한다). Publications/Conferences/Photos/Patents/Awards/Projects(연구 과제)가 사용. 목록은 렌더 전에 `sortByDateDesc`로 날짜 내림차순 정렬(편집 순서 실수를 코드가 흡수) — **단 연구 과제는 예외로 파일 순서 그대로** 쓴다(영문 `period`가 `Apr 2026 – Mar 2028` 형식이라 `dateKey`가 월을 못 읽음).

**페이지 렌더 함수** (`PAGES` 맵 → `body[data-page]` 디스패치)
- `renderHome` — 소개(+`about_photo`)/연구/강의(문자열·`{name,link}` 겸용)/**오시는 길(`buildLocation`)**. **2026-07-27: 별도 About 섹션을 없애고 `#home-intro`(intro1+intro2)를 히어로 안으로 넣었다** — 히어로가 곧 연구실 소개이고, `<section class="hero" id="about">`이 소탭 `about` 딥링크를 받는다. 홈의 남은 3개 섹션 제목은 한글을 지우고 영문만 제목 크기로 키운 `.section__title--en`(RESEARCH / CLASSES / LOCATION) — **People 페이지 제목은 기존 eyebrow+한글 구조 그대로**다.
- `renderPeople` — 지도교수(`links` 연구자 프로필 버튼, media `date`+`source`)/구성원(관심분야 태그, group×level 미매칭도 '기타'로 표시)/졸업생/지원(**`apply.json` 데이터 + 현재 모집 공고 본문 + FAQ**).
- `renderProjects` / `renderPublications`(Papers) / `renderConferences` / `renderPhotos` / `renderPatents` / `renderAwards` — **여섯 개 모두 소탭 없이 `filterBlock` 하나를 바로 렌더**한다. `renderPhotos`는 행사별 사진 앨범 + 라이트박스(`initLightbox`)를 얹는다. `renderProjects`는 구 `#areas` 딥링크만 홈으로 넘겨준 뒤 연구 과제 목록(진행 중/완료 칩 + 연도 + 검색)을 그린다.

**순수 빌더** — `buildResearchTopics`(**홈 전용** — Projects 페이지는 더 이상 쓰지 않음), `buildLocation`, `buildProfessor`, `buildMembers`, `buildApply(prof, apply, recruit)`, `buildProjects`, `buildPublications`(EN은 `citation_en` 우선), `buildConferences`(EN은 `한글 / English` 제목의 영문부 + `conference_en` 우선), `buildPatents`(EN은 `name_en`·`inventors_en` 우선 + scope/type 영문 매핑), `buildAwards`(EN은 `title_en`·`venue_en` 우선), `buildPhotoEvents`(행사별 사진 앨범 — 유형 배지 + 날짜·장소·참여자 메타 + 설명. EN은 `title_en`·`description_en`·`place_en`·`people_en` 우선. 썸네일 클릭 → 라이트박스: 행사 안에서 ←/→ 순환, 사진별 캡션 표시, Esc·배경 클릭 닫기). 보조 함수 `photoList`(문자열 경로와 `{src,caption}` 객체를 함께 받는다)·`peopleText`·`listText`.
  **`*_en` 우선 규칙은 렌더뿐 아니라 `render*`의 `getText`(검색 대상)에도 같이 넣어야 한다** — 안 그러면 영문 페이지에서 화면에 보이는 영어로 검색했는데 안 걸린다.

**유틸** — `esc`, `escMultiline`, `imgSrc`(BASE 처리), `cssUrl`(경로를 속성/CSS url 안전하게), `linkify`, `richText`, `fmtDate`, `todayStr`, `recruitOpen`(deadline 지난 모집 자동 숨김), `fetchData`, `setState`, `yearIn`, `pubYear`, `dateKey`, **`periodEnd`**(과제 기간의 끝 월 → `YYYYMM`, 국문 `2026. 7. ~ 2027. 3.`·영문 `Apr 2026 – Mar 2027` 둘 다 해석) / **`projStatus`**(`ongoing`·`completed`).

---

## 5. 데이터 스키마 (`data/*.json` — 영문판은 `data/en/` 동일 구조)

- **`site.json`** — `lab_abbr`, `lab_name_ko/en`, `tagline_en`, `intro1/2`, `about_photo`(선택), `research_topics[]`{icon,title,desc,tags[]}, `classes_undergrad/grad[]`(**`{name, link?}` 객체** — 문자열도 하위호환), `address`, `phone`, `email`, `office`, `transit_info`, `map_kakao/naver/google`.
- **`apply.json`** — `intro`, `items[]`{label,hint}, `faq[]`{q,a} — People→지원 탭 내용(CMS 편집 가능).
- **`professor.json`** — 기본 정보 + `links[]`{label,url}(Google Scholar 등) + `education[]`, `careers[]`, `societies[]`, `media[]`{**date, source**, title, url}, `committees[]`.
- **`members.json`** — `members[]`{name_ko, name_en, group("current"|"alumni"), level("PhD"|"Master"|"Undergraduate"|"Bachelor"), photo, email(재학생만 표시·졸업생은 값을 비움 — 화면에 안 나오며 sync 스크립트가 자동으로 비움), affiliation, period, grad_year, degree, thesis, `interests[]`}.
- **`news.json`** — `news[]`{date(YYYY-MM-DD), category("학술대회"|"세미나"|"랩미팅"|"모집"|"기타" — EN 파일은 "Conference"|"Seminar"|"Lab Meeting"|"Recruiting"|"Other"), `deadline`(모집 자동 종료일, 선택), title, body, photos[](문자열 배열), link}. **News 폐지 후에는 `모집`/`Recruiting` 항목만 사이트(People→지원)에 표시된다.**
- **`projects.json`** — `projects[]`{period, title, org}. **진행 중/완료는 별도 필드가 아니라 `period`의 끝 월로 자동 판정**(`projStatus`) — 국문은 `2026. 7. ~ 2027. 3.`, 영문은 `Apr 2026 – Mar 2027` 형식을 지킬 것. 끝 월을 못 읽으면 그 해 12월로 보고 '진행 중'에 남긴다(과제가 목록에서 조용히 사라지지 않도록).
- **`publications.json`** — `publications[]`{category("International"|"Domestic"|"Other"|"Books"), citation(연도는 반드시 `(YYYY)` 괄호 표기), `citation_en?`, venue?, sci(bool), link(DOI 권장)}.
- **`conferences.json`** — `conferences[]`{category, title(국내는 `한글 / English` 병기), conference, `conference_en?`, date}.
- **`photos.json`** — `events[]`{date(YYYY-MM-DD), `category`("Conference"|"Seminar"|"Fieldwork"|"Lab"), title, `title_en?`, `place?`, `place_en?`, `people?`(문자열 또는 배열), `people_en?`, description?, `description_en?`, photos[]}. 행사 하나 = 항목 하나. Photos 탭이 date 내림차순으로 행사별 앨범을 그린다.
  **`photos[]`는 두 가지 모양을 받는다** — 문자열 경로(CMS가 여러 장 동시 업로드할 때 쓰는 모양)와 `{src, caption?, caption_en?}` 객체. 캡션은 라이트박스에 뜨므로 **설명을 붙일 사진만** 객체로 바꾸면 된다(`photoList`가 흡수).
- **`patents.json`** — `patents[]`{category("Application"|"Registration"|"Software"), name, `name_en?`, scope, type, date, number, inventors, `inventors_en?`}.
- **`awards.json`** — `awards[]`{date, title_ko, title_en?, venue, `venue_en?`}.

> **`*_en` 필드는 이 5종(논문·학술대회·행사 사진·특허·수상)에만 있는 장치다.** 이들은 `data/en/` 파일이 없어 국·영문이 같은 파일을 쓰므로,
> 항목마다 붙은 영문 칸으로 언어를 가른다(`citation_en`·`conference_en`·`name_en`·`inventors_en`·`title_en`·`venue_en`·`description_en`).
> 비어 있으면 국문 값이 그대로 영문 페이지에 나온다 — 즉 **비우는 것이 곧 한글 노출**이다.
> `citation_en`에도 연도 `(YYYY)` 괄호를 유지할 것(`pubYear`가 영문 페이지 연도 필터를 이 괄호로 만든다).

---

## 6. CMS (`admin/config.yml`)

- 국문 컬렉션 + **🌐 [영문] 컬렉션**(data/en/ 6종)이 divider로 구분되어 있음.
- select는 전부 **label(한국어)/value(코드)** 분리 — value를 바꾸면 사이트 렌더링이 깨지므로 value는 고정.
- 사진 필드는 **필드별 media_folder**(`assets/uploads/members`, `assets/uploads/news`, `assets/uploads/photos`)와 규격 hint 포함. 뉴스·행사 사진은 `multiple: true`(문자열 배열로 저장).
- 📰 소식 컬렉션은 남아 있지만 **실제로 사이트에 나오는 건 모집 공고뿐**(News 폐지) — 컬렉션 label/hint에 그 안내가 적혀 있다.
- `editor: preview: false`(미리보기 패널 비활성), `site_url` 지정.
- `admin/index.html`은 Sveltia를 **@버전 고정**으로 로드 — 반년에 한 번쯤 버전 숫자 갱신.

---

## 7. CSS (`assets/css/styles.css`)

- 디자인 토큰 `:root` — 네이비 `--navy` + 틸 액센트. **`--teal-dark`(#0B7568)는 흰 배경 텍스트용으로 WCAG AA(5.6:1)를 맞춘 값** — 밝게 되돌리지 말 것.
- 주요 컴포넌트: `.site-header/.nav/.nav__sub/.nav__subtoggle`(모바일 아코디언), `.subnav`, `.fbar/.fchip/.fyear/.fsearch`(필터+검색), `.hero`(`.hero__en`+`.hero__ko` 같은 크기 2줄), `.card/.grid`, `.people-grid/.person`, `.prof-*/.prof-links`, `.ref-list`, `table.data`, `.recruit`(지원 탭 모집 콜아웃), `.apply-cta/.collapse--faq`, `.loc-box/.btn--map`, `.about-photo`, `.tags--sm`.
- 썸네일·인물 사진은 `<img loading="lazy">`로 렌더(placeholder만 div/span). `@media print` 블록 있음 — **`.hero`를 숨기므로 Home을 인쇄하면 연구실 소개가 빠진다**(소개가 히어로로 들어간 2026-07-27 이후).
- **`.hero__lead`는 이제 소개 두 문단을 담는 `<div id="home-intro">`다**(폭 760px, 문단 간격 .9rem, 560px 이하에서 .99rem). `.section__title--en`은 홈 전용 대문자 영문 제목.
- **구성원 사진 크기는 `.people-grid`의 열 수로만 조절한다**(2열 / 620px↑ 4열 / 980px↑ 5열). `.person__photo`의 `aspect-ratio: 3/4`는 **크기 손잡이가 아니라 잘림 손잡이**다 — members 사진 30장을 실측하니 17장이 3×4cm(0.75), 6장이 3.5×4.5cm(민증·여권, 0.778)라 3/4가 잘림이 가장 적다. 이 값을 납작하게 바꾸면 `object-fit: cover`가 세로를 잘라내 **상체가 사라진다**(2026-07-27에 3/3.4로 잡았다가 23/24장이 −15% 잘린 사고). `object-position`도 기본(가운데) 유지 — `top`으로 밀면 잘린 양이 전부 아래로 몰린다.
- 휴대폰(620px 미만)은 의도적으로 2열 유지 — 3열로 가면 390px 화면에서 사진이 96×128px까지 작아져 얼굴 식별이 어렵다. 새 구성원 사진은 **3×4cm 규격**으로 받으면 잘림이 0이 된다.
- 반응형 분기: 헤더는 **한 줄(메인탭만, `--header-h: 68px`)**, `max-width: 1080px`(햄버거 + 드로어), `560px`(카드 세로 쌓기). `scrollToHash()`는 `--header-h` 대신 헤더 실제 높이(offsetHeight)를 측정한다.

---

## 8. 빌드 · 로컬 미리보기 · 배포

- **빌드 없음.** 파일 수정 = 즉시 반영.
- **로컬 미리보기**(JSON `fetch` 때문에 `file://` 불가):
  ```bash
  python -m http.server 8000 --bind 127.0.0.1
  # KO: http://localhost:8000/   EN: http://localhost:8000/en/
  ```
- **배포**: `main` 병합 → `git push origin main` → **GitHub Actions 워크플로**(`.github/workflows/pages.yml`)가 사이트 파일을 그대로 업로드해 Pages에 게시(약 1~2분). 저장소 Settings ▸ Pages ▸ Source = "GitHub Actions". (레거시 Jekyll 빌더의 간헐적 "Page build failed"를 피하기 위해 2026-07-03 이 방식으로 전환.) CMS(/admin) 저장도 main 커밋 → 같은 워크플로로 배포된다.
- **국문→영문 자동 동기화(2026-09-01)**: 배포 워크플로가 업로드 전에 `node scripts/sync-i18n-structure.js`를 실행해, 국문만 고쳐도 영문 데이터의 **구조**(구성원 명단·group/level·사진·기간/학위 표기 변환, 과제 목록·기간, 모집 공고, 언론보도 URL 집합, site 비번역 값)를 맞추고 결과를 자동 커밋한다. 졸업생 email은 국문 파일에서도 비운다(개인정보 규칙). **번역 문구는 만들지 못한다** — 새 항목엔 국문이 임시로 들어가며 parity 경고가 이를 알려준다. professor의 education/careers/societies/committees·site 목록·apply는 짝 기준이 없어 제외(parity 빨간 X가 잡음). 스크립트가 실패해도 배포는 진행된다(continue-on-error).
- **캐시 무효화(중요)**: 루트 탭 8개 + 404.html + en/ 8개(총 17개)가 `app.js`/`styles.css`를 `?v=YYYYMMDD` 쿼리로 참조.
  **`app.js` 또는 `styles.css`를 수정하면 배포 전에 반드시 실행**:
  ```powershell
  powershell -ExecutionPolicy Bypass -File scripts/bump-version.ps1
  ```
  (수동 갱신 누락으로 “불러오는 중” 멈춤 장애가 실제 발생했었음 — 2026-06-03.)
  **같은 날 두 번째 배포면 `-Suffix b`(세 번째는 `c`…)를 반드시 붙일 것** — 기본값 `a`로 다시 돌리면 오늘 이미 `a`로 받아 간 브라우저가 옛 파일을 계속 쓴다.
  데이터(`data/*.json`)만 바꿀 땐 `fetch(..., {cache:"no-store"})`라 버전 불필요.
- **편집(CMS)**: `/admin`(Sveltia) — GitHub OAuth는 Cloudflare Worker가 처리하며 실제 사이트에서만 동작(localhost 불가). → `EDIT-LOGIN-GUIDE.md`(복구 절차 §2-2 포함).
- **국/영문 정합성 점검(데이터를 고쳤으면 돌릴 것)**:
  ```bash
  node scripts/check-i18n-parity.js
  ```
  국문과 영문의 **항목 수·구성원 소속·과제 기간·모집 공고 수**가 어긋나면 `❌ 오류`(exit 1),
  공용 데이터(논문·학술대회·특허·수상)의 **영문 칸이 비어 있거나 `data/en/` 파일에 한글이 남아 있으면** `⚠️ 경고`(exit 0)로 알린다.
  push할 때도 `.github/workflows/i18n-parity.yml`이 자동으로 돌지만 **배포(pages.yml)와는 분리된 워크플로**라
  여기서 실패해도 사이트 배포는 그대로 진행된다(빨간 X = "영문도 손봐야 함" 알림).

---

## 9. 자주 하는 수정 (How-to)

- **구성원 추가/졸업 처리** → `data/members.json`(국문)만 고쳐도 배포 때 영문 구조가 자동으로 따라온다(sync-i18n-structure — email 비움·기간/학위 표기 변환 포함). 단 **새 항목의 소속 등 영문 문구는 국문이 임시로 들어가므로** 🌐 [영문] 구성원에서 번역을 채울 것. **소속 학과명 주의**: 학부연구생·교수는 도시공학과(Urban Engineering)지만 **석·박사 대학원은 도시계획·조경학과**(Dept. of Urban Planning and Landscape Architecture — 2026-09-01 확정, 가운뎃점 ·).
- **모집 공고 올리기/내리기** → `data/news.json`에 category "모집"(EN `Recruiting`) + `deadline`(선택). People→지원 탭에 콜아웃으로 뜨고 마감일이 지나면 자동으로 내려간다. 그 외 분류의 소식 글은 News 폐지 후 사이트에 노출되지 않는다.
- **교수 정보/연구자 링크** → `data/professor.json`(+en). Scholar/ORCID는 `links[]`에.
- **지원 안내·FAQ** → `data/apply.json`(+en).
- **연구 분야/강의/소개/오시는 길** → `data/site.json`(+en). **연구 분야는 홈에만** 나온다(Projects 탭에서 중복 제거, 2026-07-27).
- **행사 사진 올리기** → CMS `📷 행사 사진`에서 행사 추가(행사일 + **행사 유형** + 행사명 + 장소·참여자(선택) + 사진 여러 장 동시 업로드 — `assets/uploads/photos/`에 저장). 파일로 고칠 땐 `data/photos.json` 하나면 된다(영문 파일 없음). 정렬은 date 내림차순 자동이라 순서 걱정이 없고, 영문 문구는 `title_en`·`place_en`·`people_en`·`description_en`(비우면 국문이 그대로 노출). **행사 유형을 비우면** 그 행사는 구분 칩에 안 잡히고 '전체'에서만 보인다.
- **연구 과제 추가** → `data/projects.json` **+ `data/en/projects.json` 동시 수정**. 맨 위(최신)에 넣으면 그 순서대로 보인다(코드가 재정렬하지 않음). 연도 필터는 `period`의 **첫** 4자리, 진행 중/완료 구분은 `period`의 **끝 월**로 자동 판정되므로 **기간 표기 형식만 지키면 손댈 것이 없다**(끝나는 달이 지나면 다음 달에 저절로 '완료'로 넘어감).
- **새 소탭 추가** → ① `app.js`의 `SUBNAV`(KO/EN 두 벌 모두) ② 해당 `render*`의 탭 배열, 같은 `key`로.
- **UI 문자열 수정** → `app.js`의 `T` 테이블(KO/EN 두 곳).
- **메인탭 추가/순서 변경** → `app.js`의 `NAV` + 새 페이지는 KO/EN HTML 2개 생성 + sitemap.xml 갱신.

---

## 10. 주의점 / 함정

- **국문/영문 데이터는 이중 관리**: `data/en/`에 파일이 존재하는 6종(site·news·professor·members·projects·apply)은 국문만 고치면 영문판이 낡는다. **구조는 배포 때 자동 동기화**(sync-i18n-structure)되지만 **번역 문구는 아니다** — 새 항목의 영문 문구는 CMS 🌐 [영문] 메뉴로 채울 것.
- **국문이 정본이다.** 국·영문이 어긋났을 때는 국문 값을 정답으로 삼아 영문을 맞춘다(2026-08-13 확정). 실제로 어긋난 것들을 git 이력으로 추적해 보니 전부 "교수님이 국문 CMS에서만 고친 것"이었다 — 영문 쪽이 옳았던 사례는 없었다. 반대 방향으로 고치려면 먼저 확인할 것.
- `SUBNAV`의 `key`와 `render*` 탭의 `key`가 **반드시 일치**해야 드롭다운 딥링크가 작동.
- 모집 공고 category 값은 **언어별로 다름**(KO "모집" / EN "Recruiting"). 코드에서 비교할 땐 `RECRUIT_CAT` 상수 사용.
- 국내 학술대회 title은 `한글 / English` 병기 — 슬래시 구분자를 지우면 영문판에 한글이 노출됨.
- 연구 과제 `period`는 **표시용 문자열이자 진행 중/완료 판정 근거**다. 구분자(`~`·`–`)와 끝 월을 빠뜨리면 그 과제는 계속 '진행 중'으로 남는다.
- 모든 사용자 데이터는 출력 시 `esc()`(텍스트) / `cssUrl()`(이미지 경로·url()) / `richText`(뉴스 본문) 처리 — 새 빌더도 동일하게.
- 이미지 경로는 `imgSrc()`로 정규화(BASE 처리 포함)해야 /en/ 아래에서도 안전.
- members의 group×level 조합이 어긋나도 이제 '기타' 그룹으로 표시되지만, CMS hint의 권장 조합을 따를 것.
- 이 저장소는 Google Drive 동기화 폴더 안에 있음 — `.git` 파손 위험이 있으므로 가능하면 Drive 밖 클론에서 작업 권장.
  실제 사고: Drive가 `.git/refs/**`에 `desktop.ini`를 만들어 `fatal: bad object refs/…/desktop.ini`로 fetch/push가 막힘(2026-07-25). 복구는 `find .git -name desktop.ini -delete` 한 줄.
