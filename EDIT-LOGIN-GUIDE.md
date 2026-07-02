# DASMOLabs 홈페이지 — 편집 로그인 설정 정리 & 멤버 가이드

> **목적**: `/admin` 편집 로그인(“GitHub으로 로그인”)을 어떻게 설정했는지 기록하고,
> 연구실 멤버가 홈페이지를 직접 편집·관리하는 방법을 정리한 문서.
> **작성**: 2026-06-02
> **방식**: Cloudflare Worker(무료) 기반 GitHub OAuth 로그인 — 멤버가 **각자 자기 GitHub 계정으로** 로그인.

---

## 0. 30초 요약

- 편집 주소: **https://dasmolab.github.io/admin/**
- 로그인: **“Sign in with GitHub”** → 본인 GitHub 계정으로 로그인 → 편집.
- **저장소에 쓰기(Write) 권한이 있는 사람만** 편집·저장 가능. (= 협업자 등록이 곧 편집 권한)
- 로그인 처리는 무료 **Cloudflare Worker**가 담당. (토큰을 나눠 쓰는 방식이 아니라, 각자 본인 계정으로 들어옴)
- **전부 무료.** 과금 없음.

---

## 1. 핵심 값 (설정 요약)

| 항목 | 값 |
|---|---|
| 공개 사이트 | https://dasmolab.github.io/ |
| 편집(관리자) 주소 | https://dasmolab.github.io/admin/ |
| GitHub 저장소 | `dasmolab/dasmolab.github.io` (브랜치 `main`) |
| 로그인 도우미(Cloudflare Worker) | `https://sveltia-cms-auth.gihyo123450.workers.dev` |
| GitHub OAuth App | 이름 `DASMOLabs CMS` (dasmolab 조직 소유) |
| CMS | Sveltia CMS (`admin/index.html` + `admin/config.yml`) |

> ⚠️ **Client Secret**(OAuth 비밀값)은 어디에도 기록하지 않음. Cloudflare Worker의 암호화 변수(`GITHUB_CLIENT_SECRET`)에만 저장됨.

---

## 2. 멤버가 홈페이지를 편집하는 법 (가장 자주 쓰는 부분)

1. **https://dasmolab.github.io/admin/** 접속.
2. **“Sign in with GitHub”** 클릭 → 본인 GitHub 로그인 → **Authorize(승인)**.
3. 왼쪽 메뉴에서 고칠 항목 선택:
   - ⚙️ 사이트 기본정보(+ 지원 안내) / 📰 소식 / 👤 교수 소개 / 👥 구성원 / 📁 프로젝트 / 📄 논문 / 🎤 학술대회 / 🔖 특허 / 🏆 수상
   - 🌐 **[영문]** 으로 시작하는 메뉴 = 영문(/en/) 사이트 콘텐츠. **국문을 고쳤으면 같은 내용을 영문 쪽에도 반영**해야 영문 사이트가 낡지 않음.
4. **새 항목 추가**: 목록에서 **➕ Add** → 양식 작성 → 사진은 이미지 칸에서 업로드. (각 입력칸 아래 회색 도움말을 참고)
5. 오른쪽 위 **Save / Publish** → **1~2분 뒤 실제 사이트 반영.**

> 모든 변경은 GitHub에 자동 기록(버전 관리)되어, 실수해도 되돌릴 수 있음 → 방법은 **§2-2 복구** 참고.
> 권한 없는 사람은 로그인돼도 **저장이 안 됨.** 일반 방문자는 로그인 없이 사이트를 봄(보기 전용).

---

## 2-1. 자주 하는 편집 시나리오 (레시피)

**① 구성원 졸업 처리**
1. 👥 구성원 → 해당 구성원 클릭.
2. **구분**을 `졸업생`으로 변경, **과정/학위**는 그대로(석사과정→석사).
3. **졸업년도**(예: `2026. 2.`) · **학위명**(예: `공학석사`) · **학위논문명**(`국문 / English` 병기) 입력.
4. **이메일 칸은 비우기**(졸업생 개인 이메일은 개인정보 보호를 위해 싣지 않음) → 저장.
5. 🌐 [영문] 구성원에서도 같은 사람을 같은 방식으로 수정.

