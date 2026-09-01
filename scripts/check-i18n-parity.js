#!/usr/bin/env node
/**
 * 국문(data/*.json) ↔ 영문(data/en/*.json) 정합성 점검.
 *
 *   node scripts/check-i18n-parity.js
 *
 * 왜 필요한가: 두 언어의 데이터가 별개 파일이라, CMS에서 국문만 고치면 영문판이
 * 조용히 낡는다(2026-08-13 감사에서 언론보도 7건·위원회 8건·졸업 처리 4명이
 * 영문에만 누락된 채 발견됨). 사람 눈으로는 안 보이므로 숫자로 잡는다.
 *
 * 두 등급으로 구분한다:
 *   [오류] 구조가 어긋난 것 — 항목 수 불일치, 구성원 소속/과정 불일치,
 *          졸업생 이메일 잔존, 과제 기간 불일치. exit code 1.
 *   [경고] 영문 번역이 비어 있는 것 — 새 국문 항목을 넣으면 자연히 생기므로
 *          배포를 막지 않는다. exit code 0.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const errors = [];
const warns = [];
const err = (m) => errors.push(m);
const warn = (m) => warns.push(m);

function load(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    err(`${rel} 를 읽을 수 없음 (JSON 문법 오류): ${e.message}`);
    return null;
  }
}
const arr = (o, k) => (o && Array.isArray(o[k]) ? o[k] : []);
const hasKorean = (s) => /[가-힣]/.test(String(s == null ? "" : s));

/** 두 배열의 길이를 비교한다. */
function sameLength(label, ko, en, koArr, enArr) {
  if (!ko || !en) return;
  if (koArr.length !== enArr.length) {
    err(`${label}: 국문 ${koArr.length}건 / 영문 ${enArr.length}건 — ${koArr.length - enArr.length > 0 ? "영문에 " + (koArr.length - enArr.length) + "건 누락" : "영문에 " + (enArr.length - koArr.length) + "건 초과"}`);
  }
}

/* ── 1. 파일 쌍 ─────────────────────────────────────────────── */
const NAMES = ["site", "news", "professor", "members", "projects", "apply"];
const KO = {}, EN = {};
for (const n of NAMES) {
  KO[n] = load(`data/${n}.json`);
  EN[n] = load(`data/en/${n}.json`);
  if (KO[n] && !EN[n]) err(`data/en/${n}.json 이 없음 (국문만 존재)`);
}

/* ── 2. site ────────────────────────────────────────────────── */
if (KO.site && EN.site) {
  for (const k of ["research_topics", "classes_undergrad", "classes_grad"]) {
    sameLength(`site.${k}`, KO.site, EN.site, arr(KO.site, k), arr(EN.site, k));
  }
  for (const k of ["phone", "email", "map_kakao", "map_naver", "map_google", "lab_abbr"]) {
    if (KO.site[k] !== EN.site[k]) {
      err(`site.${k}: 국문 "${KO.site[k]}" / 영문 "${EN.site[k]}" — 번역 대상이 아닌 값이 서로 다름`);
    }
  }
}

/* ── 3. apply ───────────────────────────────────────────────── */
if (KO.apply && EN.apply) {
  for (const k of ["items", "faq"]) {
    sameLength(`apply.${k}`, KO.apply, EN.apply, arr(KO.apply, k), arr(EN.apply, k));
  }
}

/* ── 4. professor ───────────────────────────────────────────── */
if (KO.professor && EN.professor) {
  for (const k of ["links", "education", "careers", "societies", "media", "committees"]) {
    sameLength(`professor.${k}`, KO.professor, EN.professor, arr(KO.professor, k), arr(EN.professor, k));
  }
  // media 는 URL이 곧 같은 기사라는 뜻 — 집합이 어긋나면 다른 기사를 싣고 있는 것
  const koUrl = new Set(arr(KO.professor, "media").map((m) => m.url).filter(Boolean));
  const enUrl = new Set(arr(EN.professor, "media").map((m) => m.url).filter(Boolean));
  for (const u of koUrl) if (!enUrl.has(u)) err(`professor.media: 영문에 없는 기사 URL — ${u}`);
  for (const u of enUrl) if (!koUrl.has(u)) err(`professor.media: 국문에 없는 기사 URL — ${u}`);
}

/* ── 5. members ─────────────────────────────────────────────── */
if (KO.members && EN.members) {
  const koM = arr(KO.members, "members"), enM = arr(EN.members, "members");
  sameLength("members", KO.members, EN.members, koM, enM);
  // 같은 사람은 name_en + level 로 짝짓는다(정지효처럼 재학·졸업 두 번 등장하는 경우가 있음)
  const key = (m) => `${m.name_en || m.name_ko}|${m.level}`;
  const koBy = new Map(koM.map((m) => [key(m), m]));
  const enBy = new Map(enM.map((m) => [key(m), m]));
  for (const [k, m] of koBy) {
    const e = enBy.get(k);
    if (!e) { err(`members: 영문에 없는 구성원 — ${k}`); continue; }
    if (m.group !== e.group) err(`members "${k}": 소속이 국문 ${m.group} / 영문 ${e.group}`);
    if ((m.photo || "") !== (e.photo || "")) warn(`members "${k}": 사진이 국문 ${m.photo} / 영문 ${e.photo}`);
  }
  for (const k of enBy.keys()) if (!koBy.has(k)) err(`members: 국문에 없는 구성원 — ${k}`);
  // 졸업생 이메일은 저장하지 않는다(CLAUDE.md 규칙 — 화면에 안 나와도 파일은 공개됨)
  for (const [label, list] of [["국문", koM], ["영문", enM]]) {
    for (const m of list) {
      if (m.group === "alumni" && m.email) err(`members(${label}): 졸업생 ${m.name_en || m.name_ko} 의 이메일이 남아 있음`);
    }
  }
}

