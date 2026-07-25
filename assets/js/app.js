/* ==========================================================================
   DASMOLabs site script — no build step. ONE file serves both languages.
   Loads content from /data/*.json (Korean) or /data/en/*.json (English
   overrides) and renders it client-side.

   Language is detected from <html lang="...">: pages under /en/ declare
   lang="en" and this script adjusts UI strings (I18N table), data paths
   (BASE = "../" under /en/) and the recruiting-notice category key.
   Academic records without a translation file (publications / conferences
   / patents / awards) automatically fall back to the Korean data.

   The site shows 7 main tabs; each academic-record tab has its own page
   and data file:
     People       = professor.json + members.json (+ apply.json, news 모집)
     Research     = site.research_topics + projects.json
     Papers       = publications.json   (publications.html)
     Conferences  = conferences.json
     Patents      = patents.json
     Awards       = awards.json
   ========================================================================== */
(function () {
  "use strict";

  /* ----- language / paths ----- */
  const EN = (document.documentElement.lang || "ko").toLowerCase().indexOf("en") === 0;
  const BASE = EN ? "../" : "";
  // data files that have an English translation under /data/en/
  const EN_DATA = ["site", "news", "professor", "members", "projects", "apply"];

  /* ----- UI strings ----- */
  const T = EN ? {
    skip: "Skip to main content", navLabel: "Main menu",
    menuOpen: "Open menu", menuClose: "Close menu", subOpen: "Open submenu",
    langLabel: "한국어", langHref: "ko", langAria: "한국어로 보기",
    footerTagline: "Intelligent Transportation Systems (ITS) · Smart Mobility · MaaS research",
    footerQuick: "Quick Links", footerContact: "Contact",
    footerEdit: "🔒 Site admin (login)", footerEditTitle: "Only authorized administrators can log in to edit",
    addrFallback: "Room 1404, Engineering Building 1, Seunghak Campus, Dong-A University, Saha-gu, Busan",
    recruitClosed: "Application deadline",
    ugrad: "Undergraduate", grad: "Graduate",
    profLoadFail: "Could not load professor information.",
    profAlt: "Professor", fField: "Field", fLab: "Lab",
    hEdu: "Education", hCareer: "Academic Careers", hSociety: "Academic Societies",
    hMedia: "Media", hCommittee: "External Committees",
    memLoadFail: "Could not load member information.",
    gPhd: "Ph.D.", gMs: "Master's", gBs: "Bachelor's",
    gPhdCur: "Ph.D. Students", gMsCur: "Master's Students", gUnderCur: "Undergraduate Researchers",
    gEtc: "Others",
    applyIntro: "We welcome prospective graduate students (M.S./Ph.D.) and undergraduate researchers interested in transportation engineering, Intelligent Transportation Systems (ITS), and smart mobility. Please complete the items below and email them to the advisor; we will review your application and reply.",
    applyProf: (n) => n ? "Professor " + n : "the advisor",
    applyLead: (n) => `Please complete the items below and email them to <b>${n}</b>.`,
    applyItems: "What to include", applyFaq: "FAQ",
    applyBtnLead: "Click the button below to open a pre-filled email.",
    applyBtn: "✉️ Apply by email", applyContact: "Inquiries · submissions:",
    applySubject: "[DASMOLabs Application] Name / Desired program",
    applyAttach: "* Please attach your CV, transcript, etc. as files.",
    applyAlumni: "Curious where our alumni ended up? See the <a href=\"#alumni\">Alumni</a> tab.",
    applyNotice: "Current opening",
    fbAll: "All", fbAllYears: "All Years", fbCat: "Category", fbYear: "Year",
    fbYearAria: "Filter by year", fbSearchPh: "Search by keyword or author",
    fbNone: "No items match the selected filters.",
    hAreas: "Research Areas", hProjects: "Projects", noAreas: "No research areas yet.",
    projLoadFail: "Could not load project information.",
    pubNone: "No publications yet.", confNone: "No conference presentations yet.",
    patNone: "No patents yet.", awdNone: "No awards yet.",
    pubLabels: { International: "International Journals & Proceedings", Domestic: "Domestic Journals", Other: "Other", Books: "Books" },
    pubChips: { International: "International", Domestic: "Domestic", Other: "Other", Books: "Books" },
    confLabels: { International: "International", Domestic: "Domestic" },
    patLabels: { Application: "Application", Registration: "Registration", Software: "Software / Copyright" },
    patChips: { Application: "Application", Registration: "Registration", Software: "Software" },
    patHead: ["No.", "Title", "Scope", "Type", "Date", "Number", "Inventors"],
    sciBadge: "SCI",
    tabProfessor: "Professor", tabCurrent: "Current Members", tabAlumni: "Alumni", tabApply: "Join Us",
    headProfessor: ["Professor", "Professor"], headCurrent: ["Current", "Current Members"],
    headAlumni: ["Alumni", "Alumni"], headApply: ["Join Us", "Join Us"],
    tabAreas: "Research Areas", tabProjects: "Projects",
    locAddress: "Address", locOffice: "Office", locTransit: "Public transit",
    mapKakao: "Kakao Map", mapNaver: "Naver Map", mapGoogle: "Google Maps",
    loading: "Loading…",
  } : {
    skip: "본문 바로가기", navLabel: "주 메뉴",
    menuOpen: "메뉴 열기", menuClose: "메뉴 닫기", subOpen: "하위 메뉴 열기",
    langLabel: "EN", langHref: "en", langAria: "View in English",
    footerTagline: "지능형 교통체계(ITS) · 스마트 모빌리티 · MaaS 연구",
    footerQuick: "바로가기", footerContact: "연락처",
    footerEdit: "🔒 사이트 관리(로그인)", footerEditTitle: "승인된 운영자만 로그인 후 편집할 수 있습니다",
    addrFallback: "부산시 사하구 하단동 동아대학교 승학캠퍼스 공대1호관 1404호",
    recruitClosed: "지원 마감",
    ugrad: "학부 (Undergraduate)", grad: "대학원 (Graduate)",
    profLoadFail: "교수 정보를 불러오지 못했습니다.",
    profAlt: "교수", fField: "전공분야", fLab: "연구실",
    hEdu: "학력 (Education)", hCareer: "주요 경력 (Academic Careers)", hSociety: "학회활동 (Academic Societies)",
    hMedia: "언론활동 (Media)", hCommittee: "대외 위원회 활동 (Committees)",
    memLoadFail: "구성원 정보를 불러오지 못했습니다.",
    gPhd: "박사 (Ph.D.)", gMs: "석사 (Master's)", gBs: "학사 (Bachelor's)",
    gPhdCur: "박사과정 (Ph.D. Students)", gMsCur: "석사과정 (Master's Students)", gUnderCur: "학부연구생 (Undergraduate)",
    gEtc: "기타",
    applyIntro: "교통공학 · 지능형 교통체계(ITS) · 스마트 모빌리티 분야에 관심 있는 대학원생(석·박사)과 학부연구생을 모집합니다. 아래 항목을 작성하여 지도교수 이메일로 보내주시면 검토 후 회신드립니다.",
    applyProf: (n) => n ? n + " 교수" : "지도교수",
    applyLead: (n) => `아래 항목을 작성하여 <b>${n}</b> 이메일로 보내주세요.`,
    applyItems: "지원 시 기재 항목", applyFaq: "자주 묻는 질문 (FAQ)",
    applyBtnLead: "아래 버튼을 누르면 작성 양식이 미리 채워진 메일 창이 열립니다.",
    applyBtn: "✉️ 이메일로 지원하기", applyContact: "문의 · 접수:",
    applySubject: "[DASMOLabs 지원] 성명 / 희망과정",
    applyAttach: "※ 이력서·성적증명서 등은 파일로 첨부해 주세요.",
    applyAlumni: "졸업생들의 진로가 궁금하다면 <a href=\"#alumni\">졸업생</a> 탭을 확인해 보세요.",
    applyNotice: "현재 모집 공고",
    fbAll: "전체", fbAllYears: "전체 연도", fbCat: "구분", fbYear: "연도",
    fbYearAria: "연도로 필터링", fbSearchPh: "키워드·저자로 검색",
    fbNone: "선택한 조건에 맞는 항목이 없습니다.",
    hAreas: "연구 분야 (Research Areas)", hProjects: "연구 과제 (Projects)", noAreas: "등록된 연구 분야가 없습니다.",
    projLoadFail: "프로젝트 정보를 불러오지 못했습니다.",
    pubNone: "등록된 논문이 없습니다.", confNone: "등록된 학술대회 발표가 없습니다.",
    patNone: "등록된 특허가 없습니다.", awdNone: "등록된 수상 실적이 없습니다.",
    pubLabels: { International: "International Journals & Proceedings", Domestic: "국내 논문", Other: "기타", Books: "저서" },
    pubChips: { International: "International", Domestic: "Domestic", Other: "기타", Books: "저서" },
    confLabels: { International: "International", Domestic: "Domestic (국내)" },
    patLabels: { Application: "출원 (Application)", Registration: "등록 (Registration)", Software: "프로그램·저작권 (Software)" },
    patChips: { Application: "출원", Registration: "등록", Software: "프로그램" },
    patHead: ["No.", "지식재산권명", "국내외", "구분", "일자", "번호", "발명인"],
    sciBadge: "SCI급",
    tabProfessor: "지도교수", tabCurrent: "현재 구성원", tabAlumni: "졸업생", tabApply: "지원",
    headProfessor: ["Professor", "지도교수"], headCurrent: ["Current", "현재 구성원"],
    headAlumni: ["Alumni", "졸업생"], headApply: ["Join Us", "지원 안내"],
    tabAreas: "연구 분야", tabProjects: "연구 과제",
    locAddress: "주소", locOffice: "연구실", locTransit: "대중교통",
    mapKakao: "카카오맵", mapNaver: "네이버지도", mapGoogle: "구글지도",
    loading: "불러오는 중…",
  };

  const NAV = [
    { href: "index.html",        label: "Home" },
    { href: "people.html",       label: "People" },
    { href: "research.html",     label: "Research" },
    { href: "publications.html", label: "Papers" },
    { href: "conferences.html",  label: "Conferences" },
    { href: "patents.html",      label: "Patents" },
    { href: "awards.html",       label: "Awards" },
  ];

  // Sub-tabs shown in each main tab's hover dropdown. Each page uses the same
  // `key` to activate the matching sub-tab / section from the URL hash.
  // Papers/Conferences/Patents/Awards have no entry here: they still carry the
  // ▾ marker so the menu row reads uniformly, but they open no dropdown.
  //   tabbed pages (People/Research): key = sub-tab id
  //   scroll page  (Home):            key = on-page element id
  const SUBNAV = EN ? {
    "index.html": [
      { label: "About the Lab", key: "about" },
      { label: "Research",      key: "research" },
      { label: "Courses",       key: "classes" },
      { label: "Location",      key: "location" },
    ],
    "people.html": [
      { label: "Professor",       key: "professor" },
      { label: "Current Members", key: "current" },
      { label: "Alumni",          key: "alumni" },
      { label: "Join Us",         key: "apply" },
    ],
    "research.html": [
      { label: "Research Areas", key: "areas" },
      { label: "Projects",       key: "projects" },
    ],
  } : {
    "index.html": [
      { label: "연구실 소개", key: "about" },
      { label: "연구 분야",   key: "research" },
      { label: "강의 과목",   key: "classes" },
      { label: "오시는 길",   key: "location" },
    ],
    "people.html": [
      { label: "지도교수",    key: "professor" },
      { label: "현재 구성원", key: "current" },
      { label: "졸업생",      key: "alumni" },
      { label: "지원",        key: "apply" },
    ],
    "research.html": [
      { label: "연구 분야", key: "areas" },
      { label: "연구 과제", key: "projects" },
    ],
  };

  // Papers / Conferences / Patents have no sub-pages, so their dropdown entries
  // are the page's own filter chips: the link carries the category in the hash
  // and the page pre-selects that chip (see applyHashToFilters).
  SUBNAV["publications.html"] = [
    { label: T.fbAll, key: "all" },
    { label: T.pubChips.International, key: "International" },
    { label: T.pubChips.Domestic, key: "Domestic" },
    { label: T.pubChips.Other, key: "Other" },
    { label: T.pubChips.Books, key: "Books" },
  ];
  SUBNAV["conferences.html"] = [
    { label: T.fbAll, key: "all" },
    { label: T.confLabels.International, key: "International" },
    { label: T.confLabels.Domestic, key: "Domestic" },
  ];
  SUBNAV["patents.html"] = [
    { label: T.fbAll, key: "all" },
    { label: T.patChips.Application, key: "Application" },
    { label: T.patChips.Registration, key: "Registration" },
    { label: T.patChips.Software, key: "Software" },
  ];

  // The News page was retired (2026-07); news.json now feeds only the
  // recruiting notice shown on People → 지원.
  const RECRUIT_CAT = EN ? "Recruiting" : "모집";

  /* ----- utilities ----- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  // escape but keep line breaks
  function escMultiline(s) { return esc(s).replace(/\n/g, "<br>"); }

  // resolve an image/asset path so it works from / and /en/ alike
  function imgSrc(p) {
    if (!p) return "";
    if (/^https?:\/\//.test(p)) return p;
    return BASE + p.replace(/^\/+/, "");
  }
  // path → value safe for both an HTML attribute and CSS url('…').
  // Percent-encode the chars that could break a url('…') (quotes/parens) so
  // they never reach the CSS parser literally, then esc() for the HTML
  // attribute. NOT encodeURI — that would double-encode an already-encoded
  // URL (e.g. a pasted address-bar URL with %XX sequences).
  function cssUrl(p) {
    return esc(String(p == null ? "" : p).replace(/[()'"]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()));
  }

  // decode a URL hash safely — a mangled link (#% or #100%) must not throw
  // URIError and abort the whole page render.
  function hashKey() {
    const raw = (location.hash || "").replace(/^#/, "");
    try { return decodeURIComponent(raw); } catch (e) { return raw; }
  }

  // split a multi-address email string on commas OR semicolons, consistently
  // (professor/member records use either separator)
  function splitEmails(s) {
    return String(s == null ? "" : s).split(/[,;]/).map(e => e.trim()).filter(Boolean);
  }

  // turn bare URLs inside text into clickable links (used for media/citations)
  function linkify(text) {
    const safe = esc(text);
    return safe.replace(/(https?:\/\/[^\s)]+)([)\s]|$)/g, function (m, url, tail) {
      return '<a href="' + url + '" target="_blank" rel="noopener">' + url + "</a>" + tail;
    });
  }
  // escape + linkify URLs + keep line breaks (used for free-form news/diary text)
  function richText(s) { return linkify(s).replace(/\n/g, "<br>"); }

  // "2026-05-20" / ISO datetime → "2026.05.20"
  function fmtDate(d) { return String(d == null ? "" : d).slice(0, 10).replace(/-/g, "."); }

  // local date as "YYYY-MM-DD" (string compare against news dates/deadlines)
  function todayStr() {
    const d = new Date();
    const p = (n) => (n < 10 ? "0" : "") + n;
    return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
  }

  // one request per data file per page load — the Awards dropdown and the
  // Awards page itself would otherwise both fetch awards.json
  const _dataCache = {};
  function fetchData(name) {
    if (!_dataCache[name]) _dataCache[name] = loadData(name);
    return _dataCache[name];
  }

  async function loadData(name) {
    const paths = (EN && EN_DATA.indexOf(name) !== -1)
      ? [BASE + "data/en/" + name + ".json", BASE + "data/" + name + ".json"]
      : [BASE + "data/" + name + ".json"];
    for (const path of paths) {
      try {
        const res = await fetch(path, { cache: "no-store" });
        if (res.ok) return await res.json();
      } catch (e) { /* try next */ }
    }
    console.warn("Could not load data for " + name);
    return null;
  }

  function setState(el, msg) {
    if (el) el.innerHTML = '<div class="state">' + esc(msg) + "</div>";
  }

  /* ====================================================================
     Header & footer (shared chrome)
     ==================================================================== */
  function currentPage() {
    const p = location.pathname.split("/").pop();
    return (!p || p === "") ? "index.html" : p;
  }

  function buildHeader() {
    const here = currentPage();
    const links = NAV.map(n => {
      const subs = SUBNAV[n.href] || [];
      const active = n.href === here ? "active" : "";
      // every tab carries the ▾ marker so the menu row reads uniformly;
      // only the tabs listed in SUBNAV actually open a dropdown
      const caret = `<span class="nav__caret" aria-hidden="true">▾</span>`;
      const subBtn = subs.length
        ? `<button class="nav__subtoggle" type="button" aria-expanded="false" aria-label="${esc(n.label)} ${esc(T.subOpen)}">▾</button>` : "";
      const menu = subs.length
        ? `<ul class="nav__sub">${subs.map(s =>
            `<li><a href="${n.href}#${encodeURIComponent(s.key)}">${esc(s.label)}</a></li>`).join("")}</ul>`
        : "";
      return `<li class="nav__item${subs.length ? " has-sub" : ""}">` +
        `<a href="${n.href}" class="${active}"${subs.length ? ' aria-haspopup="true"' : ""}>${esc(n.label)}${caret}</a>${subBtn}${menu}</li>`;
    }).join("");
    // language switch → counterpart page in the other language (legacy pages → home)
    const target = NAV.some(n => n.href === here) ? here : "index.html";
    const otherBase = EN ? "../" : "en/";
    const langItem = `<li class="nav__lang"><a class="lang-switch" href="${otherBase}${target}"` +
      ` hreflang="${T.langHref}" lang="${T.langHref}" aria-label="${esc(T.langAria)}">${esc(T.langLabel)}</a></li>`;
    // The brand line was removed (2026-07): the header is the menu row only.
    return `
      <a class="skip-link" href="#main">${esc(T.skip)}</a>
      <header class="site-header">
        <nav class="nav wrap" aria-label="${esc(T.navLabel)}">
          <button class="nav__toggle" aria-label="${esc(T.menuOpen)}" aria-expanded="false" aria-controls="navmenu">
            <span></span><span></span><span></span>
          </button>
          <ul class="nav__links" id="navmenu">${links}${langItem}</ul>
        </nav>
      </header>`;
  }

  function buildFooter(site) {
    const abbr = (site && site.lab_abbr) || "DASMOLabs";
    const en   = (site && site.lab_name_en) || "Dong-A Smart Mobility Laboratory";
    const addr = (site && site.address) || T.addrFallback;
    const tel  = (site && site.phone) || "051-200-7665";
    const email = (site && site.email) || "hoekim@dau.ac.kr";
    const mapUrl = site && (site.map_kakao || site.map_google || site.map_naver);
    const addrHtml = mapUrl
      ? `<a href="${esc(mapUrl)}" target="_blank" rel="noopener">${esc(addr)}</a>` : esc(addr);
    const navLinks = NAV.map(n => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join("");
    const year = new Date().getFullYear();
    return `
      <footer class="site-footer">
        <div class="wrap footer-grid">
          <div class="footer-brand">
            <b>${esc(abbr)}</b>
            <p style="margin:.5rem 0 0;font-size:.92rem;">${esc(en)}</p>
            <p style="font-size:.88rem;">${esc(T.footerTagline)}</p>
          </div>
          <div>
            <h4>${esc(T.footerQuick)}</h4>
            <ul class="footer-links">${navLinks}</ul>
          </div>
          <div>
            <h4>${esc(T.footerContact)}</h4>
            <p class="footer-contact">
              ${addrHtml}<br>
              TEL. ${esc(tel)}<br>
              <a href="mailto:${esc(splitEmails(email)[0] || "")}">${esc(email)}</a>
            </p>
          </div>
        </div>
        <div class="wrap footer-bottom">
          <span>© ${year} ${esc(en)}. All rights reserved.</span>
          <a class="edit-link" href="${BASE}admin/" title="${esc(T.footerEditTitle)}">${esc(T.footerEdit)}</a>
        </div>
      </footer>`;
  }

  // Awards is the one filter page with no category axis, so its sub-tabs are
  // the years that actually appear in awards.json — that way no dropdown entry
  // lands on an empty list. (fetchData is memoised, so this costs one small
  // request per page load and none at all on awards.html itself.)
  async function awardsSubnav() {
    const awd = await fetchData("awards");
    const list = (awd && Array.isArray(awd.awards)) ? awd.awards : [];
    const years = Array.from(new Set(list.map(a => yearIn(a.date)).filter(Boolean)))
      .sort((a, b) => Number(b) - Number(a)).slice(0, 6);
    if (!years.length) return;
    SUBNAV["awards.html"] = [{ label: T.fbAll, key: "all" }]
      .concat(years.map(y => ({ label: EN ? y : y + "년", key: y })));
  }

  async function mountChrome(site) {
    await awardsSubnav();
    const h = $("[data-header]"); if (h) h.outerHTML = buildHeader();
    const f = $("[data-footer]"); if (f) f.outerHTML = buildFooter(site);
    initNav();
  }

  function initNav() {
    const toggle = $(".nav__toggle");
    const menu = $(".nav__links");
    if (!toggle || !menu) return;
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? T.menuClose : T.menuOpen);
    });
    // mobile: per-tab accordion toggles for the sub-menus
    menu.addEventListener("click", (e) => {
      const btn = e.target.closest(".nav__subtoggle");
      if (btn) {
        const li = btn.closest(".nav__item");
        const open = li.classList.toggle("sub-open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        return;
      }
      if (e.target.closest("a")) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
    // Esc closes the mobile drawer and the hover dropdown (focus-within)
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (menu.classList.contains("open")) {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      } else if (document.activeElement && document.activeElement.closest &&
                 document.activeElement.closest(".nav__item.has-sub")) {
        document.activeElement.blur();
      }
    });
    // language switch: carry the current sub-tab (hash) over to the other language
    const lang = $(".lang-switch");
    if (lang) lang.addEventListener("click", function () {
      const h = hashKey();
      if (!h) return;
      this.href = this.getAttribute("href").split("#")[0] + "#" + encodeURIComponent(h);
    });
  }

  /* ====================================================================
     HOME
     ==================================================================== */
  async function renderHome() {
    const site = await fetchData("site");
    mountChrome(site);
    if (!site) {
      setState($("#home-intro"), T.loading);
      return;
    }

    // intro text (+ optional lab photo from the CMS)
    const introEl = $("#home-intro");
    if (introEl) {
      const parts = [site.intro1, site.intro2].filter(Boolean).map(t => `<p>${escMultiline(t)}</p>`).join("");
      const photo = site.about_photo
        ? `<img class="about-photo" src="${cssUrl(imgSrc(site.about_photo))}" alt="" loading="lazy">` : "";
      introEl.innerHTML = parts + photo;
    }

    // research topics (shared with the Research page)
    const topicsEl = $("#home-topics");
    if (topicsEl) topicsEl.innerHTML = buildResearchTopics(site);

    // classes — entries may be plain strings or { name, link } objects
    const clsEl = $("#home-classes");
    if (clsEl) {
      const item = (c) => {
        if (typeof c === "string") return esc(c);
        const n = esc((c && c.name) || "");
        return (c && c.link) ? `<a href="${esc(c.link)}" target="_blank" rel="noopener">${n}</a>` : n;
      };
      const join = (arr) => Array.isArray(arr) ? arr.map(item).join(", ") : esc(arr || "");
      clsEl.innerHTML =
        `<div class="card"><div class="card__icon">🎓</div><h3>${esc(T.ugrad)}</h3><p>${join(site.classes_undergrad)}</p></div>
         <div class="card"><div class="card__icon">📚</div><h3>${esc(T.grad)}</h3><p>${join(site.classes_grad)}</p></div>`;
    }

    // location / directions
    const locEl = $("#home-location");
    if (locEl) locEl.innerHTML = buildLocation(site);

    scrollToHash(); // deep-link from the Home dropdown (#about / #research / #classes / #location)
  }

  // a recruiting post is "open" until its (optional) deadline passes
  function recruitOpen(n) {
    if (!n.deadline) return true;
    return String(n.deadline).slice(0, 10) >= todayStr();
  }

  /* ====================================================================
     Content builders — pure (data → HTML string), reused by merged pages.
     ==================================================================== */

  // Research-area cards (Home + Research page)
  function buildResearchTopics(site) {
    if (!site || !Array.isArray(site.research_topics)) return "";
    return site.research_topics.map(t => {
      const tags = Array.isArray(t.tags) && t.tags.length
        ? `<div class="tags">${t.tags.map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : "";
      return `<div class="card topic">
        <div class="card__icon">${esc(t.icon || "▣")}</div>
        <h3>${esc(t.title)}</h3><p>${esc(t.desc || "")}</p>${tags}</div>`;
    }).join("");
  }

  // Location / directions block (Home)
  function buildLocation(site) {
    if (!site) return "";
    const rows = [];
    if (site.address) rows.push(`<li><b>${esc(T.locAddress)}</b> ${esc(site.address)}</li>`);
    if (site.office)  rows.push(`<li><b>${esc(T.locOffice)}</b> ${esc(site.office)}</li>`);
    if (site.phone)   rows.push(`<li><b>TEL</b> ${esc(site.phone)}</li>`);
    if (site.transit_info) rows.push(`<li><b>${esc(T.locTransit)}</b> ${escMultiline(site.transit_info)}</li>`);
    const maps = [["map_kakao", T.mapKakao], ["map_naver", T.mapNaver], ["map_google", T.mapGoogle]]
      .filter(pair => site[pair[0]])
      .map(pair => `<a class="btn btn--map" href="${esc(site[pair[0]])}" target="_blank" rel="noopener">📍 ${esc(pair[1])}</a>`)
      .join("");
    if (!rows.length && !maps) return "";
    return `<div class="loc-box">
      <ul class="deflist loc-list">${rows.join("")}</ul>
      ${maps ? `<div class="loc-maps">${maps}</div>` : ""}
    </div>`;
  }

  // Professor profile (People page)
  function buildProfessor(p) {
    if (!p) return '<div class="state">' + esc(T.profLoadFail) + "</div>";
    const fallback = BASE + "assets/uploads/prof.jpg";
    const photo = imgSrc(p.photo) || fallback;
    const nameMain = EN ? (p.name_en || p.name_ko) : p.name_ko;
    const nameSub  = EN ? (p.name_ko || "") : (p.name_en || "");
    const emailLinks = splitEmails(p.email)
      .map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(", ");
    const extLinks = Array.isArray(p.links) && p.links.length
      ? `<div class="prof-links">${p.links.filter(l => l && l.url).map(l =>
          `<a class="prof-link" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label || l.url)} ↗</a>`).join("")}</div>`
      : "";
    const head = `
      <div class="prof-head">
        <div class="prof-photo"><img src="${cssUrl(photo)}" alt="${esc(nameMain)} ${esc(T.profAlt)}" onerror="this.src='${cssUrl(fallback)}'"></div>
        <div>
          <h2 class="prof-name">${esc(nameMain)}<small>${esc(nameSub)}</small></h2>
          <div class="prof-title">${esc(p.title || "")}</div>
          <ul class="prof-contact">
            ${p.fields ? `<li><b>${esc(T.fField)}</b> ${esc(p.fields)}</li>` : ""}
            ${p.phone ? `<li><b>${esc(T.fLab)}</b> ${esc(p.phone)}</li>` : ""}
            ${emailLinks ? `<li><b>E-mail</b> ${emailLinks}</li>` : ""}
            ${p.office ? `<li><b>Office</b> ${esc(p.office)}</li>` : ""}
          </ul>
          ${extLinks}
        </div>
      </div>`;
    const eduBlock = (arr, title) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const items = arr.map(e => {
        if (typeof e === "string") return `<li><div class="what">${esc(e)}</div></li>`;
        return `<li>
          <div class="when">${esc(e.period || "")}</div>
          <div class="what">${esc(e.place || e.what || "")}${e.degree ? " — " + esc(e.degree) : ""}</div>
          ${e.thesis ? `<div class="sub">${esc(e.thesis)}</div>` : ""}
        </li>`;
      }).join("");
      return `<div class="prof-block">
        <div class="group-head"><h3>${esc(title)}</h3></div><ul class="timeline">${items}</ul></div>`;
    };
    const societies = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const items = arr.map(s => `<li><span class="k">${esc(s.name)}</span>
        <span class="v">${esc(s.position || "")}${s.note ? ` <small>(${esc(s.note)})</small>` : ""}</span></li>`).join("");
      return `<div class="group-head"><h3>${esc(T.hSociety)}</h3><span class="count">${arr.length}</span></div>
        <ul class="deflist">${items}</ul>`;
    };
    const media = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const items = arr.map(m => {
        const t = m.url ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.title)}</a>` : esc(m.title);
        const meta = [m.date ? `<span class="date">${esc(m.date)}</span>` : "",
                      m.source ? `<span class="src">${esc(m.source)}</span>` : ""].filter(Boolean).join(" ");
        return `<li>${meta ? meta + " " : ""}${t}</li>`;
      }).join("");
      return `<div class="group-head"><h3>${esc(T.hMedia)}</h3><span class="count">${arr.length}</span></div>
        <ul class="media-list">${items}</ul>`;
    };
    const committees = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const items = arr.map(c => {
        if (typeof c === "string") return `<li><span class="v">${esc(c)}</span></li>`;
        return `<li><span class="k">${esc(c.period || "")}</span><span class="v">${esc(c.name || "")}</span></li>`;
      }).join("");
      return `<details class="collapse">
        <summary>${esc(T.hCommittee)} · ${arr.length}</summary>
        <div class="collapse__body"><ul class="deflist">${items}</ul></div>
      </details>`;
    };
    return head +
      `<div style="margin-top:2.2rem">
        ${eduBlock(p.education, T.hEdu)}
        ${eduBlock(p.careers, T.hCareer)}
        ${societies(p.societies)}
        ${media(p.media)}
        <div style="margin-top:1.6rem">${committees(p.committees)}</div>
      </div>`;
  }

  // Members grids — `which` is "current" or "alumni" (People page)
  function buildMembers(M, which) {
    if (!Array.isArray(M)) return '<div class="state">' + esc(T.memLoadFail) + "</div>";
    const initials = (m) => (m.name_en || m.name_ko || "?").trim().charAt(0).toUpperCase();
    const card = (m) => {
      const photo = imgSrc(m.photo);
      const nameMain = EN ? (m.name_en || m.name_ko) : m.name_ko;
      const nameSub  = EN ? (m.name_ko || "") : (m.name_en || "");
      const pic = photo
        ? `<img class="person__photo" src="${cssUrl(photo)}" alt="${esc(nameMain)}" loading="lazy">`
        : `<div class="person__photo person__photo--ph" aria-hidden="true">${esc(initials(m))}</div>`;
      const meta = [];
      if (m.group === "alumni") {
        const deg = [m.degree, m.grad_year].filter(Boolean).map(esc).join(" · ");
        if (deg) meta.push(deg);
        if (m.affiliation) meta.push(esc(m.affiliation));
      } else {
        if (m.affiliation) meta.push(esc(m.affiliation));
        if (m.period) meta.push(esc(m.period));
      }
      const interests = (m.group !== "alumni" && Array.isArray(m.interests) && m.interests.length)
        ? `<div class="tags tags--sm">${m.interests.map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : "";
      const thesis = m.thesis ? `<div class="person__thesis" title="${esc(m.thesis)}">${esc(m.thesis)}</div>` : "";
      const email = (m.group !== "alumni" && m.email)
        ? `<div class="person__meta"><a href="mailto:${esc(splitEmails(m.email)[0] || "")}">${esc(m.email)}</a></div>` : "";
      return `<article class="person">
        ${pic}
        <div class="person__body">
          <div class="person__name">${esc(nameMain)}<small>${esc(nameSub)}</small></div>
          ${meta.length ? `<div class="person__meta">${meta.join("<br>")}</div>` : ""}
          ${interests}
          ${thesis}
          ${email}
        </div>
      </article>`;
    };
    const group = (label, items) => {
      if (!items.length) return "";
      return `<div class="group-head"><h3>${esc(label)}</h3><span class="count">${items.length}${EN ? "" : "명"}</span></div>
        <div class="people-grid">${items.map(card).join("")}</div>`;
    };
    // prefix matching over the level code; anything unmatched lands in "기타"
    // so a member never silently disappears from the page.
    const byLevel = (list, prefixes) =>
      list.filter(m => prefixes.some(lv => (m.level || "").toLowerCase().indexOf(lv) === 0));
    const list = M.filter(m => m.group === (which === "alumni" ? "alumni" : "current"));
    const phd = byLevel(list, ["ph"]);
    const ms  = byLevel(list, ["master", "m.s"]);
    const bs  = byLevel(list, ["under", "bach"]);   // byLevel uses .some(); prefix order is irrelevant
    const rest = list.filter(m => phd.indexOf(m) === -1 && ms.indexOf(m) === -1 && bs.indexOf(m) === -1);
    if (which === "alumni") {
      return group(T.gPhd, phd) + group(T.gMs, ms) + group(T.gBs, bs) + group(T.gEtc, rest);
    }
    return group(T.gPhdCur, phd) + group(T.gMsCur, ms) + group(T.gUnderCur, bs) + group(T.gEtc, rest);
  }

  // Application guide (People page → 지원 tab). Content comes from
  // data/apply.json (editable in the CMS); the active recruiting notice
  // (news category 모집/Recruiting) is shown as a callout on top.
  function buildApply(prof, apply, recruit) {
    const emails = splitEmails((prof && prof.email) || "hoekim@dau.ac.kr");
    const primary = emails[0] || "hoekim@dau.ac.kr";
    const profName = T.applyProf(prof && (EN ? prof.name_en : prof.name_ko));
    const intro = (apply && apply.intro) || T.applyIntro;
    const items = (apply && Array.isArray(apply.items) && apply.items.length) ? apply.items : [];
    const faq = (apply && Array.isArray(apply.faq)) ? apply.faq.filter(f => f && f.q) : [];

    const notice = recruit ? `<div class="recruit">
        <div class="recruit__icon">🙋</div>
        <div class="recruit__body">
          <div class="recruit__tag">${esc(T.applyNotice)}</div>
          <h3>${esc(recruit.title || "")}</h3>
          ${recruit.body ? `<p>${richText(recruit.body)}</p>` : ""}
          <div class="recruit__foot">
            <span class="date">${esc(fmtDate(recruit.date))}</span>
            ${recruit.deadline ? `<span class="date">⏰ ${esc(T.recruitClosed)}: ${esc(fmtDate(recruit.deadline))}</span>` : ""}
          </div>
        </div>
      </div>` : "";

    const rows = items.map(i =>
      `<li><span class="k">${esc(i.label || "")}</span><span class="v">${esc(i.hint || "")}</span></li>`).join("");
    const faqHtml = faq.length
      ? `<div class="group-head"><h3>${esc(T.applyFaq)}</h3></div>` +
        faq.map(f => `<details class="collapse collapse--faq"><summary>${esc(f.q)}</summary>
          <div class="collapse__body">${escMultiline(f.a || "")}</div></details>`).join("")
      : "";

    // pre-filled mail template built from the item labels
    const bodyTmpl = items.map(i => (i.label || "") + ": ").concat(["", T.applyAttach]).join("\n");
    const href = `mailto:${encodeURIComponent(primary)}?subject=${encodeURIComponent(T.applySubject)}&body=${encodeURIComponent(bodyTmpl)}`;
    const mailLinks = emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(", ");
    return `<div style="max-width:760px;margin:0 auto">
      ${notice}
      <p style="font-size:1.04rem">${escMultiline(intro)}</p>
      <p style="font-size:1.02rem">${T.applyLead(esc(profName))}</p>
      ${rows ? `<div class="group-head"><h3>${esc(T.applyItems)}</h3></div><ul class="deflist">${rows}</ul>` : ""}
      ${faqHtml}
      <div class="apply-cta">
        <p style="margin:0 0 .9rem;color:var(--text-soft)">${esc(T.applyBtnLead)}</p>
        <a class="btn btn--primary" href="${esc(href)}">${esc(T.applyBtn)}</a>
        <p style="margin:.9rem 0 0;font-size:.92rem">${esc(T.applyContact)} ${mailLinks}</p>
      </div>
      <p style="margin-top:1.4rem;font-size:.95rem;color:var(--text-soft)">${T.applyAlumni}</p>
    </div>`;
  }

  /* ====================================================================
     Filter engine — 구분(category) chips + 연도(year) dropdown + text
     search shared by the reference-list tabs. Filters are AND-combined;
     the per-build* category grouping is preserved.
     ==================================================================== */
  const FILTERS = {};   // block id → { items, cats, getCat, getYear, getText, render }
  let _fbSeq = 0;

  // first 4-digit year (19xx/20xx) found in a string ("" if none)
  function yearIn(s) { const m = String(s == null ? "" : s).match(/(?:19|20)\d{2}/); return m ? m[0] : ""; }
  // publication year: prefer the one in parentheses, e.g. "... (2025). Title ..."
  function pubYear(citation) {
    const s = String(citation == null ? "" : citation);
    const p = s.match(/\(((?:19|20)\d{2})\)/);
    return p ? p[1] : yearIn(s);
  }
  // "2025. 10. 31." → sortable number (missing parts = 0); used to keep
  // reference lists in date order regardless of the order edited in the CMS
  function dateKey(s) {
    const m = String(s == null ? "" : s).match(/((?:19|20)\d{2})\D*(\d{1,2})?\D*(\d{1,2})?/);
    if (!m) return 0;
    return Number(m[1]) * 10000 + Number(m[2] || 0) * 100 + Number(m[3] || 0);
  }
  function sortByDateDesc(items, get) {
    return items.slice().sort((a, b) => dateKey(get(b)) - dateKey(get(a)));
  }
  // categories actually present in `items`, in canonical order, with labels
  function presentCats(items, order, labels) {
    return order.filter(k => items.some(i => i.category === k))
                .map(k => ({ key: k, label: labels[k] || k }));
  }

  // Render a filter bar + list container for one tab. cfg:
  //   items, cats:[{key,label}]|null, getCat(item), getYear(item)→"YYYY",
  //   getText(item)→string|null, render(list)→HTML
  function filterBlock(cfg) {
    const id = "fb" + (++_fbSeq);
    FILTERS[id] = cfg;
    const years = Array.from(new Set(cfg.items.map(cfg.getYear).filter(Boolean)))
      .sort((a, b) => Number(b) - Number(a));
    const rows = [];
    if (cfg.cats && cfg.cats.length) {
      const chips = [{ key: "", label: T.fbAll }].concat(cfg.cats).map((c, i) =>
        `<button type="button" class="fchip${i === 0 ? " active" : ""}" data-cat="${esc(c.key)}">${esc(c.label)}</button>`
      ).join("");
      rows.push(`<div class="fbar__row"><span class="fbar__label">${esc(T.fbCat)}</span>${chips}</div>`);
    }
    const controls = [];
    if (years.length) {
      const opts = `<option value="">${esc(T.fbAllYears)}</option>` +
        years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join("");
      controls.push(`<span class="fbar__label">${esc(T.fbYear)}</span>` +
        `<select class="fyear" aria-label="${esc(T.fbYearAria)}">${opts}</select>`);
    }
    if (cfg.getText) {
      controls.push(`<input type="search" class="fsearch" placeholder="${esc(T.fbSearchPh)}" aria-label="${esc(T.fbSearchPh)}">`);
    }
    if (controls.length) rows.push(`<div class="fbar__row">${controls.join("")}</div>`);
    const bar = rows.length ? `<div class="fbar" data-fb="${id}">${rows.join("")}</div>` : "";
    return bar + `<div class="fbar__list" data-fb-list="${id}">${cfg.render(cfg.items)}</div>`;
  }

  // Recompute one block's list from its current control state (read from DOM).
  function applyFilter(id) {
    const cfg = FILTERS[id]; if (!cfg) return;
    const bar = document.querySelector('.fbar[data-fb="' + id + '"]');
    const listEl = document.querySelector('.fbar__list[data-fb-list="' + id + '"]');
    if (!listEl) return;
    const chip = bar ? bar.querySelector(".fchip.active") : null;
    const cat = chip ? (chip.dataset.cat || "") : "";
    const sel = bar ? bar.querySelector(".fyear") : null;
    const year = sel ? sel.value : "";
    const inp = bar ? bar.querySelector(".fsearch") : null;
    const q = inp ? inp.value.trim().toLowerCase() : "";
    let list = cfg.items;
    if (cat)  list = list.filter(i => cfg.getCat(i) === cat);
    if (year) list = list.filter(i => String(cfg.getYear(i)) === year);
    if (q && cfg.getText) list = list.filter(i => String(cfg.getText(i)).toLowerCase().indexOf(q) !== -1);
    listEl.innerHTML = list.length ? cfg.render(list)
      : '<div class="state">' + esc(T.fbNone) + "</div>";
  }

  // Apply the URL hash to a page's filter bars — this is what makes the header
  // dropdowns of Papers / Conferences / Patents / Awards work: a category key
  // selects that chip, a 4-digit key selects that year, "all"/no hash resets.
  function applyHashToFilters(root) {
    if (!root) return;
    const h = hashKey();
    $$(".fbar", root).forEach(bar => {
      const chips = $$(".fchip", bar);
      const sel = bar.querySelector(".fyear");
      let hit = false;
      if (chips.length) {
        const match = chips.filter(c => (c.dataset.cat || "") === h)[0];
        const all = chips.filter(c => !(c.dataset.cat || ""))[0];
        const target = match || ((!h || h === "all") ? all : null);
        if (target) { chips.forEach(c => c.classList.toggle("active", c === target)); hit = true; }
      }
      if (sel) {
        if (/^(19|20)\d{2}$/.test(h) && $$("option", sel).some(o => o.value === h)) { sel.value = h; hit = true; }
        else if (!h || h === "all") { if (sel.value) { sel.value = ""; hit = true; } }
      }
      if (hit) applyFilter(bar.dataset.fb);
    });
  }

  // One delegated handler per root (chip clicks / select / search input bubble).
  function wireFilters(root) {
    if (!root) return;
    // The handlers are delegated, so they only need wiring once…
    if (!root._fbWired) {
      root._fbWired = true;
      // deep links from the header dropdown, plus Back/Forward between them
      window.addEventListener("hashchange", () => applyHashToFilters(root));
      root.addEventListener("click", (e) => {
        const chip = e.target.closest(".fchip"); if (!chip || !root.contains(chip)) return;
        const bar = chip.closest(".fbar"); if (!bar) return;
        $$(".fchip", bar).forEach(c => c.classList.toggle("active", c === chip));
        applyFilter(bar.dataset.fb);
      });
      root.addEventListener("change", (e) => {
        const sel = e.target.closest(".fyear"); if (!sel || !root.contains(sel)) return;
        const bar = sel.closest(".fbar"); if (!bar) return;
        applyFilter(bar.dataset.fb);
      });
      root.addEventListener("input", (e) => {
        const inp = e.target.closest(".fsearch"); if (!inp || !root.contains(inp)) return;
        const bar = inp.closest(".fbar"); if (!bar) return;
        applyFilter(bar.dataset.fb);
      });
    }
    // …but the hash must be re-applied on every call: callers re-render the
    // block (sub-tab switch), which would otherwise drop the deep-linked filter.
    applyHashToFilters(root);
  }

  function buildProjects(projects) {
    if (!Array.isArray(projects)) return "";
    return projects.map(p => `<div class="proj-item">
      <div class="period">${esc(p.period || "")}</div>
      <div><div class="title">${esc(p.title || "")}</div>${p.org ? `<div class="org">${esc(p.org)}</div>` : ""}</div>
    </div>`).join("");
  }

  // Publications grouped by category (Papers page)
  function buildPublications(items) {
    const order = ["International", "Domestic", "Other", "Books"];
    const html = order.filter(g => items.some(i => i.category === g)).map(g => {
      const list = items.filter(i => i.category === g);
      const lis = list.map(i => {
        const sci = i.sci ? `<span class="badge badge--sci">${esc(T.sciBadge)}</span>` : "";
        const link = i.link ? ` <a class="link" href="${esc(i.link)}" target="_blank" rel="noopener">[link]</a>` : "";
        return `<li class="ref-item"><div><p class="title">${linkify(i.citation || i.title || "")}${sci}${link}</p>
          ${i.venue ? `<p class="meta">${esc(i.venue)}</p>` : ""}</div></li>`;
      }).join("");
      return `<div class="group-head"><h3>${esc(T.pubLabels[g] || g)}</h3><span class="count">${list.length}</span></div>
        <ol class="ref-list">${lis}</ol>`;
    }).join("");
    return html || '<div class="state">' + esc(T.pubNone) + "</div>";
  }

  // Conferences grouped by category (Conferences page).
  // Domestic titles are stored "한글 / English"; the EN site shows the
  // English half only.
  function buildConferences(items) {
    // Only Domestic titles follow the "한글 / English" convention. International
    // titles are English already and may legitimately contain " / ", so never
    // split those (would drop the leading half).
    const title = (t, cat) => {
      t = t || "";
      if (!EN || cat !== "Domestic") return t;
      return t.indexOf(" / ") !== -1 ? t.split(" / ").slice(1).join(" / ") : t;
    };
    const html = ["International", "Domestic"].filter(g => items.some(i => i.category === g)).map(g => {
      const list = items.filter(i => i.category === g);
      const lis = list.map(i => `<li class="ref-item"><div>
        <p class="title">${esc(title(i.title, i.category))}</p>
        <p class="meta">${esc(i.conference || "")}${i.date ? ` · ${esc(i.date)}` : ""}</p></div></li>`).join("");
      return `<div class="group-head"><h3>${esc(T.confLabels[g] || g)}</h3><span class="count">${list.length}</span></div>
        <ol class="ref-list">${lis}</ol>`;
    }).join("");
    return html || '<div class="state">' + esc(T.confNone) + "</div>";
  }

  // Patents tables (Patents page). Names/inventors are legal
  // records; on the EN site a translated name_en is preferred when present
  // and the controlled scope/type vocabulary is mapped to English.
  function buildPatents(patents) {
    const SCOPE = { "국내": "Domestic", "국외": "International" };
    const TYPE = {
      "특허": "Patent", "특허(소프트웨어)": "Patent (Software)",
      "저작권등록(소프트웨어)": "Copyright Registration (Software)",
    };
    const order = ["Application", "Registration", "Software"];
    const html = order.filter(c => patents.some(p => p.category === c)).map(c => {
      const list = patents.filter(p => p.category === c);
      const rows = list.map((p, idx) => `<tr>
        <td>${idx + 1}</td>
        <td class="name">${esc(EN ? (p.name_en || p.name || "") : (p.name || ""))}</td>
        <td>${esc(EN ? (SCOPE[p.scope] || p.scope || "") : (p.scope || ""))}</td>
        <td>${esc(EN ? (TYPE[p.type] || p.type || "") : (p.type || ""))}</td>
        <td>${esc(p.date || "")}</td>
        <td>${esc(p.number || "")}</td>
        <td>${esc(p.inventors || "")}</td>
      </tr>`).join("");
      return `<div class="group-head"><h3>${esc(T.patLabels[c] || c)}</h3><span class="count">${list.length}</span></div>
        <div class="table-wrap"><table class="data">
          <thead><tr>${T.patHead.map(h => `<th>${esc(h)}</th>`).join("")}</tr></thead>
          <tbody>${rows}</tbody></table></div><div style="height:1.5rem"></div>`;
    }).join("");
    return html || '<div class="state">' + esc(T.patNone) + "</div>";
  }

  // Awards list (Awards page)
  function buildAwards(awards) {
    const lis = awards.map(a => {
      const main = EN ? (a.title_en || a.title_ko || a.title || "") : (a.title_ko || a.title || "");
      const sub = (!EN && a.title_en) ? `<div class="en">${esc(a.title_en)}</div>` : "";
      return `<div class="award-item">
      <div class="date">${esc(a.date || "")}</div>
      <div>
        <div class="title">${esc(main)}</div>
        ${sub}
        ${a.venue ? `<div class="venue">🏆 ${esc(a.venue)}</div>` : ""}
      </div>
    </div>`;
    }).join("");
    return lis || '<div class="state">' + esc(T.awdNone) + "</div>";
  }

  // Generic sub-tab nav (People / Research).
  function mountSubnav(nav, root, tabs, defaultKey) {
    if (!root || !tabs.length) return;
    const find = (k) => tabs.find(t => t.key === k);
    const fromHash = () => hashKey();
    function show(key) {
      const t = find(key) || find(defaultKey) || tabs[0];
      if (nav) $$("button", nav).forEach(b => b.classList.toggle("active", b.dataset.key === t.key));
      root.innerHTML = t.view();
    }
    if (nav) {
      nav.innerHTML = tabs.map(t =>
        `<button data-key="${esc(t.key)}">${esc(t.label)}</button>`).join("");
      nav.onclick = (e) => {
        const b = e.target.closest("button"); if (!b) return;
        history.replaceState(null, "", "#" + encodeURIComponent(b.dataset.key));
        show(b.dataset.key);
      };
    }
    show(fromHash() || defaultKey);
    // React to hash changes (dropdown deep-links + Back/Forward). An empty or
    // unknown hash (e.g. Back to a bare page URL) resets to the default tab
    // instead of leaving the previously selected tab stale.
    window.addEventListener("hashchange", () => {
      const k = fromHash();
      if (!k) show(defaultKey);
      else if (find(k)) show(k);
    });
  }

  // Smooth-scroll to the element named by the URL hash, allowing for the
  // sticky header (used by the scroll-based Home page).
  function scrollToHash() {
    const id = hashKey();
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    // measure the real header: its height is content-driven on desktop, so
    // the --header-h token can drift from reality under text-only zoom
    const header = document.querySelector(".site-header");
    const offset = ((header && header.offsetHeight) || 68) + 12;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ====================================================================
     PEOPLE  (= professor + members + apply)
     ==================================================================== */
  async function renderPeople() {
    const site = await fetchData("site"); mountChrome(site);
    const [profData, memData, applyData, newsData] = await Promise.all(
      ["professor", "members", "apply", "news"].map(fetchData));
    const root = $("#people-root"); const nav = $("#people-subnav");
    if (!root) return;
    const M = (memData && Array.isArray(memData.members)) ? memData.members : null;
    // newest open recruiting notice → shown on the 지원 tab
    const recruit = (newsData && Array.isArray(newsData.news))
      ? newsData.news.slice()
          .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
          .find(n => n.category === RECRUIT_CAT && recruitOpen(n)) || null
      : null;
    const head = (eyebrow, title) =>
      `<div class="section__head" style="margin-bottom:1.6rem">
        <span class="section__eyebrow">${esc(eyebrow)}</span>
        <h2 class="section__title">${esc(title)}</h2>
      </div>`;
    const membersOr = (which) => M
      ? buildMembers(M, which) : '<div class="state">' + esc(T.memLoadFail) + "</div>";
    mountSubnav(nav, root, [
      { key: "professor", label: T.tabProfessor,
        view: () => head(T.headProfessor[0], T.headProfessor[1]) +
          `<div style="max-width:920px;margin:0 auto">${buildProfessor(profData)}</div>` },
      { key: "current", label: T.tabCurrent,
        view: () => head(T.headCurrent[0], T.headCurrent[1]) + membersOr("current") },
      { key: "alumni", label: T.tabAlumni,
        view: () => head(T.headAlumni[0], T.headAlumni[1]) + membersOr("alumni") },
      { key: "apply", label: T.tabApply,
        view: () => head(T.headApply[0], T.headApply[1]) + buildApply(profData, applyData, recruit) },
    ], "professor");
  }

  /* ====================================================================
     RESEARCH  (= research areas + projects)
     ==================================================================== */
  async function renderResearch() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("projects");
    const root = $("#research-root"); const nav = $("#research-subnav");
    if (!root) return;
    const projects = (data && Array.isArray(data.projects)) ? data.projects : null;
    const topics = buildResearchTopics(site);
    mountSubnav(nav, root, [
      { key: "areas", label: T.tabAreas,
        view: () => topics
          ? `<div class="group-head"><h3>${esc(T.hAreas)}</h3></div>
             <div class="grid grid--3" style="margin:1.2rem 0 0">${topics}</div>`
          : '<div class="state">' + esc(T.noAreas) + "</div>" },
      { key: "projects", label: T.tabProjects,
        view: () => projects ? filterBlock({
          items: projects, cats: null,
          getCat: () => "", getYear: i => yearIn(i.period),
          getText: i => (i.title || "") + " " + (i.org || ""),
          render: (list) => `<div class="group-head"><h3>${esc(T.hProjects)}</h3><span class="count">${list.length}${EN ? "" : "건"}</span></div>${buildProjects(list)}`,
        }) : '<div class="state">' + esc(T.projLoadFail) + "</div>" },
    ], "areas");
    wireFilters(root);
  }

  /* ====================================================================
     PAPERS  (publications.html — journal papers & books)
     ==================================================================== */
  async function renderPublications() {
    // legacy deep link from the merged era: publications.html#conferences
    // → conferences now live on their own page
    if (hashKey() === "conferences") { location.replace("conferences.html"); return; }
    const site = await fetchData("site"); mountChrome(site);
    const pub = await fetchData("publications");
    const root = $("#pub-root");
    if (!root) return;
    const pubs = (pub && Array.isArray(pub.publications))
      ? sortByDateDesc(pub.publications, i => pubYear(i.citation)) : [];
    root.innerHTML = filterBlock({
      items: pubs,
      cats: presentCats(pubs, ["International", "Domestic", "Other", "Books"], T.pubChips),
      getCat: i => i.category, getYear: i => pubYear(i.citation),
      getText: i => (i.citation || "") + " " + (i.venue || ""),
      render: buildPublications,
    });
    wireFilters(root);
  }

  /* ====================================================================
     CONFERENCES  (conferences.html)
     ==================================================================== */
  async function renderConferences() {
    const site = await fetchData("site"); mountChrome(site);
    const conf = await fetchData("conferences");
    const root = $("#conf-root");
    if (!root) return;
    const confs = (conf && Array.isArray(conf.conferences))
      ? sortByDateDesc(conf.conferences, i => i.date) : [];
    root.innerHTML = filterBlock({
      items: confs,
      cats: presentCats(confs, ["International", "Domestic"], T.confLabels),
      getCat: i => i.category, getYear: i => yearIn(i.date),
      getText: i => (i.title || "") + " " + (i.conference || ""),
      render: buildConferences,
    });
    wireFilters(root);
  }

  /* ====================================================================
     PATENTS  (patents.html)
     ==================================================================== */
  async function renderPatents() {
    const site = await fetchData("site"); mountChrome(site);
    const pat = await fetchData("patents");
    const root = $("#pat-root");
    if (!root) return;
    const patents = (pat && Array.isArray(pat.patents))
      ? sortByDateDesc(pat.patents, i => i.date) : [];
    root.innerHTML = filterBlock({
      items: patents,
      cats: presentCats(patents, ["Application", "Registration", "Software"], T.patChips),
      getCat: i => i.category, getYear: i => yearIn(i.date),
      getText: i => [i.name, i.name_en, i.number, i.inventors].filter(Boolean).join(" "),
      render: buildPatents,
    });
    wireFilters(root);
  }

  /* ====================================================================
     AWARDS  (awards.html)
     ==================================================================== */
  async function renderAwards() {
    const site = await fetchData("site"); mountChrome(site);
    const awd = await fetchData("awards");
    const root = $("#awd-root");
    if (!root) return;
    const awards = (awd && Array.isArray(awd.awards))
      ? sortByDateDesc(awd.awards, i => i.date) : [];
    root.innerHTML = filterBlock({
      items: awards, cats: null,
      getCat: () => "", getYear: i => yearIn(i.date),
      getText: i => [i.title_ko, i.title_en, i.venue].filter(Boolean).join(" "),
      render: buildAwards,
    });
    wireFilters(root);
  }

  /* ====================================================================
     Bootstrap by page
     ==================================================================== */
  const PAGES = {
    home: renderHome,
    people: renderPeople, research: renderResearch,
    publications: renderPublications, conferences: renderConferences,
    patents: renderPatents, awards: renderAwards,
  };

  document.addEventListener("DOMContentLoaded", function () {
    const page = document.body.dataset.page;
    const fn = PAGES[page];
    if (fn) fn();
    else { // unknown page (e.g. 404): at least mount chrome
      fetchData("site").then(mountChrome);
    }
  });
})();
