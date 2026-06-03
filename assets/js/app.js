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
    const links = NAV.map(n =>
      `<li><a href="${n.href}" class="${n.href === here ? "active" : ""}">${esc(n.label)}</a></li>`
    ).join("");
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
          <a class="recruit-bar" href="news.html">
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

  // a 2-button "type" sub-nav (no 전체) used by Publications / Achievements
  function typeTabs(nav, root, tabs) {
    if (!nav) { root.innerHTML = tabs[0].view(); return; }
    nav.innerHTML = tabs.map((t, i) =>
      `<button data-key="${esc(t.key)}" class="${i === 0 ? "active" : ""}">${esc(t.label)}</button>`).join("");
    nav.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      $$("button", nav).forEach(x => x.classList.remove("active")); b.classList.add("active");
      const t = tabs.find(x => x.key === b.dataset.key);
      if (t) root.innerHTML = t.view();
    };
    root.innerHTML = tabs[0].view();
  }

  /* ====================================================================
     PEOPLE  (= professor + members)
     ==================================================================== */
  async function renderPeople() {
    const site = await fetchData("site"); mountChrome(site);
    const [profData, memData] = await Promise.all([fetchData("professor"), fetchData("members")]);
    const root = $("#people-root");
    if (!root) return;
    const M = (memData && Array.isArray(memData.members)) ? memData.members : null;
    const sec = (cls, eyebrow, title, body) =>
      `<section class="section${cls}"><div class="wrap">
        <div class="section__head" style="margin-bottom:1.6rem">
          <span class="section__eyebrow">${esc(eyebrow)}</span>
          <h2 class="section__title">${esc(title)}</h2>
        </div>${body}</div></section>`;
    root.innerHTML =
      sec("", "Professor", "지도교수", `<div style="max-width:920px;margin:0 auto">${buildProfessor(profData)}</div>`) +
      sec(" section--muted", "Current", "현재 구성원",
        M ? buildMembers(M, "current") : '<div class="state">구성원 정보를 불러오지 못했습니다.</div>') +
      (M ? sec("", "Alumni", "졸업생", buildMembers(M, "alumni")) : "");
  }

  /* ====================================================================
     RESEARCH  (= research areas + projects)
     ==================================================================== */
  async function renderResearch() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("projects");
    const root = $("#research-root");
    if (!root) return;
    const projects = (data && Array.isArray(data.projects)) ? data.projects : null;
    const topics = buildResearchTopics(site);
    root.innerHTML =
      (topics ? `<div class="group-head"><h3>연구 분야 (Research Areas)</h3></div>
        <div class="grid grid--3" style="margin:1.2rem 0 2.4rem">${topics}</div>` : "") +
      `<div class="group-head"><h3>연구 과제 (Projects)</h3><span class="count">${projects ? projects.length + "건" : ""}</span></div>
       ${projects ? buildProjects(projects) : '<div class="state">프로젝트 정보를 불러오지 못했습니다.</div>'}`;
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
    typeTabs(nav, root, [
      { key: "논문",     label: `논문 (${pubs.length})`,     view: () => buildPublications(pubs) },
      { key: "학술대회", label: `학술대회 (${confs.length})`, view: () => buildConferences(confs) },
    ]);
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
    typeTabs(nav, root, [
      { key: "특허", label: `특허 (${patents.length})`, view: () => buildPatents(patents) },
      { key: "수상", label: `수상 (${awards.length})`,  view: () => buildAwards(awards) },
    ]);
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
  function newsItem(n) {
    return `<article class="news-item">
      <div class="news-item__head">
        <span class="news-date">${esc(fmtDate(n.date))}</span>
        <span class="news-cat">${catEmoji(n.category)} ${esc(n.category || "기타")}</span>
      </div>
      <h3 class="news-title">${esc(n.title || "")}</h3>
      ${newsPhotos(n.photos)}
      ${n.body ? `<p class="news-body">${richText(n.body)}</p>` : ""}
      ${n.link ? `<p class="news-link"><a href="${esc(n.link)}" target="_blank" rel="noopener">관련 링크 →</a></p>` : ""}
    </article>`;
  }

  async function renderNews() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("news");
    const recEl = $("#news-recruit");
    const root = $("#news-root"); const nav = $("#news-subnav");
    if (!data || !Array.isArray(data.news)) { setState(root, "소식을 불러오지 못했습니다."); return; }

    const all = data.news.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    const recruits = all.filter(n => n.category === "모집");
    const posts = all.filter(n => n.category !== "모집");

    // pinned recruit callouts (always visible at top so they never scroll away)
    if (recEl) {
      recEl.innerHTML = recruits.map(r => `
        <div class="recruit">
          <div class="recruit__icon">🙋</div>
          <div class="recruit__body">
            <div class="recruit__tag">모집 · Recruiting</div>
            <h3>${esc(r.title || "")}</h3>
            ${r.body ? `<p>${richText(r.body)}</p>` : ""}
            ${newsPhotos(r.photos)}
            <div class="recruit__foot">
              ${r.date ? `<span class="date">${esc(fmtDate(r.date))}</span>` : ""}
              ${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">관련 링크 →</a>` : ""}
            </div>
          </div>
        </div>`).join("");
    }

    // category filter over event posts (excludes 모집, which is pinned above)
    const order = ["학술대회", "세미나", "랩미팅", "기타"];
    const cats = order.filter(c => posts.some(p => p.category === c));
    posts.forEach(p => { if (p.category && p.category !== "모집" && cats.indexOf(p.category) === -1) cats.push(p.category); });

    const draw = (cat) => {
      const list = cat ? posts.filter(p => p.category === cat) : posts;
      if (!list.length) { root.innerHTML = `<div class="state">아직 등록된 소식이 없습니다.</div>`; return; }
      root.innerHTML = `<div class="news-feed">${list.map(newsItem).join("")}</div>`;
    };

    if (nav) {
      nav.innerHTML = ["전체"].concat(cats).map((c, i) =>
        `<button data-cat="${i === 0 ? "" : esc(c)}" class="${i === 0 ? "active" : ""}">${esc(c)}</button>`).join("");
      nav.onclick = (e) => {
        const b = e.target.closest("button"); if (!b) return;
        $$("button", nav).forEach(x => x.classList.remove("active")); b.classList.add("active");
        draw(b.dataset.cat);
      };
    }
    draw("");
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
