/* MARONE 1881 — slider a pagina intera (scroll-jacking)
   Un gesto = una slide. La pagina avanza da sola con transizione.
   Degrada a pagina normale se manca il JS o con prefers-reduced-motion. */
(() => {
  "use strict";
  const root = document.querySelector("[data-slides]");
  if (!root) return;

  const slides = [...root.querySelectorAll(":scope > .slide")];
  if (slides.length < 2) return;

  /* --------------------------------------------------------------------
     Dove è attivo lo slider.
     Di default solo da desktop: su touch lo scroll-jacking litiga con il
     gesto nativo del dito. Per attivarlo ovunque metti ONLY_DESKTOP = false.
     -------------------------------------------------------------------- */
  const ONLY_DESKTOP = true;
  if (ONLY_DESKTOP && !matchMedia("(min-width: 900px) and (pointer: fine)").matches) return;

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DURATION = reduced ? 0 : 1000;   // ms
  const COOLDOWN = 140;                  // ms di pausa dopo la transizione
  const WHEEL_MIN = 12;                  // soglia minima di rotella
  const SWIPE_MIN = 46;                  // px minimi di swipe

  let index = 0;
  let locked = false;
  let unlockTimer = 0;
  let lastDelta = 0;

  document.documentElement.classList.add("slides-on");
  root.style.setProperty("--n", slides.length);

  /* ---------- navigazione ---------- */
  function apply(i, instant) {
    index = i;
    root.style.transition = instant || reduced ? "none" : `transform ${DURATION}ms cubic-bezier(.72,0,.16,1)`;
    root.style.transform = `translate3d(0, ${-i * 100}%, 0)`;
    slides.forEach((s, k) => {
      s.classList.toggle("is-active", k === i);
      s.setAttribute("aria-hidden", String(k !== i));
      // il contenuto fuori schermo non deve essere raggiungibile col TAB
      s.querySelectorAll("a,button,input,select,textarea,video").forEach(el => {
        if (k === i) el.removeAttribute("tabindex");
        else el.setAttribute("tabindex", "-1");
      });
    });
    document.dispatchEvent(new CustomEvent("slidechange", { detail: { index: i, id: slides[i].id || "" } }));
    if (slides[i].id) history.replaceState(null, "", "#" + slides[i].id);
  }

  function go(i, instant) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    if (i === index) return;
    locked = true;
    apply(i, instant);
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(() => { locked = false; }, DURATION + COOLDOWN);
  }
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  /* ---------- slide più alte della finestra: scorrono al loro interno ---------- */
  function innerRoom(dir) {
    const s = slides[index];
    if (s.scrollHeight - s.clientHeight < 4) return false;
    if (dir > 0) return s.scrollTop + s.clientHeight < s.scrollHeight - 2;
    return s.scrollTop > 2;
  }

  /* ---------- rotella / trackpad ---------- */
  root.addEventListener("wheel", e => {
    const d = e.deltaY;
    if (Math.abs(d) < 4) return;
    if (innerRoom(d)) return;             // lascia scorrere il contenuto interno
    e.preventDefault();
    if (locked) { lastDelta = Math.abs(d); return; }
    // inerzia del trackpad: aspetta che la spinta cali prima di riaccettare
    if (Math.abs(d) < WHEEL_MIN && Math.abs(d) <= lastDelta) { lastDelta = Math.abs(d); return; }
    lastDelta = Math.abs(d);
    d > 0 ? next() : prev();
  }, { passive: false });

  /* ---------- touch ---------- */
  let y0 = null;
  root.addEventListener("touchstart", e => { y0 = e.touches[0].clientY; }, { passive: true });
  root.addEventListener("touchmove", e => {
    if (y0 === null) return;
    const dy = y0 - e.touches[0].clientY;
    if (innerRoom(dy)) return;
    if (e.cancelable) e.preventDefault();
  }, { passive: false });
  root.addEventListener("touchend", e => {
    if (y0 === null) return;
    const dy = y0 - e.changedTouches[0].clientY;
    y0 = null;
    if (locked || Math.abs(dy) < SWIPE_MIN) return;
    if (innerRoom(dy)) return;
    dy > 0 ? next() : prev();
  }, { passive: true });

  /* ---------- tastiera ---------- */
  addEventListener("keydown", e => {
    const tag = (e.target.tagName || "").toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "select" || e.target.isContentEditable) return;
    switch (e.key) {
      case "ArrowDown": case "PageDown": e.preventDefault(); next(); break;
      case "ArrowUp": case "PageUp": e.preventDefault(); prev(); break;
      case " ": e.preventDefault(); e.shiftKey ? prev() : next(); break;
      case "Home": e.preventDefault(); go(0); break;
      case "End": e.preventDefault(); go(slides.length - 1); break;
    }
  });

  /* ---------- link interni e ancore ---------- */
  addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const i = slides.findIndex(s => "#" + s.id === a.getAttribute("href"));
    if (i >= 0) { e.preventDefault(); go(i); }
  });

  /* ---------- indicatore laterale ---------- */
  const dots = document.querySelector(".dots");
  if (dots) {
    dots.innerHTML = "";
    slides.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", s.dataset.panel || `Sezione ${i + 1}`);
      b.addEventListener("click", () => go(i));
      dots.appendChild(b);
    });
    const btns = [...dots.children];
    document.addEventListener("slidechange", e => {
      btns.forEach((b, k) => b.setAttribute("aria-current", String(k === e.detail.index)));
    });
  }

  /* ---------- avvio ---------- */
  const start = location.hash ? slides.findIndex(s => "#" + s.id === location.hash) : 0;
  apply(start > 0 ? start : 0, true);
  requestAnimationFrame(() => root.classList.add("slides-ready"));
})();
