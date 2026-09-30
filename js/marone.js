/* MARONE 1881 — interazioni (vanilla, ~4 kB) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nativeTimeline = CSS.supports("animation-timeline", "view()");

  /* ---------- altezza reale dell'header -> --head-h ---------- */
  const head = $(".hd");
  if (head) {
    const setH = () => {
      const h = Math.round(head.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--head-h", h + "px");
    };
    setH();
    addEventListener("resize", setH, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(setH);
    addEventListener("load", setH);
  }

  /* ---------- header: si nasconde scendendo, riappare salendo ---------- */
  const hd = $(".hd");
  if (hd) {
    let last = 0, ticking = false;
    const onScroll = () => {
      const y = Math.max(0, scrollY);
      hd.classList.toggle("hd--float", y > 8);
      if (!$("body").classList.contains("nav-open")) {
        hd.classList.toggle("hd--hidden", y > last && y > 240);
      }
      last = y; ticking = false;
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  }

  /* ---------- menu mobile ---------- */
  const burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("no-scroll", open);
      if (open) hd.classList.remove("hd--hidden");
    });
    $$(".hd__nav a").forEach(a => a.addEventListener("click", () => {
      document.body.classList.remove("nav-open", "no-scroll");
      burger.setAttribute("aria-expanded", "false");
    }));
  }

  /* ---------- selettore lingua ---------- */
  $$(".lang").forEach(box => {
    const btn = $(".lang__btn", box);
    btn.addEventListener("click", e => {
      e.stopPropagation();
      const open = box.dataset.open !== "true";
      box.dataset.open = String(open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  addEventListener("click", () => $$('.lang[data-open="true"]').forEach(b => {
    b.dataset.open = "false"; $(".lang__btn", b).setAttribute("aria-expanded", "false");
  }));
  addEventListener("keydown", e => { if (e.key === "Escape") {
    $$('.lang[data-open="true"]').forEach(b => b.dataset.open = "false");
    if (document.body.classList.contains("nav-open")) burger?.click();
  }});

  /* ---------- rivelazione al scroll (fallback) ---------- */
  const revealables = $$(".js-reveal");
  if (revealables.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      revealables.forEach(el => el.classList.add("is-in"));
    } else {
      const io = new IntersectionObserver((entries, obs) => {
        entries.forEach(en => {
          if (en.isIntersecting) { en.target.classList.add("is-in"); obs.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
      revealables.forEach(el => io.observe(el));
    }
  }

  /* ---------- parallasse + dissolvenza pannelli (solo se manca view()) ---------- */
  const panels = $$(".panel__sticky");
  if (panels.length && !nativeTimeline && !reduced) {
    let raf = false;
    const tick = () => {
      const vh = innerHeight;
      panels.forEach(p => {
        const r = p.getBoundingClientRect();
        if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) return;
        // 0 quando il pannello entra dal basso, 1 quando esce in alto
        const prog = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        const img = p.querySelector(".panel__media img");
        if (img) img.style.transform = `scale(1.14) translate3d(0, ${(prog - 0.5) * 6.4}%, 0)`;
        const c = p.querySelector(".panel__content");
        if (c) {
          const inn = Math.min(1, prog / 0.30);
          const out = Math.min(1, Math.max(0, (prog - 0.74) / 0.26));
          c.style.opacity = String(Math.max(0.06, inn - out * 0.94));
          c.style.transform = `translate3d(0, ${(1 - inn) * 42 - out * 30}px, 0)`;
        }
      });
      raf = false;
    };
    const req = () => { if (!raf) { raf = true; requestAnimationFrame(tick); } };
    addEventListener("scroll", req, { passive: true });
    addEventListener("resize", req);
    tick();
  }

  /* ---------- indicatore di sezione ---------- */
  const dots = $(".dots");
  if (dots && !reduced) {
    const secs = $$("[data-panel]");
    if (secs.length > 1) {
      secs.forEach((s, i) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", s.dataset.panel || `Sezione ${i + 1}`);
        b.addEventListener("click", () => s.scrollIntoView({ behavior: "smooth", block: "start" }));
        dots.appendChild(b);
      });
      const btns = $$("button", dots);
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (en.isIntersecting) {
            const i = secs.indexOf(en.target);
            btns.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
          }
        });
      }, { threshold: 0.55 });
      secs.forEach(s => io.observe(s));
    } else { dots.remove(); }
  }

  /* ---------- store locator ---------- */
  const finder = $("#store-finder");
  if (finder) {
    const list = $("#store-list");
    const all = [...list.children];
    finder.addEventListener("submit", e => {
      e.preventDefault();
      const q = ($("#sl-city", finder)?.value || "").trim().toLowerCase();
      const rad = parseFloat($("#sl-radius", finder)?.value || "0");
      let shown = 0;
      all.forEach(li => {
        const txt = (li.textContent || "").toLowerCase();
        const d = parseFloat(li.dataset.dist || "0");
        const ok = (!q || txt.includes(q)) && (!rad || d <= rad);
        li.hidden = !ok; if (ok) shown++;
      });
      const empty = $("#store-empty");
      if (empty) empty.hidden = shown > 0;
    });
  }

  /* ---------- anno corrente ---------- */
  $$("[data-year]").forEach(el => el.textContent = String(new Date().getFullYear()));
})();