/* ── 6. projects ────────────────────────────────────────────── */
// 기간은 표시용 문자열이면서 진행중/완료 판정 근거다. 표기는 언어마다 다르므로
// (KO "2026. 8. ~ 2027. 3." / EN "Aug 2026 – Mar 2027") 시작 연도와 끝 연·월만 비교한다.
const MON = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
// "2026. 8." → {y:"2026", m:"8"} / "Aug 2026" → {y:"2026", m:"8"}
function ym(chunk) {
  const s = String(chunk == null ? "" : chunk);
  const y = (s.match(/(?:19|20)\d{2}/) || [""])[0];
  let m = "";
  const named = s.toLowerCase().match(/[a-z]{3,}/);
  if (named) {
    const i = MON.indexOf(named[0].slice(0, 3));
    if (i >= 0) m = String(i + 1);
  } else {
    // 연도(4자리)를 지운 뒤 남는 1~2자리 숫자가 월이다
    const mm = (s.replace(/(?:19|20)\d{2}/g, " ").match(/\d{1,2}/) || [""])[0];
    if (mm) m = String(Number(mm));
  }
  return { y, m };
}
function periodParts(period) {
  const s = String(period == null ? "" : period);
  const parts = s.split(/[~–—]/);
  const head = parts[0];
  const tail = parts.length > 1 ? parts[parts.length - 1] : s;
  const a = ym(head), b = ym(tail);
  return { startYear: a.y, startMonth: a.m, endYear: b.y, endMonth: b.m };
}
if (KO.projects && EN.projects) {
  const koP = arr(KO.projects, "projects"), enP = arr(EN.projects, "projects");
  sameLength("projects", KO.projects, EN.projects, koP, enP);
  const n = Math.min(koP.length, enP.length);
  for (let i = 0; i < n; i++) {
    const a = periodParts(koP[i].period), b = periodParts(enP[i].period);
    if (a.startYear !== b.startYear || a.startMonth !== b.startMonth ||
        a.endYear !== b.endYear || a.endMonth !== b.endMonth) {
      err(`projects[${i}] 기간 불일치 — 국문 "${koP[i].period}" / 영문 "${enP[i].period}" (${koP[i].title || ""})`);
    }
  }
}

/* ── 7. news ────────────────────────────────────────────────── */
if (KO.news && EN.news) {
  const koN = arr(KO.news, "news"), enN = arr(EN.news, "news");
  sameLength("news", KO.news, EN.news, koN, enN);
  const koR = koN.filter((x) => x.category === "모집").length;
  const enR = enN.filter((x) => x.category === "Recruiting").length;
  if (koR !== enR) err(`news 모집 공고: 국문 ${koR}건 / 영문 ${enR}건 — People→지원 탭 콜아웃이 언어마다 달라짐`);
}

/* ── 8. 공용 데이터의 영문 칸 (경고) ────────────────────────── */
// 논문·학술대회·행사 사진·특허·수상은 영문 파일이 없고 항목별 영문 필드로 처리한다.
const cover = [
  ["publications", "publications", "citation", "citation_en", "서지정보"],
  ["conferences", "conferences", "conference", "conference_en", "학술대회명"],
  ["photos", "events", "title", "title_en", "행사명"],
  ["photos", "events", "description", "description_en", "행사 설명"],
  ["patents", "patents", "name", "name_en", "지식재산권명"],
  ["patents", "patents", "inventors", "inventors_en", "발명인"],
  ["awards", "awards", "venue", "venue_en", "시상·학술대회"],
];
for (const [file, key, koField, enField, label] of cover) {
  const d = load(`data/${file}.json`);
  if (!d) continue;
  const items = arr(d, key);
  const need = items.filter((x) => hasKorean(x[koField]));
  const missing = need.filter((x) => !x[enField]);
  if (missing.length) {
    warn(`${file}.json ${label}: 한글 ${need.length}건 중 ${missing.length}건에 ${enField} 없음 → 영문 페이지에 한글이 그대로 노출됨`);
  }
  // 영문 칸에 한글이 남아 있으면 번역이 덜 된 것
  const dirty = items.filter((x) => x[enField] && hasKorean(x[enField]));
  if (dirty.length) warn(`${file}.json ${enField}: ${dirty.length}건에 한글이 섞여 있음`);
}
// 국내 학술대회 제목의 "한글 / English" 병기 규칙
const conf = load("data/conferences.json");
if (conf) {
  const bad = arr(conf, "conferences").filter((c) => c.category === "Domestic" && String(c.title || "").indexOf(" / ") === -1);
  if (bad.length) warn(`conferences.json: 국내 발표 ${bad.length}건의 제목에 " / " 구분자가 없어 영문 페이지에 한글 제목이 그대로 나옴`);
}

/* ── 결과 ───────────────────────────────────────────────────── */
const line = "─".repeat(64);
console.log(line);
console.log("국문 ↔ 영문 정합성 점검");
console.log(line);
if (!errors.length && !warns.length) {
  console.log("✅ 이상 없음 — 국문과 영문이 일치합니다.");
  process.exit(0);
}
if (errors.length) {
  console.log(`\n❌ 오류 ${errors.length}건 (국문과 영문이 실제로 어긋남)`);
  errors.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}
if (warns.length) {
  console.log(`\n⚠️  경고 ${warns.length}건 (영문 번역이 비어 있음 — 배포는 가능)`);
  warns.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
}
console.log("");
process.exit(errors.length ? 1 : 0);
