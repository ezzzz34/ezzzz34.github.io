/* =========================================================================
 *  화면을 그리는 코드입니다. 내용 수정은 config.js 에서 하세요.
 * ========================================================================= */
(function () {
  "use strict";

  var C = window.INVITATION;
  if (!C) {
    console.error("config.js 를 불러오지 못했습니다.");
    return;
  }

  /* ---------- 유틸 ---------- */
  function get(path) {
    return path.split(".").reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, C);
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function digits(s) { return String(s || "").replace(/[^0-9+]/g, ""); }

  /* 사진 파일이 아직 없을 때 보여줄 자리표시 이미지 (연한 베이지 그라데이션) */
  function placeholder(label) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="#f3ede5"/><stop offset="100%" stop-color="#d8c9b8"/>' +
      '</linearGradient></defs>' +
      '<rect width="600" height="600" fill="url(#g)"/>' +
      '<text x="300" y="300" text-anchor="middle" dominant-baseline="middle" ' +
      'font-family="serif" font-size="30" fill="#ffffff" opacity="0.85">' + label + '</text>' +
      '</svg>';
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }
  function withFallback(img, label) {
    img.addEventListener("error", function handler() {
      img.removeEventListener("error", handler);
      img.src = placeholder(label);
    });
  }

  /* ---------- 1) data-bind 로 텍스트/속성 채우기 ---------- */
  $$("[data-bind]").forEach(function (node) {
    var v = get(node.getAttribute("data-bind"));
    if (v != null) node.textContent = v;
  });
  $$("[data-bind-src]").forEach(function (node) {
    var v = get(node.getAttribute("data-bind-src"));
    if (v) { withFallback(node, "PHOTO"); node.setAttribute("src", v); }
  });
  $$("[data-bind-href]").forEach(function (node) {
    var raw = node.getAttribute("data-bind-href");       // 예: "tel:wedding.venue.tel"
    var i = raw.indexOf(":");
    var scheme = i > -1 ? raw.slice(0, i) : "";
    var path = i > -1 ? raw.slice(i + 1) : raw;
    var v = get(path);
    if (!v) { node.remove(); return; }
    node.setAttribute("href", scheme ? scheme + ":" + digits(v) : v);
  });

  /* ---------- 2) 예식 일시 ---------- */
  var WEEK = ["일", "월", "화", "수", "목", "금", "토"];
  var wd = new Date(C.wedding.date);

  var dateSlot = $('[data-slot="wedding-date"]');
  if (dateSlot) {
    dateSlot.textContent =
      wd.getFullYear() + "년 " + (wd.getMonth() + 1) + "월 " + wd.getDate() + "일 " +
      WEEK[wd.getDay()] + "요일";
  }
  var timeSlot = $('[data-slot="wedding-time"]');
  if (timeSlot) {
    var h = wd.getHours();
    var ampm = h < 12 ? "오전" : "오후";
    var h12 = h % 12 === 0 ? 12 : h % 12;
    var min = wd.getMinutes();
    timeSlot.textContent = ampm + " " + h12 + "시" + (min ? " " + min + "분" : "");
  }

  /* ---------- 3) 달력 ---------- */
  var calSlot = $('[data-slot="calendar"]');
  if (calSlot && C.options.showCalendar) {
    var y = wd.getFullYear(), m = wd.getMonth();
    var first = new Date(y, m, 1).getDay();
    var last = new Date(y, m + 1, 0).getDate();

    var table = el("table");
    var thead = el("thead");
    var trh = el("tr");
    WEEK.forEach(function (w) { trh.appendChild(el("th", null, w)); });
    thead.appendChild(trh);
    table.appendChild(thead);

    var tbody = el("tbody");
    var tr = el("tr");
    for (var i = 0; i < first; i++) tr.appendChild(el("td", "is-empty", " "));
    for (var d = 1; d <= last; d++) {
      if ((first + d - 1) % 7 === 0 && d !== 1) { tbody.appendChild(tr); tr = el("tr"); }
      var td = el("td");
      if (d === wd.getDate()) {
        td.className = "is-wedding";
        td.appendChild(el("span", null, String(d)));
      } else {
        td.textContent = String(d);
      }
      tr.appendChild(td);
    }
    while (tr.children.length < 7) tr.appendChild(el("td", "is-empty", " "));
    tbody.appendChild(tr);
    table.appendChild(tbody);
    calSlot.appendChild(table);
  } else if (calSlot) {
    calSlot.remove();
  }

  /* ---------- 4) D-day ---------- */
  var ddaySlot = $('[data-slot="dday"]');
  if (ddaySlot && C.options.showDday) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var target = new Date(wd.getFullYear(), wd.getMonth(), wd.getDate());
    var diff = Math.round((target - today) / 86400000);
    var names = C.couple.groom.name + " ♥ " + C.couple.bride.name;
    if (diff > 0) {
      ddaySlot.innerHTML = names + " 결혼식이 <strong>" + diff + "일</strong> 남았습니다.";
    } else if (diff === 0) {
      ddaySlot.innerHTML = "오늘은 <strong>" + names + "</strong> 결혼식입니다.";
    } else {
      ddaySlot.innerHTML = names + " 결혼식으로부터 <strong>" + Math.abs(diff) + "일</strong> 지났습니다.";
    }
  } else if (ddaySlot) {
    ddaySlot.remove();
  }

  /* ---------- 5) 갤러리 + 라이트박스 ---------- */
  var gallerySlot = $('[data-slot="gallery"]');
  var images = (C.gallery && C.gallery.images) || [];
  if (gallerySlot) {
    images.forEach(function (src, idx) {
      var btn = el("button");
      btn.type = "button";
      btn.setAttribute("aria-label", "사진 " + (idx + 1) + " 크게 보기");
      var img = el("img");
      img.alt = "웨딩 사진 " + (idx + 1);
      img.loading = "lazy";
      withFallback(img, String(idx + 1));
      img.src = src;
      btn.appendChild(img);
      btn.addEventListener("click", function () { openLightbox(idx); });
      gallerySlot.appendChild(btn);
    });
  }

  var lb = $('[data-slot="lightbox"]');
  var lbImg = lb && $(".lightbox__img", lb);
  var lbCount = lb && $(".lightbox__count", lb);
  var cur = 0;

  function openLightbox(i) {
    if (!lb || !images.length) return;
    cur = i;
    render();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    if (!lb) return;
    lb.hidden = true;
    document.body.style.overflow = "";
  }
  function move(step) {
    cur = (cur + step + images.length) % images.length;
    render();
  }
  function render() {
    lbImg.src = images[cur];
    lbCount.textContent = (cur + 1) + " / " + images.length;
  }
  if (lb) {
    $(".lightbox__close", lb).addEventListener("click", closeLightbox);
    $(".lightbox__nav--prev", lb).addEventListener("click", function () { move(-1); });
    $(".lightbox__nav--next", lb).addEventListener("click", function () { move(1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLightbox(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") move(-1);
      if (e.key === "ArrowRight") move(1);
    });
  }

  /* ---------- 6) 연락처 ---------- */
  var contactSlot = $('[data-slot="contact"]');
  if (contactSlot) {
    []
      .concat(C.contact.groomSide || [], C.contact.brideSide || [])
      .filter(function (p) { return p && p.phone; })
      .forEach(function (p) {
        var row = el("div", "contact-row");
        row.appendChild(el("span", "contact-row__label", p.label));
        row.appendChild(el("span", "contact-row__name", p.name));

        var actions = el("div", "contact-row__actions");
        var call = el("a", "icon-btn", "☎");
        call.href = "tel:" + digits(p.phone);
        call.setAttribute("aria-label", p.name + " 에게 전화");
        var sms = el("a", "icon-btn", "✉");
        sms.href = "sms:" + digits(p.phone);
        sms.setAttribute("aria-label", p.name + " 에게 문자");
        actions.appendChild(call);
        actions.appendChild(sms);

        row.appendChild(actions);
        contactSlot.appendChild(row);
      });
  }

  /* ---------- 7) 복사 / 공유 ---------- */
  var toast = $('[data-slot="toast"]');
  var toastTimer;
  function showToast(msg) {
    if (!toast) return;
    toast.textContent = msg;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.hidden = true; }, 1800);
  }
  function copy(text, msg) {
    var done = function () { showToast(msg); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else {
      fallback();
    }
    function fallback() {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); done(); } catch (e) { showToast("복사에 실패했습니다"); }
      document.body.removeChild(ta);
    }
  }

  $$('[data-action="copy-address"]').forEach(function (btn) {
    btn.addEventListener("click", function () {
      copy(C.wedding.venue.address, "주소가 복사되었습니다");
    });
  });

  var shareSlot = $('[data-slot="share"]');
  if (shareSlot && C.options.shareButton) {
    var b = el("button", "btn", "청첩장 링크 복사");
    b.type = "button";
    b.addEventListener("click", function () {
      copy(location.href, "링크가 복사되었습니다");
    });
    shareSlot.appendChild(b);
  }

  /* ---------- 8) 스크롤 등장 애니메이션 ---------- */
  var targets = $$(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add("is-visible"); });
  }

  /* ---------- 9) 문서 제목 자동 반영 ---------- */
  document.title = C.couple.groom.name + " ♥ " + C.couple.bride.name + " 결혼합니다";
})();
