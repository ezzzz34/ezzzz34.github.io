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

  /* ---------- 1-0) 새로고침 시 항상 맨 위에서 시작 ----------
   * <head> 에서 scrollRestoration 을 manual 로 바꿨지만, iOS 사파리는 로드 직후에도
   * 위치를 되돌리는 경우가 있어 load / pageshow 시점에 한 번 더 맨 위로 올립니다.
   * (html 의 scroll-behavior: smooth 때문에 스르륵 올라가지 않도록 잠시 끕니다) */
  function toTop() {
    if (location.hash) return;                          // #주소로 들어온 경우는 그대로 둠
    var root = document.documentElement;
    var prev = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);
    root.style.scrollBehavior = prev;
  }
  toTop();
  window.addEventListener("load", toTop);
  window.addEventListener("pageshow", function (e) { if (!e.persisted) toTop(); });

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
      // 사진이 다 올라온 뒤 눈 내리기 시작
      setTimeout(startSnow, reduce ? 0 : 2300);
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

  /* ---------- 1-2) 페이지 전체 뒤에서 내리는 눈 ----------
   * 화면 크기의 고정 캔버스(청첩장 내용 뒤)에 눈송이를 그립니다.
   * 흰 바탕에서도 보이도록 옅은 회청색이고, 크기가 클수록 가깝게(진하고 빠르게) 보입니다.
   * 다른 앱으로 나가 있으면 멈춰서 배터리를 아낍니다. */
  function startSnow() {
    var canvas = $('[data-slot="snow"]');
    if (!canvas || !canvas.getContext || startSnow.started) return;
    startSnow.started = true;
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, flakes = [], running = false, last = 0;

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var want = Math.min(90, Math.round(W * H / 7500));  // 폰 약 45개, PC 최대 90개
      while (flakes.length < want) flakes.push(flake(true));
      flakes.length = want;
    }
    function flake(anywhere) {
      var depth = Math.random();                          // 0 = 멀리, 1 = 가까이
      var r = 1.2 + depth * 2.6;                          // 반지름 1.2 ~ 3.8px
      return {
        x: Math.random() * W,
        y: anywhere ? Math.random() * H : -r * 2,
        r: r,
        vy: 14 + depth * 30 + Math.random() * 6,         // 초당 낙하 px
        amp: 8 + Math.random() * 18,
        freq: 0.3 + Math.random() * 0.6,
        phase: Math.random() * Math.PI * 2,
        a: 0.28 + depth * 0.42,
      };
    }
    function frame(t) {
      if (!running) return;
      var dt = last ? Math.min((t - last) / 1000, 0.05) : 0.016;
      last = t;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < flakes.length; i++) {
        var f = flakes[i];
        f.y += f.vy * dt;
        f.phase += f.freq * dt;
        if (f.y - f.r > H) { flakes[i] = flake(false); continue; }
        ctx.beginPath();
        ctx.arc(f.x + Math.sin(f.phase) * f.amp, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(178,190,206," + f.a + ")";
        ctx.fill();
      }
      requestAnimationFrame(frame);
    }
    function play() {
      if (running || document.hidden) return;
      running = true; last = 0; requestAnimationFrame(frame);
    }

    resize();
    canvas.classList.add("is-on");
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) running = false; else play();
    });
    play();
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

  /* ---------- 5) 갤러리 (9장씩 넘기는 썸네일) + 라이트박스 ---------- */
  var G = C.gallery || {};
  var folder = G.folder || "";
  var PER = G.perPage || 9;
  var images = (G.images || []).map(function (n) {
    return { full: folder + n + ".jpg", thumb: folder + n + "-thumb.jpg" };
  });

  /* 확대용 사진 미리 받아두기 — 한 번 받은 건 브라우저 캐시에 남아 팝업이 바로 뜹니다 */
  var loaded = {};
  function preloadFull(i) {
    var im = images[(i + images.length) % images.length];
    if (!im || loaded[im.full]) return;
    var p = new Image();
    p.decoding = "async";
    p.onload = function () { loaded[im.full] = "done"; };
    loaded[im.full] = "loading";
    p.src = im.full;
  }
  function preloadPage(pg) {
    for (var i = pg * PER; i < Math.min((pg + 1) * PER, images.length); i++) preloadFull(i);
  }

  var track = $('[data-slot="gallery"]');
  var dotsSlot = $('[data-slot="gallery-dots"]');
  var pages = Math.ceil(images.length / PER);
  var page = 0;
  var galleryWrap = track && track.closest(".gallery");
  var prevArrow = galleryWrap && $(".gallery__arrow--prev", galleryWrap);
  var nextArrow = galleryWrap && $(".gallery__arrow--next", galleryWrap);
  var galleryVisible = false;

  function goPage(pg) {
    page = Math.max(0, Math.min(pages - 1, pg));
    track.style.transform = "translateX(" + (-100 * page) + "%)";
    prevArrow.disabled = page === 0;
    nextArrow.disabled = page === pages - 1;
    $$(".gallery__dot", dotsSlot).forEach(function (d, i) { d.classList.toggle("is-active", i === page); });
    // 보고 있는 묶음과 다음 묶음의 썸네일을 즉시 받아둠
    $$(".gallery__page", track).forEach(function (pgEl, i) {
      if (Math.abs(i - page) <= 1) $$("img[data-src]", pgEl).forEach(function (img) {
        img.src = img.getAttribute("data-src"); img.removeAttribute("data-src");
      });
    });
    if (galleryVisible) preloadPage(page);
  }

  if (track && images.length) {
    for (var pg = 0; pg < pages; pg++) {
      var pageEl = el("div", "gallery__page");
      for (var k = pg * PER; k < Math.min((pg + 1) * PER, images.length); k++) {
        (function (idx) {
          var btn = el("button", "gallery__item");
          btn.type = "button";
          btn.setAttribute("aria-label", "사진 " + (idx + 1) + " 크게 보기");
          var img = el("img");
          img.alt = "웨딩 사진 " + (idx + 1);
          img.decoding = "async";
          withFallback(img, String(idx + 1));
          img.setAttribute("data-src", images[idx].thumb);
          btn.appendChild(img);
          btn.addEventListener("click", function () { openLightbox(idx); });
          pageEl.appendChild(btn);
        })(k);
      }
      track.appendChild(pageEl);
      if (dotsSlot && pages > 1) {
        (function (target) {
          var d = el("button", "gallery__dot");
          d.type = "button";
          d.setAttribute("aria-label", (target + 1) + "번째 사진 묶음");
          d.addEventListener("click", function () { goPage(target); });
          dotsSlot.appendChild(d);
        })(pg);
      }
    }
    if (pages < 2) { prevArrow.hidden = true; nextArrow.hidden = true; }
    prevArrow.addEventListener("click", function () { goPage(page - 1); });
    nextArrow.addEventListener("click", function () { goPage(page + 1); });

    // 썸네일 묶음 좌우로 밀어서 넘기기
    var vp = $(".gallery__viewport", galleryWrap), gx = null, gy = null;
    vp.addEventListener("touchstart", function (e) { gx = e.touches[0].clientX; gy = e.touches[0].clientY; }, { passive: true });
    vp.addEventListener("touchend", function (e) {
      if (gx == null) return;
      var dx = e.changedTouches[0].clientX - gx, dy = e.changedTouches[0].clientY - gy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) goPage(page + (dx < 0 ? 1 : -1));
      gx = gy = null;
    });

    // 갤러리가 화면에 가까워지면(400px 전) 지금 묶음의 확대 사진을 미리 받기 시작
    if ("IntersectionObserver" in window) {
      var gio = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { galleryVisible = true; preloadPage(page); gio.disconnect(); }
      }, { rootMargin: "400px 0px" });
      gio.observe(galleryWrap);
    } else { galleryVisible = true; }
    goPage(0);
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
    if (track) goPage(Math.floor(cur / PER));           // 팝업에서 넘겨 본 위치의 묶음으로 맞춤
  }
  function move(step) {
    cur = (cur + step + images.length) % images.length;
    render();
  }
  /* 팝업 표시 : 이미 받아둔 썸네일을 즉시 보여주고(같은 비율), 확대 사진이 준비되면 바꿔 끼웁니다.
     → 빈 화면에 X 만 떠 있는 순간이 없어집니다. */
  function fit() {
    var w = lbImg.naturalWidth, h = lbImg.naturalHeight;
    if (!w || !h) return;
    var s = Math.min(Math.min(window.innerWidth * 0.84, 520) / w, window.innerHeight * 0.78 / h);
    lbImg.style.width = Math.round(w * s) + "px";
    lbImg.style.height = Math.round(h * s) + "px";
  }
  if (lbImg) {
    lbImg.addEventListener("load", fit);
    window.addEventListener("resize", fit);
  }
  function render() {
    var im = images[cur], want = cur;
    lbImg.alt = "웨딩 사진 " + (cur + 1);
    lbCount.textContent = (cur + 1) + " / " + images.length;
    if (loaded[im.full] === "done") {
      lbImg.src = im.full;
      lbImg.classList.remove("is-preview");
    } else {
      lbImg.src = im.thumb;
      lbImg.classList.add("is-preview");
      var full = new Image();
      full.onload = function () {
        loaded[im.full] = "done";
        if (cur === want) { lbImg.src = im.full; lbImg.classList.remove("is-preview"); }
      };
      full.src = im.full;
    }
    preloadFull(cur + 1); preloadFull(cur - 1);         // 양옆 사진 미리 받기
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
    // 손가락으로 좌우 밀어서 넘기기
    var sx = null, sy = null;
    lb.addEventListener("touchstart", function (e) {
      sx = e.touches[0].clientX; sy = e.touches[0].clientY;
    }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (sx == null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1);
      sx = sy = null;
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

  /* ---------- 8) 배경음악 ----------
   * 기본은 '켜짐'. 브라우저는 소리 있는 자동재생을 막기 때문에
   * 접속 즉시 재생을 시도하고, 막히면 사용자의 첫 터치/클릭 때 재생합니다.
   * 버튼을 누르면 꺼짐 ↔ 켜짐 전환. 다른 앱으로 나가면 잠시 멈췄다가 돌아오면 이어서 재생. */
  var musicBtn = $('[data-slot="music"]');
  if (musicBtn) {
    if (!C.options.bgm) {
      musicBtn.remove();
    } else {
      var audio = new Audio(C.options.bgm);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = 0.6;
      var wantOn = true;
      var label = $(".music-btn__label", musicBtn);

      var paint = function () {
        musicBtn.classList.toggle("is-on", wantOn);
        musicBtn.setAttribute("aria-pressed", String(wantOn));
        musicBtn.setAttribute("aria-label", wantOn ? "배경음악 끄기" : "배경음악 켜기");
        label.textContent = wantOn ? "ON" : "OFF";
      };
      var tryPlay = function () {
        if (!wantOn || document.hidden || !audio.paused) return;
        var p = audio.play();
        if (p && p.then) p.then(stopUnlock, function () { /* 아직 허용 안 됨 → 다음 터치 때 재시도 */ });
      };
      /* 브라우저는 '재생 허용'으로 인정하는 이벤트가 정해져 있습니다.
       * 터치 기기에서는 pointerdown 이 아니라 손을 뗄 때(pointerup / touchend)와 click 만 인정됩니다.
       * → 재생이 실제로 성공할 때까지 매 터치마다 다시 시도하고, 성공하면 그때 리스너를 해제합니다.
       *   (예전에는 첫 pointerdown 에서 실패하자마자 리스너를 전부 해제해 갤럭시 크롬에서 재생이 안 됐음) */
      var unlockEvents = ["pointerup", "touchend", "click", "keydown", "mousedown"];
      var unlock = function (e) {
        if (e && musicBtn.contains(e.target)) return;    // 버튼 클릭은 아래 토글에서 처리
        tryPlay();
      };
      var stopUnlock = function () {
        unlockEvents.forEach(function (n) { document.removeEventListener(n, unlock, true); });
      };
      unlockEvents.forEach(function (n) { document.addEventListener(n, unlock, true); });

      musicBtn.addEventListener("click", function () {
        wantOn = !wantOn;
        paint();
        if (wantOn) tryPlay(); else audio.pause();
      });
      document.addEventListener("visibilitychange", function () {
        if (document.hidden) audio.pause(); else tryPlay();
      });
      paint();
      tryPlay();
    }
  }

  /* ---------- 8-1) View Details 를 눌러야 아래 내용이 열림 ----------
   * 처음에는 커버만 있어서 드래그해도 더 내려가지 않습니다.
   * View Details '탭'은 브라우저가 소리 재생을 허용하는 동작이라, 이 순간 배경음악도 함께 시작됩니다
   * (탭은 문서 전체의 재생 대기 리스너가 받아 tryPlay 를 호출). 드래그/스크롤은 허용 동작이 아니어서
   * 이전에는 음악이 시작되지 않는 경우가 있었습니다.
   * #location 처럼 주소에 위치가 붙어 들어온 경우는 바로 열어 둡니다. */
  var paper = $(".paper");
  var unlockBtn = $('[data-action="unlock"]');
  if (paper && paper.classList.contains("is-locked")) {
    if (location.hash && location.hash !== "#cover") paper.classList.remove("is-locked");
    if (unlockBtn) {
      unlockBtn.addEventListener("click", function (e) {
        e.preventDefault();
        paper.classList.remove("is-locked");
        var target = $(unlockBtn.getAttribute("href"));
        requestAnimationFrame(function () {
          if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
        });
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
