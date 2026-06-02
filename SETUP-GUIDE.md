# DASMOLabs 홈페이지 — 배포 & 운영 가이드

이 문서는 **비전공자도 따라 할 수 있도록** 만든 단계별 안내입니다.
홈페이지를 인터넷에 올리고(**완전 무료**), 승인된 사람만 로그인해서 내용을 고칠 수 있게 설정합니다.

> ### 💰 비용 안내 — 전부 무료입니다
> GitHub 계정·조직·Pages 호스팅, 편집도구(Sveltia CMS), 폰트, 로그인용 Cloudflare Worker(무료 등급) 모두 **무료**이며 **과금되지 않습니다.** 유료가 되는 건 *선택사항인 별도 도메인 구입*(PART 6)뿐이며, 안 하셔도 됩니다.

> ### 전체 구조 한눈에 보기
> - **호스팅**: GitHub Pages (무료, 광고 없음)
> - **편집**: 사이트 주소 뒤에 `/admin` → 로그인 → 양식으로 편집 (코딩 없음)
> - **로그인/권한**: GitHub 계정으로 로그인. **"저장소에 쓰기 권한(협업자)"을 가진 사람만** 저장 가능.
>   = 비밀번호를 따로 만드는 게 아니라, **GitHub 계정 + 협업자 등록**이 곧 편집 권한입니다.
> - **사진 업로드**: 편집 화면에서 이미지 업로드 버튼으로 바로 올림.

---

## 미리 정해둔 값

**연구실 브랜드 주소**를 쓰기 위해 개인 계정 대신 **무료 GitHub 조직(Organization)** 으로 호스팅합니다.

| 항목 | 값 |
|---|---|
| GitHub 조직 이름 | **dasmolab** (이미 사용 중이면 `dasmolabs`, `dau-dasmolab` 등으로) |
| 저장소(repository) 이름 | **`dasmolab.github.io`** ← 조직이름과 똑같이 `.github.io`를 붙인 이름이어야 루트 주소가 됩니다 |
| 최종 사이트 주소 | **`https://dasmolab.github.io/`** (닉네임 없음 ✅) |
| 편집(관리자) 주소 | **`https://dasmolab.github.io/admin/`** |

> 조직 이름을 `dasmolab`이 아닌 다른 이름으로 만들었다면, 이 문서의 모든 `dasmolab` 을 그 이름으로 바꿔 읽으세요.
> 그리고 `admin/config.yml` 파일의 `repo:` 줄도 `조직이름/조직이름.github.io` 로 맞춰주세요.
> 담당 직원에게는 마지막에 **최종 사이트 주소** 하나만 전달하면 됩니다.

---

## PART 1. 홈페이지를 인터넷에 올리기 (GitHub Pages)

### 1-0. GitHub 무료 조직(Organization) 만들기
1. https://github.com 에 로그인(기존 jihyo1541 계정 사용).
2. 오른쪽 위 `+` ▸ **New organization** ▸ **Free**(무료) 플랜 선택.
3. **Organization name**: `dasmolab` 입력(이미 있으면 `dasmolabs` 등 가능한 이름으로). 이메일 입력 후 생성.
   - (멤버 초대 단계는 건너뛰어도 됩니다. 나중에 추가 가능.)

### 1-1. 저장소(repository) 만들기
1. 방금 만든 **dasmolab 조직** 화면에서 **New repository** 클릭(또는 `+` ▸ New repository ▸ Owner를 dasmolab으로).
2. **Repository name**: `dasmolab.github.io` 입력 (★ 조직이름과 동일 + `.github.io`).
3. 공개 범위: **Public** 선택. (무료 GitHub Pages는 저장소가 Public이어야 합니다. ⚠️ 비밀번호·개인정보 등 민감정보는 올리지 마세요.)
4. **Create repository** 클릭.

### 1-2. 홈페이지 파일 업로드
> 💡 방금 만든 저장소가 **비어 있으면** GitHub가 "Quick setup" 안내 화면(회색 명령어 박스)을 보여주며, 이때는 `Add file` 버튼이 없습니다.
> 그 화면 아래의 문장 *"…uploading an existing file(기존 파일 업로드)"* 의 **파란색 링크를 클릭**하면 업로드 화면으로 갑니다.
> (바로가기: `https://github.com/dasmolab/dasmolab.github.io/upload/main` — 조직명은 본인 것으로)
> 첫 업로드 이후부터는 일반 화면에서 초록색 `Code` 버튼 옆의 **`Add file ▾`** 버튼이 나타납니다.

1. 저장소 화면에서 **Add file ▸ Upload files** 클릭. (빈 저장소면 위 안내처럼 "uploading an existing file" 링크 사용.)
2. 이 폴더(`G:\내 드라이브\연구실\Homepage`) **안의 내용 전체**를 끌어다 놓습니다.
   - ✅ `index.html` 이 **맨 위(최상위)** 에 오도록 하세요. (폴더 통째로가 아니라 폴더 *안의* 파일·폴더들을 올립니다.)
   - 함께 올라가야 할 것: `index.html`, `professor.html` … `awards.html`, `assets/`, `data/`, `admin/`, `.nojekyll`
   - `.nojekyll` 이라는 점으로 시작하는 빈 파일도 꼭 포함하세요(드래그 시 숨김파일이 빠지면 따로 올리세요). GitHub가 사이트를 잘못 처리하지 않게 막아줍니다.
