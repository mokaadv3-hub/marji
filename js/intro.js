/* مَرْجِع — الافتتاحية التفاعلية: مشاهد ثلاثية الأبعاد + تعليق متزامن + موسيقى مولّدة + مكان جاهز للتعليق الصوتي */
(() => {
  "use strict";
  const { $, $$, store, reduce } = window.MARJI_UTIL;
  const CFG = window.MARJI.intro;
  const root = $("#marjiIntro"),
    world = $("#introWorld"),
    stage = $("#introStage"),
    caption = $("#introCaption"),
    controls = $("#introControls"),
    track = $("#introTrack"),
    pauseBtn = $("#introPause"),
    soundBtn = $("#introSound"),
    ring = $("#introRing");
  const scenes = $$(".scene", root);
  const sceneEl = (id) => scenes.find((s) => s.dataset.scene === id);
  const SEEN = "marji_intro_seen";

  let open = false,
    playing = false,
    idx = -1, // -1 = بوابة البداية
    elapsed = 0,
    last = 0,
    raf = 0,
    opener = null;
  // دوران العالم
  let wx = 0,
    wy = 0,
    twx = 0,
    twy = 0,
    ringA = 0,
    ringT = 0,
    ringHold = 0,
    dragging = false,
    lastX = 0,
    lastY = 0;

  /* شريط المشاهد */
  CFG.scenes.forEach((s, n) => {
    const b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-label", "المشهد " + (n + 1));
    b.append(document.createElement("i"));
    b.addEventListener("click", () => go(n));
    track.append(b);
  });
  const fills = $$("i", track);

  /* ---------- الصوت ---------- */
  let ctx = null,
    master = null,
    musicOn = false,
    voice = null,
    voiceReady = false;
  function buildMusic() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    master.connect(lp).connect(ctx.destination);
    // وسادة هادئة: لا ماجور مفتوح + نبض بطيء
    [110, 164.81, 220, 277.18, 329.63].forEach((f, n) => {
      const o = ctx.createOscillator(),
        g = ctx.createGain(),
        l = ctx.createOscillator(),
        lg = ctx.createGain();
      o.type = n % 2 ? "triangle" : "sine";
      o.frequency.value = f;
      o.detune.value = (n - 2) * 4;
      g.gain.value = 0.16 / (n + 1.4);
      l.frequency.value = 0.07 + n * 0.031;
      lg.gain.value = g.gain.value * 0.55;
      l.connect(lg).connect(g.gain);
      o.connect(g).connect(master);
      o.start();
      l.start();
    });
    return true;
  }
  function setMusic(on) {
    try {
      if (on && !ctx && !buildMusic()) return;
      if (!ctx) return;
      if (on) ctx.resume();
      musicOn = on;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(on ? (voiceReady ? 0.16 : 0.34) : 0, ctx.currentTime + (on ? 1.6 : 0.5));
      soundBtn.setAttribute("aria-pressed", String(on));
    } catch (e) {}
  }
  soundBtn.addEventListener("click", () => setMusic(!musicOn));
  function loadVoice() {
    if (voice || !CFG.voiceFile) return;
    try {
      voice = new Audio();
      voice.preload = "auto";
      voice.addEventListener("canplaythrough", () => (voiceReady = true), { once: true });
      voice.addEventListener("error", () => (voiceReady = false));
      voice.src = CFG.voiceFile;
    } catch (e) {
      voice = null;
    }
  }
  const sceneStart = (n) => CFG.scenes.slice(0, n).reduce((a, s) => a + s.duration, 0);
  function syncVoice(seek) {
    if (!voiceReady || !voice) return;
    try {
      if (seek && idx >= 0) voice.currentTime = sceneStart(idx) + elapsed;
      if (playing && idx >= 0) voice.play().catch(() => {});
      else voice.pause();
    } catch (e) {}
  }

  /* ---------- المشاهد ---------- */
  function setCaption(text, dur) {
    caption.replaceChildren();
    if (!text) return;
    const words = text.split(" ");
    const step = reduce ? 0 : Math.min(0.32, (dur * 0.55) / words.length);
    words.forEach((w, n) => {
      const s = document.createElement("span");
      s.textContent = w + (n < words.length - 1 ? " " : "");
      s.style.animationDelay = 0.35 + n * step + "s";
      caption.append(s);
    });
  }
  function show(id) {
    const pos = scenes.findIndex((s) => s.dataset.scene === id);
    scenes.forEach((s, n) => {
      s.classList.toggle("is-active", n === pos);
      s.classList.toggle("is-past", n < pos);
    });
  }
  function go(n) {
    if (n < 0) return gate();
    idx = Math.min(n, CFG.scenes.length - 1);
    elapsed = 0;
    const sc = CFG.scenes[idx];
    // إعادة تشغيل حركات المشهد عند الرجوع إليه
    const node = sceneEl(sc.id);
    node.classList.remove("is-active");
    void node.offsetWidth;
    show(sc.id);
    setCaption(sc.caption, sc.duration);
    controls.hidden = false;
    fills.forEach((f, k) => (f.style.width = k < idx ? "100%" : "0%"));
    setPlaying(true);
    syncVoice(true);
  }
  function gate() {
    idx = -1;
    elapsed = 0;
    show("gate");
    setCaption("");
    controls.hidden = true;
    setPlaying(false);
  }
  function setPlaying(p) {
    playing = p;
    pauseBtn.textContent = p ? "❚❚" : "▶";
    pauseBtn.setAttribute("aria-label", p ? "إيقاف مؤقت" : "تشغيل");
    syncVoice(false);
  }
  pauseBtn.addEventListener("click", () => {
    if (!playing && idx === CFG.scenes.length - 1 && elapsed >= CFG.scenes[idx].duration) return go(0);
    setPlaying(!playing);
  });
  $("#introPrev").addEventListener("click", () => go(Math.max(0, idx - 1)));
  $("#introNext").addEventListener("click", () => (idx >= CFG.scenes.length - 1 ? close() : go(idx + 1)));
  $("#introStart").addEventListener("click", () => {
    setMusic(true);
    go(0);
  });
  $("#introReplay").addEventListener("click", () => go(0));
  $("#introSkip").addEventListener("click", () => close());
  $$("[data-intro-skip]", root).forEach((b) => b.addEventListener("click", () => close()));
  $$("[data-go]", root).forEach((b) => b.addEventListener("click", () => close(b.dataset.go)));

  /* ---------- الحلقة الرئيسية ---------- */
  function frame(t) {
    if (!open) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0);
    last = t;
    if (playing && idx >= 0) {
      const d = CFG.scenes[idx].duration;
      elapsed += dt;
      fills[idx].style.width = Math.min(100, (elapsed / d) * 100) + "%";
      if (elapsed >= d) {
        if (idx < CFG.scenes.length - 1) go(idx + 1);
        else setPlaying(false);
      }
    }
    if (!reduce) {
      wx += (twx - wx) * 0.07;
      wy += (twy - wy) * 0.07;
      world.style.setProperty("--wx", wx.toFixed(2) + "deg");
      world.style.setProperty("--wy", wy.toFixed(2) + "deg");
      // الحلقة تتوقف عند كل بطاقة لحظة ثم تنتقل للتالية؛ تثبت عند مرور المؤشر
      if (!dragging) {
        if (!ringHover && playing && idx >= 0 && CFG.scenes[idx].id === "4") {
          ringHold += dt;
          if (ringHold > 1.7) {
            ringHold = 0;
            ringT += 60;
          }
        }
        ringA += (ringT - ringA) * 0.06;
      }
      ring.style.setProperty("--ring", ringA.toFixed(2) + "deg");
    }
    dust(dt);
    raf = requestAnimationFrame(frame);
  }

  /* ---------- التفاعل: المؤشر والسحب ---------- */
  let ringHover = false;
  ring.addEventListener("pointerenter", () => (ringHover = true));
  ring.addEventListener("pointerleave", () => (ringHover = false));
  root.addEventListener(
    "pointermove",
    (e) => {
      if (dragging) {
        const dx = e.clientX - lastX,
          dy = e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        if (idx >= 0 && CFG.scenes[idx].id === "4") {
          ringA += dx * 0.45;
          ringT = ringA;
        } else twy = Math.max(-38, Math.min(38, twy + dx * 0.3));
        twx = Math.max(-22, Math.min(22, twx - dy * 0.2));
        return;
      }
      if (e.pointerType === "mouse") {
        twy = (e.clientX / innerWidth - 0.5) * 26;
        twx = (0.5 - e.clientY / innerHeight) * 16;
      }
    },
    { passive: true },
  );
  stage.addEventListener("pointerdown", (e) => {
    if (e.target.closest("button")) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    ringT = Math.round(ringA / 60) * 60;
    ringHold = 0;
    if (e.pointerType !== "mouse") {
      twx = 0;
      twy = 0;
    }
  };
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  /* ---------- غبار ضوئي بعمق ---------- */
  const cv = $("#introDust"),
    g = cv.getContext("2d");
  let dots = [],
    W = 0,
    H = 0;
  function sizeDust() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth;
    H = cv.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(90, (W * H) / 16000));
    dots = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, z: 0.2 + Math.random() * 0.8, p: Math.random() * 6.28 }));
  }
  function dust(dt) {
    g.clearRect(0, 0, W, H);
    for (const d of dots) {
      d.p += dt * 0.6;
      d.y -= dt * 9 * d.z;
      if (d.y < -4) d.y = H + 4;
      const x = d.x + wy * d.z * 3.2,
        y = d.y - wx * d.z * 3.2;
      g.globalAlpha = (0.18 + 0.22 * Math.sin(d.p)) * d.z + 0.08;
      g.fillStyle = d.z > 0.7 ? "#7ff5e6" : "#8fc8e8";
      g.beginPath();
      g.arc(x, y, d.z * 2.1, 0, 6.283);
      g.fill();
    }
    g.globalAlpha = 1;
  }
  addEventListener("resize", () => open && sizeDust());

  /* ---------- فتح وإغلاق ---------- */
  function openIntro(from) {
    if (open) return;
    open = true;
    opener = from || document.activeElement;
    root.hidden = false;
    root.classList.remove("is-leaving");
    document.body.classList.add("intro-open");
    $$("body > *:not(#marjiIntro):not(script):not(.cursor-halo)").forEach((n) => (n.inert = true));
    sizeDust();
    loadVoice();
    gate();
    last = performance.now();
    raf = requestAnimationFrame(frame);
    $("#introStart").focus({ preventScroll: true });
  }
  function close(hash) {
    if (!open) return;
    open = false;
    cancelAnimationFrame(raf);
    setPlaying(false);
    setMusic(false);
    store.set(SEEN, 1);
    $$("body > *").forEach((n) => (n.inert = false));
    document.body.classList.remove("intro-open");
    root.classList.add("is-leaving");
    setTimeout(
      () => {
        root.hidden = true;
        root.classList.remove("is-leaving");
        scenes.forEach((s) => s.classList.remove("is-active", "is-past"));
      },
      reduce ? 0 : 430,
    );
    if (hash) {
      const target = $(hash);
      if (target) setTimeout(() => target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }), 60);
    } else if (opener && opener.focus) opener.focus({ preventScroll: true });
  }
  addEventListener("keydown", (e) => {
    if (!open) return;
    if (e.key === "Escape") close();
    else if (e.key === "ArrowLeft" && idx >= 0) $("#introNext").click();
    else if (e.key === "ArrowRight" && idx > 0) $("#introPrev").click();
    else if (e.key === " " && idx >= 0 && !e.target.closest("button")) {
      e.preventDefault();
      pauseBtn.click();
    }
  });
  document.addEventListener("visibilitychange", () => {
    if (open && document.hidden && playing) setPlaying(false);
  });
  $$("[data-open-intro]").forEach((b) => b.addEventListener("click", () => openIntro(b)));

  // أول زيارة: تظهر بوابة الافتتاحية تلقائيًا (لا يبدأ العرض ولا الصوت إلا بضغطة من الزائر)
  if (!store.get(SEEN, 0) && !location.hash) openIntro(document.body);
})();
