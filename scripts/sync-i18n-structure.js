#!/usr/bin/env node
/**
 * 국문(data/*.json) → 영문(data/en/*.json) 구조 자동 동기화.
 *
 *   node scripts/sync-i18n-structure.js
 *
 * 왜 필요한가: CMS에서 국문 컬렉션만 저장하면 영문 파일이 조용히 낡는다
 * (2026-09-01에도 구성원 국문 33명 / 영문 30명으로 어긋난 채 발견됨).
 * 이 스크립트는 배포 워크플로(pages.yml)가 push마다 실행해, 국문만 고쳐도
 * 영문 파일의 "구조"가 저절로 따라오게 한다. 국문이 정본이다.
 *
 * 동기화하는 것 (번역이 필요 없는 구조):
 *   - members  : 명단 추가/삭제/순서, group/level/photo,
 *                이메일(재학생 복사 · 졸업생은 국문/영문 모두 삭제 — 개인정보 규칙),
 *                기간·졸업년도·학위(국문 표기 → 영문 표기 자동 변환)
 *   - projects : 목록 추가/삭제/순서 + period 형식 변환(2026. 7. ~ → Jul 2026 –)
 *   - news     : 목록 추가/삭제/순서 + category 국→영 매핑, date/deadline/photos/link
 *   - professor.media : URL 기준 추가/삭제/순서 (URL 없는 항목은 건드리지 않음)
 *   - site     : 번역 대상이 아닌 값(phone·email·지도 링크·lab_abbr) 복사
 *
 * 동기화하지 않는 것 (번역이 필요한 텍스트):
 *   - 소속·논문명·제목·본문 등은 기존 영문 번역을 보존한다. 새로 생긴 항목만
 *     국문을 그대로 넣어 두므로, check-i18n-parity.js 경고를 보고 번역을 채울 것.
 *   - 국문 텍스트가 "수정"된 경우(예: 소속 변경)는 여기서 감지하지 못한다 —
 *     영문 번역이 낡은 채 남으므로 사람이 확인해야 한다.
 *   - professor의 education/careers/societies/committees, site의 목록형 항목,
 *     apply는 안정된 짝 맞추기 기준이 없어 제외 — parity 검사 빨간 X가 잡는다.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const changes = [];
const note = (m) => changes.push(m);

function load(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    console.error(`${rel} 를 읽을 수 없음 (JSON 문법 오류): ${e.message} — 이 파일은 건너뜀`);
    return null;
  }
}
function save(rel, obj) {
  // CMS(Sveltia)와 같은 모양(2칸 들여쓰기 + 마지막 개행)으로 저장해 diff를 줄인다
  fs.writeFileSync(path.join(ROOT, rel), JSON.stringify(obj, null, 2) + "\n", "utf8");
}
const arr = (o, k) => (o && Array.isArray(o[k]) ? o[k] : null);

/* ── 국문 표기 → 영문 표기 변환 ─────────────────────────────── */
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// "2026. 8." / "2022.03." → "Aug 2026" (변환 불가면 원문 유지)
function ymEn(s) {
  const m = String(s == null ? "" : s).match(/(\d{4})\s*\.\s*(\d{1,2})/);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) return String(s == null ? "" : s).trim();
  return MON[Number(m[2]) - 1] + " " + m[1];
}
// "2024. 10. ~ 현재" → "Oct 2024 – Present" (변환 불가면 원문 유지)
function periodEn(s) {
  const t = String(s == null ? "" : s).trim();
  if (!t) return "";
  const parts = t.split(/[~–—]/);
  if (parts.length < 2) return t;
  const a = ymEn(parts[0]);
  if (a === parts[0].trim()) return t;             // 시작 연·월을 못 읽음 → 그대로
  const tail = parts[parts.length - 1].trim();
  const b = /현재/.test(tail) ? "Present" : ymEn(tail);
  return a + " – " + b;
}
const DEGREE_EN = { "공학박사": "Ph.D.", "공학석사": "M.S.", "공학사": "B.S." };
// 국문 논문명은 "국문 제목 / English Title" 병기 관례 — 영문 파일에는 영문부만
function thesisEn(t) {
  const s = String(t == null ? "" : t);
  const i = s.indexOf(" / ");
  return i === -1 ? s : s.slice(i + 3);
}