3. 맨 아래 **Commit changes** 클릭.

### 1-3. GitHub Pages 확인/켜기
- `이름.github.io` 저장소는 보통 **자동으로** Pages가 켜집니다.
1. 저장소 **Settings ▸ Pages** 로 들어가 확인.
2. 만약 꺼져 있으면 **Source**: **Deploy from a branch**, **Branch**: `main`, 폴더 **`/ (root)`** → **Save**.
3. 1~10분 뒤 새로고침하면 **"Your site is live at https://dasmolab.github.io/"** 가 뜹니다.
4. 그 주소로 들어가 홈페이지가 보이는지 확인하세요. (HTTPS 자물쇠 자동 적용)

> 이후 내용을 바꾸면(아래 PART 5 편집 또는 파일 재업로드) **자동으로 다시 게시**됩니다.

---

## PART 2. (빠른 확인 / 1~2명용) 토큰으로 편집하기 — 외부 서비스 불필요

OAuth(팀 로그인) 설정 없이 **GitHub만으로** 바로 편집하는 방법입니다. **혼자 또는 1~2명**이 쓸 때 가장 단순합니다.

1. 브라우저에서 `https://dasmolab.github.io/admin/` 접속.
2. **"Sign in with Token"** 버튼 클릭.
3. 안내 링크에서 GitHub **Personal Access Token** 생성:
   - 권한(scope)은 **repo** 체크(또는 이 저장소만 허용하는 fine-grained 토큰)하고 생성.
   - 생성된 토큰 문자열을 복사해 CMS 화면에 붙여넣기.
4. 왼쪽에 **사이트 기본정보 / 교수 소개 / 구성원 / 논문 …** 메뉴가 보이고 편집·저장되면 성공.

> 여러 명(연구실 멤버)이 각자 자기 GitHub 계정으로 로그인하게 하려면 → PART 3 진행. (둘 다 무료)

---

## PART 3. (선택 / 팀용) "GitHub으로 로그인" 만들기 — 무료 Cloudflare Worker

GitHub Pages엔 서버가 없어서, "GitHub으로 로그인"을 처리할 작은 **무료** 도우미를 한 번만 만들어 둡니다. (무료 등급, 카드 불필요)

### 3-1. Cloudflare 무료 가입 & Worker 배포
1. https://dash.cloudflare.com 에서 무료 계정 생성.
2. https://github.com/sveltia/sveltia-cms-auth 의 README **"Deploy to Cloudflare Workers"** 버튼으로 배포.
3. 배포 후 생기는 Worker 주소를 **복사**: 예) `https://sveltia-cms-auth.<본인서브도메인>.workers.dev`

### 3-2. GitHub OAuth App 등록 (조직 소유로)
1. **dasmolab 조직** ▸ Settings ▸ Developer settings ▸ **OAuth Apps** ▸ **New OAuth App**.
   (조직 소유로 만들면 담당자가 바뀌어도 유지됩니다.)
2. 입력값:
   - **Application name**: `DASMOLabs CMS`
   - **Homepage URL**: `https://dasmolab.github.io/`
   - **Authorization callback URL**: `https://sveltia-cms-auth.<본인서브도메인>.workers.dev/callback`
     ⚠️ **반드시 끝에 `/callback`** (가장 흔한 실수 1순위)
3. **Register application** → **Client ID** 복사, **Generate a new client secret** → **Client Secret** 즉시 복사
   (시크릿은 한 번만 보임. **절대 저장소/파일에 넣지 말 것** — 아래 Worker에만 입력).

### 3-3. Worker에 비밀값 넣기
1. Cloudflare 대시보드 ▸ **sveltia-cms-auth** Worker ▸ **Settings ▸ Variables and Secrets**.
2. 추가:
   - `GITHUB_CLIENT_ID` = (Client ID) — 일반 텍스트
   - `GITHUB_CLIENT_SECRET` = (Client Secret) — **Encrypt(암호화)** 로 저장
   - `ALLOWED_DOMAINS` = `dasmolab.github.io` — (권장: 도용 방지)
3. 저장(필요 시 redeploy).

### 3-4. 설정파일에 Worker 주소 연결
1. 저장소의 `admin/config.yml` 을 GitHub에서 편집(연필 아이콘).
2. `backend:` 아래 주석 처리된 `base_url:` 줄에서 **#을 지우고** 본인 Worker 주소로:
   ```yaml
   base_url: https://sveltia-cms-auth.<본인서브도메인>.workers.dev
   ```
   ⚠️ 여기에는 **`/callback` 없이**, 끝에 슬래시도 없이 Worker "루트" 주소만.
3. **Commit changes** 저장.

### 3-5. 로그인 테스트
1. `https://dasmolab.github.io/admin/` 새로고침 → **"Sign in with GitHub"** → 승인 → 편집 화면. 끝!

