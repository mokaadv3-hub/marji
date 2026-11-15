/* مَرْجِع — منطق الواجهة (مبني على سكربتات الملف الأصلي بعد توحيدها وإصلاحها) */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DATA = window.MARJI;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const AR = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const store = {
    get(k, fallback) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
        return true;
      } catch (e) {
        return false;
      }
    },
    del(k) {
      try {
        localStorage.removeItem(k);
      } catch (e) {}
    },
  };
  window.MARJI_UTIL = { $, $$, store, reduce };

  /* ---------- القائمة ---------- */
  const menu = $("#menu"),
    links = $("#links");
  const closeMenu = () => {
    links.classList.remove("open");
    menu.setAttribute("aria-expanded", "false");
    menu.textContent = "☰";
  };
  menu.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    menu.setAttribute("aria-expanded", String(open));
    menu.setAttribute("aria-label", open ? "إغلاق القائمة" : "فتح القائمة");
    menu.textContent = open ? "✕" : "☰";
  });
  $$(".links a").forEach((a) => a.addEventListener("click", closeMenu));
  addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());

  /* إبراز رابط القسم الحالي */
  const navLinks = $$(".links a");
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          navLinks.forEach((a) => a.classList.toggle("is-current", a.getAttribute("href") === "#" + en.target.id));
        }),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    $$("main section[id]").forEach((s) => spy.observe(s));
  }

  /* ---------- النوافذ الداخلية: إغلاق موحّد ---------- */
  function wireDialog(d, onClose) {
    d.addEventListener("click", (e) => {
      if (e.target === d) d.close();
    });
    if (onClose) d.addEventListener("close", onClose);
  }
  $$("[data-close-dialog]").forEach((b) => b.addEventListener("click", () => b.closest("dialog").close()));

  /* ---------- الأنظمة المبسّطة ---------- */
  function pickLaw(id, scroll) {
    if (!$('[data-law-content="' + id + '"]')) return;
    $$("[data-law]").forEach((b) => {
      const active = b.dataset.law === id;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-pressed", String(active));
      if (active && b.scrollIntoView && innerWidth <= 850) b.scrollIntoView({ block: "nearest", inline: "center" });
    });
    $$("[data-law-content]").forEach((n) => {
      const active = n.dataset.lawContent === id;
      n.hidden = !active;
      n.classList.toggle("is-active", active);
    });
    if (scroll) $("#regulations").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }
  $$("[data-law]").forEach((b) => b.addEventListener("click", () => pickLaw(b.dataset.law, false)));
  $$("[data-pick-law]").forEach((b) => b.addEventListener("click", () => pickLaw(b.dataset.pickLaw, true)));

  /* ---------- التدريب على المواقف ---------- */
  (function scenarios() {
    const list = DATA.scenarios;
    const title = $("#scenarioTitle"),
      text = $("#scenarioText"),
      box = $("#scenarioChoices"),
      fb = $("#feedback"),
      next = $("#scenarioNext"),
      count = $("#scenarioCount"),
      dots = $("#scenarioDots");
    let i = 0,
      score = 0,
      answered = false;
    list.forEach(() => dots.append(el("i")));
    function render() {
      const s = list[i];
      answered = false;
      count.textContent = "الموقف " + AR(i + 1) + " من " + AR(list.length);
      title.textContent = s.title;
      text.textContent = s.text;
      fb.classList.remove("show", "ok", "no");
      fb.textContent = "";
      next.hidden = true;
      box.replaceChildren(
        ...s.options.map((o, n) => {
          const b = el("button", "choice", o);
          b.type = "button";
          b.addEventListener("click", () => choose(b, n));
          return b;
        }),
      );
      $$("i", dots).forEach((d, n) => d.classList.toggle("on", n === i));
    }
    function choose(btn, n) {
      const s = list[i];
      const ok = n === s.correct;
      $$(".choice", box).forEach((x, k) => {
        x.classList.toggle("selected", x === btn);
        x.classList.toggle("is-right", answered || ok ? k === s.correct : false);
      });
      if (!answered) {
        answered = true;
        if (ok) score++;
        $$("i", dots)[i].classList.add(ok ? "ok" : "no");
      }
      fb.classList.add("show");
      fb.classList.toggle("ok", ok);
      fb.classList.toggle("no", !ok);
      fb.textContent = (ok ? "✓ " : "") + (ok ? s.right : s.wrong);
      next.hidden = false;
      next.textContent = i < list.length - 1 ? "الموقف التالي ←" : "اعرض نتيجتي ←";
    }
    next.addEventListener("click", () => {
      if (i < list.length - 1) {
        i++;
        render();
        return;
      }
      count.textContent = "النتيجة";
      title.textContent = "أصبت في " + AR(score) + " من " + AR(list.length) + " مواقف";
      text.textContent = score === list.length ? "قرارات مهنية موفقة. جرّب الآن اختبار الفهم." : "راجع شروح الأنظمة ثم أعد المحاولة.";
      box.replaceChildren();
      fb.classList.remove("show");
      next.textContent = "أعد المواقف ↻";
      next.hidden = false;
      i = -1;
      score = 0;
      $$("i", dots).forEach((d) => (d.className = ""));
    });
    render();
  })();

  /* ---------- الاختبار قبل/بعد ---------- */
  (function quiz() {
    const KEY = "marji_quiz_scores";
    const dlg = $("#quizDialog");
    const total = DATA.quiz.length;
    let mode = "pre",
      order = [],
      i = 0,
      score = 0,
      locked = false;
    wireDialog(dlg);
    function paint() {
      const s = store.get(KEY, {});
      [
        ["pre", "#scorePre", "#barPre", "#barPreN"],
        ["post", "#scorePost", "#barPost", "#barPostN"],
      ].forEach(([k, box, bar, num]) => {
        const has = typeof s[k] === "number";
        $(box + " .quiz-score-num").textContent = has ? AR(s[k]) + " / " + AR(total) : "—";
        $(box + " .quiz-score-label").textContent = has ? "آخر نتيجة" : "لم يُجرَ بعد";
        $(bar).style.width = has ? (s[k] / total) * 100 + "%" : "0%";
        $(num).textContent = has ? AR(s[k]) + "/" + AR(total) : "—";
      });
      const v = $("#quizVerdict");
      if (typeof s.pre === "number" && typeof s.post === "number") {
        const d = s.post - s.pre;
        v.textContent = d > 0 ? "تحسّن فهمك بمقدار " + AR(d) + (d === 1 ? " إجابة." : " إجابات.") : d === 0 ? "النتيجتان متساويتان. راجع الشروح التي أخطأت فيها." : "تراجعت النتيجة؛ أعد قراءة الشروح بهدوء ثم حاول مجددًا.";
      } else v.textContent = typeof s.pre === "number" ? "أحسنت. تصفّح المنصة ثم أجرِ الاختبار البعدي." : "أكمل الاختبارين لتظهر المقارنة.";
    }
    function show() {
      const q = DATA.quiz[order[i]];
      locked = false;
      $("#quizTag").textContent = mode === "pre" ? "الاختبار القبلي" : "الاختبار البعدي";
      $("#quizHeading").textContent = q.q;
      $("#quizExplain").textContent = "";
      $("#quizStepText").textContent = "سؤال " + AR(i + 1) + " من " + AR(total);
      $("#quizProgress").style.width = (i / total) * 100 + "%";
      $("#quizNext").hidden = true;
      $("#quizOptions").replaceChildren(
        ...q.options.map((o, n) => {
          const b = el("button", "quiz-opt", o);
          b.type = "button";
          b.addEventListener("click", () => {
            if (locked) return;
            locked = true;
            const ok = n === q.correct;
            if (ok) score++;
            $$(".quiz-opt", dlg).forEach((x, k) => {
              x.disabled = true;
              if (k === q.correct) x.classList.add("right");
              else if (x === b) x.classList.add("wrong");
            });
            $("#quizExplain").textContent = (ok ? "✓ صحيح. " : "ليست الأدق. ") + q.why;
            const nx = $("#quizNext");
            nx.hidden = false;
            nx.textContent = i < total - 1 ? "التالي ←" : "اعرض النتيجة ←";
            nx.focus();
          });
          return b;
        }),
      );
    }
    $("#quizNext").addEventListener("click", () => {
      if (i < total - 1) {
        i++;
        show();
        return;
      }
      if (i === total) {
        dlg.close();
        return;
      }
      i = total;
      const s = store.get(KEY, {});
      s[mode] = score;
      store.set(KEY, s);
      paint();
      $("#quizProgress").style.width = "100%";
      $("#quizHeading").textContent = "نتيجتك: " + AR(score) + " من " + AR(total);
      $("#quizOptions").replaceChildren();
      $("#quizExplain").textContent = mode === "pre" ? "حُفظت نتيجتك القبلية في متصفحك. تصفّح الأنظمة والمواقف، ثم أجرِ الاختبار البعدي." : "حُفظت نتيجتك البعدية. قارن النتيجتين في قسم «اختبر فهمك».";
      $("#quizStepText").textContent = "";
      $("#quizNext").textContent = "إغلاق";
    });
    $$("[data-start-quiz]").forEach((b) =>
      b.addEventListener("click", () => {
        mode = b.dataset.startQuiz;
        order = DATA.quiz.map((_, n) => n);
        if (mode === "post") order.reverse();
        i = 0;
        score = 0;
        show();
        dlg.showModal();
      }),
    );
    $("#quizReset").addEventListener("click", () => {
      store.del(KEY);
      paint();
    });
    paint();
  })();

  /* ---------- المقالات وملفات الأعضاء ---------- */
  const ad = $("#articleDialog"),
    wd = $("#writerDialog"),
    md = $("#memberDialog");
  [ad, wd, md, $("#policyDialog")].forEach((d) => wireDialog(d));
  const BADGE =
    '<svg aria-hidden="true" class="verified-icon" viewBox="0 0 24 24"><path d="M12 1.8 15 3.5l3.4-.1 1.1 3.2 2.8 2-1.1 3.2 1.1 3.2-2.8 2-1.1 3.2-3.4-.1-3 1.7-3-1.7-3.4.1-1.1-3.2-2.8-2 1.1-3.2-1.1-3.2 2.8-2 1.1-3.2 3.4.1z" fill="currentColor"/><path d="m7.4 12 3.1 3.1 6.2-6.4" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>';

  function openArticle(id) {
    const a = DATA.articles[id];
    if (!a || a.status !== "published") return;
    const m = DATA.members[a.author];
    $("#articleHeading").textContent = a.title;
    const bar = $("#articleAuthor");
    const btn = el("button", "article-author-link");
    btn.type = "button";
    const img = el("img");
    img.src = m.photo;
    img.alt = "";
    const who = el("span");
    who.append(el("strong", null, m.name), el("small", null, m.role + (m.sample ? " · عضوية تجريبية" : "")));
    btn.append(img, who);
    btn.addEventListener("click", () => {
      ad.close();
      openMember(a.author);
    });
    bar.replaceChildren(btn);
    $("#articleBody").replaceChildren(...a.paras.map((x) => el("p", null, x)));
    if (md.open) md.close();
    ad.showModal();
    ad.scrollTop = 0;
  }
  function openMember(id) {
    const m = DATA.members[id];
    if (!m) return;
    $("#memberPhoto").src = m.photo;
    $("#memberName").textContent = m.name;
    $("#memberRole").textContent = m.role;
    $("#memberBio").textContent = m.bio;
    const badge = $("#memberBadge");
    badge.innerHTML = m.verified ? '<span class="status yes">' + BADGE + " موثّق لدى مَرْجِع" + (m.sample ? " (تجريبي)" : "") + "</span>" : '<span class="status no">غير موثّق</span>';
    $(".member-dialog .sample-ribbon").hidden = !m.sample;
    $(".profile-sub").textContent = (m.pronoun === "f" ? "مقالاتها" : "مقالاته") + " في مَرْجِع";
    $("#memberTags").replaceChildren(...m.tags.map((t) => el("span", null, t)));
    $("#memberArticles").replaceChildren(
      ...m.articles
        .filter((k) => DATA.articles[k] && DATA.articles[k].status === "published")
        .map((k) => {
          const a = DATA.articles[k];
          const b = el("button", "profile-article");
          b.type = "button";
          b.append(el("small", null, a.category), el("strong", null, a.title), el("span", null, "اقرأ ←"));
          b.addEventListener("click", () => openArticle(k));
          return b;
        }),
    );
    md.showModal();
  }
  $$("[data-article]").forEach((b) => b.addEventListener("click", () => openArticle(b.dataset.article)));
  $$("[data-member-articles]").forEach((b) => b.addEventListener("click", () => openArticle(b.dataset.memberArticles)));
  $$("[data-open-member]").forEach((b) => b.addEventListener("click", () => openMember(b.dataset.openMember)));
  $$("[data-open-policy]").forEach((b) => b.addEventListener("click", () => $("#policyDialog").showModal()));

  /* تصفية الأعضاء: (إصلاح) كان زر «المصورون» يُشغّل معالجين متعارضين */
  const mbuttons = $$("[data-member-filter]"),
    members = $$("#memberlist .member");
  mbuttons.forEach((b) =>
    b.addEventListener("click", () => {
      const v = b.dataset.memberFilter;
      mbuttons.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      members.forEach((m) => (m.hidden = !(v === "all" || (v === "photo" ? m.dataset.specialty === "photo" : m.dataset.status === v))));
    }),
  );

  /* ---------- مسودة المقال (محلية) ---------- */
  const DRAFT = "marji_writer_draft";
  ["openWriter", "openWriter2"].forEach((id) =>
    $("#" + id)?.addEventListener("click", () => {
      const d = store.get(DRAFT, {});
      $("#authorName").value = d.author || "";
      $("#draftTitle").value = d.title || "";
      $("#draftBody").value = d.body || "";
      $("#draftResult").textContent = "";
      wd.showModal();
    }),
  );
  $("#writerForm").addEventListener("submit", (e) => e.preventDefault());
  const draftData = () => ({ author: $("#authorName").value.trim(), title: $("#draftTitle").value.trim(), body: $("#draftBody").value.trim(), status: "draft" });
  const draftText = (d) => d.title + "\n" + (d.author || "كاتب") + "\n\n" + d.body;
  const say = (t) => ($("#draftResult").textContent = t);
  const needDraft = () => {
    const d = draftData();
    if (!d.title || !d.body) {
      say("اكتب عنوانًا ونصًا أولًا.");
      return null;
    }
    return d;
  };
  $("#saveDraft").addEventListener("click", () => {
    const d = needDraft();
    if (d) say(store.set(DRAFT, d) ? "حُفظت المسودة في متصفحك فقط." : "المتصفح لا يسمح بالحفظ المحلي؛ انسخ المسودة أو نزّلها.");
  });
  $("#copyDraft").addEventListener("click", async () => {
    const d = needDraft();
    if (!d) return;
    try {
      await navigator.clipboard.writeText(draftText(d));
      say("نُسخت المسودة، وهي غير منشورة.");
    } catch (e) {
      say("تعذّر النسخ التلقائي؛ حدّد النص وانسخه يدويًا.");
    }
  });
  $("#exportDraft").addEventListener("click", () => {
    const d = needDraft();
    if (!d) return;
    const url = URL.createObjectURL(new Blob([draftText(d)], { type: "text/plain;charset=utf-8" }));
    const a = el("a");
    a.href = url;
    a.download = "marji-article-draft.txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say("جُهّزت المسودة للتنزيل، وهي غير منشورة.");
  });

  /* ---------- قارئ المكتبة ---------- */
  (function library() {
    const d = $("#bookDialog"),
      pane = $("#bookReaderPane"),
      display = $("#readerDisplay");
    let current = null;
    const placeholder = (title, text) => {
      const block = el("div", "reading-placeholder");
      block.append(el("span", null, "مكتبة مَرْجِع"), el("strong", null, title), el("p", null, text));
      return block;
    };
    const sourceBtn = (b) => {
      const a = el("a", "btn outline reader-source", "افتح نسخة المصدر في تبويب جديد ↗");
      a.href = b.sourceurl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      return a;
    };
    function setTab(t) {
      $$("[data-book-tab]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.bookTab === t)));
      pane.replaceChildren();
      display.replaceChildren();
      const b = current;
      if (t === "about") {
        const hint = el("p", "muted-reader", "هذه بطاقة تعريفية من إعداد مَرْجِع، وليست نص الكتاب الكامل.");
        pane.append(el("h3", null, "نبذة الكتاب"), el("p", null, b.brief), hint);
      }
      if (t === "chapters") {
        const ol = el("ol");
        b.chapters.forEach((c) => ol.append(el("li", null, c)));
        pane.append(el("h3", null, b.full ? "فصول الدليل" : "موضوعات الكتاب"), ol);
      }
      if (t === "read") {
        if (b.full) {
          pane.append(el("h3", null, "اقرأ الدليل كاملًا"), el("p", null, "هذا الدليل مكتوب خصيصًا كنموذج لمَرْجِع، ويمكنك قراءته من داخل الموقع."));
          const guide = el("article", "guide-reading");
          guide.append(el("h2", null, b.title));
          b.chapters.forEach((ch, i) => guide.append(el("h3", null, "الخطوة " + AR(i + 1)), el("p", null, ch)));
          guide.append(el("p", null, "ختامًا: استعن دائمًا بالمصدر الرسمي المختص فيما يتعلق بالمتطلبات التنظيمية والحقوق."));
          display.append(guide);
        } else if (b.pdf) {
          pane.append(
            el("h3", null, "نسخة المصدر داخل نافذة مَرْجِع"),
            el("p", null, "نعرض الملف من عنوانه الأصلي دون إعادة استضافته. إن لم يظهر في الإطار فالمصدر يمنع العرض المضمّن؛ افتحه في تبويب جديد."),
            sourceBtn(b),
          );
          const wrap = el("div", "reader-frame");
          wrap.append(el("p", "reader-frame-note", "جارٍ طلب الملف من مصدره…"));
          const f = el("iframe", "reader-pdf");
          f.title = "النسخة الرقمية من مصدرها";
          f.loading = "lazy";
          f.referrerPolicy = "no-referrer";
          f.src = b.pdf + "#view=FitH";
          wrap.append(f);
          display.append(wrap);
        } else {
          pane.append(el("h3", null, "ملخص داخل مَرْجِع"), el("p", null, "النسخة الكاملة محفوظة لدى جهة الإتاحة، ولم تتوفر موافقة لإعادة استضافتها هنا؛ لذلك نعرض نبذة وموضوعات تعريفية."));
          if (b.sourceurl) pane.append(sourceBtn(b));
          display.append(placeholder(b.title, b.brief));
        }
      } else display.append(placeholder(b.title, "اختر «القراءة» لاستعراض الدليل أو نسخة المصدر المتاحة."));
    }
    $$("[data-open-book]").forEach((b) =>
      b.addEventListener("click", () => {
        current = DATA.books.find((x) => x.id === b.dataset.openBook);
        if (!current) return;
        $("#bookReaderTitle").textContent = current.title;
        $("#bookReaderAuthor").textContent = current.author;
        $("#bookReaderCategory").textContent = current.kind;
        $("#bookReaderSource").textContent = "بيانات المصدر: " + current.source;
        d.showModal();
        setTab("about");
      }),
    );
    $$("[data-book-tab]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.bookTab)));
    $("[data-close-reading]").addEventListener("click", () => d.close());
    wireDialog(d, () => display.replaceChildren());
  })();

  /* ---------- نافذة المصدر الرسمي ---------- */
  (function sources() {
    const sd = $("#sourceDialog");
    let url = "";
    $$("[data-source-url]").forEach((b) =>
      b.addEventListener("click", () => {
        url = b.dataset.sourceUrl;
        $("#sourceHeading").textContent = b.dataset.sourceTitle.replace(/\s+/g, " ").slice(0, 160);
        $("#sourceAddress").textContent = url;
        $("#openSource").href = url;
        $("#sourceCopied").textContent = "";
        sd.showModal();
      }),
    );
    $("[data-close-source]").addEventListener("click", () => sd.close());
    wireDialog(sd);
    $("#copySource").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(url);
        $("#sourceCopied").textContent = "تم نسخ الرابط الرسمي.";
      } catch (e) {
        $("#sourceCopied").textContent = "حدّد العنوان أعلاه وانسخه عند الحاجة.";
      }
    });
  })();

  /* ---------- الظهور عند التمرير وشريط التقدّم ---------- */
  const reveal = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    reveal.forEach((e, n) => {
      e.style.transitionDelay = Math.min((n % 6) * 60, 300) + "ms";
      io.observe(e);
    });
  } else reveal.forEach((e) => e.classList.add("visible"));
  let ticking = false;
  const bar = $("#progress"),
    header = $(".header");
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
      header.classList.toggle("is-scrolled", scrollY > 30);
      ticking = false;
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
