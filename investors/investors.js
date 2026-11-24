/* Asanoha for investors: motion, the build chart and the verified contact flow. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme */
  var themeBtn = document.getElementById('theme-btn');
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('asanoha:investors-theme', next); } catch (e) {}
    drawChart();
    dotClips.forEach(function (c) { c.redraw(); });
  });

  /* Nav border once the page scrolls */
  var nav = document.querySelector('.nav');
  function onScroll() { nav.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Reveal on scroll */
  var revealables = document.querySelectorAll('.section-head, .product, .rail, .comp-table, .chart-card, .shared-item, .faq, .person, .cta-inner, .stats');
  revealables.forEach(function (el) { el.classList.add('reveal'); });
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -10% 0px' }) : null;
  revealables.forEach(function (el) { io ? io.observe(el) : el.classList.add('in'); });
  requestAnimationFrame(function () { document.querySelectorAll('.rise').forEach(function (el) { el.classList.add('in'); }); });

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

  /* The star: unfold, then point at a part to read about it */
  var star = document.querySelector('.star');
  var hint = document.getElementById('star-hint');
  var blurbs = {
    store: 'Asanoha store: prescription Ayurveda, packed in pairs',
    pp: 'People Pitchers: hiring from real work, live',
    kosmik: 'Kosmik: the Gita and Vedic astrology with sources, alpha on web and Android',
    wearday: 'Wearday: your wardrobe and outfit log, built',
    pay: 'Noha Pay: our own UPI rail, takes payments for three products',
    money: 'Noha Money: one closed wallet for cashback and refunds'
  };
  requestAnimationFrame(function () {
    setTimeout(function () { star.classList.add('in'); }, 120);
    setTimeout(function () { star.classList.add('ready'); }, reduce ? 0 : 1600);
  });
  function focusPart(k) {
    star.classList.toggle('focus', !!k);
    star.querySelectorAll('[data-k]').forEach(function (el) { el.classList.toggle('on', el.getAttribute('data-k') === k); });
    hint.textContent = k ? blurbs[k] : 'Point at a part';
  }
  star.querySelectorAll('.petal').forEach(function (p) {
    var k = p.getAttribute('data-k');
    p.setAttribute('tabindex', '0');
    p.setAttribute('role', 'button');
    p.setAttribute('aria-label', blurbs[k]);
    p.addEventListener('mouseenter', function () { focusPart(k); });
    p.addEventListener('focus', function () { focusPart(k); });
    p.addEventListener('click', function () {
      var target = { pp: 'p-pp', kosmik: 'p-kosmik', wearday: 'p-wearday', store: 'p-store' }[k];
      if (target) document.getElementById(target).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      else document.querySelector('.rails').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
    p.addEventListener('blur', function () { focusPart(null); });
  });
  star.addEventListener('mouseleave', function () { focusPart(null); });

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

  /* Build chart: commits a week by product, from git history (21 Sep to 24 Nov 2026) */
  var WEEKS = ['21 Sep', '28 Sep', '5 Oct', '12 Oct', '19 Oct', '26 Oct', '2 Nov', '9 Nov', '16 Nov', '23 Nov'];
  var SERIES = [
    { k: 'store', name: 'Asanoha store', v: [13, 20, 0, 0, 0, 0, 0, 4, 3, 0] },
    { k: 'wearday', name: 'Wearday', v: [0, 0, 0, 0, 0, 0, 35, 24, 1, 0] },
    { k: 'pp', name: 'People Pitchers', v: [0, 0, 0, 0, 0, 0, 0, 19, 69, 0] },
    { k: 'kosmik', name: 'Kosmik', v: [0, 0, 0, 0, 0, 0, 0, 32, 51, 51] },
    { k: 'pay', name: 'Noha Pay', v: [0, 0, 0, 0, 0, 0, 0, 0, 1, 0] }
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
    var max = 140;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, 'aria-hidden': 'true' });
    var grid = el('g', { class: 'grid axis' }, svg);
    [0, 35, 70, 105, 140].forEach(function (v) {
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
    note.textContent = narrow ? 'Quiet October' : 'October: day jobs, seven commits';
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
    if (on) { b.dataset.label = b.textContent; b.textContent = label || 'One moment'; b.disabled = true; }
    else { b.textContent = b.dataset.label || b.textContent; b.disabled = false; }
  }

  function api(path, body) {
    if (!API) return Promise.reject(new Error('The contact form isn’t switched on yet. Please write to founders@asanoha.co.in.'));
    return fetch(API + path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body || {})
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (j) {
        if (!res.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
        return j;
      });
    }, function () { throw new Error('We couldn’t reach our server. Check your connection and try again.'); });
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
    if (!d.name) return setError(f, 'Please add your name.');
    if (!d.firm) return setError(f, 'Please add your fund or firm. Angels can write Angel.');
    var p = phoneOk(d.phone);
    if (!p) return setError(f, 'Please add a 10-digit Indian mobile number that has WhatsApp.');
    d.phone = p;
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return setError(f, 'That email doesn’t look right. You can also leave it empty.');
    if (!f.elements.consent.checked) return setError(f, 'Please agree to be contacted so we can write back.');
    state.details = d;
    busy(f, true, 'Sending the code');
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
    if (code.length !== 6) return setError(f, 'Please type the 6-digit code from WhatsApp.');
    busy(f, true, 'Checking');
    api('/api/verify', { id: state.id, code: code }).then(function (r) {
      bind('first', state.details.name.split(/\s+/)[0]);
      bind('doneText', r.updated
        ? 'We have updated your details. One of the founders will reach out to you.'
        : 'We have your details and sent you a note on WhatsApp. One of the founders will reach out to you.');
      try { localStorage.removeItem('asanoha:investor-draft'); } catch (e2) {}
      show(3);
    }).catch(function (err) { setError(f, err.message); }).then(function () { busy(f, false); });
  });

  forms[2].querySelector('[data-resend]').addEventListener('click', function (e) {
    var f = forms[2], b = e.currentTarget;
    setError(f, '');
    b.disabled = true;
    api('/api/resend', { id: state.id }).then(function () {
      b.textContent = 'Sent. You can ask again in a minute';
      setTimeout(function () { b.textContent = 'Send the code again'; b.disabled = false; }, 60000);
    }).catch(function (err) { setError(f, err.message); b.disabled = false; });
  });

  dialog.querySelectorAll('[data-back]').forEach(function (b) {
    b.addEventListener('click', function () { show(Number(b.getAttribute('data-back'))); });
  });

  document.querySelectorAll('[data-open-contact]').forEach(function (b) {
    b.addEventListener('click', function () {
      if (state.step === 3) state.step = 1;
      loadDraft();
      show(state.step);
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    });
  });
  dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); });
})();
