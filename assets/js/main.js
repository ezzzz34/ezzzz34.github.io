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

  /* 고인(故) 표시용 국화 아이콘 */
  function chrysanthemum() {
    var petals = "";
    for (var i = 0; i < 12; i++) {
      petals += '<ellipse cx="12" cy="6.4" rx="2.1" ry="5.4" fill="none" ' +
                'stroke="currentColor" stroke-width=".8" ' +
                'transform="rotate(' + (i * 30) + ' 12 12)"/>';
    }
    // width/height 속성을 함께 주어야 iOS 사파리에서 크기가 커지지 않습니다
    return '<svg class="chrysanthemum" width="12" height="12" viewBox="0 0 24 24" ' +
           'preserveAspectRatio="xMidYMid meet" aria-hidden="true">' +
           petals + '<circle cx="12" cy="12" r="2.6" fill="currentColor"/></svg>';
  }

  /* ---------- 1) data-bind 로 텍스트/속성 채우기 ---------- */
  $$("[data-bind]").forEach(function (node) {
    var v = get(node.getAttribute("data-bind"));
    if (v == null || v === "") { node.hidden = true; return; }   // 빈 값이면 숨김
    node.textContent = v;
  });
  $$("[data-bind-src]").forEach(function (node) {
    var v = get(node.getAttribute("data-bind-src"));
    if (v) { withFallback(node, "PHOTO"); node.setAttribute("src", v); }
  });
  // 혼주 성함 : deceased 가 true 면 이름 앞에 국화 표시를 붙입니다
  $$("[data-parent]").forEach(function (node) {
    var p = get(node.getAttribute("data-parent"));
    if (!p || !p.name) { node.hidden = true; return; }
    node.innerHTML = p.deceased ? chrysanthemum() : "";
    node.appendChild(document.createTextNode(p.name));
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

  /* ---------- 1-1) 커버 봉투 열기 애니메이션 ----------
   * 메인 사진이 다 불러와진 뒤(최대 2.5초 대기) 봉투를 엽니다.
   * '동작 줄이기' 설정 사용자는 애니메이션 없이 바로 열린 상태로 보여줍니다. */
  var envelope = $('[data-slot="envelope"]');
  if (envelope) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var opened = false;
    var openEnvelope = function () {
      if (opened) return;
      opened = true;
      envelope.classList.remove("is-closed");
      if (!reduce) envelope.classList.add("is-opening");
    };
    if (reduce) {
      openEnvelope();
    } else {
      var coverImg = $("img", envelope);
      var go = function () { setTimeout(openEnvelope, 250); };
      if (!coverImg || (coverImg.complete && coverImg.naturalWidth)) go();
      else {
        coverImg.addEventListener("load", go, { once: true });
        coverImg.addEventListener("error", go, { once: true });
      }
      setTimeout(openEnvelope, 2500);
    }
  }

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
    for (var i = 0; i < first; i++) tr.appendChild(el("td", "is-empty", " "));
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
    while (tr.children.length < 7) tr.appendChild(el("td", "is-empty", " "));
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

  /* ---------- 5-1) 지도 · 지도 앱 버튼 · 오시는 길 ---------- */
  var venue = C.wedding.venue || {};
  var mapSlot = $('[data-slot="map"]');
  if (mapSlot && venue.mapQuery) {
    var iframe = el("iframe");
    iframe.title = venue.name + " 지도";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    iframe.src = "https://maps.google.com/maps?hl=ko&z=16&output=embed&q=" +
                 encodeURIComponent(venue.mapQuery);
    mapSlot.appendChild(iframe);
  } else if (mapSlot) {
    mapSlot.remove();
  }

  var appsSlot = $('[data-slot="map-apps"]');
  if (appsSlot) {
    var q = encodeURIComponent(venue.searchName || venue.name);
    [
      { name: "네이버지도", cls: "naver", href: "https://map.naver.com/p/search/" + q },
      { name: "카카오맵",   cls: "kakao", href: "https://map.kakao.com/link/search/" + q },
      { name: "티맵",       cls: "tmap",  href: "tmap://search?name=" + q },
    ].forEach(function (a) {
      var link = el("a", "map-app map-app--" + a.cls);
      link.href = a.href;
      if (a.href.indexOf("http") === 0) { link.target = "_blank"; link.rel = "noopener"; }
      link.appendChild(el("span", "map-app__dot"));
      link.appendChild(document.createTextNode(a.name));
      appsSlot.appendChild(link);
    });
  }

  var ICONS = {
    car: '<path d="M5 17h14M5 17v2.2M19 17v2.2M3.5 12.5 5.6 7.3A2 2 0 0 1 7.5 6h9a2 2 0 0 1 1.9 1.3l2.1 5.2M3.5 12.5h17v4.5h-17z" /><circle cx="7.5" cy="14.8" r=".9" /><circle cx="16.5" cy="14.8" r=".9" />',
    bus: '<rect x="5" y="3.5" width="14" height="14.5" rx="2.5" /><path d="M5 11h14M8 18v2.3M16 18v2.3M9 6.5h6" /><circle cx="8.3" cy="14.5" r=".9" /><circle cx="15.7" cy="14.5" r=".9" />',
    subway: '<rect x="6" y="3.5" width="12" height="13.5" rx="3" /><path d="M6 10.5h12M9 17l-2.5 3.5M15 17l2.5 3.5M8 20.5h8" /><circle cx="9" cy="13.8" r=".9" /><circle cx="15" cy="13.8" r=".9" />',
  };
  var dirSlot = $('[data-slot="directions"]');
  var dirs = C.wedding.directions || [];
  if (dirSlot && dirs.length) {
    dirs.forEach(function (d) {
      var item = el("div", "direction");
      var head = el("div", "direction__head");
      var icon = el("span", "direction__icon");
      icon.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[d.icon] || "") + "</svg>";
      head.appendChild(icon);
      head.appendChild(el("h3", "direction__title", d.title));
      item.appendChild(head);

      var list = el("ul", "direction__list");
      var badgeRow = null;
      (d.lines || []).forEach(function (line) {
        if (typeof line === "string") {
          badgeRow = null;
          list.appendChild(el("li", null, line));
          return;
        }
        // 배지 줄 : 연속된 배지(예: 1호선, 2호선)는 한 줄에 모읍니다
        if (!badgeRow || line.items.length) {
          var li = el("li", "direction__badges");
          list.appendChild(li);
          badgeRow = line.items.length ? null : li;
          var target = li;
        } else {
          target = badgeRow;
        }
        var badge = el("span", "badge", line.label);
        badge.style.background = line.color;
        target.appendChild(badge);
        line.items.forEach(function (n) {
          var num = el("span", "bus-no", n);
          num.style.color = line.color;
          target.appendChild(num);
        });
      });
      item.appendChild(list);
      dirSlot.appendChild(item);
    });
  } else if (dirSlot) {
    dirSlot.remove();
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

    // 전화번호가 하나도 없으면 연락처 섹션 자체를 감춥니다
    if (!contactSlot.children.length) {
      var section = contactSlot.closest ? contactSlot.closest(".section") : null;
      if (section) section.hidden = true;
    }
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

  /* ---------- 8) 배경음악 (config 의 options.bgm 에 파일 경로가 있을 때만) ---------- */
  var musicBtn = $('[data-slot="music"]');
  if (musicBtn) {
    if (!C.options.bgm) {
      musicBtn.remove();
    } else {
      var audio = new Audio(C.options.bgm);
      audio.loop = true;
      musicBtn.addEventListener("click", function () {
        if (audio.paused) {
          audio.play().then(function () {
            musicBtn.classList.add("is-playing");
          }, function () {
            showToast("브라우저가 음악 재생을 막았습니다");
          });
        } else {
          audio.pause();
          musicBtn.classList.remove("is-playing");
        }
      });
    }
  }

  /* ---------- 9) 스크롤 등장 애니메이션 ---------- */
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

  /* ---------- 10) 문서 제목 자동 반영 ---------- */
  document.title = C.couple.groom.name + " ♥ " + C.couple.bride.name + " 결혼합니다";
})();
