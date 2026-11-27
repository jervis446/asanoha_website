/* Asanoha for investors: motion, the build chart and the verified contact flow. */
(function () {
  'use strict';
  /* Translated pages set window.INV_T; English is the key and the fallback. */
  var T = function (s) { var d = window.INV_T; return (d && d[s]) || s; };
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Language menu */
  var langBtn = document.getElementById('lang-btn');
  var langList = document.getElementById('lang-list');
  if (langBtn && langList) {
    var setLang = function (open) { langList.hidden = !open; langBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
    langBtn.addEventListener('click', function (e) { e.stopPropagation(); setLang(langList.hidden); });
    document.addEventListener('click', function (e) { if (!langList.hidden && !langList.contains(e.target)) setLang(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !langList.hidden) { setLang(false); langBtn.focus(); } });
  }

  /* Theme */
  var themeBtn = document.getElementById('theme-btn');
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function applyTheme(next) {
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('asanoha:investors-theme', next);
      // shared with the store, which saves 'day' / 'night' as JSON
      var st = JSON.stringify(next === 'dark' ? 'night' : 'day');
      localStorage.setItem('asanoha:theme', st); localStorage.setItem('asanoha:themePref', st);
    } catch (e) {}
    drawChart();
    dotClips.forEach(function (c) { c.redraw(); });
  }
  // Same reveal as Kosmik on the web: a circle of the new theme grows from the button, about 400 ms
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    if (!document.startViewTransition || reduce) { applyTheme(next); return; }
    var b = themeBtn.getBoundingClientRect();
    var x = b.left + b.width / 2, y = b.top + b.height / 2;
    var r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    var t = document.startViewTransition(function () { applyTheme(next); });
    t.ready.then(function () {
      root.animate(
        { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + r + 'px at ' + x + 'px ' + y + 'px)'] },
        { duration: 400, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' }
      );
    }).catch(function () {});
  });

  /* Nav border once the page scrolls */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Sections menu on narrow screens: the links collapse into one button */
  var menuBtn = document.getElementById('menu-btn');
  function setMenu(open) {
    nav.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) {
    menuBtn.addEventListener('click', function () { setMenu(!nav.classList.contains('open')); });
    document.getElementById('nav-links').addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); menuBtn.focus(); }
    });
    document.addEventListener('click', function (e) { if (nav.classList.contains('open') && !nav.contains(e.target)) setMenu(false); });
  }

  /* Header fit: step down (hide walkthrough link, hide tag, collapse links) until the row fits */
  var navRow = document.querySelector('.nav-row'), navLinks = document.getElementById('nav-links');
  function navOverflows() {
    return navRow.scrollWidth > navRow.clientWidth + 1 || (navLinks && navLinks.scrollWidth > navLinks.clientWidth + 1);
  }
  function fitNav() {
    if (!navRow) return;
    nav.classList.remove('fit-1', 'fit-2', 'fit-3');
    ['fit-1', 'fit-2', 'fit-3'].some(function (c) {
      if (!navOverflows()) return true;
      nav.classList.add(c);
      return false;
    });
    if (menuBtn && !nav.classList.contains('fit-3') && window.innerWidth > 980) setMenu(false);
  }
  var fitQueued = false;
  window.addEventListener('resize', function () {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(function () { fitQueued = false; fitNav(); });
  });
  fitNav();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitNav);

  /* Reveal on scroll */
  document.querySelectorAll('.handnote .hn-line').forEach(function (l, i) { l.style.setProperty('--i', i); });
  var revealables = document.querySelectorAll('.handnote, .section-head, .tier-head, .selfhost, .product, .rail, .comp-table, .chart-card, .shared-item, .faq, .person, .cta-inner, .stats');
  revealables.forEach(function (el) { el.classList.add('reveal'); });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' }) : null;
  revealables.forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  // rAF never fires in a background tab or a preview renderer, so also show the hero on a timer
  function showHero() { document.querySelectorAll('.rise').forEach(function (el) { el.classList.add('in'); }); }
  requestAnimationFrame(showHero); setTimeout(showHero, 400);

  /* Count up numbers the first time each one is seen */
  function countUp(el) {
    var target = Number(el.getAttribute('data-count'));
    if (reduce) return;
    var start = performance.now(), dur = 1400;
    (function tick(t) {
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = Math.round(target * eased).toLocaleString('en-IN');
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if (io) {
    var countIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        countUp(e.target);
        countIo.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll('[data-count]').forEach(function (el) { countIo.observe(el); });
  }

  /* Founder chapters: each clip is a tiny grayscale video drawn as a halftone of dots.
     The video only loads near the screen, plays while visible and pauses when it leaves. */
  var chapters = document.querySelectorAll('.chapter');
  var dotClips = [];

  function DotClip(fig) {
    var canvas = fig.querySelector('canvas');
    var ctx = canvas.getContext('2d');
    var sample = document.createElement('canvas');
    var sctx = sample.getContext('2d', { willReadFrequently: true });
    var video = document.createElement('video');
    video.muted = true; video.loop = true; video.playsInline = true; video.preload = 'none';
    video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
    var self = { fig: fig, video: video, visible: false, loaded: false, born: 0, raf: 0, last: 0, w: 0, h: 0, cols: 0, rows: 0, gap: 7, lo: 0, hi: 1, px: -1e3, py: -1e3, ready: false };

    function size() {
      var r = canvas.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      self.w = r.width; self.h = r.height;
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      self.gap = r.width < 260 ? 6 : 7;
      self.cols = Math.max(8, Math.floor(r.width / self.gap));
      self.rows = Math.max(8, Math.floor(r.height / self.gap));
      sample.width = self.cols; sample.height = self.rows;
    }

    function draw(now) {
      if (!self.w) return;
      var cols = self.cols, rows = self.rows, gap = self.gap;
      var css = getComputedStyle(root);
      var dark = isDark();
      ctx.clearRect(0, 0, self.w, self.h);
      if (!self.ready) return;
      sctx.drawImage(video, 0, 0, cols, rows);
      var d = sctx.getImageData(0, 0, cols, rows).data;
      // Stretch contrast per frame, smoothed, so dim dusk clips still read
      var lo = 255, hi = 0, i, l;
      for (i = 0; i < d.length; i += 4) { l = d[i]; if (l < lo) lo = l; if (l > hi) hi = l; }
      self.lo += (lo / 255 - self.lo) * 0.2; self.hi += (hi / 255 - self.hi) * 0.2;
      var span = Math.max(0.15, self.hi - self.lo);
      var maxR = gap * 0.5;
      var t = reduce ? 1 : Math.min(1, (now - self.born) / 1400);
      var cx = cols / 2, cy = rows / 2, maxDist = Math.sqrt(cx * cx + cy * cy);
      ctx.fillStyle = css.getPropertyValue(dark ? '--text' : '--text-2').trim();
      ctx.beginPath();
      for (var y = 0; y < rows; y++) {
        for (var x = 0; x < cols; x++) {
          l = (d[(y * cols + x) * 4] / 255 - self.lo) / span;
          l = l < 0 ? 0 : l > 1 ? 1 : l;
          var v = dark ? Math.pow(l, 1.3) : Math.pow(1 - l, 1.6);
          // Entrance: dots grow outward from the middle
          var dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy)) / maxDist;
          var grow = Math.min(1, Math.max(0, (t * 1.6 - dist * 0.6)));
          var px = x * gap + gap / 2, py = y * gap + gap / 2;
          // Pointer: dots swell a little under the cursor
          var dx = px - self.px, dy = py - self.py, near = dx * dx + dy * dy;
          var lens = near < 2500 ? 1 + 0.5 * (1 - near / 2500) : 1;
          var r = maxR * v * grow * lens;
          if (r < 0.35) continue;
          ctx.moveTo(px + r, py);
          ctx.arc(px, py, r, 0, 6.2832);
        }
      }
      ctx.fill();
    }

    function loop(now) {
      self.raf = 0;
      if (!self.visible) return;
      if (now - self.last > 1000 / 24) { self.last = now; draw(now); }
      self.raf = requestAnimationFrame(loop);
    }

    self.load = function () {
      if (self.loaded) return;
      self.loaded = true;
      video.src = fig.getAttribute('data-src');
      video.addEventListener('loadeddata', function () {
        self.ready = true;
        size();
        self.born = performance.now();
        if (reduce) { draw(performance.now()); return; }
        if (self.visible) self.play();
      }, { once: true });
      video.load();
    };
    self.play = function () {
      if (reduce || !self.ready) return;
      var pr = video.play(); if (pr && pr.catch) pr.catch(function () {});
      if (!self.raf) self.raf = requestAnimationFrame(loop);
    };
    self.pause = function () { video.pause(); };
    self.redraw = function () { size(); if (self.ready) draw(performance.now() + 1e5); };

    canvas.addEventListener('pointermove', function (e) {
      var r = canvas.getBoundingClientRect(); self.px = e.clientX - r.left; self.py = e.clientY - r.top;
    });
    canvas.addEventListener('pointerleave', function () { self.px = self.py = -1e3; });
    size();
    return self;
  }

  chapters.forEach(function (ch) { dotClips.push(DotClip(ch.querySelector('.clip'))); });
  var nearIo = io ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      dotClips[[].indexOf.call(chapters, e.target)].load();
      nearIo.unobserve(e.target);
    });
  }, { rootMargin: '600px 0px' }) : null;
  var clipIo = io ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var c = dotClips[[].indexOf.call(chapters, e.target)];
      c.visible = e.isIntersecting;
      if (e.isIntersecting) { e.target.classList.add('in'); c.load(); c.play(); }
      else c.pause();
    });
  }, { threshold: 0.2 }) : null;
  chapters.forEach(function (ch, i) {
    if (clipIo) { nearIo.observe(ch); clipIo.observe(ch); }
    else { ch.classList.add('in'); dotClips[i].visible = true; dotClips[i].load(); }
  });
  document.addEventListener('visibilitychange', function () {
    dotClips.forEach(function (c) { if (document.hidden) c.pause(); else if (c.visible) c.play(); });
  });
  var rd;
  window.addEventListener('resize', function () { clearTimeout(rd); rd = setTimeout(function () { dotClips.forEach(function (c) { c.redraw(); }); }, 150); });

  /* Market grids: 1,000 dots, each 0.1% of a market; the lit ones are our target */
  document.querySelectorAll('.dots').forEach(function (g) {
    var lit = Number(g.getAttribute('data-lit')) || 0;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 1000; i++) {
      var d = document.createElement('i');
      if (i >= 1000 - lit) d.className = 'lit';
      if (!reduce) d.style.transitionDelay = ((i % 40) * 8 + Math.floor(i / 40) * 12) + 'ms';
      frag.appendChild(d);
    }
    g.appendChild(frag);
    if (io) {
      new IntersectionObserver(function (es, o) {
        if (es[0].isIntersecting) { g.classList.add('in'); o.disconnect(); }
      }, { threshold: 0.3 }).observe(g);
    } else g.classList.add('in');
  });

  /* The three layers: a static SVG first, then the 3D stack when WebGL works and motion is allowed */
  var stack = document.getElementById('layers-3d');
  function goTo(id) {
    var t = document.getElementById(id);
    if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  if (stack) {
    stack.querySelectorAll('[data-go]').forEach(function (b) {
      b.addEventListener('click', function () { goTo(b.getAttribute('data-go')); });
    });
    var webgl = (function () {
      try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
    })();
    if (!reduce && webgl && 'IntersectionObserver' in window && 'ResizeObserver' in window) {
      var stage = stack.querySelector('.stack-stage');
      var src = (document.currentScript && document.currentScript.src) || '';
      var moduleUrl = new URL('stack3d.js?v=3', src || location.href).href;
      var go3d = function () {
        import(moduleUrl).then(function (m) {
          m.mount(stage, { onPick: function (k) {
            var b = stage.querySelector('[data-k="' + k + '"]');
            if (b) goTo(b.getAttribute('data-go'));
          } });
        }).catch(function () { /* the static SVG stays */ });
      };
      if ('requestIdleCallback' in window) requestIdleCallback(go3d, { timeout: 1200 }); else setTimeout(go3d, 300);
    }
  }

  /* Timeline: the line fills as you read */
  var timeline = document.querySelector('.timeline');
  var items = timeline.querySelectorAll('li');
  function onTimeline() {
    var r = timeline.getBoundingClientRect();
    var mid = window.innerHeight * 0.6;
    var p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    timeline.style.setProperty('--progress', (p * 100).toFixed(1) + '%');
    items.forEach(function (li) { li.classList.toggle('lit', li.getBoundingClientRect().top + 12 < mid); });
  }
  window.addEventListener('scroll', onTimeline, { passive: true });
  window.addEventListener('resize', onTimeline);
  onTimeline();

  /* Build chart: commits a week by product, from git history (21 Sep to 27 Nov 2026; the last week is 23 to 27 Nov) */
  var WEEKS = [T('21 Sep'), T('28 Sep'), T('5 Oct'), T('12 Oct'), T('19 Oct'), T('26 Oct'), T('2 Nov'), T('9 Nov'), T('16 Nov'), T('23 Nov')];
  var SERIES = [
    { k: 'store', name: T('Asanoha Store'), v: [13, 20, 0, 0, 0, 0, 0, 4, 3, 44] },
    { k: 'wearday', name: T('Wearday'), v: [0, 0, 0, 0, 0, 0, 35, 24, 1, 0] },
    { k: 'pp', name: T('People Pitchers'), v: [0, 0, 0, 0, 0, 0, 0, 19, 69, 149] },
    { k: 'kosmik', name: T('Kosmik'), v: [0, 0, 0, 0, 0, 0, 0, 32, 51, 93] },
    { k: 'pay', name: T('Noha Pay'), v: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0] }
  ];
  var chartEl = document.getElementById('chart');
  var legendEl = document.getElementById('legend');
  var NS = 'http://www.w3.org/2000/svg';
  var tip = document.createElement('div');
  tip.className = 'chart-tip';
  chartEl.appendChild(tip);

  SERIES.forEach(function (s) {
    var li = document.createElement('li');
    li.style.setProperty('--c', 'var(--' + s.k + ')');
    li.innerHTML = '<i></i>' + s.name;
    li.addEventListener('mouseenter', function () { highlight(s.k); });
    li.addEventListener('mouseleave', function () { highlight(null); });
    legendEl.appendChild(li);
  });

  function highlight(k) {
    chartEl.classList.toggle('dim', !!k);
    chartEl.querySelectorAll('.bar').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-k') === k); });
  }

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var a in attrs) n.setAttribute(a, attrs[a]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function drawChart() {
    var old = chartEl.querySelector('svg');
    if (old) old.remove();
    var W = chartEl.clientWidth, H = chartEl.clientHeight;
    if (!W) return;
    var narrow = W < 520;
    var pad = { l: 28, r: 4, t: 20, b: 28 };
    var iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
    var max = 300;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
    var grid = el('g', { class: 'grid axis' }, svg);
    [0, 100, 200, 300].forEach(function (v) {
      var y = pad.t + ih - (v / max) * ih;
      el('line', { x1: pad.l, x2: W - pad.r, y1: y, y2: y }, grid);
      var t = el('text', { x: pad.l - 8, y: y + 4, 'text-anchor': 'end' }, grid);
      t.textContent = v;
    });
    var band = iw / WEEKS.length;
    var bw = Math.min(40, band * 0.58);
    var css = getComputedStyle(root);
    WEEKS.forEach(function (w, i) {
      var x = pad.l + band * i + (band - bw) / 2;
      var y = pad.t + ih, total = 0;
      SERIES.forEach(function (s) {
        var v = s.v[i];
        if (!v) return;
        var h = (v / max) * ih;
        y -= h;
        total += v;
        var r = el('rect', {
          class: 'bar', 'data-k': s.k, x: x, y: y, width: bw, height: Math.max(h - 1, 1), rx: 2,
          fill: css.getPropertyValue('--' + s.k).trim()
        }, svg);
        r.style.transitionDelay = reduce ? '0s' : (i * 0.06) + 's';
        r.addEventListener('mouseenter', function () {
          highlight(s.k);
          tip.innerHTML = '<b>' + s.name + '</b> · ' + v + (v === 1 ? ' commit' : ' commits') + '<br><span class="muted">week of ' + w + '</span>';
          tip.style.left = (x + bw / 2) + 'px';
          tip.style.top = (y - 6) + 'px';
          tip.classList.add('on');
        });
        r.addEventListener('mouseleave', function () { highlight(null); tip.classList.remove('on'); });
      });
      if (total) {
        var tt = el('text', { class: 'total', x: x + bw / 2, y: pad.t + ih - (total / max) * ih - 6, 'text-anchor': 'middle' }, svg);
        tt.textContent = total;
      }
      if (!narrow || i % 2 === 0) {
        var lab = el('text', { x: x + bw / 2, y: H - 8, 'text-anchor': 'middle' }, grid);
        lab.textContent = w;
      }
    });
    // The quiet month, said in words
    var qx = pad.l + band * 2, qw = band * 4;
    var note = el('text', { class: 'note', x: qx + qw / 2, y: pad.t + ih - 12, 'text-anchor': 'middle' }, svg);
    note.textContent = narrow ? T('Quiet October') : T('October: day jobs, seven commits');
    chartEl.insertBefore(svg, tip);
    if (chartEl.classList.contains('in') || !io) chartEl.classList.add('in');
  }
  drawChart();
  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(drawChart, 150); });
  if (io) {
    new IntersectionObserver(function (es, o) {
      if (es[0].isIntersecting) { chartEl.classList.add('in'); o.disconnect(); }
    }, { threshold: 0.35 }).observe(chartEl);
  }

  /* Contact flow: details, then a WhatsApp code, then the founders hear about it. No sign-in;
     the email address is optional and not verified. */
  var apiMeta = document.querySelector('meta[name="investors-api"]');
  var local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var API = local ? 'http://localhost:8799' : (apiMeta ? apiMeta.content : '');

  var dialog = document.getElementById('contact');
  var forms = { 1: document.getElementById('s1'), 2: document.getElementById('s2') };
  var state = { details: null, id: null, step: 1 };

  function bind(name, value) {
    dialog.querySelectorAll('[data-bind="' + name + '"]').forEach(function (n) { n.textContent = value; });
  }

  function show(step) {
    state.step = step;
    dialog.querySelectorAll('.c-step').forEach(function (s) {
      var on = Number(s.getAttribute('data-step')) === step;
      s.hidden = !on;
      if (on) { s.classList.remove('enter'); void s.offsetWidth; s.classList.add('enter'); }
    });
    dialog.querySelectorAll('.steps li').forEach(function (li) {
      var n = Number(li.getAttribute('data-step'));
      li.classList.toggle('on', n === step);
      li.classList.toggle('done', n < step);
    });
    var first = dialog.querySelector('.c-step[data-step="' + step + '"] input:not([type=checkbox]), .c-step[data-step="' + step + '"] button');
    if (first) setTimeout(function () { first.focus(); }, 50);
  }

  function setError(form, msg) { form.querySelector('.c-error').textContent = msg || ''; }
  function busy(form, on, label) {
    var b = form.querySelector('button[type=submit]');
    if (!b) return;
    if (on) { b.dataset.label = b.textContent; b.textContent = label || T('One moment'); b.disabled = true; }
    else { b.textContent = b.dataset.label || b.textContent; b.disabled = false; }
  }

  function api(path, body) {
    if (!API) return Promise.reject(new Error(T('The contact form isn’t switched on yet. Please write to orders@asanoha.co.in.')));
    return fetch(API + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (!res.ok) throw new Error(j.error || T('Something went wrong. Please try again.'));
        return j;
      });
    }, function () { throw new Error(T('We couldn’t reach our server. Check your connection and try again.')); });
  }

  // Keep what the investor typed if they close the dialog by mistake
  var DRAFT_KEYS = ['name', 'firm', 'role', 'website', 'email', 'phone', 'message'];
  function saveDraft() {
    var f = forms[1], data = {};
    DRAFT_KEYS.forEach(function (k) { data[k] = f.elements[k].value; });
    try { localStorage.setItem('asanoha:investor-draft', JSON.stringify(data)); } catch (e) {}
  }
  function loadDraft() {
    var data = null;
    try { data = JSON.parse(localStorage.getItem('asanoha:investor-draft') || 'null'); } catch (e) {}
    if (!data) return;
    DRAFT_KEYS.forEach(function (k) { if (forms[1].elements[k] && data[k]) forms[1].elements[k].value = data[k]; });
  }
  forms[1].addEventListener('input', saveDraft);

  function phoneOk(v) {
    var d = v.replace(/[\s\-().]/g, '').replace(/^(\+91|0091|91(?=\d{10}$)|0(?=\d{10}$))/, '');
    return /^[6-9]\d{9}$/.test(d) ? d : null;
  }

  forms[1].addEventListener('submit', function (e) {
    e.preventDefault();
    var f = forms[1];
    setError(f, '');
    var v = function (k) { return (f.elements[k].value || '').trim(); };
    var d = { name: v('name'), firm: v('firm'), role: v('role'), website: v('website'), email: v('email').toLowerCase(), phone: v('phone'), message: v('message') };
    if (!d.name) return setError(f, T('Please add your name.'));
    if (!d.firm) return setError(f, T('Please add your fund or firm. Angels can write Angel.'));
    var p = phoneOk(d.phone);
    if (!p) return setError(f, T('Please add a 10-digit Indian mobile number that has WhatsApp.'));
    d.phone = p;
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return setError(f, T('That email doesn’t look right. You can also leave it empty.'));
    if (!f.elements.consent.checked) return setError(f, T('Please agree to be contacted so we can write back.'));
    state.details = d;
    busy(f, true, T('Sending the code'));
    api('/api/start', {
      name: d.name, firm: d.firm, role: d.role, website: d.website, email: d.email, phone: d.phone, message: d.message, consent: true
    }).then(function (r) {
      state.id = r.id;
      bind('phone', r.phone);
      forms[2].elements.code.value = '';
      show(2);
    }).catch(function (err) { setError(f, err.message); }).then(function () { busy(f, false); });
  });

  forms[2].addEventListener('submit', function (e) {
    e.preventDefault();
    var f = forms[2];
    setError(f, '');
    var code = f.elements.code.value.replace(/\D/g, '');
    if (code.length !== 6) return setError(f, T('Please type the 6-digit code from WhatsApp.'));
    busy(f, true, T('Checking'));
    api('/api/verify', { id: state.id, code: code }).then(function (r) {
      bind('first', state.details.name.split(/\s+/)[0]);
      bind('doneText', r.updated
        ? T('We have updated your details. Our founder will reach out to you.')
        : T('We have your details and sent you a note on WhatsApp. Our founder will reach out to you.'));
      try { localStorage.removeItem('asanoha:investor-draft'); } catch (e2) {}
      show(3);
    }).catch(function (err) { setError(f, err.message); }).then(function () { busy(f, false); });
  });

  forms[2].querySelector('[data-resend]').addEventListener('click', function (e) {
    var f = forms[2], b = e.currentTarget;
    setError(f, '');
    b.disabled = true;
    api('/api/resend', { id: state.id }).then(function () {
      b.textContent = T('Sent. You can ask again in a minute');
      setTimeout(function () { b.textContent = T('Send the code again'); b.disabled = false; }, 60000);
    }).catch(function (err) { setError(f, err.message); b.disabled = false; });
  });

  dialog.querySelectorAll('[data-back]').forEach(function (b) {
    b.addEventListener('click', function () { show(Number(b.getAttribute('data-back'))); });
  });

  var opener = null;
  dialog.addEventListener('close', function () {
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
    opener = null;
  });
  function openContact(b) {
    opener = b;
    if (state.step === 3) state.step = 1;
    loadDraft();
    show(state.step);
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  document.querySelectorAll('[data-open-contact]').forEach(function (b) {
    b.addEventListener('click', function () { openContact(b); });
  });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });

  /* Join our mission: the first press turns every mission button into "talk to our founder",
     the next press opens the contact flow. */
  var missionLive = document.getElementById('mission-live');
  var missionBtns = document.querySelectorAll('[data-mission]');
  function setMission(on) {
    root.classList.toggle('mission-on', on);
    missionBtns.forEach(function (b) {
      var join = b.querySelector('.m-join'), talk = b.querySelector('.m-talk');
      join.setAttribute('aria-hidden', on ? 'true' : 'false');
      talk.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    if (typeof fitNav === 'function') fitNav();
  }
  missionBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      if (!root.classList.contains('mission-on')) {
        setMission(true);
        if (missionLive) missionLive.textContent = T('Welcome aboard. Press again to talk to our founder.');
        return;
      }
      openContact(b);
    });
  });

  /* The masked name: hover or focus shows the line; a tap toggles it on touch screens */
  document.querySelectorAll('.masked').forEach(function (m) {
    m.addEventListener('click', function () { m.classList.toggle('show'); });
    m.addEventListener('blur', function () { m.classList.remove('show'); });
    m.addEventListener('keydown', function (e) { if (e.key === 'Escape') m.classList.remove('show'); });
  });

  /* Investor walkthrough: step by step, keyboard friendly, skippable at any point */
  var STEPS = [
    { sel: '#manifesto .hero-copy', t: T('What Asanoha builds'), x: T('Everyday apps for India that share one sign-in, one payment rail and one wallet.') },
    { sel: '#theme-btn', fixed: true, t: T('Day or night'), x: T('Switch between light and dark here. The choice is remembered across Asanoha.') },
    { sel: '.lang-menu', fixed: true, t: T('Read it in your language'), x: T('This page comes in 16 languages, from Hindi, Tamil and Bengali to Japanese and Arabic. A few new lines are still in English.') },
    { sel: '#layers-3d', t: T('Three layers, one star'), x: T('Our logo, built in 3D. Asanoha Store on top, three apps in the middle, shared rails at the base. Drag it, or tap a part.') },
    { sel: '.receipts', t: T('Real numbers only'), x: T('Read from our own databases. Every plan figure on this page is tagged Plan, every outside figure Market.') },
    { sel: '#p-store', t: T('Layer 1: Asanoha Store'), x: T('The main product. It opens only after five gates: GST, licence on every product, lab reports, legal sign-off and a prescription check.') },
    { sel: '#p-pp', t: T('Layer 2: the apps'), x: T('Meant to fund the company once they earn. People Pitchers is live and invite-only. Its recruiter search answers in about 4 seconds, with a quoted reason for every match.') },
    { sel: '#p-kosmik', t: T('Kosmik, in safe mode'), x: T('Answers come from a cited library before any AI writes a word, as tendencies, not predictions. Guests get 3 questions a day.') },
    { sel: '#p-pay', t: T('Layer 3: shared rails'), x: T('Noha Pay and Noha Money are open source under AGPL-3.0. Read the code, or run it yourself.') },
    { sel: '#market', t: T('Big markets, small slices'), x: T('Each year-three target needs less than one percent of its market. The math is under every card.') },
    { sel: '#questions', t: T('The hard questions'), x: T('Risks, focus and money, answered plainly.') },
    { sel: '#founder', t: T('Join our mission'), x: T('Press the button once to join, and again to talk to our founder.') }
  ];
  var tour = document.getElementById('tour');
  if (tour) {
    var ring = tour.querySelector('.tour-ring'), card = tour.querySelector('.tour-card');
    var stepEl = document.getElementById('tour-step'), titleEl = document.getElementById('tour-title'), textEl = document.getElementById('tour-text');
    var dotsEl = tour.querySelector('.tour-dots');
    var backBtn = tour.querySelector('[data-tour-back]'), nextBtn = tour.querySelector('[data-tour-next]');
    var at = 0, tourOpener = null, target = null;
    STEPS.forEach(function () { dotsEl.appendChild(document.createElement('i')); });
    function place() {
      if (!target) return;
      var r = target.getBoundingClientRect(), pad = 8;
      ring.style.top = (r.top - pad) + 'px'; ring.style.left = (r.left - pad) + 'px';
      ring.style.width = (r.width + pad * 2) + 'px'; ring.style.height = (r.height + pad * 2) + 'px';
    }
    function go(i) {
      at = Math.max(0, Math.min(STEPS.length - 1, i));
      var s = STEPS[at];
      target = document.querySelector(s.sel);
      stepEl.textContent = T('Step') + ' ' + (at + 1) + ' ' + T('of') + ' ' + STEPS.length;
      titleEl.textContent = s.t; textEl.textContent = s.x;
      [].forEach.call(dotsEl.children, function (d, j) { d.className = j === at ? 'on' : j < at ? 'done' : ''; });
      backBtn.disabled = at === 0;
      nextBtn.textContent = at === STEPS.length - 1 ? T('Join our mission') : T('Next');
      if (target && !s.fixed) {
        var r = target.getBoundingClientRect();
        var tall = r.height > window.innerHeight * 0.6;
        target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: tall ? 'start' : 'center' });
      }
      place();
      card.focus({ preventScroll: true });
    }
    function openTour(b) {
      tourOpener = b; tour.hidden = false; root.classList.add('touring');
      if (nav.classList.contains('open')) setMenu(false);
      go(0);
      requestAnimationFrame(follow);
    }
    function closeTour() {
      tour.hidden = true; root.classList.remove('touring'); target = null;
      if (tourOpener && document.contains(tourOpener)) tourOpener.focus({ preventScroll: true });
    }
    document.querySelectorAll('[data-tour]').forEach(function (b) { b.addEventListener('click', function () { openTour(b); }); });

    /* First visit: dim the page, point at the walkthrough button */
    var intro = document.getElementById('intro');
    var start = document.getElementById('tour-start');
    var SEEN = 'asanoha:public-intro-seen';
    var seen = false;
    try { seen = localStorage.getItem(SEEN) === '1'; } catch (e) { seen = true; }
    function closeIntro() {
      if (!intro || intro.hidden) return;
      intro.hidden = true; root.classList.remove('intro-on');
      try { localStorage.setItem(SEEN, '1'); } catch (e) {}
    }
    function placeIntro() {
      if (intro.hidden) return;
      var r = start.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) { closeIntro(); return; }
      var ring = intro.querySelector('.intro-ring'), ptr = intro.querySelector('.intro-pointer'), tip = intro.querySelector('.intro-tip');
      ring.style.cssText = 'top:' + (r.top - 6) + 'px;left:' + (r.left - 6) + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px';
      ptr.style.cssText = 'top:' + (r.top - 62) + 'px;left:' + (r.left + Math.min(48, r.width / 2) - 22) + 'px';
      tip.style.cssText = 'top:' + (r.bottom + 16) + 'px;left:' + Math.max(16, r.left) + 'px';
      requestAnimationFrame(placeIntro);
    }
    if (intro && start && !seen && window.scrollY < 200 && !location.hash) {
      setTimeout(function () {
        if (!tour.hidden || window.scrollY > 200 || (dialog && dialog.open)) return;
        intro.hidden = false; root.classList.add('intro-on');
        placeIntro();
      }, 1200);
      start.addEventListener('click', closeIntro);
      intro.querySelector('.intro-close').addEventListener('click', closeIntro);
      document.addEventListener('click', function (e) { if (!intro.hidden && !intro.querySelector('.intro-tip').contains(e.target)) closeIntro(); }, true);
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeIntro(); });
    }
    tour.querySelector('[data-tour-skip]').addEventListener('click', closeTour);
    backBtn.addEventListener('click', function () { go(at - 1); });
    nextBtn.addEventListener('click', function () {
      if (at < STEPS.length - 1) return go(at + 1);
      closeTour();
      var b = document.querySelector('#founder [data-mission]');
      if (b) { b.focus({ preventScroll: true }); b.click(); }
    });
    document.addEventListener('keydown', function (e) {
      if (tour.hidden || (dialog.open)) return;
      if (e.key === 'Escape') { e.preventDefault(); closeTour(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); nextBtn.click(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); if (at > 0) go(at - 1); }
    });
    // Follow the target while the page scrolls to it (smooth scroll, reveal motion, resizes)
    function follow() { if (tour.hidden) return; place(); requestAnimationFrame(follow); }
  }
})();