/* ── members ────────────────────────────────────────────────── */
function syncMembers() {
  const koDoc = load("data/members.json");
  const enDoc = load("data/en/members.json");
  const ko = arr(koDoc, "members"), en = arr(enDoc, "members");
  if (!ko || !en) return;
  // 저장 판정은 변형 전 스냅샷과 비교한다 — out은 en과 같은 객체를 제자리
  // 수정해 담으므로 JSON.stringify(out)!==JSON.stringify(en)은 항상 거짓이 된다
  const enBefore = JSON.stringify(en);

  // 개인정보 규칙: 졸업생 이메일은 국문 파일에서도 지운다 (정본 쪽 정리)
  let koDirty = false;
  for (const m of ko) {
    if (m.group === "alumni" && m.email) {
      m.email = "";
      koDirty = true;
      note(`members(국문): 졸업생 ${m.name_ko} 이메일 비움`);
    }
  }

  // 같은 사람 찾기 — 2단계. 1단계: 전원 이름+과정 정확 일치(한 항목이 남의
  // 짝을 먼저 집어가는 탐욕 매칭 방지). 2단계: 남은 것만 느슨한 짝.
  // 두 번 등장하는 이름(정지효·김민정 — 석사+박사 두 항목, 국문·영문 어느
  // 쪽에서든)은 느슨한 짝이 엉뚱한 항목을 집을 수 있어, 남은 것 중 같은
  // 이름을 배열 순서대로 잇는다(CMS 편집은 배열 순서를 보존한다).
  const countIn = (list, name) => list.filter((m) => m.name_ko === name).length;
  const dupName = new Set(ko.map((m) => m.name_ko)
    .filter((n) => countIn(ko, n) > 1 || countIn(en, n) > 1));
  const pool = en.slice();
  const take = (pred) => {
    const i = pool.findIndex(pred);
    return i === -1 ? null : pool.splice(i, 1)[0];
  };
  const match = new Array(ko.length).fill(null);
  ko.forEach((k, i) => {
    match[i] = take((x) => x.name_ko === k.name_ko && x.level === k.level);
  });
  ko.forEach((k, i) => {
    if (match[i]) return;
    match[i] = dupName.has(k.name_ko)
      ? take((x) => x.name_ko === k.name_ko)
      : take((x) => x.name_ko === k.name_ko && x.group === k.group) ||
        take((x) => x.name_ko === k.name_ko) ||
        (k.name_en ? take((x) => x.name_en === k.name_en) : null);
  });

  const out = [];
  ko.forEach((k, i) => {
    const e = match[i];
    if (!e) {
      // 영문에 없는 구성원 → 국문을 복사(표기만 영문 형식으로 변환)해 추가.
      // 소속 등 번역 문구는 국문 그대로 들어가며 parity 경고가 번역을 재촉한다.
      const copy = Object.assign({}, k, {
        period: periodEn(k.period),
        grad_year: ymEn(k.grad_year),
        degree: DEGREE_EN[k.degree] || k.degree || "",
        thesis: thesisEn(k.thesis),
      });
      if (copy.group === "alumni") copy.email = "";
      out.push(copy);
      note(`members(영문): ${k.name_ko} (${k.level}) 추가 — 소속 등 번역 필요`);
      return;
    }
    const before = JSON.stringify(e);
    e.group = k.group;
    e.level = k.level;
    e.photo = k.photo || "";
    e.email = k.group === "alumni" ? "" : (k.email || "");
    e.period = periodEn(k.period);
    e.grad_year = ymEn(k.grad_year);
    e.degree = DEGREE_EN[k.degree] || k.degree || "";
    if (!e.name_en && k.name_en) e.name_en = k.name_en;
    // 번역 문구(affiliation/thesis/interests)는 영문 쪽을 보존하되, 비어 있으면 국문으로 메꾼다
    if (!e.affiliation && k.affiliation) { e.affiliation = k.affiliation; note(`members(영문): ${k.name_ko} 소속을 국문으로 임시 채움 — 번역 필요`); }
    if (!e.thesis && k.thesis) e.thesis = thesisEn(k.thesis);
    if (JSON.stringify(e) !== before) note(`members(영문): ${k.name_ko} (${k.level}) 갱신`);
    out.push(e);
  });
  for (const left of pool) note(`members(영문): ${left.name_ko || left.name_en} 삭제 (국문에 없음)`);

  if (koDirty) save("data/members.json", koDoc);
  if (JSON.stringify(out) !== enBefore) {
    enDoc.members = out;
    save("data/en/members.json", enDoc);
  }
}