---

## PART 4. 편집 권한 주기 (= 접근 제어)

**"승인된 사람만 수정"** 의 핵심. 저장소에 **쓰기(Write) 권한이 있는 사람만** 저장 가능합니다.

1. 저장소 ▸ **Settings ▸ Collaborators and teams** ▸ **Add people**.
2. 함께 편집할 멤버의 **GitHub 사용자명/이메일** 입력 ▸ 추가, 권한 **Write**.
3. 초대받은 사람은 이메일의 **Accept** 후부터 로그인·편집 가능.
4. 권한 회수(졸업생 등)는 같은 화면에서 제거.

> 권한 없는 사람은 로그인돼도 **저장이 안 됩니다.** 방문자는 로그인 없이 그냥 사이트를 봅니다(보기 전용).

---

## PART 5. 평소 내용 수정하는 법 (가장 자주 쓰는 부분)

1. `https://dasmolab.github.io/admin/` 접속 → 로그인.
2. 왼쪽 메뉴에서 고칠 항목 선택:
   - **⚙️ 사이트 기본정보** — 소개글, 연구분야 카드, 강의, 연락처, 로고
   - **👤 교수 소개** — 학력·경력·학회·언론·위원회
   - **👥 구성원** — 멤버 추가/수정/삭제, 사진 업로드
   - **📁 프로젝트 / 📄 논문 / 🎤 학술대회 / 🔖 특허 / 🏆 수상** — 목록 추가/수정
3. **새 항목 추가**: 목록에서 **➕ Add** → 양식 작성 → 사진은 이미지 칸에서 업로드.
4. 오른쪽 위 **Save / Publish** → 1~2분 뒤 실제 사이트 반영.

> 모든 변경은 자동 기록(버전 관리)되어, 실수해도 GitHub에서 되돌릴 수 있습니다.

---

## PART 6. (선택) 우리 도메인 연결하기 — 유료

기본 주소(`dasmolab.github.io`)로 충분합니다. 굳이 별도 도메인을 원하면:

1. 도메인 구입(가비아·Cloudflare 등, **도메인 비용만 유료** / GitHub 호스팅은 무료).
2. 저장소 ▸ Settings ▸ Pages ▸ **Custom domain** 입력 → Save.
3. 등록업체 DNS: `www`는 **CNAME → dasmolab.github.io** / 루트도메인은 **A 레코드 4개** → `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
4. DNS 초록 체크 후 **Enforce HTTPS** 체크(인증서 최대 24h).
5. ⚠️ 도메인 변경 시 PART 3의 **OAuth Homepage URL / ALLOWED_DOMAINS / 편집 주소**도 새 도메인으로 업데이트.

---

## ❗ 문제 해결 (Troubleshooting)

| 증상 | 원인 / 해결 |
|---|---|
| 사이트가 404 | `index.html`이 저장소 최상위에 없음 → 최상위로 옮겨 재업로드. 게시까지 ~10분 대기. |
| 한글 깨짐 | 거의 없음(UTF-8). 강력 새로고침(Ctrl+F5). |
| "Sign in with GitHub" 오류 | ① callback이 `…workers.dev/callback`로 정확히 끝나는지 ② config.yml `base_url`은 `/callback` 없이 Worker 루트인지 ③ `ALLOWED_DOMAINS`에 `dasmolab.github.io` 포함됐는지. |
| 로그인은 되는데 **저장 안 됨** | 그 사람이 저장소 **협업자(Write)** 가 아님 → PART 4. |
| 편집 메뉴가 안 보임 | `admin/config.yml`의 `repo:`가 `dasmolab/dasmolab.github.io`(본인 조직/저장소)와 일치하는지, `branch: main` 인지 확인. |
| 사진 올렸는데 안 보임 | 저장 후 1~2분 대기, 강력 새로고침. 이미지가 `assets/uploads/`에 커밋됐는지 확인. |

---

## 폴더 구조 (참고)

```
dasmolab.github.io/         (= 업로드하는 내용물의 최상위)
├─ index.html               # Home
├─ professor.html · members.html · projects.html
├─ publications.html · conferences.html · patents.html · awards.html
├─ .nojekyll                # (필수) GitHub Jekyll 처리 비활성화 — 삭제 금지
├─ assets/
│  ├─ css/styles.css        # 디자인
│  ├─ js/app.js             # 화면 렌더링 로직
│  ├─ img/                  # 로고 등 고정 이미지
│  └─ uploads/              # 교수·구성원 사진 (CMS 업로드 위치)
├─ data/                    # ← 실제 "내용"이 들어있는 곳 (CMS가 이 파일들을 편집)
│  ├─ site.json · professor.json · members.json · projects.json
│  └─ publications.json · conferences.json · patents.json · awards.json
└─ admin/
   ├─ index.html            # 편집 화면
   └─ config.yml            # 편집 양식 정의 / 저장소·로그인 설정
```

**보통은 `/admin` 화면에서만 편집하면 되고, 위 파일을 직접 손댈 일은 없습니다.**