**② 모집 공고 올리기 / 내리기**
- 올리기: 📰 소식 → 추가 → 분류 `모집` → 제목·내용 작성 → (선택) **모집 마감일** 지정 → 저장.
  → 홈 화면 상단에 모집 배너가 자동 표시되고, People→지원 탭에 공고 본문이 표시됨. (News 목록에는 안 뜸 — 정상)
- 내리기: 마감일을 지정했다면 그 날짜가 지나면 **자동으로 내려감**. 아니면 항목을 삭제하거나 분류를 바꾸면 됨.
- 영문 배너도 원하면 🌐 [영문] 소식에 분류 `Recruiting`으로 같은 글 추가.

**③ 소식(활동 일지) 올리기**
- 📰 소식 → 추가 → 날짜/분류/제목/내용 → **사진은 여러 장 한 번에 선택** 가능.
- 사진은 가로 1600px 이하·1장당 500KB 이하로 줄여서 업로드(핸드폰 원본은 너무 큼 — 카톡 ‘일반 화질’ 전송본 정도면 적당).

**④ 논문·학술대회 추가**
- 📄 논문: 서지정보에 연도를 반드시 `(2025)` 괄호로 포함(연도 필터가 이 괄호를 읽음). **링크 칸에 DOI 주소**(`https://doi.org/...`)를 넣으면 [link] 버튼이 생김.
- 🎤 학술대회: 국내 발표 제목은 `한글 제목 / English Title` 형식으로 — 영문 사이트가 슬래시 뒤 영문만 표시함.

---

## 2-2. 실수했을 때 되돌리기 (복구) 🛟

CMS 저장 = 즉시 실제 사이트 반영이므로, 목록을 통째로 지우는 등 큰 실수를 하면 아래 절차로 되돌립니다.
**비전공자도 GitHub 웹 화면만으로 가능** (설치·명령어 불필요):

1. https://github.com/dasmolab/dasmolab.github.io 접속 → 로그인.
2. 잘못 저장된 파일로 이동 — 예: 구성원이면 `data/members.json` 클릭.
3. 오른쪽 위 **History**(시계 아이콘) 클릭 → 커밋 목록에서 **사고 이전 시점**의 커밋 클릭.
4. 그 시점의 파일 내용이 보이면 **Raw** 버튼 → 전체 선택(Ctrl+A) → 복사(Ctrl+C).
5. 다시 파일의 현재 화면으로 돌아와 ✏️(연필, Edit) → 전체 선택 → 붙여넣기 → **Commit changes**.
6. 1~2분 뒤 사이트가 사고 이전 내용으로 복구됨.

> 개발자가 있다면 한 줄로도 가능: `git revert <사고 커밋>` 후 push.
> 어떤 파일이 어느 메뉴인지: 소식=`data/news.json`, 구성원=`data/members.json`, 교수=`data/professor.json`,
> 논문=`data/publications.json`, 영문판은 `data/en/` 아래 같은 이름.

---

## 3. 새 멤버에게 편집 권한 주기 (= 접근 제어)

**“승인된 사람만 수정”의 핵심.** 저장소에 **Write 권한**을 준 사람만 편집·저장 가능.

### 추가 (관리자가 하는 일)
1. 추가할 멤버에게 **GitHub 계정**을 만들어 오라고 하고 **GitHub 사용자명**을 받음.
2. https://github.com/dasmolab/dasmolab.github.io/settings/access 접속
   (또는 저장소 ▸ Settings ▸ **Collaborators and teams**).
3. **Add people** → 멤버 GitHub 사용자명/이메일 입력 → 권한 **Write** → 추가.
4. 멤버는 **GitHub 초대 메일의 Accept** 클릭 후부터 로그인·편집 가능.

### 멤버가 첫 로그인
- https://dasmolab.github.io/admin/ → **Sign in with GitHub** → Authorize → 편집.

### 권한 회수 (졸업 등)
- 같은 Collaborators 화면에서 그 사람 옆 **Remove**. 그 사람만 즉시 편집 불가. (나머지는 영향 없음)

> 💡 조직(dasmolab)에 “OAuth App 접근 제한”이 켜져 있으면, 멤버 첫 로그인 시 조직 소유자의 승인이 필요할 수 있음.
> 그 경우 조직 ▸ Settings ▸ Third-party access(또는 OAuth app policy)에서 `DASMOLabs CMS` 앱을 승인.

---

## 4. 이 로그인은 어떻게 동작하나 (구조)

