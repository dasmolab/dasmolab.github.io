/* ==========================================================================
   DASMOLabs site script — ENGLISH edition (no build step).
   Mirror of /assets/js/app.js with English UI strings.

   Data: fetches /data/en/<name>.json (translated prose) and falls back to
   /data/<name>.json (academic records kept in their original form:
   publications / conferences / patents / awards). Asset & data paths are
   resolved one level up because these pages live under /en/.
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

  // Sub-tabs shown in each main tab's hover dropdown. Same `key`s as the Korean
  // site so behaviour is identical; only the labels are translated. News keys
  // are the English category values used in /data/en/news.json.
  const SUBNAV = {
    "index.html": [
      { label: "About the Lab", key: "about" },
      { label: "Research",      key: "research" },
      { label: "Courses",       key: "classes" },
    ],
    "news.html": [
      { label: "All",         key: "all" },
      { label: "Conference",  key: "Conference" },
      { label: "Seminar",     key: "Seminar" },
      { label: "Lab Meeting", key: "Lab Meeting" },
    ],
    "people.html": [
      { label: "Professor",         key: "professor" },
      { label: "Current Members",   key: "current" },
      { label: "Alumni",            key: "alumni" },
      { label: "Join Us",           key: "apply" },
    ],
    "research.html": [
      { label: "Research Areas", key: "areas" },
      { label: "Projects",       key: "projects" },
    ],
    "publications.html": [
      { label: "Papers",       key: "papers" },
      { label: "Conferences",  key: "conferences" },
    ],
    "achievements.html": [
      { label: "Patents", key: "patents" },
      { label: "Awards",  key: "awards" },
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
  function escMultiline(s) { return esc(s).replace(/\n/g, "<br>"); }

  // resolve an image/asset path; en/ pages are one level deep, so add "../"
  function imgSrc(p) {
    if (!p) return "";
    if (/^https?:\/\//.test(p)) return p;
    return "../" + p.replace(/^\/+/, "");
  }

  function linkify(text) {
    const safe = esc(text);
    return safe.replace(/(https?:\/\/[^\s)]+)([)\s]|$)/g, function (m, url, tail) {
      return '<a href="' + url + '" target="_blank" rel="noopener">' + url + "</a>" + tail;
    });
  }
  function richText(s) { return linkify(s).replace(/\n/g, "<br>"); }

  function fmtDate(d) { return String(d == null ? "" : d).slice(0, 10).replace(/-/g, "."); }

  function photoSrc(p) { return imgSrc(typeof p === "string" ? p : (p && (p.image || p.src)) || ""); }
  function firstPhoto(arr) { return Array.isArray(arr) && arr.length ? photoSrc(arr[0]) : ""; }

  // Translated prose lives in /data/en/; academic records fall back to /data/.
  async function fetchData(name) {
    for (const path of ["../data/en/" + name + ".json", "../data/" + name + ".json"]) {
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
    // language switch → Korean counterpart page (or KO home for legacy pages)
    const koHref = NAV.some(n => n.href === here) ? "../" + here : "../index.html";
    const langItem = `<li class="nav__lang"><a class="lang-switch" href="${koHref}" hreflang="ko" lang="ko" aria-label="한국어로 보기">한국어</a></li>`;
    const abbr = (site && site.lab_abbr) || "DASMOLabs";
    const en   = (site && site.lab_name_en) || "Dong-A Smart Mobility Laboratory";
    const logo = (site && site.logo) ? imgSrc(site.logo) : "../assets/img/logo_231027.jpg";
    return `
      <a class="skip-link" href="#main">Skip to main content</a>
      <header class="site-header">
        <nav class="nav wrap" aria-label="Main menu">
          <a class="brand" href="index.html">
            <img src="${logo}" alt="${esc(abbr)} logo" onerror="this.style.display='none'">
            <span class="brand__txt"><b>${esc(abbr)}</b><span>${esc(en)}</span></span>
          </a>
          <button class="nav__toggle" aria-label="Open menu" aria-expanded="false" aria-controls="navmenu">
            <span></span><span></span><span></span>
          </button>
          <ul class="nav__links" id="navmenu">${links}${langItem}</ul>
        </nav>
      </header>`;
  }

  function buildFooter(site) {
    const abbr = (site && site.lab_abbr) || "DASMOLabs";
    const en   = (site && site.lab_name_en) || "Dong-A Smart Mobility Laboratory";
    const addr = (site && site.address) || "Room 1404, Engineering Building 1, Seunghak Campus, Dong-A University, Saha-gu, Busan";
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
            <p style="font-size:.88rem;">Intelligent Transportation Systems (ITS) · Smart Mobility · MaaS research</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <ul class="footer-links">${navLinks}</ul>
          </div>
          <div>
            <h4>Contact</h4>
            <p class="footer-contact">
              ${esc(addr)}<br>
              TEL. ${esc(tel)}<br>
              <a href="mailto:${esc((email || "").split(",")[0].trim())}">${esc(email)}</a>
            </p>
          </div>
        </div>
        <div class="wrap footer-bottom">
          <span>© ${year} ${esc(en)}. All rights reserved.</span>
          <a class="edit-link" href="../admin/" title="Only authorized administrators can log in to edit">🔒 Site admin (login)</a>
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
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
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

    const introEl = $("#home-intro");
    if (introEl) {
      const parts = [site.intro1, site.intro2].filter(Boolean).map(t => `<p>${escMultiline(t)}</p>`).join("");
      introEl.innerHTML = parts;
    }

    const topicsEl = $("#home-topics");
    if (topicsEl) topicsEl.innerHTML = buildResearchTopics(site);

    const clsEl = $("#home-classes");
    if (clsEl) {
      const u = Array.isArray(site.classes_undergrad) ? site.classes_undergrad.join(", ") : (site.classes_undergrad || "");
      const g = Array.isArray(site.classes_grad) ? site.classes_grad.join(", ") : (site.classes_grad || "");
      clsEl.innerHTML =
        `<div class="card"><div class="card__icon">🎓</div><h3>Undergraduate</h3><p>${esc(u)}</p></div>
         <div class="card"><div class="card__icon">📚</div><h3>Graduate</h3><p>${esc(g)}</p></div>`;
    }

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

    const news = await fetchData("news");
    if (news && Array.isArray(news.news)) {
      const sorted = news.news.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
      const recruits = sorted.filter(n => n.category === "Recruiting");
      const posts = sorted.filter(n => n.category !== "Recruiting");

      const recEl = $("#home-recruit");
      if (recEl && recruits.length) {
        const r = recruits[0];
        recEl.innerHTML = `<div class="wrap" style="margin-top:1.6rem">
          <a class="recruit-bar" href="people.html#apply">
            <span class="recruit-bar__icon">👩‍🎓</span>
            <span class="recruit-bar__txt"><b>Now recruiting</b> — ${esc(r.title || "")}</span>
            <span class="recruit-bar__cta">Learn more →</span>
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
              <div class="newscard__meta"><span class="news-date">${esc(fmtDate(n.date))}</span> · ${esc(n.category || "Other")}</div>
              <div class="newscard__title">${esc(n.title || "")}</div>
            </div></a>`;
        }).join("");
        newsEl.innerHTML = `<section class="section" style="padding-bottom:0">
          <div class="wrap">
            <div class="section__head" style="margin-bottom:1.6rem">
              <span class="section__eyebrow">News</span>
              <h2 class="section__title">Latest News</h2>
            </div>
            <div class="grid grid--3">${cards}</div>
            <div style="text-align:center;margin-top:1.8rem">
              <a class="btn btn--primary" href="news.html">View all news →</a>
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

  function buildProfessor(p) {
    if (!p) return '<div class="state">Could not load professor information.</div>';
    const photo = imgSrc(p.photo) || "../assets/uploads/prof.jpg";
    const emailLinks = (p.email || "").split(",").map(e => e.trim()).filter(Boolean)
      .map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(", ");
    const head = `
      <div class="prof-head">
        <div class="prof-photo"><img src="${photo}" alt="Professor ${esc(p.name_en || p.name_ko)}" onerror="this.src='../assets/uploads/prof.jpg'"></div>
        <div>
          <h2 class="prof-name">${esc(p.name_en || p.name_ko)}<small>${esc(p.name_ko || "")}</small></h2>
          <div class="prof-title">${esc(p.title || "")}</div>
          <ul class="prof-contact">
            ${p.fields ? `<li><b>Field</b> ${esc(p.fields)}</li>` : ""}
            ${p.phone ? `<li><b>Lab</b> ${esc(p.phone)}</li>` : ""}
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
      return `<div class="group-head"><h3>Academic Societies</h3><span class="count">${arr.length}</span></div>
        <ul class="deflist">${items}</ul>`;
    };
    const media = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const items = arr.map(m => {
        const t = m.url ? `<a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.title)}</a>` : esc(m.title);
        return `<li>${m.date ? `<span class="date">${esc(m.date)}</span> ` : ""}${t}</li>`;
      }).join("");
      return `<div class="group-head"><h3>Media</h3><span class="count">${arr.length}</span></div>
        <ul class="media-list">${items}</ul>`;
    };
    const committees = (arr) => {
      if (!Array.isArray(arr) || !arr.length) return "";
      const items = arr.map(c => {
        if (typeof c === "string") return `<li><span class="v">${esc(c)}</span></li>`;
        return `<li><span class="k">${esc(c.period || "")}</span><span class="v">${esc(c.name || "")}</span></li>`;
      }).join("");
      return `<details class="collapse">
        <summary>External Committees · ${arr.length}</summary>
        <div class="collapse__body"><ul class="deflist">${items}</ul></div>
      </details>`;
    };
    return head +
      `<div style="margin-top:2.2rem">
        ${eduBlock(p.education, "Education")}
        ${eduBlock(p.careers, "Academic Careers")}
        ${societies(p.societies)}
        ${media(p.media)}
        <div style="margin-top:1.6rem">${committees(p.committees)}</div>
      </div>`;
  }

  // Members grids — `which` is "current" or "alumni"
  function buildMembers(M, which) {
    if (!Array.isArray(M)) return '<div class="state">Could not load member information.</div>';
    const initials = (m) => (m.name_en || m.name_ko || "?").trim().charAt(0).toUpperCase();
    const card = (m) => {
      const photo = imgSrc(m.photo);
      const pic = photo
        ? `<div class="person__photo" style="background-image:url('${photo}')" role="img" aria-label="${esc(m.name_en || m.name_ko)}"></div>`
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
          <div class="person__name">${esc(m.name_en || m.name_ko)}<small>${esc(m.name_ko || "")}</small></div>
          ${meta.length ? `<div class="person__meta">${meta.join("<br>")}</div>` : ""}
          ${thesis}
          ${email}
        </div>
      </article>`;
    };
    const group = (label, items) => {
      if (!items.length) return "";
      return `<div class="group-head"><h3>${esc(label)}</h3><span class="count">${items.length}</span></div>
        <div class="people-grid">${items.map(card).join("")}</div>`;
    };
    const byLevel = (list, lv) => list.filter(m => (m.level || "").toLowerCase().startsWith(lv));
    if (which === "alumni") {
      const alu = M.filter(m => m.group === "alumni");
      return group("Ph.D.", byLevel(alu, "ph"))
        + group("Master's", byLevel(alu, "master").concat(byLevel(alu, "m.s")))
        + group("Bachelor's", byLevel(alu, "bach"));
    }
    const cur = M.filter(m => m.group === "current");
    return group("Ph.D. Students", byLevel(cur, "ph"))
      + group("Master's Students", byLevel(cur, "master").concat(byLevel(cur, "m.s")))
      + group("Undergraduate Researchers", byLevel(cur, "under"));
  }

  // Application guide (People → Join Us). Pre-fills an email to the advisor.
  function buildApply(prof) {
    const emails = ((prof && prof.email) || "hoekim@dau.ac.kr")
      .split(",").map(e => e.trim()).filter(Boolean);
    const primary = emails[0] || "hoekim@dau.ac.kr";
    const profName = (prof && prof.name_en) ? "Professor " + prof.name_en : "the advisor";
    const fields = [
      ["Full name", "Korean / English, e.g. 홍길동 / Hong Gildong"],
      ["Date of birth (age)", "e.g. 2000.01.01 (age 25)"],
      ["Phone", "Mobile number"],
      ["E-mail", "Address for our reply"],
      ["Current affiliation", "School · department · year (or graduation status)"],
      ["Desired program", "M.S. / Ph.D. / Integrated M.S.–Ph.D. / Undergraduate researcher"],
      ["Research interests", "ITS · autonomous driving · smart mobility · traffic safety, etc."],
      ["Motivation", "Brief self-introduction and motivation"],
      ["Attachments", "CV · transcript, etc. (optional)"],
    ];
    const rows = fields.map(([k, v]) =>
      `<li><span class="k">${esc(k)}</span><span class="v">${esc(v)}</span></li>`).join("");
    const subject = "[DASMOLabs Application] Name / Desired program";
    const bodyTmpl = [
      "Full name (Korean/English): ", "Date of birth (age): ", "Phone: ", "E-mail: ",
      "Current affiliation (school/department/year): ", "Desired program (M.S./Ph.D./Undergraduate researcher): ",
      "Research interests: ", "Motivation: ", "",
      "* Please attach your CV, transcript, etc. as files.",
    ].join("\n");
    const href = `mailto:${primary}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTmpl)}`;
    const mailLinks = emails.map(e => `<a href="mailto:${esc(e)}">${esc(e)}</a>`).join(", ");
    return `<div style="max-width:760px;margin:0 auto">
      <p style="font-size:1.04rem">We welcome prospective graduate students (M.S./Ph.D.) and undergraduate
        researchers interested in transportation engineering, Intelligent Transportation Systems (ITS), and
        smart mobility. Please complete the items below and email them to
        <b>${esc(profName)}</b>; we will review your application and reply.</p>
      <div class="group-head"><h3>What to include</h3></div>
      <ul class="deflist">${rows}</ul>
      <div class="apply-cta">
        <p style="margin:0 0 .9rem;color:var(--text-soft)">Click the button below to open a pre-filled email.</p>
        <a class="btn btn--primary" href="${href}">✉️ Apply by email</a>
        <p style="margin:.9rem 0 0;font-size:.92rem">Inquiries · submissions: ${mailLinks}</p>
      </div>
    </div>`;
  }

  /* ====================================================================
     Filter engine — category chips + year dropdown shared by the
     reference-list tabs (Publications / Achievements / Research projects).
     ==================================================================== */
  const FILTERS = {};
  let _fbSeq = 0;

  function yearIn(s) { const m = String(s == null ? "" : s).match(/(?:19|20)\d{2}/); return m ? m[0] : ""; }
  function pubYear(citation) {
    const s = String(citation == null ? "" : citation);
    const p = s.match(/\(((?:19|20)\d{2})\)/);
    return p ? p[1] : yearIn(s);
  }
  function presentCats(items, order, labels) {
    return order.filter(k => items.some(i => i.category === k))
                .map(k => ({ key: k, label: labels[k] || k }));
  }

  function filterBlock(cfg) {
    const id = "fb" + (++_fbSeq);
    FILTERS[id] = cfg;
    const years = Array.from(new Set(cfg.items.map(cfg.getYear).filter(Boolean)))
      .sort((a, b) => Number(b) - Number(a));
    const rows = [];
    if (cfg.cats && cfg.cats.length) {
      const chips = [{ key: "", label: "All" }].concat(cfg.cats).map((c, i) =>
        `<button type="button" class="fchip${i === 0 ? " active" : ""}" data-cat="${esc(c.key)}">${esc(c.label)}</button>`
      ).join("");
      rows.push(`<div class="fbar__row"><span class="fbar__label">Category</span>${chips}</div>`);
    }
    if (years.length) {
      const opts = `<option value="">All Years</option>` +
        years.map(y => `<option value="${esc(y)}">${esc(y)}</option>`).join("");
      rows.push(`<div class="fbar__row"><span class="fbar__label">Year</span>` +
        `<select class="fyear" aria-label="Filter by year">${opts}</select></div>`);
    }
    const bar = rows.length ? `<div class="fbar" data-fb="${id}">${rows.join("")}</div>` : "";
    return bar + `<div class="fbar__list" data-fb-list="${id}">${cfg.render(cfg.items)}</div>`;
  }

  function applyFilter(id) {
    const cfg = FILTERS[id]; if (!cfg) return;
    const bar = document.querySelector('.fbar[data-fb="' + id + '"]');
    const listEl = document.querySelector('.fbar__list[data-fb-list="' + id + '"]');
    if (!listEl) return;
    const chip = bar ? bar.querySelector(".fchip.active") : null;
    const cat = chip ? (chip.dataset.cat || "") : "";
    const sel = bar ? bar.querySelector(".fyear") : null;
    const year = sel ? sel.value : "";
    let list = cfg.items;
    if (cat)  list = list.filter(i => cfg.getCat(i) === cat);
    if (year) list = list.filter(i => String(cfg.getYear(i)) === year);
    listEl.innerHTML = list.length ? cfg.render(list)
      : '<div class="state">No items match the selected filters.</div>';
  }

  function wireFilters(root) {
    if (!root || root._fbWired) return;
    root._fbWired = true;
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
  }

  function buildProjects(projects) {
    if (!Array.isArray(projects)) return "";
    return projects.map(p => `<div class="proj-item">
      <div class="period">${esc(p.period || "")}</div>
      <div><div class="title">${esc(p.title || "")}</div>${p.org ? `<div class="org">${esc(p.org)}</div>` : ""}</div>
    </div>`).join("");
  }

  // Publications grouped by category (academic records — citations kept as recorded)
  function buildPublications(items) {
    const order = ["International", "Domestic", "Other", "Books"];
    const labelMap = { International: "International Journals & Proceedings", Domestic: "Domestic Journals", Other: "Other", Books: "Books" };
    const html = order.filter(g => items.some(i => i.category === g)).map(g => {
      const list = items.filter(i => i.category === g);
      const lis = list.map(i => {
        const sci = i.sci ? `<span class="badge badge--sci">SCI</span>` : "";
        const link = i.link ? ` <a class="link" href="${esc(i.link)}" target="_blank" rel="noopener">[link]</a>` : "";
        return `<li class="ref-item"><div><p class="title">${linkify(i.citation || i.title || "")}${sci}${link}</p>
          ${i.venue ? `<p class="meta">${esc(i.venue)}</p>` : ""}</div></li>`;
      }).join("");
      return `<div class="group-head"><h3>${esc(labelMap[g] || g)}</h3><span class="count">${list.length}</span></div>
        <ol class="ref-list">${lis}</ol>`;
    }).join("");
    return html || '<div class="state">No publications yet.</div>';
  }

  // Conferences grouped by category. Domestic titles are stored "Korean / English";
  // show the English half on the English site.
  function buildConferences(items) {
    const labelMap = { International: "International", Domestic: "Domestic" };
    const engTitle = (t) => {
      t = t || "";
      return t.indexOf(" / ") !== -1 ? t.split(" / ").slice(1).join(" / ") : t;
    };
    const html = ["International", "Domestic"].filter(g => items.some(i => i.category === g)).map(g => {
      const list = items.filter(i => i.category === g);
      const lis = list.map(i => `<li class="ref-item"><div>
        <p class="title">${esc(engTitle(i.title))}</p>
        <p class="meta">${esc(i.conference || "")}${i.date ? ` · ${esc(i.date)}` : ""}</p></div></li>`).join("");
      return `<div class="group-head"><h3>${esc(labelMap[g] || g)}</h3><span class="count">${list.length}</span></div>
        <ol class="ref-list">${lis}</ol>`;
    }).join("");
    return html || '<div class="state">No conference presentations yet.</div>';
  }

  // Patents tables. Names/inventors are legal records kept in the original;
  // the controlled scope/type vocab is mapped to English for readability.
  function buildPatents(patents) {
    const SCOPE = { "국내": "Domestic", "국외": "International" };
    const TYPE = {
      "특허": "Patent", "특허(소프트웨어)": "Patent (Software)",
      "저작권등록(소프트웨어)": "Copyright Registration (Software)",
    };
    const order = ["Application", "Registration", "Software"];
    const labelMap = { Application: "Application", Registration: "Registration", Software: "Software / Copyright" };
    const html = order.filter(c => patents.some(p => p.category === c)).map(c => {
      const list = patents.filter(p => p.category === c);
      const rows = list.map((p, idx) => `<tr>
        <td>${idx + 1}</td>
        <td class="name">${esc(p.name || "")}</td>
        <td>${esc(SCOPE[p.scope] || p.scope || "")}</td>
        <td>${esc(TYPE[p.type] || p.type || "")}</td>
        <td>${esc(p.date || "")}</td>
        <td>${esc(p.number || "")}</td>
        <td>${esc(p.inventors || "")}</td>
      </tr>`).join("");
      return `<div class="group-head"><h3>${esc(labelMap[c] || c)}</h3><span class="count">${list.length}</span></div>
        <div class="table-wrap"><table class="data">
          <thead><tr><th>No.</th><th>Title</th><th>Scope</th><th>Type</th><th>Date</th><th>Number</th><th>Inventors</th></tr></thead>
          <tbody>${rows}</tbody></table></div><div style="height:1.5rem"></div>`;
    }).join("");
    return html || '<div class="state">No patents yet.</div>';
  }

  // Awards list. Prefer the English title; venue kept as recorded.
  function buildAwards(awards) {
    const lis = awards.map(a => `<div class="award-item">
      <div class="date">${esc(a.date || "")}</div>
      <div>
        <div class="title">${esc(a.title_en || a.title_ko || a.title || "")}</div>
        ${a.venue ? `<div class="venue">🏆 ${esc(a.venue)}</div>` : ""}
      </div>
    </div>`).join("");
    return lis || '<div class="state">No awards yet.</div>';
  }

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
      ? buildMembers(M, which) : '<div class="state">Could not load member information.</div>';
    mountSubnav(nav, root, [
      { key: "professor", label: "Professor",
        view: () => head("Professor", "Professor") +
          `<div style="max-width:920px;margin:0 auto">${buildProfessor(profData)}</div>` },
      { key: "current", label: "Current Members",
        view: () => head("Current", "Current Members") + membersOr("current") },
      { key: "alumni", label: "Alumni",
        view: () => head("Alumni", "Alumni") + membersOr("alumni") },
      { key: "apply", label: "Join Us",
        view: () => head("Join Us", "Join Us") + buildApply(profData) },
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
      { key: "areas", label: "Research Areas",
        view: () => topics
          ? `<div class="group-head"><h3>Research Areas</h3></div>
             <div class="grid grid--3" style="margin:1.2rem 0 0">${topics}</div>`
          : '<div class="state">No research areas yet.</div>' },
      { key: "projects", label: "Projects",
        view: () => projects ? filterBlock({
          items: projects, cats: null,
          getCat: () => "", getYear: i => yearIn(i.period),
          render: (list) => `<div class="group-head"><h3>Projects</h3><span class="count">${list.length}</span></div>${buildProjects(list)}`,
        }) : '<div class="state">Could not load project information.</div>' },
    ], "areas");
    wireFilters(root);
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
      { key: "papers", label: `Papers (${pubs.length})`,
        view: () => filterBlock({
          items: pubs,
          cats: presentCats(pubs, ["International", "Domestic", "Other", "Books"],
            { International: "International", Domestic: "Domestic", Other: "Other", Books: "Books" }),
          getCat: i => i.category, getYear: i => pubYear(i.citation),
          render: buildPublications,
        }) },
      { key: "conferences", label: `Conferences (${confs.length})`,
        view: () => filterBlock({
          items: confs,
          cats: presentCats(confs, ["International", "Domestic"],
            { International: "International", Domestic: "Domestic" }),
          getCat: i => i.category, getYear: i => yearIn(i.date),
          render: buildConferences,
        }) },
    ], "papers");
    wireFilters(root);
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
      { key: "patents", label: `Patents (${patents.length})`,
        view: () => filterBlock({
          items: patents,
          cats: presentCats(patents, ["Application", "Registration", "Software"],
            { Application: "Application", Registration: "Registration", Software: "Software" }),
          getCat: i => i.category, getYear: i => yearIn(i.date),
          render: buildPatents,
        }) },
      { key: "awards", label: `Awards (${awards.length})`,
        view: () => filterBlock({
          items: awards, cats: null,
          getCat: () => "", getYear: i => yearIn(i.date),
          render: buildAwards,
        }) },
    ], "patents");
    wireFilters(root);
  }

  /* ====================================================================
     NEWS (conference / seminar / lab-meeting log + recruiting notices)
     ==================================================================== */
  function catEmoji(c) {
    return ({ "Conference": "🎤", "Seminar": "🧑‍🏫", "Lab Meeting": "👥", "Recruiting": "🙋", "Other": "🗒️" })[c] || "🗒️";
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
  function newsCard(n, idx) {
    return `<button class="news-card" type="button" data-idx="${idx}" aria-label="Read more: ${esc(n.title || "")}">
      ${newsThumb(n)}
      <span class="news-card__body">
        <span class="news-card__meta"><span class="news-date">${esc(fmtDate(n.date))}</span> · ${esc(n.category || "Other")}</span>
        <span class="news-card__title">${esc(n.title || "")}</span>
        ${n.body ? `<span class="news-card__excerpt">${esc(newsExcerpt(n.body))}</span>` : ""}
        <span class="news-card__more">Read more →</span>
      </span>
    </button>`;
  }

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
    wrap.setAttribute("aria-label", n.title || "News");
    wrap.innerHTML =
      `<div class="news-modal__backdrop" data-close></div>
       <div class="news-modal__panel">
         <button class="news-modal__close" type="button" data-close aria-label="Close">&times;</button>
         <div class="news-modal__head">
           <span class="news-date">${esc(fmtDate(n.date))}</span>
           <span class="news-cat">${catEmoji(n.category)} ${esc(n.category || "Other")}</span>
         </div>
         <h2 class="news-modal__title">${esc(n.title || "")}</h2>
         ${(Array.isArray(n.photos) && n.photos.length) ? `<div class="news-modal__photos">${newsPhotos(n.photos)}</div>` : ""}
         ${n.body ? `<div class="news-modal__body">${richText(n.body)}</div>` : ""}
         ${n.link ? `<p class="news-link" style="margin-top:1.1rem"><a href="${esc(n.link)}" target="_blank" rel="noopener">Related link →</a></p>` : ""}
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
    if (!data || !Array.isArray(data.news)) { setState(root, "Could not load news."); return; }

    // Recruiting is intentionally NOT shown on News — prospective students are
    // directed to People → Join Us (linked from the Home recruit bar).
    const posts = data.news.slice()
      .filter(n => n.category !== "Recruiting")
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    const order = ["Conference", "Seminar", "Lab Meeting", "Other"];
    const cats = order.filter(c => posts.some(p => p.category === c));
    posts.forEach(p => { if (p.category && p.category !== "Recruiting" && cats.indexOf(p.category) === -1) cats.push(p.category); });

    const draw = (cat) => {
      if (nav) $$("button", nav).forEach(x => x.classList.toggle("active", (x.dataset.cat || "") === (cat || "")));
      const list = cat ? posts.filter(p => p.category === cat) : posts;
      if (!list.length) { root.innerHTML = `<div class="state">No news yet.</div>`; return; }
      root.innerHTML = `<div class="news-list">${list.map(n => newsCard(n, posts.indexOf(n))).join("")}</div>`;
    };
    root.addEventListener("click", (e) => {
      const card = e.target.closest(".news-card"); if (!card) return;
      const idx = parseInt(card.dataset.idx, 10);
      if (!isNaN(idx) && posts[idx]) openNewsModal(posts[idx]);
    });
    const catFromHash = () => {
      const h = decodeURIComponent((location.hash || "").replace(/^#/, ""));
      return (h && h !== "all" && cats.indexOf(h) !== -1) ? h : "";
    };

    if (nav) {
      nav.innerHTML = ["All"].concat(cats).map((c, i) =>
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
    else { fetchData("site").then(mountChrome); }
  });
})();
