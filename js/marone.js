/* MARONE 1881 — interazioni (vanilla, ~4 kB) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const SCRIPT_SRC = (document.currentScript && document.currentScript.src) || "";
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

  /* ---------- store locator (AJAX: punti vendita in base alla distanza) ---------- */
  const finder = $("#store-finder");
  if (finder) {
    const list = $("#store-list");
    const empty = $("#store-empty");
    const cityInput = $("#sl-city", finder);
    const radiusSel = $("#sl-radius", finder);
    const submitBtn = $("button[type=submit]", finder) || $(".btn", finder);

    /* URL di store-list.json derivato dalla posizione dello script (funziona a ogni profondità) */
    const storesUrl = SCRIPT_SRC ? new URL("../store-list.json", SCRIPT_SRC).href : "../store-list.json";

    /* messaggi UI nella lingua della pagina */
    const lang = (document.documentElement.lang || "it").slice(0, 2).toLowerCase();
    const i18n = {
      it: { enterCity: "Inserisci una città.", searching: "Ricerca in corso…", cityNotFound: "Città non trovata.", error: "Si è verificato un errore. Riprova tra poco." },
      en: { enterCity: "Please enter a city.", searching: "Searching…", cityNotFound: "City not found.", error: "Something went wrong. Please try again later." },
      fr: { enterCity: "Veuillez saisir une ville.", searching: "Recherche en cours…", cityNotFound: "Ville introuvable.", error: "Une erreur s'est produite. Veuillez réessayer plus tard." },
      de: { enterCity: "Bitte geben Sie eine Stadt ein.", searching: "Suche läuft…", cityNotFound: "Stadt nicht gefunden.", error: "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut." },
      es: { enterCity: "Introduce una ciudad.", searching: "Buscando…", cityNotFound: "Ciudad no encontrada.", error: "Se ha producido un error. Inténtalo de nuevo más tarde." },
      ja: { enterCity: "都市を入力してください。", searching: "検索中…", cityNotFound: "都市が見つかりません。", error: "エラーが発生しました。しばらくしてからもう一度お試しください。" }
    };
    const t = i18n[lang] || i18n.it;

    /* testo localizzato "nessun risultato" già presente nella pagina */
    const noResultsText = (empty ? empty.textContent : "").trim();

    if (empty) { empty.setAttribute("role", "status"); empty.setAttribute("aria-live", "polite"); }
    const setMessage = text => {
      if (!empty) return;
      if (text) { empty.textContent = text; empty.hidden = false; }
      else { empty.textContent = noResultsText; empty.hidden = true; }
    };

    const parseGps = store => {
      if (!store || typeof store !== "object") return null;
      if (store.gps && typeof store.gps === "object") {
        const lat = Number(store.gps.lat), lon = Number(store.gps.lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
      }
      if (typeof store.gps === "string") {
        const p = store.gps.split(",");
        const lat = Number((p[0] || "").trim()), lon = Number((p[1] || "").trim());
        if (Number.isFinite(lat) && Number.isFinite(lon)) return { lat, lon };
      }
      const lat = Number(store.lat), lon = Number(store.lon);
      return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
    };
    const haversineKm = (lat1, lon1, lat2, lon2) => {
      const rad = Math.PI / 180;
      const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
      return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const buildAddress = s => {
      const locality = [(s.city || "").trim(), s.region ? `(${String(s.region).trim()})` : "", (s.zipcode || "").trim()].filter(Boolean).join(" ");
      return [(s.address || "").trim(), locality, (s.state || "").trim()].filter(Boolean).join(" — ");
    };

    const render = shops => {
      list.innerHTML = "";
      for (const s of shops) {
        const li = document.createElement("li");
        li.className = "store";
        li.dataset.dist = s.distance.toFixed(1);

        const dist = document.createElement("span");
        dist.className = "dist";
        dist.textContent = `${s.distance.toFixed(1)} KM`;

        const name = document.createElement("h3");
        name.className = "d-s";
        name.textContent = s.name;

        li.append(dist, name);
        if (s.addressLine) {
          const p = document.createElement("p");
          p.className = "label";
          p.textContent = s.addressLine;
          li.appendChild(p);
        }
        if (s.phone) {
          const p = document.createElement("p");
          p.className = "label";
          const a = document.createElement("a");
          a.className = "u-link";
          a.href = `tel:${s.phone.replace(/[\s-]/g, "")}`;
          a.textContent = s.phone;
          p.appendChild(a);
          li.appendChild(p);
        }
        list.appendChild(li);
      }
    };
    const loadStores = async () => {
      const res = await fetch(`${storesUrl}?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error("store-list.json");
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return data && Array.isArray(data.stores) ? data.stores : [];
    };

    const geocode = async q => {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=${encodeURIComponent(lang)}&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("geocode");
      const data = await res.json();
      if (!Array.isArray(data) || !data.length) return null;
      const lat = Number(data[0].lat), lon = Number(data[0].lon);
      return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
    };

    const search = async (q, radius) => {
      const clean = (q || "").trim();
      list.innerHTML = "";
      if (!clean) { setMessage(t.enterCity); return; }

      if (submitBtn) submitBtn.disabled = true;
      setMessage(t.searching);
      try {
        const [stores, coords] = await Promise.all([loadStores(), geocode(clean)]);
        if (!coords) { setMessage(t.cityNotFound); return; }

        const maxKm = Number(radius) > 0 ? Number(radius) : Infinity;
        const shops = [];
        for (const store of stores) {
          const gps = parseGps(store);
          if (!gps) continue;
          const d = haversineKm(coords.lat, coords.lon, gps.lat, gps.lon);
          if (d > maxKm) continue;
          shops.push({
            name: (store.name || store.title || "").trim(),
            distance: Math.round(d * 10) / 10,
            addressLine: buildAddress(store),
            phone: (store.phone || "").trim()
          });
        }

        shops.sort((a, b) => a.distance - b.distance);

        if (!shops.length) { setMessage(noResultsText); return; }
        setMessage("");
        render(shops);
      } catch (err) {
        setMessage(t.error);
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    };
    /* query string condivisibile: ?city=...&radius=... */
    const params = new URLSearchParams(location.search);
    const qCity = (params.get("city") || "").trim();
    const qRadius = params.get("radius") || "";
    if (qCity && cityInput) cityInput.value = qCity;
    if (qRadius && radiusSel && [...radiusSel.options].some(o => o.value === qRadius)) radiusSel.value = qRadius;

    finder.addEventListener("submit", e => {
      e.preventDefault();
      const url = new URL(location.href);
      if (cityInput && cityInput.value.trim()) url.searchParams.set("city", cityInput.value.trim()); else url.searchParams.delete("city");
      if (radiusSel && radiusSel.value) url.searchParams.set("radius", radiusSel.value); else url.searchParams.delete("radius");
      history.replaceState({}, "", url.toString());
      search(cityInput ? cityInput.value : "", radiusSel ? Number(radiusSel.value) : 0);
    });

    /* ricerca automatica se la pagina è aperta con ?city=... */
    if (qCity) search(qCity, Number(qRadius || (radiusSel ? radiusSel.value : 0)));
  }

  /* ---------- anno corrente ---------- */
  $$("[data-year]").forEach(el => el.textContent = String(new Date().getFullYear()));
})();
