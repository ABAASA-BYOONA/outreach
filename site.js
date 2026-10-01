(function () {
  "use strict";

  /* ---------- settings (edit these) ---------- */
  var WA = "256749541324";                       // WhatsApp number that receives messages (international format, no +)
  var ORG = "Anagkazo Outreach International";

  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("js");

  function $(s, c) { return (c || doc).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); }
  function ico(id, cls) { return '<svg class="i ' + (cls || "") + '" aria-hidden="true"><use href="#' + id + '"/></svg>'; }
  function waLink(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }
  function money(n) { return "UGX " + Number(n).toLocaleString("en-US"); }

  /* ---------- toast ---------- */
  var toastEl, toastT;
  function toast(msg) {
    if (!toastEl) {
      toastEl = doc.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      doc.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("show"); }, 3000);
  }

  /* ---------- mobile navigation ---------- */
  var toggle = $(".nav-toggle");
  function setNav(open) {
    doc.body.classList.toggle("nav-open", open);
    if (toggle) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
  }
  if (toggle) {
    toggle.addEventListener("click", function () { setNav(!doc.body.classList.contains("nav-open")); });
    $$("#nav a").forEach(function (a) { a.addEventListener("click", function () { setNav(false); }); });
    window.addEventListener("resize", function () { if (window.innerWidth > 980) setNav(false); });
  }

  /* ---------- floating buttons + header shadow ---------- */
  var wa = doc.createElement("a");
  wa.className = "fab fab-wa";
  wa.href = waLink("Hello " + ORG + ", I would like to know more.");
  wa.target = "_blank";
  wa.rel = "noopener";
  wa.setAttribute("aria-label", "Chat with us on WhatsApp");
  wa.innerHTML = ico("whatsapp", "fill");
  doc.body.appendChild(wa);

  var up = doc.createElement("button");
  up.type = "button";
  up.className = "fab fab-top";
  up.setAttribute("aria-label", "Back to top");
  up.innerHTML = ico("chev-u");
  up.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });
  doc.body.appendChild(up);

  var header = $(".site-header");
  function onScroll() {
    var y = window.pageYOffset || root.scrollTop;
    if (header) header.classList.toggle("scrolled", y > 8);
    up.classList.toggle("show", y > 700);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- reveal on scroll + counters ---------- */
  function runCount(el) {
    var end = parseFloat(el.getAttribute("data-count")), suf = el.getAttribute("data-suffix") || "", t0 = null;
    if (reduce) { el.textContent = end + suf; return; }
    function step(t) {
      if (!t0) t0 = t;
      var p = Math.min((t - t0) / 1400, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var revealEls = $$(".reveal"), countEls = $$("[data-count]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add("visible");
        if (en.target.hasAttribute("data-count")) runCount(en.target);
        io.unobserve(en.target);
      });
    }, { threshold: 0.15 });
    revealEls.concat(countEls).forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
    countEls.forEach(function (el) { el.textContent = el.getAttribute("data-count") + (el.getAttribute("data-suffix") || ""); });
  }

  /* ---------- copy buttons ---------- */
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    return new Promise(function (res, rej) {
      var a = doc.createElement("textarea");
      a.value = t;
      a.style.cssText = "position:fixed;opacity:0";
      doc.body.appendChild(a);
      a.select();
      try { doc.execCommand("copy") ? res() : rej(); } catch (e) { rej(e); }
      a.remove();
    });
  }
  $$("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-copy");
      copyText(v).then(function () { toast("Copied " + v); }, function () { toast("Could not copy. The number is " + v); });
    });
  });

  /* ---------- tabs ---------- */
  $$(".tabs").forEach(function (list) {
    var tabs = $$('[role="tab"]', list);
    function select(t) {
      tabs.forEach(function (x) {
        var on = x === t;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        var p = doc.getElementById(x.getAttribute("aria-controls"));
        if (p) p.hidden = !on;
      });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!n) return;
        var nt = tabs[(i + n + tabs.length) % tabs.length];
        nt.focus();
        select(nt);
        e.preventDefault();
      });
    });
  });

  /* ---------- giving: amount + network ---------- */
  var give = { amount: "", provider: "" };
  var NET = { mtn: "MTN Mobile Money", airtel: "Airtel Money" };
  var summary = $("#give-summary");
  function updateSummary() {
    if (!summary) return;
    if (!give.amount && !give.provider) { summary.hidden = true; return; }
    var t = "You are giving " + (give.amount ? money(give.amount) : "a gift") + (give.provider ? " with " + NET[give.provider] : "") + ".";
    summary.textContent = t;
    summary.hidden = false;
  }
  var chips = $$(".chip[data-amount]"), amountInput = $("#amount");
  chips.forEach(function (c) {
    c.addEventListener("click", function () {
      var on = c.getAttribute("aria-pressed") !== "true";
      chips.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
      c.setAttribute("aria-pressed", String(on));
      give.amount = on ? c.getAttribute("data-amount") : "";
      if (amountInput) amountInput.value = "";
      updateSummary();
    });
  });
  if (amountInput) amountInput.addEventListener("input", function () {
    chips.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
    give.amount = amountInput.value > 0 ? amountInput.value : "";
    updateSummary();
  });
  var provs = $$(".provider[data-provider]");
  provs.forEach(function (p) {
    p.addEventListener("click", function () {
      var key = p.getAttribute("data-provider");
      give.provider = key;
      provs.forEach(function (x) { x.setAttribute("aria-pressed", String(x === p)); });
      $$(".pp").forEach(function (pp) { pp.hidden = pp.getAttribute("data-provider") !== key; });
      var hint = $(".pp-hint");
      if (hint) hint.hidden = true;
      updateSummary();
    });
  });
  $$("[data-wa-notify]").forEach(function (b) {
    b.addEventListener("click", function () {
      var bank = b.getAttribute("data-wa-notify") === "bank";
      var donor = $("#donor"), name = donor ? donor.value.trim() : "";
      var how = bank ? " by bank transfer (Centenary Bank)" : give.provider ? " with " + NET[give.provider] : "";
      var msg = "Hello " + ORG + ", I have just made a gift" + (give.amount ? " of " + money(give.amount) : "") + how + "." + (name ? " My name is " + name + "." : "") + " Please confirm receipt. Thank you!";
      b.href = waLink(msg);
    });
  });

  /* ---------- lightbox ---------- */
  var lb, lbImg, lbCount, list = [], idx = 0, lastFocus, sx = 0;
  function buildLb() {
    lb = doc.createElement("div");
    lb.className = "lb";
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Photo viewer");
    lb.innerHTML =
      '<button class="lb-btn lb-x" type="button" aria-label="Close photo">' + ico("close") + "</button>" +
      '<button class="lb-btn lb-p" type="button" aria-label="Previous photo">' + ico("chev-l") + "</button>" +
      '<figure><img alt=""></figure>' +
      '<button class="lb-btn lb-n" type="button" aria-label="Next photo">' + ico("chev-r") + "</button>" +
      '<div class="lb-c" aria-live="polite"></div>';
    doc.body.appendChild(lb);
    lbImg = $("img", lb);
    lbCount = $(".lb-c", lb);
    $(".lb-x", lb).addEventListener("click", closeLb);
    $(".lb-p", lb).addEventListener("click", function () { go(-1); });
    $(".lb-n", lb).addEventListener("click", function () { go(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb || e.target.tagName === "FIGURE") closeLb(); });
    lb.addEventListener("touchstart", function (e) { sx = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    }, { passive: true });
    lbImg.addEventListener("load", function () { lbImg.classList.add("ready"); lb.classList.remove("loading"); });
    lbImg.addEventListener("error", function () { lb.classList.remove("loading"); });
  }
  function show(i) {
    idx = (i + list.length) % list.length;
    var s = list[idx];
    lbImg.classList.remove("ready");
    lb.classList.add("loading");
    lbImg.alt = s.alt;
    lbImg.src = s.src;
    lbCount.textContent = (idx + 1) + " / " + list.length;
    if (list.length > 1) { var pre = new Image(); pre.src = list[(idx + 1) % list.length].src; }
  }
  function go(n) { if (list.length > 1) show(idx + n); }
  function openLb(imgs, i, trigger) {
    if (!lb) buildLb();
    list = imgs.map(function (im) { return { src: im.getAttribute("data-full") || im.currentSrc || im.src, alt: im.alt }; });
    lastFocus = trigger;
    lb.classList.toggle("single", list.length < 2);
    doc.body.classList.add("lb-open");
    lb.classList.add("open");
    show(i);
    $(".lb-x", lb).focus();
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove("open");
    doc.body.classList.remove("lb-open");
    if (lastFocus) lastFocus.focus();
  }
  $$("[data-lightbox]").forEach(function (box) {
    $$(".g-item img", box).forEach(function (im) {
      im.addEventListener("error", function () { var t = im.closest(".g-item"); if (t) t.remove(); });
    });
    box.addEventListener("click", function (e) {
      var t = e.target.closest(".g-item");
      if (!t || !box.contains(t)) return;
      var imgs = $$(".g-item img", box);
      openLb(imgs, imgs.indexOf($("img", t)), t);
    });
  });

  /* ---------- PDF + WhatsApp forms ---------- */
  function clean(s) {
    return String(s)
      .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
      .replace(/[\u2013\u2014]/g, "-").replace(/\u2026/g, "...")
      .replace(/[^\x09\x0A\x0D\x20-\xFF]/g, "?");
  }
  function collect(form) {
    var rows = [];
    $$("[name]", form).forEach(function (el) {
      var v = (el.value || "").trim();
      if (!v) return;
      var l = $('label[for="' + el.id + '"]', form);
      rows.push({ label: l ? l.textContent.replace(/[*]/g, "").replace(/\(.*?\)/g, "").trim() : el.name, value: v });
    });
    return rows;
  }
  function makePdf(title, rows) {
    var J = window.jspdf && window.jspdf.jsPDF;
    if (!J) return null;
    var d = new J({ unit: "mm", format: "a4" }), W = 210, H = 297, m = 18, y;
    function chrome() {
      d.setFillColor(10, 35, 81); d.rect(0, 0, W, 34, "F");
      d.setFillColor(246, 186, 74); d.rect(0, 34, W, 2, "F");
      d.setTextColor(255, 255, 255); d.setFont("helvetica", "bold"); d.setFontSize(17); d.text(clean(ORG), m, 16);
      d.setFont("helvetica", "normal"); d.setFontSize(10); d.text("Save a Soul, Save a Generation.", m, 24);
    }
    function footer() {
      d.setDrawColor(221, 226, 238); d.line(m, H - 16, W - m, H - 16);
      d.setFont("helvetica", "normal"); d.setFontSize(8.5); d.setTextColor(87, 96, 122);
      d.text("anagkazooutreach@gmail.com  |  +256 749 541 324  |  +256 767 167 761  |  P.O. Box 118777, Wakiso, Uganda", m, H - 10);
    }
    chrome();
    d.setTextColor(10, 35, 81); d.setFont("helvetica", "bold"); d.setFontSize(16); d.text(clean(title), m, 50);
    d.setFont("helvetica", "normal"); d.setFontSize(9); d.setTextColor(87, 96, 122);
    d.text("Submitted from the website on " + new Date().toLocaleString("en-GB"), m, 57);
    y = 70;
    rows.forEach(function (r) {
      var lines = d.splitTextToSize(clean(r.value), W - 2 * m - 8), h = lines.length * 5.2 + 13;
      if (y + h > H - 24) { footer(); d.addPage(); y = 20; }
      d.setFillColor(244, 246, 251); d.roundedRect(m, y - 6, W - 2 * m, h, 2.5, 2.5, "F");
      d.setFont("helvetica", "bold"); d.setFontSize(9); d.setTextColor(147, 18, 29); d.text(clean(r.label), m + 4, y);
      d.setFont("helvetica", "normal"); d.setFontSize(11); d.setTextColor(20, 33, 61); d.text(lines, m + 4, y + 6.5);
      y += h + 3;
    });
    footer();
    return d;
  }
  function saveBlob(b, n) {
    var u = URL.createObjectURL(b), a = doc.createElement("a");
    a.href = u; a.download = n;
    doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 5000);
  }
  function viaLink(r) {
    if (r.blob) saveBlob(r.blob, r.name);
    window.open(waLink(r.text + (r.blob ? "\n\nI am attaching a PDF copy of these details." : "")), "_blank", "noopener");
    if (r.blob) toast("PDF saved. Attach it in the WhatsApp chat.");
  }
  function sendWhatsApp(r) {
    var mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (mobile && r.file && navigator.canShare && navigator.canShare({ files: [r.file] })) {
      navigator.share({ files: [r.file], title: r.title, text: r.text }).catch(function (err) {
        if (err && err.name !== "AbortError") viaLink(r);
      });
      return;
    }
    viaLink(r);
  }

  var modal, modalLast;
  function closeModal(reset) {
    if (!modal) return;
    modal.classList.remove("open");
    doc.body.classList.remove("modal-open");
    if (reset && reset.form) reset.form.reset();
    if (modalLast) modalLast.focus();
  }
  function openResult(r) {
    if (!modal) {
      modal = doc.createElement("div");
      modal.className = "modal";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "modal-title");
      doc.body.appendChild(modal);
      modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
    }
    var ok = !!r.blob;
    modal.innerHTML =
      '<div class="modal-card">' +
      '<div class="modal-ico' + (ok ? "" : " warn") + '">' + ico(ok ? "check-circle" : "file") + "</div>" +
      '<h3 id="modal-title">' + (ok ? "Your message is ready" : "Send your message on WhatsApp") + "</h3>" +
      (ok ? '<span class="pdf-chip">' + ico("file") + r.name + "</span>" : "") +
      "<p>" + (ok
        ? "We turned your details into a PDF. Tap the button to send it to us on WhatsApp."
        : "We could not create the PDF just now, but we can still send your details as a WhatsApp message.") + "</p>" +
      '<div class="modal-actions">' +
      '<button class="btn wa" type="button" data-act="send">' + ico("whatsapp", "fill") + (ok ? "Send PDF on WhatsApp" : "Send on WhatsApp") + "</button>" +
      (ok ? '<button class="btn ghost" type="button" data-act="save">' + ico("download") + "Download PDF</button>" : "") +
      '<button class="btn ghost" type="button" data-act="close">Done</button>' +
      "</div>" +
      (ok ? '<p class="modal-fine">On a phone, pick WhatsApp from the share list and choose our chat. On a computer, the PDF downloads and WhatsApp opens so you can attach it.</p>' : "") +
      "</div>";
    $('[data-act="send"]', modal).addEventListener("click", function () { sendWhatsApp(r); });
    var sv = $('[data-act="save"]', modal);
    if (sv) sv.addEventListener("click", function () { saveBlob(r.blob, r.name); });
    $('[data-act="close"]', modal).addEventListener("click", function () { closeModal(r); });
    modalLast = doc.activeElement;
    doc.body.classList.add("modal-open");
    modal.classList.add("open");
    $('[data-act="send"]', modal).focus();
  }
  $$("form[data-wa-form]").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var title = f.getAttribute("data-title") || "Message", rows = collect(f);
      var text = "*" + title + "* for " + ORG + "\n\n" + rows.map(function (r) { return "*" + r.label + ":* " + r.value; }).join("\n");
      var pdf = null;
      try { pdf = makePdf(title, rows); } catch (err) { pdf = null; }
      var d = new Date(), stamp = d.getFullYear() + ("0" + (d.getMonth() + 1)).slice(-2) + ("0" + d.getDate()).slice(-2);
      var name = "Anagkazo-" + title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + stamp + ".pdf";
      var blob = pdf ? pdf.output("blob") : null, file = null;
      if (blob) { try { file = new File([blob], name, { type: "application/pdf" }); } catch (err) { file = null; } }
      openResult({ title: title, text: text, blob: blob, file: file, name: name, form: f });
    });
  });

  /* ---------- newsletter ---------- */
  var nf = $("#newsletter-form");
  if (nf) nf.addEventListener("submit", function (e) {
    e.preventDefault();
    var em = $("#newsletter-email").value.trim();
    window.open(waLink("Hello " + ORG + ", please add " + em + " to your updates list. Thank you!"), "_blank", "noopener");
    nf.reset();
    toast("Opening WhatsApp to confirm your sign-up");
  });

  /* ---------- keyboard ---------- */
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (modal && modal.classList.contains("open")) closeModal();
      else if (lb && lb.classList.contains("open")) closeLb();
      else setNav(false);
    } else if (lb && lb.classList.contains("open")) {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") {
        var f = $$("button", lb).filter(function (b) { return b.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { last.focus(); e.preventDefault(); }
        else if (!e.shiftKey && doc.activeElement === last) { first.focus(); e.preventDefault(); }
      }
    }
  });
})();