```
방문자/멤버 ── https://dasmolab.github.io/admin/ (Sveltia CMS)
                      │  "Sign in with GitHub"
                      ▼
   Cloudflare Worker (sveltia-cms-auth.gihyo123450.workers.dev)  ← 로그인 중계
                      │  GitHub OAuth (DASMOLabs CMS 앱)
                      ▼
              GitHub 로그인 + 권한 확인
                      │  저장소 Write 권한 있으면
                      ▼
        data/*.json · assets/uploads/ 를 GitHub에 커밋 → 사이트 자동 재배포
```

- GitHub Pages에는 서버가 없어서, “GitHub으로 로그인”을 처리할 작은 중계 서버가 필요 → 그게 **Cloudflare Worker**.
- 설정 연결 위치: `admin/config.yml`의 `base_url: https://sveltia-cms-auth.gihyo123450.workers.dev` (끝에 `/callback` 없음, 슬래시로 끝나지 않음).
- OAuth App의 **Authorization callback URL** = `https://sveltia-cms-auth.gihyo123450.workers.dev/callback` (반드시 `/callback` 포함).

---

## 5. 설정에 사용한 값 (Cloudflare Worker 변수)

Cloudflare ▸ Workers & Pages ▸ `sveltia-cms-auth` ▸ Settings ▸ Variables and Secrets:

| 이름 | 종류 | 값 |
|---|---|---|
| `GITHUB_CLIENT_ID` | Text | (OAuth App의 Client ID) |
| `GITHUB_CLIENT_SECRET` | Secret(암호화) | (OAuth App의 Client Secret) — 비공개 |
| `ALLOWED_DOMAINS` | Text | `dasmolab.github.io` |

---

## 6. 문제 해결 (Troubleshooting)

