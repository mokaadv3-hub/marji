/* مَرْجِع — تفاعلات المؤشر: هادئة، وتتعطل تلقائيًا على اللمس وعند تفضيل تقليل الحركة */
(() => {
  "use strict";
  const { $, $$ } = window.MARJI_UTIL;
  const fine = matchMedia("(hover:hover) and (pointer:fine) and (prefers-reduced-motion: no-preference)").matches;
  if (!fine) return;
  document.documentElement.classList.add("has-pointer");

  /* 1) خلفية الهيرو تتبع المؤشر (من الملف الأصلي) + ميل ثلاثي الأبعاد لبطاقة «ملف معرفة» */
  const hero = $(".hero"),
    glass = $(".hero-art .glass");
  let hf = 0;
  hero.addEventListener(
    "pointermove",
    (e) => {
      if (hf) return;
      hf = requestAnimationFrame(() => {
        const r = hero.getBoundingClientRect();
        const px = e.clientX - r.left,
          py = e.clientY - r.top;
        const nx = px / r.width - 0.5,
          ny = py / r.height - 0.5;
        hero.style.setProperty("--mx", px + "px");
        hero.style.setProperty("--my", py + "px");
        hero.style.setProperty("--vx", nx * 45 + "px");
        hero.style.setProperty("--vy", ny * 38 + "px");
        if (glass) {
          glass.style.setProperty("--ry", nx * 14 + "deg");
          glass.style.setProperty("--rx", ny * -10 + "deg");
        }
        hf = 0;
      });
    },
    { passive: true },
  );
  hero.addEventListener("pointerleave", () => {
    hero.style.setProperty("--vx", "0px");
    hero.style.setProperty("--vy", "0px");
    if (glass) {
      glass.style.setProperty("--ry", "0deg");
      glass.style.setProperty("--rx", "0deg");
    }
  });

  /* 2) ميل خفيف وبقعة ضوء على البطاقات */
  const TILT = ".card, .quick-card, .book-item, .writer-card, .member, .gap-item, .quiz-card, .source-trigger.resource";
  $$(TILT).forEach((c) => {
    c.classList.add("tilt");
    let f = 0;
    c.addEventListener(
      "pointermove",
      (e) => {
        if (f) return;
        f = requestAnimationFrame(() => {
          const r = c.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width,
            y = (e.clientY - r.top) / r.height;
          c.style.setProperty("--tx", (x - 0.5) * 7 + "deg");
          c.style.setProperty("--ty", (0.5 - y) * 6 + "deg");
          c.style.setProperty("--gx", x * 100 + "%");
          c.style.setProperty("--gy", y * 100 + "%");
          f = 0;
        });
      },
      { passive: true },
    );
    c.addEventListener("pointerleave", () => {
      c.style.setProperty("--tx", "0deg");
      c.style.setProperty("--ty", "0deg");
    });
  });

  /* 3) أزرار رئيسية «مغناطيسية» بمقدار بسيط */
  $$(".btn.primary, .navcta, .intro-play").forEach((b) => {
    b.addEventListener(
      "pointermove",
      (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--bx", ((e.clientX - r.left) / r.width - 0.5) * 8 + "px");
        b.style.setProperty("--by", ((e.clientY - r.top) / r.height - 0.5) * 6 + "px");
      },
      { passive: true },
    );
    b.addEventListener("pointerleave", () => {
      b.style.setProperty("--bx", "0px");
      b.style.setProperty("--by", "0px");
    });
  });

  /* 4) هالة مؤشر: حلقة «عدسة» تكبر فوق العناصر التفاعلية */
  const halo = $("#cursorHalo");
  let x = innerWidth / 2,
    y = innerHeight / 2,
    tx = x,
    ty = y,
    live = false;
  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!live) {
        live = true;
        x = tx;
        y = ty;
        halo.classList.add("on");
        requestAnimationFrame(loop);
      }
      const t = e.target.closest ? e.target.closest("a, button, summary, input, textarea, [role=button]") : null;
      halo.classList.toggle("grow", !!t);
    },
    { passive: true },
  );
  document.addEventListener("pointerleave", () => halo.classList.remove("on"));
  document.addEventListener("pointerenter", () => live && halo.classList.add("on"));
  addEventListener("pointerdown", () => halo.classList.add("press"));
  addEventListener("pointerup", () => halo.classList.remove("press"));
  function loop() {
    x += (tx - x) * 0.18;
    y += (ty - y) * 0.18;
    halo.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    requestAnimationFrame(loop);
  }
})();