/* ── projects ───────────────────────────────────────────────── */
function syncProjects() {
  const koDoc = load("data/projects.json");
  const enDoc = load("data/en/projects.json");
  const ko = arr(koDoc, "projects"), en = arr(enDoc, "projects");
  if (!ko || !en) return;
  const enBefore = JSON.stringify(en);   // 저장 판정용 변형 전 스냅샷
  // 1차: 기간(영문 변환값)이 같은 항목끼리 짝짓기
  const pool = en.slice();
  const paired = ko.map((k) => {
    const want = periodEn(k.period);
    const i = pool.findIndex((x) => x.period === want);
    return i === -1 ? null : pool.splice(i, 1)[0];
  });
  // 2차: 기간이 바뀐 기존 항목 구제 — 미매칭 국문 수와 남은 영문 수가 같은
  // "순수 기간 수정"일 때만 순서대로 잇는다. 수가 다르면(같은 push에 신규
  // 추가와 기간 수정이 섞임) 엉뚱한 번역이 다른 과제에 붙을 수 있어 구제하지
  // 않는다 — 미매칭 국문은 신규 추가(번역 필요), 남은 영문은 삭제 로그로.
  const unmatched = [];
  paired.forEach((p, i) => { if (!p) unmatched.push(i); });
  if (unmatched.length && unmatched.length === pool.length) {
    unmatched.forEach((i) => { paired[i] = pool.shift(); });
  }
  const out = ko.map((k, i) => {
    const e = paired[i];
    if (!e) {
      note(`projects(영문): "${(k.title || "").slice(0, 30)}…" 추가 — 과제명·기관 번역 필요`);
      return { period: periodEn(k.period), title: k.title || "", org: k.org || "" };
    }
    const want = periodEn(k.period);
    if (e.period !== want) { note(`projects(영문): 기간 ${e.period} → ${want}`); e.period = want; }
    return e;
  });
  for (const left of pool) note(`projects(영문): "${(left.title || "").slice(0, 30)}…" 삭제 (국문에 없음)`);
  if (JSON.stringify(out) !== enBefore) {
    enDoc.projects = out;
    save("data/en/projects.json", enDoc);
  }
}

/* ── news ───────────────────────────────────────────────────── */
const NEWS_CAT_EN = { "학술대회": "Conference", "세미나": "Seminar", "랩미팅": "Lab Meeting", "모집": "Recruiting", "기타": "Other" };
function syncNews() {
  const koDoc = load("data/news.json");
  const enDoc = load("data/en/news.json");
  const ko = arr(koDoc, "news"), en = arr(enDoc, "news");
  if (!ko || !en) return;
  const enBefore = JSON.stringify(en);   // 저장 판정용 변형 전 스냅샷
  const pool = en.slice();
  const take = (pred) => {
    const i = pool.findIndex(pred);
    return i === -1 ? null : pool.splice(i, 1)[0];
  };
  // 2단계 매칭: 먼저 전원 날짜+분류 정확 일치, 남은 것만 날짜 단독 —
  // 같은 날짜 글 2건에서 앞 항목이 남의 짝을 먼저 집어가지 않게.
  const match = new Array(ko.length).fill(null);
  ko.forEach((k, i) => {
    const cat = NEWS_CAT_EN[k.category] || k.category || "";
    match[i] = take((x) => x.date === k.date && x.category === cat);
  });
  ko.forEach((k, i) => {
    if (!match[i]) match[i] = take((x) => x.date === k.date);
  });
  const out = [];
  for (let i = 0; i < ko.length; i++) {
    const k = ko[i];
    const cat = NEWS_CAT_EN[k.category] || k.category || "";
    const e = match[i];
    if (!e) {
      out.push(Object.assign({}, k, { category: cat }));
      note(`news(영문): ${k.date} "${(k.title || "").slice(0, 24)}…" 추가 — 제목·본문 번역 필요`);
      continue;
    }
    const before = JSON.stringify(e);
    e.category = cat;
    e.date = k.date;
    if (k.deadline) e.deadline = k.deadline; else delete e.deadline;
    e.photos = Array.isArray(k.photos) ? k.photos.slice() : [];
    e.link = k.link || "";
    if (JSON.stringify(e) !== before) note(`news(영문): ${k.date} 항목 갱신`);
    out.push(e);
  }
  for (const left of pool) note(`news(영문): ${left.date} 항목 삭제 (국문에 없음)`);
  if (JSON.stringify(out) !== enBefore) {
    enDoc.news = out;
    save("data/en/news.json", enDoc);
  }
}