| 증상 | 원인 / 해결 |
|---|---|
| “Sign in with GitHub”이 아니라 “Sign in with Token”만 보임 | `admin/config.yml`의 `base_url` 주석이 안 풀렸거나 배포 전. Ctrl+F5 강력 새로고침, 1~2분 대기. |
| “Sign in with GitHub” 클릭 시 오류 | ① OAuth callback이 `…workers.dev/callback`로 정확히 끝나는지 ② config.yml `base_url`은 `/callback` 없이 Worker 루트인지 ③ Worker 변수 `ALLOWED_DOMAINS`에 `dasmolab.github.io` 포함됐는지 ④ `GITHUB_CLIENT_ID`/`SECRET` 오타 없는지. |
| 로그인은 되는데 **저장 안 됨** | 그 사람이 저장소 **협업자(Write)**가 아님 → §3에서 추가. |
| 멤버 로그인 시 “조직 승인 필요” | 조직 OAuth 앱 정책 → 소유자가 `DASMOLabs CMS` 앱 승인(§3 메모). |
| 편집 메뉴가 안 보임 | `admin/config.yml`의 `repo:`가 `dasmolab/dasmolab.github.io`인지, `branch: main`인지 확인. |
| 사진 올렸는데 안 보임 | 저장 후 1~2분 대기 + 강력 새로고침. `assets/uploads/`에 커밋됐는지 확인. |
| 잘못 저장/삭제해서 되돌리고 싶음 | **§2-2 복구** 절차대로 GitHub History에서 이전 내용을 복사해 다시 저장. |
| 어느 날 갑자기 편집 화면이 이상함 | `admin/index.html`이 Sveltia CMS 버전을 고정(`@버전`)하고 있으므로 드묾. 반년에 한 번쯤 그 버전 숫자를 [최신 릴리스](https://github.com/sveltia/sveltia-cms/releases)로 올려 주면 좋음. |

---

## 7. 오늘 한 작업 기록 (2026-06-02)

1. 로그인 방식 **Cloudflare Worker(팀용)** 으로 결정. (토큰 공유 방식은 보안·관리상 비추천이라 제외)
2. 로그인 중계용 **Cloudflare Worker 배포**:
   - `sveltia/sveltia-cms-auth` 레포를 받아 `wrangler`로 배포 → `https://sveltia-cms-auth.gihyo123450.workers.dev`.
   - (Cloudflare “Deploy” 버튼은 Workers Builds 권한 오류로 막혀서, `wrangler deploy`로 직접 배포함.)
3. **GitHub OAuth App `DASMOLabs CMS`** 등록(dasmolab 조직 소유). callback = Worker 주소 + `/callback`.
4. Worker에 변수 3개 입력: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`(암호화), `ALLOWED_DOMAINS=dasmolab.github.io`.
5. `admin/config.yml`의 `base_url` 주석 해제 → Worker 주소 연결 → commit & push(배포).
6. https://dasmolab.github.io/admin/ 에서 **“Sign in with GitHub” 로그인 → 편집 메뉴 표시 확인 → 성공.**

---

## 8. 남은 일 (선택)

- 편집할 연구실 멤버를 **저장소 협업자(Write)로 추가**(§3).
- 담당직원에게 **https://dasmolab.github.io/** 전달 → 기존 학교 페이지에 링크.
- (선택) 커스텀 도메인 연결(유료) — 연결 시 OAuth Homepage URL / callback / `ALLOWED_DOMAINS` 도 새 도메인으로 갱신 필요.

---

## 9. 졸업 인수인계 체크리스트 (관리자 교체 시) ⭐

홈페이지 관리자(대학원생)가 졸업·이동할 때, 일부 설정이 **그 사람 개인 계정에 묶여** 있어 후임에게 넘겨야 함. 안 하면 로그인이 깨질 수 있음.

### 지금 개인 계정에 묶여 있는 것
| 항목 | 소유 | 위험도 |
|---|---|---|
| GitHub 조직 `dasmolab` | 만든 사람(현재 jihyo1541) | ⚠️ 소유권 이전 필요 |
| **Cloudflare Worker**(로그인 도우미) | **개인 Cloudflare 계정**(현재 gihyo123450) | 🔴 **가장 중요** — 계정 사라지면 로그인 전체 중단 |
| GitHub OAuth 앱 `DASMOLabs CMS` | 조직(dasmolab) 소유 | ✅ 조직만 유지되면 안전 |
| 저장소 콘텐츠 | 조직 소유 | ✅ 안전 |

### 💡 가장 좋은 방향: “연구실 공용 계정”으로 묶기
사람(학생)이 아니라 **연구실에 남는 주체**(교수님 계정 또는 연구실 공용 이메일, 예: `dasmolab@gmail.com`)가
**GitHub 조직 소유권**과 **Cloudflare 계정**을 갖게 하면, 이후엔 그 계정 로그인 정보만 후임에게 넘기면 끝. 재설정 불필요.

### ✅ 졸업 전 인수인계 4단계

**1) GitHub 조직 소유권 넘기기**
- 조직 `dasmolab` ▸ People ▸ 후임을 **Owner(소유자)** 로 지정.
- 항상 **안정적인 소유자 최소 1명**(교수님/연구실 공용 계정)을 남겨둘 것.

**2) Cloudflare Worker 넘기기 🔴 (제일 중요)**
- (쉬움) 후임/연구실 Cloudflare 계정에서 **Worker를 새로 배포** → 새 주소가 생김 → 아래 2곳만 새 주소로 갱신:
  - GitHub OAuth 앱의 **Authorization callback URL** = `새Worker주소/callback`
  - `admin/config.yml`의 **`base_url`** = `새Worker주소` (`/callback` 없이) → commit & push
  - (재배포 방법은 §7 “오늘 한 작업 기록”과 동일. `wrangler deploy` 사용, 약 10분.)
- (대안) Cloudflare 계정 자체를 연구실 공용 계정으로 두면, 로그인 정보만 넘기면 됨(재배포 불필요).

**3) 편집 권한 정리**
- 후임을 저장소 **협업자(Write)** 로 추가(§3). 졸업하는 본인은 필요 시 Remove.

**4) 문서 전달**
- 후임에게 `EDIT-LOGIN-GUIDE.md`(이 문서) · `SETUP-GUIDE.md` · `PROJECT-NOTES.md` 위치를 알려주면 인수인계 끝.

> 한 줄 요약: 평소엔 할 일 없음. **졸업이 다가오면 ① 조직 소유권 ② Cloudflare Worker** 이 둘만 연구실/후임에게 넘기면 홈페이지는 그대로 작동.

---

> 관련 문서: `SETUP-GUIDE.md`(전체 배포·운영 가이드, 공개), `README.md`(개요), `PROJECT-NOTES.md`(개발 인수인계, 비공개).
