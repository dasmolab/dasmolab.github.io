/* ==========================================================================
   DASMOLabs site script — no build step.
   Loads content from /data/*.json and renders it client-side.
   Header & footer are injected from data/site.json so the lab can change
   the name / contact info in one place (via the CMS).

   Pages are consolidated into 6 tabs for visitors, but the underlying data
   files (and the CMS editing menus) stay separate:
     People       = professor.json + members.json
     Research     = site.research_topics + projects.json
     Publications = publications.json + conferences.json
     Achievements = patents.json + awards.json
   ========================================================================== */
(function () {
  "use strict";

  const NAV = [
    { href: "index.html",        label: "Home" },
    { href: "news.html",         label: "News" },
    { href: "people.html",       label: "People" },
    { href: "research.html",     label: "Research" },
    { href: "publications.html", label: "Publications" },
    { href: "achievements.html", label: "Achievements" },
  ];

  // Sub-tabs shown in each main tab's hover dropdown. Each page uses the same
  // `key` to activate the matching sub-tab / section from the URL hash, so the
  // dropdown can deep-link straight into a sub-tab.
  //   tabbed pages (People/Research/Publications/Achievements): key = sub-tab id
  //   scroll page  (Home):                             key = on-page element id
  //   News:                                            key = category ("all" = 전체)
  const SUBNAV = {
    "index.html": [
      { label: "연구실 소개", key: "about" },
      { label: "연구 분야",   key: "research" },
      { label: "강의 과목",   key: "classes" },
    ],
    "news.html": [
      { label: "전체",     key: "all" },
      { label: "학술대회", key: "학술대회" },
      { label: "세미나",   key: "세미나" },
      { label: "랩미팅",   key: "랩미팅" },
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
    "publications.html": [
      { label: "논문",     key: "papers" },
      { label: "학술대회", key: "conferences" },
    ],
    "achievements.html": [
      { label: "특허", key: "patents" },
      { label: "수상", key: "awards" },
    ],
  };

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

  // resolve an image/asset path so it works under any sub-path
  function imgSrc(p) {
    if (!p) return "";
    if (/^https?:\/\//.test(p)) return p;
    return p.replace(/^\/+/, "");
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

  // a photo entry may be a plain path string or an object { image }
  function photoSrc(p) { return imgSrc(typeof p === "string" ? p : (p && (p.image || p.src)) || ""); }
  function firstPhoto(arr) { return Array.isArray(arr) && arr.length ? photoSrc(arr[0]) : ""; }

  async function fetchData(name) {
    try {
      const res = await fetch("data/" + name + ".json", { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      console.warn("Could not load data/" + name + ".json", e);
      return null;
    }
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

  function buildHeader(site) {
    const here = currentPage();
    const links = NAV.map(n => {
      const subs = SUBNAV[n.href] || [];
      const active = n.href === here ? "active" : "";
      const caret = subs.length ? `<span class="nav__caret" aria-hidden="true">▾</span>` : "";
      const menu = subs.length
        ? `<ul class="nav__sub">${subs.map(s =>
            `<li><a href="${n.href}#${encodeURIComponent(s.key)}">${esc(s.label)}</a></li>`).join("")}</ul>`
        : "";
      return `<li class="nav__item${subs.length ? " has-sub" : ""}">` +
        `<a href="${n.href}" class="${active}">${esc(n.label)}${caret}</a>${menu}</li>`;
    }).join("");
    const abbr = (site && site.lab_abbr) || "DASMOLabs";
    const ko   = (site && site.lab_name_ko) || "동아대학교 교통공학연구실";
    const logo = (site && site.logo) ? imgSrc(site.logo) : "assets/img/logo_231027.jpg";
    return `
      <a class="skip-link" href="#main">본문 바로가기</a>
      <header class="site-header">
        <nav class="nav wrap" aria-label="주 메뉴">
          <a class="brand" href="index.html">
            <img src="${logo}" alt="${esc(abbr)} 로고" onerror="this.style.display='none'">
            <span class="brand__txt"><b>${esc(abbr)}</b><span>${esc(ko)}</span></span>
          </a>
          <button class="nav__toggle" aria-label="메뉴 열기" aria-expanded="false" aria-controls="navmenu">
            <span></span><span></span><span></span>
          </button>
          <ul class="nav__links" id="navmenu">${links}</ul>
        </nav>
      </header>`;
  }

  function buildFooter(site) {
    const abbr = (site && site.lab_abbr) || "DASMOLabs";
    const en   = (site && site.lab_name_en) || "Dong-A Smart Mobility Laboratory";
    const addr = (site && site.address) || "부산시 사하구 하단동 동아대학교 승학캠퍼스 공대1호관 1404호";
    const tel  = (site && site.phone) || "051-200-7665";
    const email = (site && site.email) || "hoekim@dau.ac.kr";
    const navLinks = NAV.map(n => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join("");
    const year = "2026";
    return `
      <footer class="site-footer">
        <div class="wrap footer-grid">
          <div class="footer-brand">
            <b>${esc(abbr)}</b>
            <p style="margin:.5rem 0 0;font-size:.92rem;">${esc(en)}</p>
            <p style="font-size:.88rem;">지능형 교통체계(ITS) · 스마트 모빌리티 · MaaS 연구</p>
          </div>
          <div>
            <h4>바로가기</h4>
            <ul class="footer-links">${navLinks}</ul>
          </div>
          <div>
            <h4>연락처</h4>
            <p class="footer-contact">
              ${esc(addr)}<br>
              TEL. ${esc(tel)}<br>
              <a href="mailto:${esc((email || "").split(",")[0].trim())}">${esc(email)}</a>
            </p>
          </div>
        </div>
        <div class="wrap footer-bottom">
          <span>© ${year} ${esc(en)}. All rights reserved.</span>
          <a class="edit-link" href="admin/" title="승인된 운영자만 로그인 후 편집할 수 있습니다">🔒 사이트 관리(로그인)</a>
        </div>
      </footer>`;
  }

  function mountChrome(site) {
    const h = $("[data-header]"); if (h) h.outerHTML = buildHeader(site);
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
      toggle.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    });
    $$(".nav__links a").forEach(a => a.addEventListener("click", () => {
      menu.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  /* ====================================================================
     HOME
     ==================================================================== */
  async function renderHome() {
    const site = await fetchData("site");
    mountChrome(site);
    if (!site) return;

    // intro text
    const introEl = $("#home-intro");
    if (introEl) {
      const parts = [site.intro1, site.intro2].filter(Boolean).map(t => `<p>${escMultiline(t)}</p>`).join("");
      introEl.innerHTML = parts;
    }

    // research topics (shared with the Research page)
    const topicsEl = $("#home-topics");
    if (topicsEl) topicsEl.innerHTML = buildResearchTopics(site);

    // classes
    const clsEl = $("#home-classes");
    if (clsEl) {
      const u = Array.isArray(site.classes_undergrad) ? site.classes_undergrad.join(", ") : (site.classes_undergrad || "");
      const g = Array.isArray(site.classes_grad) ? site.classes_grad.join(", ") : (site.classes_grad || "");
      clsEl.innerHTML =
        `<div class="card"><div class="card__icon">🎓</div><h3>학부 (Undergraduate)</h3><p>${esc(u)}</p></div>
         <div class="card"><div class="card__icon">📚</div><h3>대학원 (Graduate)</h3><p>${esc(g)}</p></div>`;
    }

    // live stats
    const statsEl = $("#home-stats");
    if (statsEl) {
      const [pubs, projs, mem, conf] = await Promise.all(
        ["publications", "projects", "members", "conferences"].map(fetchData)
      );
      const nPub = pubs && pubs.publications ? pubs.publications.length : 0;
      const nProj = projs && projs.projects ? projs.projects.length : 0;
      const nConf = conf && conf.conferences ? conf.conferences.length : 0;
      const nMem = mem && mem.members ? mem.members.filter(m => m.group === "current").length : 0;
      const stat = (num, label) => `<div class="stats__item"><div class="stats__num">${num}<span>+</span></div><div class="stats__label">${esc(label)}</div></div>`;
      statsEl.innerHTML = stat(nPub, "Publications") + stat(nConf, "Conference Papers") + stat(nProj, "Projects") + stat(nMem, "Current Members");
    }

    // recruit banner + latest news (only render if there is content)
    const news = await fetchData("news");
    if (news && Array.isArray(news.news)) {
      const sorted = news.news.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      const recruits = sorted.filter(n => n.category === "모집");
      const posts = sorted.filter(n => n.category !== "모집");

      const recEl = $("#home-recruit");
      if (recEl && recruits.length) {
        const r = recruits[0];
        recEl.innerHTML = `<div class="wrap" style="margin-top:1.6rem">
          <a class="recruit-bar" href="people.html#apply">
            <span class="recruit-bar__icon">👩‍🎓</span>
            <span class="recruit-bar__txt"><b>지원자 모집 중</b> — ${esc(r.title || "")}</span>
            <span class="recruit-bar__cta">자세히 보기 →</span>
          </a></div>`;
      }

      const newsEl = $("#home-news");
      if (newsEl && posts.length) {
        const cards = posts.slice(0, 3).map(n => {
          const photo = firstPhoto(n.photos);
          const thumb = photo
            ? `<div class="newscard__thumb" style="background-image:url('${photo}')"></div>`
            : `<div class="newscard__thumb newscard__thumb--ph">${catEmoji(n.category)}</div>`;
          return `<a class="newscard" href="news.html">
            ${thumb}
            <div class="newscard__body">
              <div class="newscard__meta"><span class="news-date">${esc(fmtDate(n.date))}</span> · ${esc(n.category || "기타")}</div>
              <div class="newscard__title">${esc(n.title || "")}</div>
            </div></a>`;
        }).join("");
        newsEl.innerHTML = `<section class="section" style="padding-bottom:0">
          <div class="wrap">
            <div class="section__head" style="margin-bottom:1.6rem">
              <span class="section__eyebrow">News</span>
              <h2 class="section__title">최신 소식</h2>
            </div>
            <div class="grid grid--3">${cards}</div>
            <div style="text-align:center;margin-top:1.8rem">
              <a class="btn btn--primary" href="news.html">전체 소식 보기 →</a>
            </div>
          </div>
        </section>`;
      }
    }

    scrollToHash(); // deep-link from the Home dropdown (#about / #research / #classes)
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

  // Professor profile (People page)
  function buildProfessor(p) {
    if (!p) return '<div class="state">교수 정보를 불러오지 못했습니다.</div>';
    const photo = imgSrc(p.photo) || "assets/uploads/prof.jpg";
    const emailLinks = (p.email || "").split(",").map(e => e.trim()).filter(Boolean)
      .map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(", ");
    const head = `
      <div class="prof-head">
        <div class="prof-photo"><img src="${photo}" alt="${esc(p.name_ko)} 교수" onerror="this.src='assets/uploads/prof.jpg'"></div>
        <div>
          <h2 class="prof-name">${esc(p.name_ko)}<small>${esc(p.name_en || "")}</small></h2>
          <div class="prof-title">${esc(p.title || "")}</div>
          <ul class="prof-contact">
            ${p.fields ? `<li><b>전공분야</b> ${esc(p.fields)}</li>` : ""}
            ${p.phone ? `<li><b>연구실</b> ${esc(p.phone)}</li>` : ""}
            ${emailLinks ? `<li><b>E-mail</b> ${emailLinks}</li>` : ""}
            ${p.office ? `<li><b>Office</b> ${esc(p.office)}</li>` : ""}
          </ul>
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
      return `<div class="group-head"><h3>학회활동 (Academic Societies)</h3><span class="count">${arr.length}</span></div>
        <ul class="deflist">${items}</ul>`;
    };
    const media = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const items = arr.map(m => {
        const t = m.url ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.title)}</a>` : esc(m.title);
        return `<li>${m.date ? `<span class="date">${esc(m.date)}</span> ` : ""}${t}</li>`;
      }).join("");
      return `<div class="group-head"><h3>언론활동 (Media)</h3><span class="count">${arr.length}</span></div>
        <ul class="media-list">${items}</ul>`;
    };
    const committees = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const items = arr.map(c => {
        if (typeof c === "string") return `<li><span class="v">${esc(c)}</span></li>`;
        return `<li><span class="k">${esc(c.period || "")}</span><span class="v">${esc(c.name || "")}</span></li>`;
      }).join("");
      return `<details class="collapse">
        <summary>대외 위원회 활동 (Committees) · ${arr.length}건</summary>
        <div class="collapse__body"><ul class="deflist">${items}</ul></div>
      </details>`;
    };
    return head +
      `<div style="margin-top:2.2rem">
        ${eduBlock(p.education, "학력 (Education)")}
        ${eduBlock(p.careers, "주요 경력 (Academic Careers)")}
        ${societies(p.societies)}
        ${media(p.media)}
        <div style="margin-top:1.6rem">${committees(p.committees)}</div>
      </div>`;
  }

  // Members grids — `which` is "current" or "alumni" (People page)
  function buildMembers(M, which) {
    if (!Array.isArray(M)) return '<div class="state">구성원 정보를 불러오지 못했습니다.</div>';
    const initials = (m) => (m.name_en || m.name_ko || "?").trim().charAt(0).toUpperCase();
    const card = (m) => {
      const photo = imgSrc(m.photo);
      const pic = photo
        ? `<div class="person__photo" style="background-image:url('${photo}')" role="img" aria-label="${esc(m.name_ko)}"></div>`
        : `<div class="person__photo person__photo--ph">${esc(initials(m))}</div>`;
      const meta = [];
      if (m.group === "alumni") {
        const deg = [m.degree, m.grad_year].filter(Boolean).map(esc).join(" · ");
        if (deg) meta.push(deg);
        if (m.affiliation) meta.push(esc(m.affiliation));
      } else {
        if (m.affiliation) meta.push(esc(m.affiliation));
        if (m.period) meta.push(esc(m.period));
      }
      const thesis = m.thesis ? `<div class="person__thesis" title="${esc(m.thesis)}">${esc(m.thesis)}</div>` : "";
      const email = (m.group !== "alumni" && m.email)
        ? `<div class="person__meta"><a href="mailto:${esc((m.email || "").split(/[,;]/)[0].trim())}">${esc(m.email)}</a></div>` : "";
      return `<article class="person">
        ${pic}
        <div class="person__body">
          <div class="person__name">${esc(m.name_ko)}<small>${esc(m.name_en || "")}</small></div>
          ${meta.length ? `<div class="person__meta">${meta.join("<br>")}</div>` : ""}
          ${thesis}
          ${email}
        </div>
      </article>`;
    };
    const group = (label, items) => {
      if (!items.length) return "";
      return `<div class="group-head"><h3>${esc(label)}</h3><span class="count">${items.length}명</span></div>
        <div class="people-grid">${items.map(card).join("")}</div>`;
    };
    const byLevel = (list, lv) => list.filter(m => (m.level || "").toLowerCase().startsWith(lv));
    if (which === "alumni") {
      const alu = M.filter(m => m.group === "alumni");
      return group("박사 (Ph.D.)", byLevel(alu, "ph"))
        + group("석사 (Master's)", byLevel(alu, "master").concat(byLevel(alu, "m.s")))
        + group("학사 (Bachelor's)", byLevel(alu, "bach"));
    }
    const cur = M.filter(m => m.group === "current");
    return group("박사과정 (Ph.D. Students)", byLevel(cur, "ph"))
      + group("석사과정 (Master's Students)", byLevel(cur, "master").concat(byLevel(cur, "m.s")))
      + group("학부연구생 (Undergraduate)", byLevel(cur, "under"));
  }

  // Application guide (People page → 지원 tab). Tells prospective students to
  // email the advisor with the required personal info; the button pre-fills a mail.
  function buildApply(prof) {
    const emails = ((prof && prof.email) || "hoekim@dau.ac.kr")
      .split(",").map(e => e.trim()).filter(Boolean);
    const primary = emails[0] || "hoekim@dau.ac.kr";
    const profName = (prof && prof.name_ko) ? prof.name_ko + " 교수" : "지도교수";
    // [label, hint] for each field the applicant should include
    const fields = [
      ["성명 (한글 / 영문)", "예) 홍길동 / Hong Gildong"],
      ["생년월일 (나이)", "예) 2000.01.01 (만 25세)"],
      ["연락처", "휴대전화 번호"],
      ["이메일", "회신받을 이메일 주소"],
      ["현재 소속", "학교 · 학과 · 학년 (또는 졸업 여부)"],
      ["희망 과정", "석사 / 박사 / 석·박사 통합 / 학부연구생"],
      ["관심 연구분야", "ITS · 자율주행 · 스마트 모빌리티 · 교통안전 등"],
      ["지원 동기", "간단한 자기소개 및 지원 동기"],
      ["첨부 서류", "이력서 · 성적증명서 등 (파일 첨부, 선택)"],
    ];
    const rows = fields.map(([k, v]) =>
      `<li><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></li>`).join("");
    // pre-filled mail template
    const subject = "[DASMOLabs 지원] 성명 / 희망과정";
    const bodyTmpl = [
      "성명(한글/영문): ", "생년월일(나이): ", "연락처: ", "이메일: ",
      "현재 소속(학교/학과/학년): ", "희망 과정(석사/박사/학부연구생): ",
      "관심 연구분야: ", "지원 동기: ", "",
      "※ 이력서·성적증명서 등은 파일로 첨부해 주세요.",
    ].join("\n");
    const href = `mailto:${primary}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTmpl)}`;
    const mailLinks = emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(", ");
    return `<div style="max-width:760px;margin:0 auto">
      <p style="font-size:1.04rem">교통공학 · 지능형 교통체계(ITS) · 스마트 모빌리티 분야에 관심 있는
        대학원생(석·박사)과 학부연구생을 모집합니다. 아래 항목을 작성하여
        <b>${esc(profName)}</b> 이메일로 보내주시면 검토 후 회신드립니다.</p>
      <div class="group-head"><h3>지원 시 기재 항목</h3></div>
      <ul class="deflist">${rows}</ul>
      <div class="apply-cta">
        <p style="margin:0 0 .9rem;color:var(--text-soft)">아래 버튼을 누르면 작성 양식이 미리 채워진 메일 창이 열립니다.</p>
        <a class="btn btn--primary" href="${href}">✉️ 이메일로 지원하기</a>
        <p style="margin:.9rem 0 0;font-size:.92rem">문의 · 접수: ${mailLinks}</p>
      </div>
    </div>`;
  }

  // Project rows (Research page) — heading is added by the caller
  function buildProjects(projects) {
    if (!Array.isArray(projects)) return "";
    return projects.map(p => `<div class="proj-item">
      <div class="period">${esc(p.period || "")}</div>
      <div><div class="title">${esc(p.title || "")}</div>${p.org ? `<div class="org">${esc(p.org)}</div>` : ""}</div>
    </div>`).join("");
  }

  // Publications grouped by category (Publications page → 논문 tab)
  function buildPublications(items) {
    const order = ["International", "Domestic", "Other", "Books"];
    const labelMap = { International: "International Journals & Proceedings", Domestic: "국내 논문", Other: "기타", Books: "저서" };
    const html = order.filter(g => items.some(i => i.category === g)).map(g => {
      const list = items.filter(i => i.category === g);
      const lis = list.map(i => {
        const sci = i.sci ? `<span class="badge badge--sci">SCI급</span>` : "";
        const link = i.link ? ` <a class="link" href="${esc(i.link)}" target="_blank" rel="noopener">[link]</a>` : "";
        return `<li class="ref-item"><div><p class="title">${linkify(i.citation || i.title || "")}${sci}${link}</p>
          ${i.venue ? `<p class="meta">${esc(i.venue)}</p>` : ""}</div></li>`;
      }).join("");
      return `<div class="group-head"><h3>${esc(labelMap[g] || g)}</h3><span class="count">${list.length}</span></div>
        <ol class="ref-list">${lis}</ol>`;
    }).join("");
    return html || '<div class="state">등록된 논문이 없습니다.</div>';
  }

  // Conferences grouped by category (Publications page → 학술대회 tab)
  function buildConferences(items) {
    const labelMap = { International: "International", Domestic: "Domestic (국내)" };
    const html = ["International", "Domestic"].filter(g => items.some(i => i.category === g)).map(g => {
      const list = items.filter(i => i.category === g);
      const lis = list.map(i => `<li class="ref-item"><div>
        <p class="title">${esc(i.title || "")}</p>
        <p class="meta">${esc(i.conference || "")}${i.date ? ` · ${esc(i.date)}` : ""}</p></div></li>`).join("");
      return `<div class="group-head"><h3>${esc(labelMap[g] || g)}</h3><span class="count">${list.length}</span></div>
        <ol class="ref-list">${lis}</ol>`;
    }).join("");
    return html || '<div class="state">등록된 학술대회 발표가 없습니다.</div>';
  }

  // Patents tables (Achievements page → 특허 tab)
  function buildPatents(patents) {
    const order = ["Application", "Registration", "Software"];
    const labelMap = { Application: "출원 (Application)", Registration: "등록 (Registration)", Software: "프로그램·저작권 (Software)" };
    const html = order.filter(c => patents.some(p => p.category === c)).map(c => {
      const list = patents.filter(p => p.category === c);
      const rows = list.map((p, idx) => `<tr>
        <td>${idx + 1}</td>
        <td class="name">${esc(p.name || "")}</td>
        <td>${esc(p.scope || "")}</td>
        <td>${esc(p.type || "")}</td>
        <td>${esc(p.date || "")}</td>
        <td>${esc(p.number || "")}</td>
        <td>${esc(p.inventors || "")}</td>
      </tr>`).join("");
      return `<div class="group-head"><h3>${esc(labelMap[c] || c)}</h3><span class="count">${list.length}</span></div>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>No.</th><th>지식재산권명</th><th>국내외</th><th>구분</th><th>일자</th><th>번호</th><th>발명인</th></tr></thead>
          <tbody>${rows}</tbody></table></div><div style="height:1.5rem"></div>`;
    }).join("");
    return html || '<div class="state">등록된 특허가 없습니다.</div>';
  }

  // Awards list (Achievements page → 수상 tab)
  function buildAwards(awards) {
    const lis = awards.map(a => `<div class="award-item">
      <div class="date">${esc(a.date || "")}</div>
      <div>
        <div class="title">${esc(a.title_ko || a.title || "")}</div>
        ${a.title_en ? `<div class="en">${esc(a.title_en)}</div>` : ""}
        ${a.venue ? `<div class="venue">🏆 ${esc(a.venue)}</div>` : ""}
      </div>
    </div>`).join("");
    return lis || '<div class="state">등록된 수상 실적이 없습니다.</div>';
  }

  // Generic sub-tab nav (People / Publications / Achievements). Shows one view
  // at a time, syncs the active tab with the URL hash, and listens for hash
  // changes so the header dropdown can switch tabs without a full reload.
  function mountSubnav(nav, root, tabs, defaultKey) {
    if (!root || !tabs.length) return;
    const find = (k) => tabs.find(t => t.key === k);
    const fromHash = () => decodeURIComponent((location.hash || "").replace(/^#/, ""));
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
    window.addEventListener("hashchange", () => { const k = fromHash(); if (find(k)) show(k); });
  }

  // Smooth-scroll to the element named by the URL hash, allowing for the sticky
  // header. Used by the scroll-based pages (Home / Research) whose target
  // sections are rendered by JS after the browser's own hash jump has passed.
  function scrollToHash() {
    const id = decodeURIComponent((location.hash || "").replace(/^#/, ""));
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;
    const offset = (parseInt(getComputedStyle(document.documentElement).getPropertyValue("--header-h"), 10) || 68) + 12;
    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  }

  /* ====================================================================
     PEOPLE  (= professor + members)
     ==================================================================== */
  async function renderPeople() {
    const site = await fetchData("site"); mountChrome(site);
    const [profData, memData] = await Promise.all([fetchData("professor"), fetchData("members")]);
    const root = $("#people-root"); const nav = $("#people-subnav");
    if (!root) return;
    const M = (memData && Array.isArray(memData.members)) ? memData.members : null;
    const head = (eyebrow, title) =>
      `<div class="section__head" style="margin-bottom:1.6rem">
        <span class="section__eyebrow">${esc(eyebrow)}</span>
        <h2 class="section__title">${esc(title)}</h2>
      </div>`;
    const membersOr = (which) => M
      ? buildMembers(M, which) : '<div class="state">구성원 정보를 불러오지 못했습니다.</div>';
    mountSubnav(nav, root, [
      { key: "professor", label: "지도교수",
        view: () => head("Professor", "지도교수") +
          `<div style="max-width:920px;margin:0 auto">${buildProfessor(profData)}</div>` },
      { key: "current", label: "현재 구성원",
        view: () => head("Current", "현재 구성원") + membersOr("current") },
      { key: "alumni", label: "졸업생",
        view: () => head("Alumni", "졸업생") + membersOr("alumni") },
      { key: "apply", label: "지원",
        view: () => head("Join Us", "지원 안내") + buildApply(profData) },
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
      { key: "areas", label: "연구 분야",
        view: () => topics
          ? `<div class="group-head"><h3>연구 분야 (Research Areas)</h3></div>
             <div class="grid grid--3" style="margin:1.2rem 0 0">${topics}</div>`
          : '<div class="state">등록된 연구 분야가 없습니다.</div>' },
      { key: "projects", label: "연구 과제",
        view: () => `<div class="group-head"><h3>연구 과제 (Projects)</h3><span class="count">${projects ? projects.length + "건" : ""}</span></div>
          ${projects ? buildProjects(projects) : '<div class="state">프로젝트 정보를 불러오지 못했습니다.</div>'}` },
    ], "areas");
  }

  /* ====================================================================
     PUBLICATIONS  (= journals/books + conferences, by type tab)
     ==================================================================== */
  async function renderPublications() {
    const site = await fetchData("site"); mountChrome(site);
    const [pub, conf] = await Promise.all([fetchData("publications"), fetchData("conferences")]);
    const root = $("#pub-root"); const nav = $("#pub-subnav");
    if (!root) return;
    const pubs = (pub && Array.isArray(pub.publications)) ? pub.publications : [];
    const confs = (conf && Array.isArray(conf.conferences)) ? conf.conferences : [];
    mountSubnav(nav, root, [
      { key: "papers",      label: `논문 (${pubs.length})`,      view: () => buildPublications(pubs) },
      { key: "conferences", label: `학술대회 (${confs.length})`, view: () => buildConferences(confs) },
    ], "papers");
  }

  /* ====================================================================
     ACHIEVEMENTS  (= patents + awards, by type tab)
     ==================================================================== */
  async function renderAchievements() {
    const site = await fetchData("site"); mountChrome(site);
    const [pat, awd] = await Promise.all([fetchData("patents"), fetchData("awards")]);
    const root = $("#ach-root"); const nav = $("#ach-subnav");
    if (!root) return;
    const patents = (pat && Array.isArray(pat.patents)) ? pat.patents : [];
    const awards = (awd && Array.isArray(awd.awards)) ? awd.awards : [];
    mountSubnav(nav, root, [
      { key: "patents", label: `특허 (${patents.length})`, view: () => buildPatents(patents) },
      { key: "awards",  label: `수상 (${awards.length})`,  view: () => buildAwards(awards) },
    ], "patents");
  }

  /* ====================================================================
     NEWS / 소식 (학술대회·세미나·랩미팅 일지 + 모집 공고)
     ==================================================================== */
  function catEmoji(c) {
    return ({ "학술대회": "🎤", "세미나": "🧑‍🏫", "랩미팅": "👥", "모집": "🙋", "기타": "🗒️" })[c] || "🗒️";
  }
  function newsPhotos(arr) {
    if (!Array.isArray(arr) || !arr.length) return "";
    const items = arr.map(p => {
      const src = photoSrc(p);
      if (!src) return "";
      return `<a class="news-photo" href="${esc(src)}" target="_blank" rel="noopener">` +
        `<img src="${esc(src)}" alt="" loading="lazy" onerror="this.parentNode.style.display='none'"></a>`;
    }).join("");
    return items ? `<div class="news-photos">${items}</div>` : "";
  }
  // short single-line preview of the body for the feed cards
  function newsExcerpt(s, max) {
    const t = String(s == null ? "" : s).replace(/\s+/g, " ").trim();
    const n = max || 90;
    return t.length > n ? t.slice(0, n).trim() + "…" : t;
  }
  function newsThumb(n) {
    const photo = firstPhoto(n.photos);
    return photo
      ? `<span class="news-card__thumb" style="background-image:url('${photo}')"></span>`
      : `<span class="news-card__thumb news-card__thumb--ph">${catEmoji(n.category)}</span>`;
  }
  // compact, clickable feed card (opens the detail modal). idx → index in `posts`.
  function newsCard(n, idx) {
    return `<button class="news-card" type="button" data-idx="${idx}" aria-label="${esc(n.title || "")} 자세히 보기">
      ${newsThumb(n)}
      <span class="news-card__body">
        <span class="news-card__meta"><span class="news-date">${esc(fmtDate(n.date))}</span> · ${esc(n.category || "기타")}</span>
        <span class="news-card__title">${esc(n.title || "")}</span>
        ${n.body ? `<span class="news-card__excerpt">${esc(newsExcerpt(n.body))}</span>` : ""}
        <span class="news-card__more">자세히 보기 →</span>
      </span>
    </button>`;
  }

  // Detail modal (full title, photos, body, link) opened from a feed card.
  let newsModalEl = null;
  function newsModalKey(e) { if (e.key === "Escape") closeNewsModal(); }
  function closeNewsModal() {
    if (!newsModalEl) return;
    newsModalEl.remove(); newsModalEl = null;
    document.body.style.overflow = "";
    document.removeEventListener("keydown", newsModalKey);
  }
  function openNewsModal(n) {
    closeNewsModal();
    const wrap = document.createElement("div");
    wrap.className = "news-modal";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-modal", "true");
    wrap.setAttribute("aria-label", n.title || "소식");
    wrap.innerHTML =
      `<div class="news-modal__backdrop" data-close></div>
       <div class="news-modal__panel">
         <button class="news-modal__close" type="button" data-close aria-label="닫기">&times;</button>
         <div class="news-modal__head">
           <span class="news-date">${esc(fmtDate(n.date))}</span>
           <span class="news-cat">${catEmoji(n.category)} ${esc(n.category || "기타")}</span>
         </div>
         <h2 class="news-modal__title">${esc(n.title || "")}</h2>
         ${(Array.isArray(n.photos) && n.photos.length) ? `<div class="news-modal__photos">${newsPhotos(n.photos)}</div>` : ""}
         ${n.body ? `<div class="news-modal__body">${richText(n.body)}</div>` : ""}
         ${n.link ? `<p class="news-link" style="margin-top:1.1rem"><a href="${esc(n.link)}" target="_blank" rel="noopener">관련 링크 →</a></p>` : ""}
       </div>`;
    wrap.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeNewsModal(); });
    document.body.appendChild(wrap);
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", newsModalKey);
    const closeBtn = wrap.querySelector(".news-modal__close");
    if (closeBtn) closeBtn.focus();
    newsModalEl = wrap;
  }

  async function renderNews() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("news");
    const root = $("#news-root"); const nav = $("#news-subnav");
    if (!data || !Array.isArray(data.news)) { setState(root, "소식을 불러오지 못했습니다."); return; }

    // 모집(Recruiting) is intentionally NOT shown on News — prospective students
    // are directed to People → 지원 tab (linked from the Home recruit bar).
    const posts = data.news.slice()
      .filter(n => n.category !== "모집")
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    // category filter over event posts
    const order = ["학술대회", "세미나", "랩미팅", "기타"];
    const cats = order.filter(c => posts.some(p => p.category === c));
    posts.forEach(p => { if (p.category && p.category !== "모집" && cats.indexOf(p.category) === -1) cats.push(p.category); });

    const draw = (cat) => {
      if (nav) $$("button", nav).forEach(x => x.classList.toggle("active", (x.dataset.cat || "") === (cat || "")));
      const list = cat ? posts.filter(p => p.category === cat) : posts;
      if (!list.length) { root.innerHTML = `<div class="state">아직 등록된 소식이 없습니다.</div>`; return; }
      root.innerHTML = `<div class="news-list">${list.map(n => newsCard(n, posts.indexOf(n))).join("")}</div>`;
    };
    // open the detail modal when a feed card is activated (native button = mouse + keyboard)
    root.addEventListener("click", (e) => {
      const card = e.target.closest(".news-card"); if (!card) return;
      const idx = parseInt(card.dataset.idx, 10);
      if (!isNaN(idx) && posts[idx]) openNewsModal(posts[idx]);
    });
    // a category from the URL hash ("all"/unknown/empty → 전체)
    const catFromHash = () => {
      const h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      return (h && h !== "all" && cats.indexOf(h) !== -1) ? h : "";
    };

    if (nav) {
      nav.innerHTML = ["전체"].concat(cats).map((c, i) =>
        `<button data-cat="${i === 0 ? "" : esc(c)}">${esc(c)}</button>`).join("");
      nav.onclick = (e) => {
        const b = e.target.closest("button"); if (!b) return;
        const cat = b.dataset.cat || "";
        history.replaceState(null, "", cat ? "#" + encodeURIComponent(cat) : location.pathname + location.search);
        draw(cat);
      };
      window.addEventListener("hashchange", () => draw(catFromHash()));
    }
    draw(catFromHash());
  }

  /* ====================================================================
     Bootstrap by page
     ==================================================================== */
  const PAGES = {
    home: renderHome, news: renderNews,
    people: renderPeople, research: renderResearch,
    publications: renderPublications, achievements: renderAchievements,
  };

  document.addEventListener("DOMContentLoaded", function () {
    const page = document.body.dataset.page;
    const fn = PAGES[page];
    if (fn) fn();
    else { // unknown page: at least mount chrome
      fetchData("site").then(mountChrome);
    }
  });
})();
