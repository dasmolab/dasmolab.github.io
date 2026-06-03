/* ==========================================================================
   DASMOLabs site script — no build step.
   Loads content from /data/*.json and renders it client-side.
   Header & footer are injected from data/site.json so the lab can change
   the name / contact info in one place (via the CMS).
   ========================================================================== */
(function () {
  "use strict";

  const NAV = [
    { href: "index.html",        label: "Home" },
    { href: "news.html",         label: "News" },
    { href: "professor.html",    label: "Professor" },
    { href: "members.html",      label: "Members" },
    { href: "projects.html",     label: "Projects" },
    { href: "publications.html", label: "Publications" },
    { href: "conferences.html",  label: "Conferences" },
    { href: "patents.html",      label: "Patents" },
    { href: "awards.html",       label: "Awards" },
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

    // research topics
    const topicsEl = $("#home-topics");
    if (topicsEl && Array.isArray(site.research_topics)) {
      topicsEl.innerHTML = site.research_topics.map(t => {
        const tags = Array.isArray(t.tags) && t.tags.length
          ? `<div class="tags">${t.tags.map(x => `<span class="tag">${esc(x)}</span>`).join("")}</div>` : "";
        return `<div class="card topic">
          <div class="card__icon">${esc(t.icon || "▣")}</div>
          <h3>${esc(t.title)}</h3><p>${esc(t.desc || "")}</p>${tags}</div>`;
      }).join("");
    }

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
     PROFESSOR
     ==================================================================== */
  async function renderProfessor() {
    const site = await fetchData("site");
    mountChrome(site);
    const p = await fetchData("professor");
    const root = $("#prof-root");
    if (!p) { setState(root, "교수 정보를 불러오지 못했습니다."); return; }

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

    root.innerHTML = head +
      `<div class="section" style="padding:2.5rem 0 0">
        ${eduBlock(p.education, "학력 (Education)")}
        ${eduBlock(p.careers, "주요 경력 (Academic Careers)")}
        ${societies(p.societies)}
        ${media(p.media)}
        <div style="margin-top:1.6rem">${committees(p.committees)}</div>
      </div>`;
  }

  /* ====================================================================
     MEMBERS
     ==================================================================== */
  async function renderMembers() {
    const site = await fetchData("site");
    mountChrome(site);
    const data = await fetchData("members");
    const root = $("#members-root");
    if (!data || !Array.isArray(data.members)) { setState(root, "구성원 정보를 불러오지 못했습니다."); return; }
    const M = data.members;

    const initials = (m) => {
      const en = (m.name_en || m.name_ko || "?").trim();
      return en.charAt(0).toUpperCase();
    };
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

    const group = (label, items, render) => {
      if (!items.length) return "";
      return `<div class="group-head"><h3>${esc(label)}</h3><span class="count">${items.length}명</span></div>
        <div class="people-grid">${items.map(render).join("")}</div>`;
    };

    const cur = M.filter(m => m.group === "current");
    const alu = M.filter(m => m.group === "alumni");
    const byLevel = (list, lv) => list.filter(m => (m.level || "").toLowerCase().startsWith(lv));

    let html = `<div class="section" style="padding-top:2.5rem">
      <div class="section__head" style="margin-bottom:1rem"><span class="section__eyebrow">Current</span>
      <h2 class="section__title">현재 구성원</h2></div>`;
    html += group("박사과정 (Ph.D. Students)", byLevel(cur, "ph"), card, "current");
    html += group("석사과정 (Master's Students)", byLevel(cur, "master").concat(byLevel(cur, "m.s")), card, "current");
    html += group("학부연구생 (Undergraduate)", byLevel(cur, "under"), card, "current");
    html += `</div>`;

    html += `<div class="section section--muted">
      <div class="section__head" style="margin-bottom:1rem"><span class="section__eyebrow">Alumni</span>
      <h2 class="section__title">졸업생</h2></div>`;
    html += group("박사 (Ph.D.)", byLevel(alu, "ph"), card);
    html += group("석사 (Master's)", byLevel(alu, "master").concat(byLevel(alu, "m.s")), card);
    html += group("학사 (Bachelor's)", byLevel(alu, "bach"), card);
    html += `</div>`;

    root.innerHTML = html;
  }

  /* ====================================================================
     Generic category-filtered reference renderer
     ==================================================================== */
  function buildSubnav(container, cats, onPick) {
    const all = ["전체"].concat(cats);
    container.innerHTML = all.map((c, i) =>
      `<button data-cat="${i === 0 ? "" : esc(c)}" class="${i === 0 ? "active" : ""}">${esc(c)}</button>`).join("");
    container.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      $$("button", container).forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      onPick(b.dataset.cat);
    });
  }

  /* ----- PUBLICATIONS ----- */
  async function renderPublications() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("publications");
    const root = $("#pub-root"); const nav = $("#pub-subnav");
    if (!data || !Array.isArray(data.publications)) { setState(root, "논문 정보를 불러오지 못했습니다."); return; }
    const order = ["International", "Domestic", "Other", "Books"];
    const labelMap = { International: "International Journals & Proceedings", Domestic: "국내 논문", Other: "기타", Books: "저서" };
    const items = data.publications;
    const cats = order.filter(c => items.some(i => i.category === c));

    const draw = (cat) => {
      const groups = cat ? [cat] : cats;
      root.innerHTML = groups.map(g => {
        const list = items.filter(i => i.category === g);
        if (!list.length) return "";
        const lis = list.map(i => {
          const sci = i.sci ? `<span class="badge badge--sci">SCI급</span>` : "";
          const link = i.link ? ` <a class="link" href="${esc(i.link)}" target="_blank" rel="noopener">[link]</a>` : "";
          return `<li class="ref-item"><div><p class="title">${linkify(i.citation || i.title || "")}${sci}${link}</p>
            ${i.venue ? `<p class="meta">${esc(i.venue)}</p>` : ""}</div></li>`;
        }).join("");
        return `<div class="group-head"><h3>${esc(labelMap[g] || g)}</h3><span class="count">${list.length}</span></div>
          <ol class="ref-list">${lis}</ol>`;
      }).join("");
    };
    buildSubnav(nav, cats.map(c => labelMap[c] ? c : c), () => {});
    // override subnav to use raw category values
    nav.innerHTML = ["전체"].concat(cats).map((c, i) =>
      `<button data-cat="${i === 0 ? "" : esc(c)}" class="${i === 0 ? "active" : ""}">${i === 0 ? "전체" : esc(labelMap[c] || c)}</button>`).join("");
    nav.onclick = (e) => { const b = e.target.closest("button"); if (!b) return;
      $$("button", nav).forEach(x => x.classList.remove("active")); b.classList.add("active"); draw(b.dataset.cat); };
    draw("");
  }

  /* ----- CONFERENCES ----- */
  async function renderConferences() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("conferences");
    const root = $("#conf-root"); const nav = $("#conf-subnav");
    if (!data || !Array.isArray(data.conferences)) { setState(root, "학술대회 정보를 불러오지 못했습니다."); return; }
    const items = data.conferences;
    const cats = ["International", "Domestic"].filter(c => items.some(i => i.category === c));
    const labelMap = { International: "International", Domestic: "Domestic (국내)" };

    const draw = (cat) => {
      const groups = cat ? [cat] : cats;
      root.innerHTML = groups.map(g => {
        const list = items.filter(i => i.category === g);
        if (!list.length) return "";
        const lis = list.map(i => `<li class="ref-item"><div>
          <p class="title">${esc(i.title || "")}</p>
          <p class="meta">${esc(i.conference || "")}${i.date ? ` · ${esc(i.date)}` : ""}</p></div></li>`).join("");
        return `<div class="group-head"><h3>${esc(labelMap[g] || g)}</h3><span class="count">${list.length}</span></div>
          <ol class="ref-list">${lis}</ol>`;
      }).join("");
    };
    nav.innerHTML = ["전체"].concat(cats).map((c, i) =>
      `<button data-cat="${i === 0 ? "" : esc(c)}" class="${i === 0 ? "active" : ""}">${i === 0 ? "전체" : esc(labelMap[c] || c)}</button>`).join("");
    nav.onclick = (e) => { const b = e.target.closest("button"); if (!b) return;
      $$("button", nav).forEach(x => x.classList.remove("active")); b.classList.add("active"); draw(b.dataset.cat); };
    draw("");
  }

  /* ----- PROJECTS ----- */
  async function renderProjects() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("projects");
    const root = $("#proj-root");
    if (!data || !Array.isArray(data.projects)) { setState(root, "프로젝트 정보를 불러오지 못했습니다."); return; }
    const lis = data.projects.map(p => `<div class="proj-item">
      <div class="period">${esc(p.period || "")}</div>
      <div><div class="title">${esc(p.title || "")}</div>${p.org ? `<div class="org">${esc(p.org)}</div>` : ""}</div>
    </div>`).join("");
    root.innerHTML = `<div class="group-head"><h3>연구 프로젝트</h3><span class="count">${data.projects.length}건</span></div>${lis}`;
  }

  /* ----- PATENTS ----- */
  async function renderPatents() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("patents");
    const root = $("#patent-root");
    if (!data || !Array.isArray(data.patents)) { setState(root, "특허 정보를 불러오지 못했습니다."); return; }
    const order = ["Application", "Registration", "Software"];
    const labelMap = { Application: "출원 (Application)", Registration: "등록 (Registration)", Software: "프로그램·저작권 (Software)" };
    const cats = order.filter(c => data.patents.some(p => p.category === c));
    root.innerHTML = cats.map(c => {
      const list = data.patents.filter(p => p.category === c);
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
  }

  /* ----- AWARDS ----- */
  async function renderAwards() {
    const site = await fetchData("site"); mountChrome(site);
    const data = await fetchData("awards");
    const root = $("#award-root");
    if (!data || !Array.isArray(data.awards)) { setState(root, "수상 정보를 불러오지 못했습니다."); return; }
    const lis = data.awards.map(a => `<div class="award-item">
      <div class="date">${esc(a.date || "")}</div>
      <div>
        <div class="title">${esc(a.title_ko || a.title || "")}</div>
        ${a.title_en ? `<div class="en">${esc(a.title_en)}</div>` : ""}
        ${a.venue ? `<div class="venue">🏆 ${esc(a.venue)}</div>` : ""}
      </div>
    </div>`).join("");
    root.innerHTML = `<div class="group-head"><h3>수상 실적</h3><span class="count">${data.awards.length}건</span></div>${lis}`;
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
    home: renderHome, news: renderNews, professor: renderProfessor, members: renderMembers,
    projects: renderProjects, publications: renderPublications,
    conferences: renderConferences, patents: renderPatents, awards: renderAwards,
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
