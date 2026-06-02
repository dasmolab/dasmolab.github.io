# DASMOLabs — Dong-A Smart Mobility Laboratory

동아대학교 도시공학과 교통공학연구실 홈페이지입니다.
빌드 과정 없는 정적 사이트(HTML/CSS/JS) + GitHub Pages(무료 호스팅) + Sveltia CMS(로그인 편집)로 구성됩니다.

- **사이트**: https://dasmolab.github.io/  (무료 GitHub 조직 계정으로 호스팅 — 닉네임 없는 브랜드 주소)
- **편집(관리자)**: https://dasmolab.github.io/admin/ — 승인된(저장소 쓰기권한) 사용자만 로그인 후 편집

> 조직 이름을 `dasmolab`이 아닌 다른 이름으로 만들면 위 주소와 `admin/config.yml`의 `repo:`를 그 이름으로 맞추세요.

## 처음 배포하거나 운영하는 분께

➡️ **[SETUP-GUIDE.md](SETUP-GUIDE.md)** 를 보세요. GitHub 가입부터 로그인 편집 설정까지 단계별 한국어 안내가 있습니다.

## 내용 수정

대부분의 수정은 `/admin` 편집 화면에서 합니다(코딩 불필요).
실제 콘텐츠는 `data/*.json` 에 저장되며, 화면은 `assets/js/app.js` 가 이 데이터를 읽어 그립니다.

## 로컬 미리보기 (선택, 개발용)

```bash
# Node.js가 설치돼 있으면:
npx serve .
# 또는
python -m http.server 8000
```
브라우저에서 `http://localhost:8000` 접속. (※ 로컬에서는 `/admin` CMS 로그인은 동작하지 않습니다 — 실제 배포 후 사용)

## 기술 메모

- 디자인: 네이비 + 틸(teal) 색상, Pretendard 폰트(동적 서브셋), 반응형.
- 헤더/푸터는 `assets/js/app.js`가 `data/site.json` 기준으로 자동 생성합니다.
- `.nojekyll` 은 GitHub Pages의 Jekyll 처리를 비활성화합니다(삭제 금지).