/* ── professor.media (URL 기준) ─────────────────────────────── */
function syncProfessorMedia() {
  const koDoc = load("data/professor.json");
  const enDoc = load("data/en/professor.json");
  const ko = koDoc && Array.isArray(koDoc.media) ? koDoc.media : null;
  const en = enDoc && Array.isArray(enDoc.media) ? enDoc.media : null;
  if (!ko || !en) return;
  const enByUrl = new Map(en.filter((m) => m.url).map((m) => [m.url, m]));
  const noUrl = en.filter((m) => !m.url);           // URL 없는 항목은 손대지 않고 뒤에 보존
  const out = [];
  for (const k of ko) {
    if (!k.url) continue;                            // 국문에도 URL이 없으면 짝 기준이 없어 제외
    const e = enByUrl.get(k.url);
    if (e) { out.push(e); enByUrl.delete(k.url); continue; }
    // "2025. 11. 30." → "Nov 30, 2025"
    const md = String(k.date || "").match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
    const dateEn = md ? `${MON[Number(md[2]) - 1]} ${Number(md[3])}, ${md[1]}` : (k.date || "");
    out.push({ date: dateEn, source: k.source || "", title: k.title || "", url: k.url });
    note(`professor.media(영문): "${(k.title || "").slice(0, 24)}…" 추가 — 제목·매체 번역 필요`);
  }
  for (const left of enByUrl.values()) note(`professor.media(영문): "${(left.title || "").slice(0, 24)}…" 삭제 (국문에 없음)`);
  const merged = out.concat(noUrl);
  if (JSON.stringify(merged) !== JSON.stringify(en)) {
    enDoc.media = merged;
    save("data/en/professor.json", enDoc);
  }
}

/* ── site 비번역 값 ─────────────────────────────────────────── */
function syncSiteScalars() {
  const koDoc = load("data/site.json");
  const enDoc = load("data/en/site.json");
  if (!koDoc || !enDoc) return;
  let dirty = false;
  for (const k of ["phone", "email", "map_kakao", "map_naver", "map_google", "lab_abbr"]) {
    if (koDoc[k] !== enDoc[k]) {
      note(`site(영문): ${k} "${enDoc[k]}" → "${koDoc[k]}"`);
      enDoc[k] = koDoc[k];
      dirty = true;
    }
  }
  if (dirty) save("data/en/site.json", enDoc);
}

/* ── 실행 ───────────────────────────────────────────────────── */
syncMembers();
syncProjects();
syncNews();
syncProfessorMedia();
syncSiteScalars();

const line = "─".repeat(64);
console.log(line);
console.log("국문 → 영문 구조 동기화");
console.log(line);
if (!changes.length) {
  console.log("✅ 바꿀 것 없음 — 구조가 이미 일치합니다.");
} else {
  console.log(`✍️  ${changes.length}건 반영:`);
  changes.forEach((m, i) => console.log(`  ${i + 1}. ${m}`));
  console.log("\n※ '번역 필요' 항목은 국문이 임시로 들어가 있음 — check-i18n-parity.js 경고 참고.");
}
